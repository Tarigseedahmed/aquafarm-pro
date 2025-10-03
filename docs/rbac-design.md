# RBAC Design Document - AquaFarm Pro

## نظرة عامة

نظام إدارة الأدوار والصلاحيات (Role-Based Access Control) في AquaFarm Pro يهدف إلى توفير تحكم دقيق في الوصول إلى الموارد والعمليات بناءً على الأدوار المحددة للمستخدمين.

## المبادئ الأساسية

### 1. Multi-Tenancy

- كل مستخدم ينتمي إلى مستأجر واحد (tenant)
- البيانات معزولة تماماً بين المستأجرين
- الصلاحيات تُطبق في سياق المستأجر

### 2. Principle of Least Privilege

- المستخدمون يحصلون على الحد الأدنى من الصلاحيات المطلوبة
- الصلاحيات تُمنح بناءً على الوظيفة الفعلية

### 3. Hierarchical Roles

- الأدوار لها تسلسل هرمي (Admin > Manager > Operator > Viewer)
- الأدوار الأعلى ترث صلاحيات الأدوار الأدنى

## الأدوار المحددة

### 1. Super Admin (System Level)

**الوصف:** إدارة النظام على مستوى المنصة
**الصلاحيات:**

- إدارة المستأجرين (Tenants)
- إدارة المستخدمين على مستوى النظام
- إعدادات النظام العامة
- مراقبة الأداء والصحة العامة

### 2. Tenant Admin

**الوصف:** إدارة شاملة للمستأجر
**الصلاحيات:**

- إدارة جميع المستخدمين في المستأجر
- إدارة المزارع والأحواض
- إدارة الحسابات المالية
- إعدادات المستأجر
- التقارير الشاملة

### 3. Farm Manager

**الوصف:** إدارة مزرعة أو أكثر
**الصلاحيات:**
-إدارة المزارع المخصصة

- إدارة الأحواض في المزارع المخصصة
- إدارة دورة حياة الأسماك
- مراقبة جودة المياه
- التقارير على مستوى المزرعة

### 4. Pond Operator

**الوصف:** تشغيل أحواض محددة
**الصلاحيات:**

- إدخال قراءات جودة المياه
- تسجيل التغذية
- إدارة دورة حياة الأسماك في الأحواض المخصصة
- عرض التقارير الأساسية

### 5. Accountant

**الوصف:** إدارة الحسابات المالية
**الصلاحيات:**

- إدارة الحسابات (Chart of Accounts)
- تسجيل المعاملات المالية
- إدارة الضرائب والرسوم
- تقارير مالية
- إدارة الفواتير

### 6. Viewer

**الوصف:** عرض البيانات فقط
**الصلاحيات:**
-عرض التقارير

- عرض بيانات المزارع والأحواض
- عرض الإحصائيات
- لا يمكن التعديل أو الحذف

## مصفوفة الصلاحيات

### إدارة المستخدمين

| الصلاحية | Super Admin | Tenant Admin | Farm Manager | Pond Operator | Accountant | Viewer |
|----------|-------------|--------------|--------------|---------------|------------|--------|
| إنشاء مستخدمين | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| تعديل المستخدمين | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| حذف المستخدمين | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| عرض المستخدمين | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### إدارة المزارع

| الصلاحية | Super Admin | Tenant Admin | Farm Manager | Pond Operator | Accountant | Viewer |
|----------|-------------|--------------|--------------|---------------|------------|--------|
| إنشاء مزارع | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| تعديل المزارع | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| حذف المزارع | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| عرض المزارع | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### إدارة الأحواض

| الصلاحية | Super Admin | Tenant Admin | Farm Manager | Pond Operator | Accountant | Viewer |
|----------|-------------|--------------|--------------|---------------|------------|--------|
| إنشاء أحواض | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| تعديل الأحواض | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| حذف الأحواض | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| عرض الأحواض | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### جودة المياه

| الصلاحية | Super Admin | Tenant Admin | Farm Manager | Pond Operator | Accountant | Viewer |
|----------|-------------|--------------|--------------|---------------|------------|--------|
| إدخال قراءات | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| تعديل القراءات | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| حذف القراءات | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| عرض القراءات | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### المحاسبة

| الصلاحية | Super Admin | Tenant Admin | Farm Manager | Pond Operator | Accountant | Viewer |
|----------|-------------|--------------|--------------|---------------|------------|--------|
| إدارة الحسابات | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| تسجيل المعاملات | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| إدارة الضرائب | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| عرض التقارير المالية | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |

## التنفيذ التقني

### 1. Database Schema

```sql
-- جدول الأدوار
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- جدول الصلاحيات
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول ربط الأدوار بالصلاحيات
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- جدول ربط المستخدمين بالأدوار
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id, tenant_id)
);
```

### 2. Implementation in NestJS

