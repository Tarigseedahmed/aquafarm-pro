export enum Permission {
  TENANT_READ = 'tenant.read',
  TENANT_CREATE = 'tenant.create',
  TENANT_UPDATE = 'tenant.update',
  TENANT_DELETE = 'tenant.delete',
  USER_READ = 'user.read',
  USER_WRITE = 'user.write',
  FARM_READ = 'farm.read',
  FARM_CREATE = 'farm.create',
  FARM_UPDATE = 'farm.update',
  FARM_DELETE = 'farm.delete',
  POND_READ = 'pond.read',
  POND_CREATE = 'pond.create',
  POND_UPDATE = 'pond.update',
  POND_DELETE = 'pond.delete',
}

export const RolePermissions: Record<string, Permission[]> = {
  admin: [
    Permission.TENANT_READ,
    Permission.TENANT_CREATE,
    Permission.TENANT_UPDATE,
    Permission.TENANT_DELETE,
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.FARM_READ,
    Permission.FARM_CREATE,
    Permission.FARM_UPDATE,
    Permission.FARM_DELETE,
    Permission.POND_READ,
    Permission.POND_CREATE,
    Permission.POND_UPDATE,
    Permission.POND_DELETE,
  ],
  user: [
    Permission.TENANT_READ,
    Permission.FARM_READ,
    Permission.FARM_CREATE,
    Permission.FARM_UPDATE,
    Permission.FARM_DELETE,
    Permission.POND_READ,
    Permission.POND_CREATE,
    Permission.POND_UPDATE,
    Permission.POND_DELETE,
  ],
  viewer: [Permission.TENANT_READ, Permission.FARM_READ, Permission.POND_READ],
};

export function permissionsForRole(role?: string): Permission[] {
  return RolePermissions[role || 'user'] || [];
}
