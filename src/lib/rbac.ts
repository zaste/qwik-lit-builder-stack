/**
 * Role-Based Access Control (RBAC) System
 * Production-grade authorization and permission management
 */

import { logger } from './logger';
import { validateInput } from './input-validation';
import { z } from 'zod';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[]; // Direct permissions (not through roles)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorizationContext {
  userId: string;
  resource: string;
  action: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
  matchedPermissions?: string[];
}

// Predefined system permissions
export const SYSTEM_PERMISSIONS: Record<string, Permission> = {
  // User management
  'users:create': {
    id: 'users:create',
    name: 'Create Users',
    description: 'Create new user accounts',
    resource: 'users',
    action: 'create'
  },
  'users:read': {
    id: 'users:read',
    name: 'Read Users',
    description: 'View user information',
    resource: 'users',
    action: 'read'
  },
  'users:update': {
    id: 'users:update',
    name: 'Update Users',
    description: 'Modify user information',
    resource: 'users',
    action: 'update'
  },
  'users:delete': {
    id: 'users:delete',
    name: 'Delete Users',
    description: 'Delete user accounts',
    resource: 'users',
    action: 'delete'
  },
  
  // File management
  'files:create': {
    id: 'files:create',
    name: 'Upload Files',
    description: 'Upload new files',
    resource: 'files',
    action: 'create'
  },
  'files:read': {
    id: 'files:read',
    name: 'Read Files',
    description: 'View and download files',
    resource: 'files',
    action: 'read'
  },
  'files:update': {
    id: 'files:update',
    name: 'Update Files',
    description: 'Modify file metadata and content',
    resource: 'files',
    action: 'update'
  },
  'files:delete': {
    id: 'files:delete',
    name: 'Delete Files',
    description: 'Delete files',
    resource: 'files',
    action: 'delete'
  },
  'files:batch': {
    id: 'files:batch',
    name: 'Batch File Operations',
    description: 'Perform bulk file operations',
    resource: 'files',
    action: 'batch'
  },
  
  // Content management
  'content:create': {
    id: 'content:create',
    name: 'Create Content',
    description: 'Create new content',
    resource: 'content',
    action: 'create'
  },
  'content:read': {
    id: 'content:read',
    name: 'Read Content',
    description: 'View content',
    resource: 'content',
    action: 'read'
  },
  'content:update': {
    id: 'content:update',
    name: 'Update Content',
    description: 'Modify content',
    resource: 'content',
    action: 'update'
  },
  'content:delete': {
    id: 'content:delete',
    name: 'Delete Content',
    description: 'Delete content',
    resource: 'content',
    action: 'delete'
  },
  'content:publish': {
    id: 'content:publish',
    name: 'Publish Content',
    description: 'Publish content to live site',
    resource: 'content',
    action: 'publish'
  },
  
  // System administration
  'system:admin': {
    id: 'system:admin',
    name: 'System Administration',
    description: 'Full system administration access',
    resource: 'system',
    action: 'admin'
  },
  'system:settings': {
    id: 'system:settings',
    name: 'System Settings',
    description: 'Modify system settings',
    resource: 'system',
    action: 'settings'
  },
  'system:logs': {
    id: 'system:logs',
    name: 'View System Logs',
    description: 'Access system logs and monitoring',
    resource: 'system',
    action: 'logs'
  },
  
  // Role management
  'roles:create': {
    id: 'roles:create',
    name: 'Create Roles',
    description: 'Create new roles',
    resource: 'roles',
    action: 'create'
  },
  'roles:read': {
    id: 'roles:read',
    name: 'Read Roles',
    description: 'View role information',
    resource: 'roles',
    action: 'read'
  },
  'roles:update': {
    id: 'roles:update',
    name: 'Update Roles',
    description: 'Modify role permissions',
    resource: 'roles',
    action: 'update'
  },
  'roles:delete': {
    id: 'roles:delete',
    name: 'Delete Roles',
    description: 'Delete roles',
    resource: 'roles',
    action: 'delete'
  }
};

// Predefined system roles
export const SYSTEM_ROLES: Record<string, Omit<Role, 'createdAt' | 'updatedAt'>> = {
  'super_admin': {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    permissions: Object.keys(SYSTEM_PERMISSIONS),
    isSystemRole: true
  },
  'admin': {
    id: 'admin',
    name: 'Administrator',
    description: 'Administrative access without system-level permissions',
    permissions: [
      'users:create', 'users:read', 'users:update', 'users:delete',
      'files:create', 'files:read', 'files:update', 'files:delete', 'files:batch',
      'content:create', 'content:read', 'content:update', 'content:delete', 'content:publish',
      'roles:read'
    ],
    isSystemRole: true
  },
  'editor': {
    id: 'editor',
    name: 'Editor',
    description: 'Content creation and management',
    permissions: [
      'files:create', 'files:read', 'files:update', 'files:delete',
      'content:create', 'content:read', 'content:update', 'content:delete', 'content:publish'
    ],
    isSystemRole: true
  },
  'contributor': {
    id: 'contributor',
    name: 'Contributor',
    description: 'Content creation without publishing rights',
    permissions: [
      'files:create', 'files:read', 'files:update',
      'content:create', 'content:read', 'content:update'
    ],
    isSystemRole: true
  },
  'viewer': {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to content and files',
    permissions: [
      'files:read',
      'content:read'
    ],
    isSystemRole: true
  }
};

