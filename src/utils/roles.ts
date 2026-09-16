import type { WorkspaceRole } from '@/types/models';

const RANK: Record<WorkspaceRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4
};

export function hasRole(role: WorkspaceRole | undefined, minimum: WorkspaceRole): boolean {
  return role ? RANK[role] >= RANK[minimum] : false;
}

export const ROLE_OPTIONS: { value: WorkspaceRole; label: string }[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' }
];
