import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateLabReportHtml } from '../services/report.service';

export const getProjectReportHtml = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        author: {
          select: { fullName: true, email: true, role: true },
        },
        analyticsLogs: {
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      res.status(404).send('<h1>Project not found</h1>');
      return;
    }

    const html = generateLabReportHtml(project as any);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error: any) {
    console.error('Export report error:', error);
    res.status(500).send('<h1>Failed to generate lab report</h1>');
  }
};

export const getProjectJson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        author: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="schematic-${project.shareCode}.json"`);
    res.json({
      meta: {
        title: project.title,
        author: project.author.fullName,
        exportedAt: new Date().toISOString(),
        version: 'Proteus-v2.4-compatible',
      },
      schematic: project.schematicData,
      environment: project.environmentData,
    });
  } catch (error: any) {
    console.error('Export JSON error:', error);
    res.status(500).json({ error: 'Failed to export project JSON' });
  }
};

export const exportDirectReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, schematicData, environmentData, authorName } = req.body || {};

    const reportData = {
      id: 'preview',
      title: title || 'Workbench Circuit Analysis',
      description: description || 'Live simulation export from Open-World Electronics Lab.',
      shareCode: 'PREVIEW-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        fullName: authorName || req.user?.fullName || 'Engineering Student',
        email: req.user?.email || 'student@lab.edu',
        role: req.user?.role || 'STUDENT',
      },
      schematicData: schematicData || { parts: [], wires: [] },
      environmentData: environmentData || {},
      analyticsLogs: [],
    };

    const html = generateLabReportHtml(reportData as any);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error: any) {
    console.error('Export direct report error:', error);
    res.status(500).send('<h1>Failed to generate export report</h1>');
  }
};
