export enum Permission {
  TENANT_READ = 'tenant.read',
  TENANT_CREATE = 'tenant.create',
  TENANT_UPDATE = 'tenant.update',
  TENANT_DELETE = 'tenant.delete',
  USER_READ = 'user.read',
  USER_WRITE = 'user.write',
}

export const RolePermissions: Record<string, Permission[]> = {
  admin: [
    Permission.TENANT_READ,
    Permission.TENANT_CREATE,
    Permission.TENANT_UPDATE,
    Permission.TENANT_DELETE,
    Permission.USER_READ,
    Permission.USER_WRITE,
  ],
  user: [Permission.TENANT_READ],
};

export function permissionsForRole(role?: string): Permission[] {
  return RolePermissions[role || 'user'] || [];
}
