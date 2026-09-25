import { Response } from 'express';
import { SharePermission, Role } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper to generate a unique share code (cuid/slug style)
const generateShareCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'proj_';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let authorId = req.user?.id;

    // If guest/demo mode, use a default user or auto-provision guest user
    if (!authorId) {
      let defaultUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'student@lab.edu' },
            { email: 'guest@lab.edu' },
          ],
        },
      });

      if (!defaultUser) {
        defaultUser = await prisma.user.findFirst();
      }

      if (!defaultUser) {
        defaultUser = await prisma.user.create({
          data: {
            fullName: 'Guest Engineer',
            email: 'guest@lab.edu',
            passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYeq',
            role: Role.STUDENT,
          },
        });
      }

      authorId = defaultUser.id;
    }

    const { title, description, schematicData, environmentData } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Project title is required' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        schematicData: schematicData || { parts: [], wires: [] },
        environmentData: environmentData || null,
        shareCode: generateShareCode(),
        authorId,
      },
      include: {
        author: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // If not authenticated (guest/demo mode), return all institutional projects
    if (!req.user) {
      const allProjects = await prisma.project.findMany({
        include: {
          author: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          shares: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
          _count: {
            select: { analyticsLogs: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });

      res.json({
        myProjects: allProjects,
        sharedWithMe: [],
      });
      return;
    }

    // Teachers and Admins can see all student projects if requested
    const viewAll = req.query.all === 'true' && (req.user.role === Role.TEACHER || req.user.role === Role.ADMIN);

    if (viewAll) {
      const allProjects = await prisma.project.findMany({
        include: {
          author: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          shares: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
          _count: {
            select: { analyticsLogs: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      res.json({ projects: allProjects, myProjects: allProjects, sharedWithMe: [], filter: 'all_institutional' });
      return;
    }

    // Standard user: Projects authored by user + projects shared with user
    const [myProjects, sharedWithMe] = await Promise.all([
      prisma.project.findMany({
        where: { authorId: req.user.id },
        include: {
          author: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          shares: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
          _count: {
            select: { analyticsLogs: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.projectShare.findMany({
        where: { userId: req.user.id },
        include: {
          project: {
            include: {
              author: {
                select: { id: true, fullName: true, email: true, role: true },
              },
              _count: {
                select: { analyticsLogs: true },
              },
            },
          },
        },
        orderBy: { project: { updatedAt: 'desc' } },
      }),
    ]);

    const formattedShared = sharedWithMe.map(s => ({
      ...s.project,
      sharedPermission: s.permission,
      shareId: s.id,
    }));

    res.json({
      myProjects,
      sharedWithMe: formattedShared,
    });
  } catch (error: any) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        shares: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: true } },
          },
        },
        analyticsLogs: {
          orderBy: { completedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Permission check
    const isAuthor = req.user?.id === project.authorId;
    const isTeacherOrAdmin = req.user?.role === Role.TEACHER || req.user?.role === Role.ADMIN;
    const shareEntry = req.user ? project.shares.find(s => s.userId === req.user?.id) : null;
    const isGuest = !req.user;

    if (!isAuthor && !isTeacherOrAdmin && !shareEntry && !isGuest) {
      res.status(403).json({ error: 'You do not have permission to view this project' });
      return;
    }

    res.json({
      project,
      userPermission: isAuthor ? 'OWNER' : (shareEntry ? shareEntry.permission : (isTeacherOrAdmin ? 'ADMIN' : 'VIEWER')),
    });
  } catch (error: any) {
    console.error('Get project by id error:', error);
    res.status(500).json({ error: 'Failed to load project details' });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, schematicData, environmentData } = req.body;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { shares: true, author: true },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (req.user) {
      const isAuthor = project.authorId === req.user.id;
      const isAdmin = req.user.role === Role.ADMIN;
      const isEditor = project.shares.some(s => s.userId === req.user?.id && s.permission === SharePermission.EDITOR);

      if (!isAuthor && !isAdmin && !isEditor) {
        res.status(403).json({ error: 'Write permission required. You have view-only access or are not a collaborator.' });
        return;
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(schematicData !== undefined ? { schematicData } : {}),
        ...(environmentData !== undefined ? { environmentData } : {}),
      },
      include: {
        author: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.json({
      message: 'Project updated successfully',
      project: updated,
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (req.user && project.authorId !== req.user.id && req.user.role !== Role.ADMIN) {
      res.status(403).json({ error: 'Only the project author or system administrator can delete this project' });
      return;
    }

    await prisma.project.delete({ where: { id } });

    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const getProjectByShareCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { shareCode } = req.params;

    const project = await prisma.project.findUnique({
      where: { shareCode },
      include: {
        author: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Shared circuit link invalid or expired' });
      return;
    }

    res.json({
      project,
      isReadOnly: true,
    });
  } catch (error: any) {
    console.error('Get shared project error:', error);
    res.status(500).json({ error: 'Failed to retrieve shared circuit' });
  }
};
