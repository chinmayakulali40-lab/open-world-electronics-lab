import { Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const logSimulation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId, runDurationSec, componentCount, peakVoltage, peakPower, environmentUsed } = req.body;

    if (!projectId || runDurationSec === undefined || componentCount === undefined) {
      res.status(400).json({ error: 'projectId, runDurationSec, and componentCount are required' });
      return;
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      res.status(404).json({ error: 'Target project not found' });
      return;
    }

    const log = await prisma.simulationLog.create({
      data: {
        projectId,
        runDurationSec: Number(runDurationSec),
        componentCount: Number(componentCount),
        peakVoltage: peakVoltage ? parseFloat(peakVoltage) : null,
        peakPower: peakPower ? parseFloat(peakPower) : null,
        environmentUsed: environmentUsed || 'Classroom',
      },
    });

    res.status(201).json({
      message: 'Simulation telemetry logged successfully',
      log,
    });
  } catch (error: any) {
    console.error('Log simulation error:', error);
    res.status(500).json({ error: 'Failed to record simulation analytics log' });
  }
};

export const getTeacherAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isTeacher = req.user?.role === Role.TEACHER || req.user?.role === Role.ADMIN;

    // Fetch students, projects, and simulation logs
    const [
      totalStudents,
      totalTeachers,
      totalProjects,
      allLogs,
      recentProjects,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.TEACHER } }),
      prisma.project.count(),
      prisma.simulationLog.findMany({
        include: {
          project: {
            include: {
              author: {
                select: { id: true, fullName: true, email: true, role: true },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.project.findMany({
        take: 8,
        orderBy: { updatedAt: 'desc' },
        include: {
          author: { select: { id: true, fullName: true, email: true } },
          _count: { select: { analyticsLogs: true } },
        },
      }),
    ]);

    // Aggregate statistics
    let totalSimulationSeconds = 0;
    let maxVoltageRecorded = 0;
    let maxPowerRecorded = 0;
    const environmentCounts: Record<string, number> = {};

    allLogs.forEach(log => {
      totalSimulationSeconds += log.runDurationSec;
      if (log.peakVoltage && log.peakVoltage > maxVoltageRecorded) {
        maxVoltageRecorded = log.peakVoltage;
      }
      if (log.peakPower && log.peakPower > maxPowerRecorded) {
        maxPowerRecorded = log.peakPower;
      }
      const env = log.environmentUsed || 'Classroom';
      environmentCounts[env] = (environmentCounts[env] || 0) + 1;
    });

    // Average simulation duration per session
    const avgDurationSec = allLogs.length > 0 ? Math.round(totalSimulationSeconds / allLogs.length) : 0;

    // Aggregate component breakdown from projects
    const allProjectRecords = await prisma.project.findMany({
      select: { schematicData: true },
    });

    const componentStats: Record<string, number> = {};
    allProjectRecords.forEach(p => {
      try {
        const data = p.schematicData as any;
        const parts = Array.isArray(data?.parts) ? data.parts : (Array.isArray(data) ? data : []);
        parts.forEach((part: any) => {
          const type = part.type || 'Generic';
          componentStats[type] = (componentStats[type] || 0) + 1;
        });
      } catch (e) {}
    });

    // Recent student simulation activity feed
    const recentActivity = allLogs.slice(0, 10).map(log => ({
      id: log.id,
      studentName: log.project.author.fullName,
      studentEmail: log.project.author.email,
      projectTitle: log.project.title,
      durationSec: log.runDurationSec,
      componentCount: log.componentCount,
      peakVoltage: log.peakVoltage,
      peakPower: log.peakPower,
      environment: log.environmentUsed,
      completedAt: log.completedAt,
    }));

    res.json({
      summary: {
        totalStudents,
        totalTeachers,
        totalProjects,
        totalSimulationRuns: allLogs.length,
        totalSimulationHours: (totalSimulationSeconds / 3600).toFixed(1),
        avgSessionDurationSec: avgDurationSec,
        maxVoltageRecorded: maxVoltageRecorded.toFixed(2),
        maxPowerRecorded: maxPowerRecorded.toFixed(1),
      },
      environmentDistribution: environmentCounts,
      componentFrequency: componentStats,
      recentActivity,
      recentProjects,
    });
  } catch (error: any) {
    console.error('Teacher analytics error:', error);
    res.status(500).json({ error: 'Failed to generate teacher analytics report' });
  }
};
