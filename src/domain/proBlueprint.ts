export type TeamRole = 'owner' | 'admin' | 'operator' | 'viewer';

export interface WorkspaceMembership {
  userId: string;
  role: TeamRole;
  joinedAt: string;
}

export interface CloudBackupSnapshot {
  id: string;
  workspaceId: string;
  createdAt: string;
  createdBy: string;
  schemaVersion: number;
  checksum: string;
}

export interface MultiEventWorkspace {
  id: string;
  name: string;
  timezone: string;
  memberships: WorkspaceMembership[];
}

export interface ProCapabilityMatrix {
  cloudBackup: boolean;
  teamRoles: boolean;
  multiEvent: boolean;
}

export const PRO_CAPABILITIES: ProCapabilityMatrix = {
  cloudBackup: true,
  teamRoles: true,
  multiEvent: true,
};