```typescript
// Permission Enum
export enum Permission {
  // User Management
  USER_CREATE = 'user.create',
  USER_READ = 'user.read',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  
  // Farm Management
  FARM_CREATE = 'farm.create',
  FARM_READ = 'farm.read',
  FARM_UPDATE = 'farm.update',
  FARM_DELETE = 'farm.delete',
  
  // Pond Management
  POND_CREATE = 'pond.create',
  POND_READ = 'pond.read',
  POND_UPDATE = 'pond.update',
  POND_DELETE = 'pond.delete',
  
  // Water Quality
  WATER_QUALITY_CREATE = 'water_quality.create',
  WATER_QUALITY_READ = 'water_quality.read',
  WATER_QUALITY_UPDATE = 'water_quality.update',
  WATER_QUALITY_DELETE = 'water_quality.delete',
  
  // Accounting
  ACCOUNTING_CREATE = 'accounting.create',
  ACCOUNTING_READ = 'accounting.read',
  ACCOUNTING_UPDATE = 'accounting.update',
  ACCOUNTING_DELETE = 'accounting.delete',
}

// Role Enum
export enum Role {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  FARM_MANAGER = 'farm_manager',
  POND_OPERATOR = 'pond_operator',
  ACCOUNTANT = 'accountant',
  VIEWER = 'viewer',
}

// Role-Permission Mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.TENANT_ADMIN]: [
    Permission.USER_CREATE, Permission.USER_READ, Permission.USER_UPDATE, Permission.USER_DELETE,
    Permission.FARM_CREATE, Permission.FARM_READ, Permission.FARM_UPDATE, Permission.FARM_DELETE,
    Permission.POND_CREATE, Permission.POND_READ, Permission.POND_UPDATE, Permission.POND_DELETE,
    Permission.WATER_QUALITY_CREATE, Permission.WATER_QUALITY_READ, Permission.WATER_QUALITY_UPDATE, Permission.WATER_QUALITY_DELETE,
    Permission.ACCOUNTING_CREATE, Permission.ACCOUNTING_READ, Permission.ACCOUNTING_UPDATE, Permission.ACCOUNTING_DELETE,
  ],
  [Role.FARM_MANAGER]: [
    Permission.FARM_READ, Permission.FARM_UPDATE,
    Permission.POND_CREATE, Permission.POND_READ, Permission.POND_UPDATE, Permission.POND_DELETE,
    Permission.WATER_QUALITY_CREATE, Permission.WATER_QUALITY_READ, Permission.WATER_QUALITY_UPDATE,
  ],
  [Role.POND_OPERATOR]: [
    Permission.POND_READ, Permission.POND_UPDATE,
    Permission.WATER_QUALITY_CREATE, Permission.WATER_QUALITY_READ, Permission.WATER_QUALITY_UPDATE,
  ],
  [Role.ACCOUNTANT]: [
    Permission.ACCOUNTING_CREATE, Permission.ACCOUNTING_READ, Permission.ACCOUNTING_UPDATE, Permission.ACCOUNTING_DELETE,
  ],
  [Role.VIEWER]: [
    Permission.FARM_READ, Permission.POND_READ, Permission.WATER_QUALITY_READ, Permission.ACCOUNTING_READ,
  ],
};
```

### 3. Guards and Decorators

```typescript
// Permissions Guard
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredPermissions.some(permission => 
      user.permissions?.includes(permission)
    );
  }
}

// Permissions Decorator
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);

// Usage in Controllers
@Controller('farms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FarmsController {
  @Post()
  @RequirePermissions(Permission.FARM_CREATE)
  create(@Body() createFarmDto: CreateFarmDto) {
    // Implementation
  }
}
```

## الأمان والمراجعة

### 1. Audit Logging

- تسجيل جميع العمليات الحساسة
- تتبع تغييرات الصلاحيات
- مراجعة دورية للوصول

### 2. Session Management

- انتهاء صلاحية الجلسات
- إعادة المصادقة للعمليات الحساسة
- تسجيل الخروج من جميع الأجهزة

### 3. Data Isolation

- Row Level Security (RLS) في PostgreSQL
- فحص tenant_id في جميع الاستعلامات
- عزل البيانات على مستوى التطبيق

## التطوير المستقبلي

### 1. Dynamic Roles

- إمكانية إنشاء أدوار مخصصة
- واجهة إدارة الأدوار
- تخصيص الصلاحيات

### 2. Time-based Permissions

- صلاحيات مؤقتة
- انتهاء صلاحية الأدوار
- جدولة الصلاحيات

### 3. Resource-specific Permissions

- صلاحيات على مستوى المزرعة
- صلاحيات على مستوى الحوض
- تحكم دقيق في الوصول

## الخلاصة

نظام RBAC في AquaFarm Pro يوفر:
-تحكم دقيق في الوصول
-عزل البيانات بين المستأجرين
-مرونة في إدارة الصلاحيات
-أمان عالي المستوى
-سهولة في الصيانة والتطوير

هذا التصميم يضمن أن كل مستخدم يحصل على الصلاحيات المناسبة لوظيفته مع الحفاظ على أمان البيانات وسرية المعلومات.