// Validation schemas
const PermissionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  conditions: z.record(z.any()).optional()
});

const RoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  permissions: z.array(z.string()).min(0).max(100)
});

const UserRoleAssignmentSchema = z.object({
  userId: z.string().uuid(),
  roleIds: z.array(z.string()).max(10),
  permissions: z.array(z.string()).max(50).optional()
});

export class RBACManager {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private users: Map<string, User> = new Map();
  private roleHierarchy: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeSystemData();
  }

  // Initialize system permissions and roles
  private initializeSystemData(): void {
    // Load system permissions
    Object.values(SYSTEM_PERMISSIONS).forEach(permission => {
      this.permissions.set(permission.id, permission);
    });

    // Load system roles
    Object.values(SYSTEM_ROLES).forEach(roleData => {
      const role: Role = {
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.roles.set(role.id, role);
    });

    logger.info('RBAC system initialized', {
      permissions: this.permissions.size,
      roles: this.roles.size
    });
  }

  // Permission management
  async createPermission(permissionData: {
    name: string;
    description: string;
    resource: string;
    action: string;
    conditions?: Record<string, any>;
  }): Promise<{ success: boolean; permissionId?: string; error?: string }> {
    try {
      const validation = validateInput(permissionData, PermissionSchema);
      if (!validation.isValid) {
        return { success: false, error: validation.errors?.join(', ') };
      }

      const permissionId = `${permissionData.resource}:${permissionData.action}`;
      
      if (this.permissions.has(permissionId)) {
        return { success: false, error: 'Permission already exists' };
      }

      const permission: Permission = {
        id: permissionId,
        name: permissionData.name,
        description: permissionData.description,
        resource: permissionData.resource,
        action: permissionData.action,
        conditions: permissionData.conditions
      };

      this.permissions.set(permissionId, permission);

      logger.info('Permission created', { permissionId, name: permission.name });
      
      return { success: true, permissionId };

    } catch (_error) {
      logger.error('Permission creation failed', permissionData, _error as Error);
      return { success: false, error: 'Failed to create permission' };
    }
  }

  // Role management
  async createRole(roleData: {
    name: string;
    description: string;
    permissions: string[];
  }): Promise<{ success: boolean; roleId?: string; error?: string }> {
    try {
      const validation = validateInput(roleData, RoleSchema);
      if (!validation.isValid) {
        return { success: false, error: validation.errors?.join(', ') };
      }

      // Validate all permissions exist
      const invalidPermissions = roleData.permissions.filter(
        permId => !this.permissions.has(permId)
      );

      if (invalidPermissions.length > 0) {
        return { 
          success: false, 
          error: `Invalid permissions: ${invalidPermissions.join(', ')}` 
        };
      }

      const roleId = this.generateRoleId(roleData.name);
      
      if (this.roles.has(roleId)) {
        return { success: false, error: 'Role already exists' };
      }

      const role: Role = {
        id: roleId,
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        isSystemRole: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.roles.set(roleId, role);

      logger.info('Role created', { 
        roleId, 
        name: role.name, 
        permissionCount: role.permissions.length 
      });
      
      return { success: true, roleId };

    } catch (_error) {
      logger.error('Role creation failed', roleData, _error as Error);
      return { success: false, error: 'Failed to create role' };
    }
  }

  async updateRole(
    roleId: string, 
    updates: Partial<{ name: string; description: string; permissions: string[] }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        return { success: false, error: 'Role not found' };
      }

      if (role.isSystemRole) {
        return { success: false, error: 'Cannot modify system role' };
      }

      // Validate permissions if provided
      if (updates.permissions) {
        const invalidPermissions = updates.permissions.filter(
          permId => !this.permissions.has(permId)
        );

        if (invalidPermissions.length > 0) {
          return { 
            success: false, 
            error: `Invalid permissions: ${invalidPermissions.join(', ')}` 
          };
        }
      }

      // Apply updates
      if (updates.name) role.name = updates.name;
      if (updates.description) role.description = updates.description;
      if (updates.permissions) role.permissions = updates.permissions;
      role.updatedAt = new Date();

      this.roles.set(roleId, role);

      logger.info('Role updated', { roleId, updates });
      
      return { success: true };

    } catch (_error) {
      logger.error('Role update failed', { roleId, updates }, _error as Error);
      return { success: false, error: 'Failed to update role' };
    }
  }

  // User role assignment
  async assignUserRoles(
    userId: string, 
    roleIds: string[], 
    directPermissions: string[] = []
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = validateInput({
        userId,
        roleIds,
        permissions: directPermissions
      }, UserRoleAssignmentSchema);

      if (!validation.isValid) {
        return { success: false, error: validation.errors?.join(', ') };
      }

      // Validate roles exist
      const invalidRoles = roleIds.filter(roleId => !this.roles.has(roleId));
      if (invalidRoles.length > 0) {
        return { 
          success: false, 
          error: `Invalid roles: ${invalidRoles.join(', ')}` 
        };
      }

      // Validate direct permissions exist
      const invalidPermissions = directPermissions.filter(
        permId => !this.permissions.has(permId)
      );
      if (invalidPermissions.length > 0) {
        return { 
          success: false, 
          error: `Invalid permissions: ${invalidPermissions.join(', ')}` 
        };
      }

      // Get or create user
      let user = this.users.get(userId);
      if (!user) {
        user = {
          id: userId,
          email: '', // Would be populated from user service
          roles: [],
          permissions: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // Update user roles and permissions
      user.roles = roleIds;
      user.permissions = directPermissions;
      user.updatedAt = new Date();

      this.users.set(userId, user);

      logger.info('User roles assigned', { 
        userId, 
        roleCount: roleIds.length, 
        directPermissions: directPermissions.length 
      });
      
      return { success: true };

    } catch (_error) {
      logger.error('User role assignment failed', { 
        userId, 
        roleIds, 
        directPermissions 
      }, _error as Error);
      return { success: false, error: 'Failed to assign roles' };
    }
  }

  // Authorization check
  async authorize(context: AuthorizationContext): Promise<AuthorizationResult> {
    try {
      const user = this.users.get(context.userId);
      if (!user || !user.isActive) {
        return {
          allowed: false,
          reason: 'User not found or inactive'
        };
      }

      // Collect all user permissions (from roles + direct permissions)
      const userPermissions = new Set<string>();
      
      // Add direct permissions
      user.permissions.forEach(permId => userPermissions.add(permId));
      
      // Add permissions from roles
      for (const roleId of user.roles) {
        const role = this.roles.get(roleId);
        if (role) {
          role.permissions.forEach(permId => userPermissions.add(permId));
        }
      }

      // Check for required permission
      const requiredPermission = `${context.resource}:${context.action}`;
      const hasDirectPermission = userPermissions.has(requiredPermission);
      
      // Check for wildcard permissions
      const wildcardPermission = `${context.resource}:*`;
      const hasWildcardPermission = userPermissions.has(wildcardPermission);
      
      // Check for admin permission
      const hasAdminPermission = userPermissions.has('system:admin');

      const allowed = hasDirectPermission || hasWildcardPermission || hasAdminPermission;

      const result: AuthorizationResult = {
        allowed,
        requiredPermissions: [requiredPermission],
        matchedPermissions: Array.from(userPermissions).filter(perm => 
          perm === requiredPermission || 
          perm === wildcardPermission || 
          perm === 'system:admin'
        )
      };

      if (!allowed) {
        result.reason = `Missing required permission: ${requiredPermission}`;
      }

      // Log authorization attempts
      if (!allowed) {
        logger.warn('Authorization denied', {
          userId: context.userId,
          resource: context.resource,
          action: context.action,
          resourceId: context.resourceId,
          userPermissions: Array.from(userPermissions),
          requiredPermission
        });
      } else {
        logger.debug('Authorization granted', {
          userId: context.userId,
          resource: context.resource,
          action: context.action,
          matchedPermissions: result.matchedPermissions
        });
      }

      return result;

    } catch (_error) {
      logger.error('Authorization check failed', context, _error as Error);
      return {
        allowed: false,
        reason: 'Authorization check failed'
      };
    }
  }

  // Utility methods
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  getPermission(permissionId: string): Permission | undefined {
    return this.permissions.get(permissionId);
  }

  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  getUserPermissions(userId: string): string[] {
    const user = this.users.get(userId);
    if (!user) return [];

    const permissions = new Set<string>();
    
    // Add direct permissions
    user.permissions.forEach(permId => permissions.add(permId));
    
    // Add permissions from roles
    for (const roleId of user.roles) {
      const role = this.roles.get(roleId);
      if (role) {
        role.permissions.forEach(permId => permissions.add(permId));
      }
    }

    return Array.from(permissions);
  }

  private generateRoleId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
}

// Global RBAC manager instance
export const rbacManager = new RBACManager();

// Middleware helper for route protection
export async function requirePermission(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string
): Promise<AuthorizationResult> {
  return rbacManager.authorize({
    userId,
    resource,
    action,
    resourceId
  });
}

// Helper function to check if user has any of the required permissions
export async function requireAnyPermission(
  userId: string,
  permissions: Array<{ resource: string; action: string }>
): Promise<AuthorizationResult> {
  for (const permission of permissions) {
    const result = await rbacManager.authorize({
      userId,
      resource: permission.resource,
      action: permission.action
    });
    
    if (result.allowed) {
      return result;
    }
  }

  return {
    allowed: false,
    reason: 'Missing required permissions',
    requiredPermissions: permissions.map(p => `${p.resource}:${p.action}`)
  };
}