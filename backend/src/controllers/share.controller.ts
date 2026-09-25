import { Response } from 'express';
import { SharePermission, Role } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const shareProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId, targetEmail, permission } = req.body;

    if (!projectId || !targetEmail) {
      res.status(400).json({ error: 'projectId and targetEmail are required' });
      return;
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // If logged in, check permission
    if (req.user && project.authorId !== req.user.id && req.user.role !== Role.ADMIN) {
      res.status(403).json({ error: 'Only the project author can grant or modify collaboration access' });
      return;
    }

    // Find target user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail.toLowerCase().trim() },
    });

    if (!targetUser) {
      res.status(404).json({ error: `User with email "${targetEmail}" does not have an account in the lab system` });
      return;
    }

    if (targetUser.id === project.authorId) {
      res.status(400).json({ error: 'Cannot share a project with yourself (you are the owner)' });
      return;
    }

    const validPermission: SharePermission =
      permission === 'EDITOR' ? SharePermission.EDITOR : SharePermission.VIEWER;

    // Upsert project share
    const share = await prisma.projectShare.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUser.id,
        },
      },
      update: {
        permission: validPermission,
      },
      create: {
        projectId,
        userId: targetUser.id,
        permission: validPermission,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });

    res.status(200).json({
      message: `Project shared with ${targetUser.fullName} (${validPermission})`,
      share,
    });
  } catch (error: any) {
    console.error('Share project error:', error);
    res.status(500).json({ error: 'Failed to share project' });
  }
};

export const getProjectShares = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const shares = await prisma.projectShare.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
      orderBy: { user: { fullName: 'asc' } },
    });

    res.json({ shares });
  } catch (error: any) {
    console.error('Get project shares error:', error);
    res.status(500).json({ error: 'Failed to retrieve project collaborators' });
  }
};

export const removeShare = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const share = await prisma.projectShare.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!share) {
      res.status(404).json({ error: 'Share record not found' });
      return;
    }

    if (req.user && share.project.authorId !== req.user.id && req.user.role !== Role.ADMIN) {
      res.status(403).json({ error: 'Only the project owner can revoke collaborator access' });
      return;
    }

    await prisma.projectShare.delete({ where: { id } });

    res.json({ message: 'Collaborator access revoked successfully' });
  } catch (error: any) {
    console.error('Remove share error:', error);
    res.status(500).json({ error: 'Failed to revoke sharing' });
  }
};
