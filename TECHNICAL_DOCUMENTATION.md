# 📋 الوثائق التقنية والفنية - AquaFarm Pro

## Technical Documentation

<div align="center">

![AquaFarm Pro](https://img.shields.io/badge/AquaFarm%20Pro-Production%20Ready-green.svg)
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)

**تاريخ التحديث:** 3 أكتوبر 2025  
**الحالة:** جاهز للإنتاج ✅

</div>

---

## 📑 فهرس المحتويات | Table of Contents

1.[نظرة عامة على المشروع](#-نظرة-عامة-على-المشروع)
2. [البنية التحتية](#-البنية-التحتية)
3. [المكونات التقنية](#-المكونات-التقنية)
4. [البنية المعمارية](#-البنية-المعمارية)
5. [قاعدة البيانات](#-قاعدة-البيانات)
6. [واجهات برمجة التطبيقات](#-واجهات-برمجة-التطبيقات)
7. [الأمان والحماية](#-الأمان-والحماية)
8. [الأداء والتحسين](#-الأداء-والتحسين)
9. [النشر والاستضافة](#-النشر-والاستضافة)
10. [الاختبارات](#-الاختبارات)
11. [المراقبة والتسجيل](#-المراقبة-والتسجيل)
12. [التطوير المستقبلي](#-التطوير-المستقبلي)

---

## 🎯 نظرة عامة على المشروع

### وصف المشروع

**AquaFarm Pro** هو نظام إدارة متكامل قائم على السحابة لمزارع الاستزراع المائي، يوفر حلولاً شاملة لإدارة الأحواض، مراقبة جودة المياه، تتبع الأسماك، وإدارة التغذية.

### الأهداف الرئيسية

- 🎯 إدارة شاملة لمزارع الاستزراع المائي
- 📊 مراقبة جودة المياه في الوقت الفعلي
- 🐟 تتبع دفعات الأسماك ونموها
- 📈 تحليلات وتقارير متقدمة
- 📱 واجهة مستخدم حديثة ومتجاوبة
- 🔐 نظام أمان متعدد المستويات
- 🌐 دعم متعدد المستأجرين (Multi-tenancy)

### التقنيات الأساسية

#### Backend Stack

- **Framework:** NestJS 10.0.0
- **Language:** TypeScript 5.x
- **Runtime:** Node.js 20.x
- **API Style:** RESTful API
- **Documentation:** OpenAPI 3.0 (Swagger)

#### Frontend Stack

- **Framework:** Next.js 15.5.4
- **Language:** TypeScript 5.x
- **UI Library:** React 19.1.0
- **Styling:** Tailwind CSS 4.x
- **State Management:** TanStack Query 5.90.2
- **Animations:** Framer Motion 12.23.22

#### Mobile Stack

- **Framework:** React Native / Expo
- **Language:** TypeScript
- **State Management:** React Query

---

## 🏗️ البنية التحتية

### معلومات الخادم (VPS)

```yaml
Provider: Hostinger
Server: srv1029413.hstgr.cloud
IP Address: 72.60.187.58
Location: Paris, France
OS: Ubuntu 24.04 LTS
Plan: KVM 4 VPS
```

### النطاقات (Domains)

```yaml
Main Domain: aquafarm.cloud
API Subdomain: api.aquafarm.cloud
Admin Panel: admin.aquafarm.cloud
Status: Active ✅
SSL: Let's Encrypt (Auto-renewal enabled)
```

### البيئات (Environments)

#### Production Environment

```bash
NODE_ENV: production
DOMAIN: aquafarm.cloud
API_URL: https://api.aquafarm.cloud
FRONTEND_URL: https://aquafarm.cloud
```

#### Development Environment

```bash
NODE_ENV: development
DOMAIN: localhost
API_URL: http://localhost:3000
FRONTEND_URL: http://localhost:3001
```

### الخدمات السحابية

#### Docker Services

```yaml
Services:
  - postgres: PostgreSQL 15 Alpine
  - redis: Redis 7 Alpine
  - backend: NestJS Application
  - frontend: Next.js Application
  - nginx: Reverse Proxy & Load Balancer
```

---

## 🔧 المكونات التقنية

### Backend Components

#### Core Modules

```typescript
// Structure: backend/src/
├── auth/                    # نظام المصادقة والترخيص
│   ├── guards/             # حراس الأمان
│   ├── strategies/         # استراتيجيات Passport
│   └── decorators/         # ديكوريتورز مخصصة
│
├── users/                   # إدارة المستخدمين
│   ├── entities/           # كيانات المستخدم
│   ├── dto/               # Data Transfer Objects
│   └── roles/             # الأدوار والصلاحيات
│
├── farms/                   # إدارة المزارع
├── ponds/                   # إدارة الأحواض
├── fish-batches/           # دفعات الأسماك
├── feeding-records/        # سجلات التغذية
├── water-quality/          # جودة المياه
├── notifications/          # نظام الإشعارات
├── iot/                    # أجهزة إنترنت الأشياء
├── alerts/                 # التنبيهات
├── accounting/             # المحاسبة
├── payments/               # المدفوعات
├── bi/                     # ذكاء الأعمال
├── ai/                     # الذكاء الاصطناعي
├── monitoring/             # المراقبة
├── backup/                 # النسخ الاحتياطي
├── audit/                  # تدقيق العمليات
└── tenancy/                # Multi-tenancy Support
```

#### Dependencies الرئيسية

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/typeorm": "^11.0.0",
  "@nestjs/jwt": "^11.0.0",
  "@nestjs/passport": "^11.0.5",
  "@nestjs/config": "^4.0.2",
  "@nestjs/swagger": "^8.1.1",
  "@nestjs/throttler": "^6.4.0",
  "typeorm": "^0.3.27",
  "pg": "^8.16.3",
  "ioredis": "^5.8.0",
  "bcrypt": "^6.0.0",
  "class-validator": "^0.14.2",
  "class-transformer": "^0.5.1",
  "passport-jwt": "^4.0.1",
  "helmet": "^7.1.0",
  "cors": "^2.8.5"
}
```

### Frontend Components

#### Page Structure

```typescript
// Structure: frontend/src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # صفحات المصادقة
│   ├── (dashboard)/        # لوحة التحكم
│   ├── farms/              # إدارة المزارع
│   ├── ponds/              # إدارة الأحواض
│   ├── fish/               # إدارة الأسماك
│   ├── feeding/            # التغذية
│   ├── water-quality/      # جودة المياه
│   ├── reports/            # التقارير
│   └── settings/           # الإعدادات
│
├── components/              # المكونات المشتركة
│   ├── ui/                 # مكونات UI الأساسية
│   ├── forms/              # النماذج
│   ├── charts/             # الرسوم البيانية
│   ├── tables/             # الجداول
│   └── layout/             # مكونات التخطيط
│
├── services/                # خدمات API
├── hooks/                   # React Hooks مخصصة
├── lib/                     # مكتبات مساعدة
├── types/                   # TypeScript Types
├── config/                  # ملفات التكوين
└── i18n/                    # الترجمة الدولية
```

#### UI Components Library

```typescript
// Radix UI Components
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-tabs
- @radix-ui/react-select
- @radix-ui/react-toast
- @radix-ui/react-avatar
- @radix-ui/react-accordion
- @radix-ui/react-slider
```

**** Dependencies الرئيسية

```json
{
  "next": "15.5.4",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "@tanstack/react-query": "^5.90.2",
  "axios": "^1.12.2",
  "react-hook-form": "^7.54.2",
  "recharts": "^3.2.1",
  "framer-motion": "^12.23.22",
  "lucide-react": "^0.468.0",
  "tailwindcss": "^4",
  "i18next": "^25.5.2",
  "react-i18next": "^15.7.3"
}
```

---

## 🏛️ البنية المعمارية

### Architecture Pattern

```text
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Web    │  │  Mobile  │  │   Admin  │             │
│  │ Next.js  │  │   React  │  │  Panel   │             │
│  │          │  │  Native  │  │          │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼───────────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      Nginx Reverse Proxy   │
        │    (SSL Termination)       │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │     Backend API Layer      │
        │        NestJS              │
        │  ┌──────────────────────┐ │
        │  │  Controllers         │ │
        │  │  Services            │ │
        │  │  Repositories        │ │
        │  │  Guards & Middleware │ │
        │  └──────────────────────┘ │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌───────▼────────┐
│  PostgreSQL    │         │     Redis      │
│   Database     │         │     Cache      │
│                │         │                │
│  - Main Data   │         │  - Sessions    │
│  - Relations   │         │  - Cache       │
│  - Constraints │         │  - Rate Limit  │
└────────────────┘         └────────────────┘
```

### Multi-Tenancy Architecture

```typescript
// Tenant Isolation Strategy
interface TenantIsolation {
  strategy: 'DATABASE_PER_TENANT' | 'SCHEMA_PER_TENANT' | 'SHARED_DATABASE';
  implementation: 'SHARED_DATABASE'; // Current implementation
  
  isolation_level: {
    data: 'ROW_LEVEL_SECURITY',
    queries: 'TENANT_SCOPED',
    cache: 'TENANT_PREFIXED'
  };
  
  tenant_resolution: {
    method: 'SUBDOMAIN' | 'JWT_CLAIM' | 'HEADER',
    current: 'JWT_CLAIM' // tenantId in JWT
  };
}
```

### API Architecture

```typescript
// RESTful API Design
interface APIDesign {
  style: 'REST';
  versioning: 'URL_VERSIONING'; // /api/v1/
  authentication: 'JWT_BEARER';
  authorization: 'RBAC'; // Role-Based Access Control
  
  response_format: {
    success: {
      data: any;
      message?: string;
      meta?: {
        page: number;
        limit: number;
        total: number;
      };
    };
    error: {
      statusCode: number;
      message: string;
      error: string;
      timestamp: string;
      path: string;
    };
  };
}
```

---

## 💾 قاعدة البيانات

### Database Configuration

```yaml
Database Management System: PostgreSQL 15
Container: aquafarm-postgres
Port: 5432 (internal)
Database Name: aquafarm_pro
User: aquafarm_admin
Character Set: UTF-8
Timezone: UTC
```

### Schema Design

```sql
-- Core Tables Structure

-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL,
  tenant_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenants (Organizations)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  plan VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farms
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  size_hectares DECIMAL(10, 2),
  coordinates POINT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ponds
CREATE TABLE ponds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  capacity DECIMAL(10, 2),
  depth DECIMAL(5, 2),
  area DECIMAL(10, 2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fish Batches
CREATE TABLE fish_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id UUID NOT NULL REFERENCES ponds(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  species VARCHAR(100),
  initial_count INTEGER,
  current_count INTEGER,
  average_weight DECIMAL(10, 3),
  stocking_date DATE,
  harvest_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Water Quality Records
CREATE TABLE water_quality_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id UUID NOT NULL REFERENCES ponds(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  temperature DECIMAL(5, 2),
  ph DECIMAL(4, 2),
  dissolved_oxygen DECIMAL(5, 2),
  ammonia DECIMAL(5, 2),
  nitrite DECIMAL(5, 2),
  nitrate DECIMAL(5, 2),
  salinity DECIMAL(5, 2),
  measured_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feeding Records
CREATE TABLE feeding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id UUID NOT NULL REFERENCES ponds(id),
  fish_batch_id UUID REFERENCES fish_batches(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  feed_type VARCHAR(100),
  quantity DECIMAL(10, 3),
  feeding_time TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  severity VARCHAR(20),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes & Optimization

```sql
-- Performance Indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_farms_tenant ON farms(tenant_id);
CREATE INDEX idx_ponds_farm ON ponds(farm_id);
CREATE INDEX idx_ponds_tenant ON ponds(tenant_id);
CREATE INDEX idx_fish_batches_pond ON fish_batches(pond_id);
CREATE INDEX idx_water_quality_pond_date ON water_quality_records(pond_id, measured_at DESC);
CREATE INDEX idx_feeding_pond_date ON feeding_records(pond_id, feeding_time DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Full-Text Search Indexes
CREATE INDEX idx_farms_name_trgm ON farms USING gin(name gin_trgm_ops);
CREATE INDEX idx_ponds_name_trgm ON ponds USING gin(name gin_trgm_ops);
```

### Backup Strategy

```yaml
Backup Type: Automated Daily Backups
Schedule: Every day at 02:00 UTC
Retention: 30 days
Location: /var/backups/postgres/
Method: pg_dump with compression

Backup Command:
  pg_dump -U aquafarm_admin -d aquafarm_pro \
    -F c -b -v -f "/var/backups/postgres/backup_$(date +%Y%m%d_%H%M%S).dump"
```

---

## 🔌 واجهات برمجة التطبيقات

### API Endpoints Overview

#### Authentication Endpoints

```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// POST /api/auth/refresh
// GET /api/auth/profile
// POST /api/auth/logout
```

#### Farms Management

```typescript
// GET /api/farms
interface GetFarmsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
}

// POST /api/farms
interface CreateFarmDto {
  name: string;
  location: string;
  sizeHectares: number;
  coordinates?: { lat: number; lng: number };
}

// GET /api/farms/:id
// PATCH /api/farms/:id
// DELETE /api/farms/:id
```

#### Ponds Management

```typescript
// GET /api/ponds
// POST /api/ponds
interface CreatePondDto {
  farmId: string;
  name: string;
  capacity: number;
  depth: number;
  area: number;
}

// GET /api/ponds/:id
// PATCH /api/ponds/:id
// DELETE /api/ponds/:id
// GET /api/ponds/:id/water-quality
// GET /api/ponds/:id/fish-batches
```

#### Water Quality

```typescript
// GET /api/water-quality
interface WaterQualityQuery {
  pondId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// POST /api/water-quality
interface CreateWaterQualityDto {
  pondId: string;
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  ammonia?: number;
  nitrite?: number;
  nitrate?: number;
  salinity?: number;
  measuredAt: string;
}

// GET /api/water-quality/:id
// GET /api/water-quality/analytics
```

#### Fish Batches

```typescript
// GET /api/fish-batches
// POST /api/fish-batches
interface CreateFishBatchDto {
  pondId: string;
  species: string;
  initialCount: number;
  averageWeight: number;
  stockingDate: string;
}

// GET /api/fish-batches/:id
// PATCH /api/fish-batches/:id
// POST /api/fish-batches/:id/harvest
// GET /api/fish-batches/:id/growth-history
```

#### Feeding Records

```typescript
// GET /api/feeding-records
// POST /api/feeding-records
interface CreateFeedingRecordDto {
  pondId: string;
  fishBatchId?: string;
  feedType: string;
  quantity: number;
  feedingTime: string;
  notes?: string;
}

// GET /api/feeding-records/analytics
```

### API Response Standards

```typescript
// Success Response
interface SuccessResponse<T> {
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Response
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// HTTP Status Codes Used
200 OK              // Successful GET, PATCH
201 Created         // Successful POST
204 No Content      // Successful DELETE
400 Bad Request     // Validation errors
401 Unauthorized    // Authentication required
403 Forbidden       // Insufficient permissions
404 Not Found       // Resource not found
409 Conflict        // Resource conflict
422 Unprocessable   // Business logic error
429 Too Many Requests // Rate limit exceeded
500 Server Error    // Internal server error
```

### Rate Limiting

```typescript
interface RateLimitConfig {
  global: {
    limit: 100,    // requests
    ttl: 60        // seconds
  },
  auth: {
    login: {
      limit: 5,
      ttl: 300     // 5 attempts per 5 minutes
    },
    register: {
      limit: 3,
      ttl: 3600    // 3 attempts per hour
    }
  }
}
```

---

## 🔐 الأمان والحماية

### Authentication System

```typescript
// JWT Configuration
interface JWTConfig {
  algorithm: 'HS256';
  accessToken: {
    expiresIn: '15m';
    secret: process.env.JWT_SECRET;
  };
  refreshToken: {
    expiresIn: '7d';
    secret: process.env.JWT_REFRESH_SECRET;
  };
}

// Password Security
interface PasswordPolicy {
  minLength: 8;
  requireUppercase: true;
  requireLowercase: true;
  requireNumbers: true;
  requireSpecialChars: true;
  hashAlgorithm: 'bcrypt';
  saltRounds: 10;
}
```

### Authorization (RBAC)

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',      // Full system access
  TENANT_ADMIN = 'tenant_admin',    // Tenant-wide access
  FARM_MANAGER = 'farm_manager',    // Farm-level access
  POND_OPERATOR = 'pond_operator',  // Pond-level access
  VIEWER = 'viewer'                 // Read-only access
}

// Permission Matrix
const Permissions = {
  SUPER_ADMIN: ['*'],
  TENANT_ADMIN: ['farms:*', 'ponds:*', 'users:manage'],
  FARM_MANAGER: ['farms:read', 'ponds:*', 'fish:*'],
  POND_OPERATOR: ['ponds:read', 'water-quality:*', 'feeding:*'],
  VIEWER: ['*:read']
};
```

### Security Headers

```typescript
// Helmet Configuration
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}
```

### CORS Configuration

```typescript
// CORS Settings
{
  origin: [
    'https://aquafarm.cloud',
    'https://admin.aquafarm.cloud',
    'http://localhost:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 3600
}
```

### Data Encryption

```yaml
At Rest:
  - Database: PostgreSQL encryption
  - Passwords: bcrypt hashing (10 rounds)
  - Sensitive Fields: AES-256 encryption

In Transit:
  - HTTPS/TLS 1.3
  - Certificate: Let's Encrypt
  - HSTS enabled
  - Secure cookies (HttpOnly, Secure, SameSite)
```

### Input Validation

```typescript
// Using class-validator
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;
}

// XSS Protection
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}
```

---

## ⚡ الأداء والتحسين

### Caching Strategy

```typescript
// Redis Cache Configuration
interface CacheConfig {
  host: 'redis';
  port: 6379;
  password: process.env.REDIS_PASSWORD;
  db: 0;
  
  strategies: {
    // Cache frequently accessed data
    users: { ttl: 3600 },           // 1 hour
    farms: { ttl: 1800 },           // 30 minutes
    ponds: { ttl: 900 },            // 15 minutes
    waterQuality: { ttl: 300 },     // 5 minutes
    
    // Session management
    sessions: { ttl: 86400 },       // 24 hours
    
    // Rate limiting
    rateLimits: { ttl: 60 }         // 1 minute
  };
}

// Cache Keys Pattern
const cacheKeys = {
  user: (id: string) => `user:${id}`,
  farm: (id: string) => `farm:${id}`,
  pondList: (farmId: string) => `ponds:farm:${farmId}`,
  waterQuality: (pondId: string) => `water-quality:pond:${pondId}:latest`
};
```

### Database Optimization

```sql
-- Query Optimization Techniques
1. Proper Indexing (see Database section)
2. Query Planning with EXPLAIN ANALYZE
3. Connection Pooling (max: 20 connections)
4. Prepared Statements
5. Batch Operations
6. Pagination (limit/offset)
7. Selective Column Fetching
8. Avoiding N+1 queries (eager loading)

-- Connection Pool Configuration
{
  max: 20,
  min: 5,
  idle: 10000,
  acquire: 30000,
  evict: 1000
}
```

### Frontend Performance

```typescript
// Next.js Optimization
{
  // Image Optimization
  images: {
    domains: ['aquafarm.cloud', 'api.aquafarm.cloud'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920]
  },
  
  // Code Splitting
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          priority: 10
        }
      }
    };
  },
  
  // Build Optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Static Generation where possible
  // Incremental Static Regeneration (ISR)
  revalidate: 60  // 60 seconds
}

// React Query Configuration
{
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      cacheTime: 10 * 60 * 1000,    // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
}
```

### Performance Metrics

```yaml
Target Performance Metrics:
  Time to First Byte (TTFB): < 200ms
  First Contentful Paint (FCP): < 1.5s
  Largest Contentful Paint (LCP): < 2.5s
  Time to Interactive (TTI): < 3.5s
  Cumulative Layout Shift (CLS): < 0.1
  First Input Delay (FID): < 100ms

API Response Times:
  GET endpoints: < 100ms (cached) / < 500ms (uncached)
  POST/PATCH endpoints: < 1s
  Complex analytics: < 3s
```

---

## 🚀 النشر والاستضافة

### Docker Configuration

```yaml
# docker-compose.yml Structure
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: aquafarm_pro
      POSTGRES_USER: aquafarm_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: pg_isready -U aquafarm_admin
      interval: 30s

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: redis-cli ping
      interval: 30s

  backend:
    build: ./backend
    depends_on:
      - postgres
      - redis
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      REDIS_HOST: redis
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs

  frontend:
    build: ./frontend
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
```

### Nginx Configuration

```nginx
# nginx.conf
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:3001;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name aquafarm.cloud www.aquafarm.cloud api.aquafarm.cloud;
    return 301 https://$server_name$request_uri;
}

# Main Application
server {
    listen 443 ssl http2;
    server_name aquafarm.cloud www.aquafarm.cloud;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Server
server {
    listen 443 ssl http2;
    server_name api.aquafarm.cloud;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://aquafarm.cloud" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
}
```

### Deployment Process

```bash
# Automated Deployment Script
#!/bin/bash

# 1. Pull latest code
git pull origin main

# 2. Build Docker images
docker compose build --no-cache

# 3. Run database migrations
docker compose run --rm migration-runner

# 4. Stop old containers
docker compose down

# 5. Start new containers
docker compose up -d

# 6. Wait for health checks
sleep 30

# 7. Verify deployment
curl -f https://api.aquafarm.cloud/health || exit 1
curl -f https://aquafarm.cloud || exit 1

# 8. Clean up old images
docker image prune -f

echo "✅ Deployment successful!"
```

### Environment Variables

```bash
# .env.production
NODE_ENV=production

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=aquafarm_pro
DB_USER=aquafarm_admin
DB_PASSWORD=<STRONG_PASSWORD>

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<STRONG_PASSWORD>

# JWT
JWT_SECRET=<RANDOM_SECRET_KEY>
JWT_REFRESH_SECRET=<RANDOM_SECRET_KEY>

# Domain
DOMAIN=aquafarm.cloud
API_URL=https://api.aquafarm.cloud
FRONTEND_URL=https://aquafarm.cloud

# CORS
CORS_ORIGIN=https://aquafarm.cloud

# Hostinger
HOSTINGER_API_KEY=<API_KEY>
```

---

## 🧪 الاختبارات

### Testing Strategy

```typescript
// Test Types & Coverage
{
  unitTests: {
    framework: 'Jest',
    coverage: '>80%',
    location: '**/*.spec.ts'
  },
  
  integrationTests: {
    framework: 'Jest + Supertest',
    coverage: '>70%',
    location: 'test/**/*.e2e-spec.ts'
  },
  
  e2eTests: {
    framework: 'Playwright / Cypress',
    coverage: 'Critical paths',
    location: 'e2e/**/*.test.ts'
  }
}
```

### Backend Tests

```typescript
// Unit Test Example
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useClass: Repository }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should hash password correctly', async () => {
    const password = 'Test123!@#';
    const hashed = await service.hashPassword(password);
    expect(hashed).not.toBe(password);
    expect(await bcrypt.compare(password, hashed)).toBe(true);
  });
});

// E2E Test Example
describe('Farms API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    // Setup test app
  });

  it('/api/farms (GET) - should return list of farms', () => {
    return request(app.getHttpServer())
      .get('/api/farms')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
```

### Test Commands

```bash
# Backend Tests
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run specific test suite
npm run test:tenant
npm run test:water-quality

# Frontend Tests
cd frontend

# Run tests
npm test

# Watch mode
npm test:watch
```

---

## 📊 المراقبة والتسجيل

### Logging System

```typescript
// Pino Logger Configuration
{
  level: process.env.LOG_LEVEL || 'info',
  prettyPrint: process.env.NODE_ENV !== 'production',
  
  // Log Rotation
  transport: {
    target: 'pino/file',
    options: {
      destination: '/app/logs/app.log',
      mkdir: true,
      maxsize: 10 * 1024 * 1024,  // 10MB
      maxFiles: 10
    }
  },
  
  // Redact sensitive data
  redact: {
    paths: ['password', 'accessToken', 'refreshToken'],
    remove: true
  }
}

// Log Levels
{
  fatal: 60,    // System crash
  error: 50,    // Error conditions
  warn: 40,     // Warning conditions
  info: 30,     // Informational messages
  debug: 20,    // Debug messages
  trace: 10     // Trace messages
}
```

### Health Checks

```typescript
// Health Check Endpoint
GET /health

Response:
{
  status: 'ok',
  info: {
    database: { status: 'up' },
    redis: { status: 'up' },
    memory: { status: 'up', heap: '150MB / 512MB' },
    disk: { status: 'up', usage: '45%' }
  },
  error: {},
  details: {
    database: { status: 'up' },
    redis: { status: 'up' },
    memory: { status: 'up', heap: '150MB / 512MB' },
    disk: { status: 'up', usage: '45%' }
  }
}
```

### Monitoring Metrics

```typescript
// Prometheus Metrics
{
  // System Metrics
  'process_cpu_usage_percent': gauge,
  'process_memory_usage_bytes': gauge,
  'nodejs_heap_size_total_bytes': gauge,
  'nodejs_heap_size_used_bytes': gauge,
  
  // Application Metrics
  'http_requests_total': counter,
  'http_request_duration_seconds': histogram,
  'http_requests_errors_total': counter,
  
  // Database Metrics
  'db_query_duration_seconds': histogram,
  'db_connections_active': gauge,
  'db_queries_total': counter,
  
  // Cache Metrics
  'redis_commands_total': counter,
  'redis_cache_hits_total': counter,
  'redis_cache_misses_total': counter,
  
  // Business Metrics
  'farms_total': gauge,
  'ponds_total': gauge,
  'fish_batches_active': gauge,
  'water_quality_readings_24h': counter
}
```

### Error Tracking

```typescript
// Error Handling Strategy
{
  // Global Exception Filter
  captureException: (exception, context) => {
    const error = {
      message: exception.message,
      stack: exception.stack,
      context: context,
      timestamp: new Date(),
      user: context.user?.id,
      tenantId: context.tenantId
    };
    
    // Log to file
    logger.error(error);
    
    // Send to monitoring service (optional)
    // sentry.captureException(exception);
  },
  
  // Error Notifications
  criticalErrors: ['DatabaseError', 'AuthenticationError'],
  notifyOn: ['fatal', 'error']
}
```

---

## 🔮 التطوير المستقبلي

### Roadmap - Phase 1 (Completed ✅)

- [x] Core authentication system
- [x] Multi-tenancy support
- [x] Farm and pond management
- [x] Water quality monitoring
- [x] Fish batch tracking
- [x] Feeding records
- [x] Basic analytics
- [x] Notification system
- [x] RESTful API
- [x] Docker deployment
- [x] Production deployment on Hostinger VPS

### Roadmap - Phase 2 (In Progress 🚧)

- [ ] Advanced analytics and BI dashboards
- [ ] AI-powered insights
- [ ] Mobile application (React Native)
- [ ] IoT device integration
- [ ] Real-time sensors monitoring
- [ ] Automated alerts system
- [ ] Export/Import functionality
- [ ] Multi-language support (Arabic/English)
- [ ] Payment integration
- [ ] Subscription management

### Roadmap - Phase 3 (Planned 📋)

- [ ] Machine learning predictions
- [ ] Disease detection AI
- [ ] Growth optimization algorithms
- [ ] Supply chain management
- [ ] Marketplace integration
- [ ] Financial management
- [ ] Inventory tracking
- [ ] Staff management
- [ ] Mobile app (iOS/Android native)
- [ ] Offline mode support

### Technology Improvements

```yaml
Performance:
  - Implement GraphQL API
  - Add service workers for PWA
  - Optimize image loading
  - Implement CDN
  - Database sharding for scalability

Security:
  - Two-factor authentication (2FA)
  - Biometric authentication
  - Advanced audit logging
  - Penetration testing
  - Security compliance certifications

DevOps:
  - CI/CD pipeline with GitHub Actions
  - Automated testing on PRs
  - Blue-green deployments
  - Kubernetes migration
  - Auto-scaling infrastructure
```

---

## 📞 معلومات الاتصال والدعم

### Project Information

```yaml
Project Name: AquaFarm Pro
Version: 0.1.0
Status: Production Ready
Last Updated: October 3, 2025

Live URLs:
  Main: https://aquafarm.cloud
  API: https://api.aquafarm.cloud
  Docs: https://api.aquafarm.cloud/api
  Health: https://api.aquafarm.cloud/health

Repository:
  Platform: GitHub
  Owner: Tarigseedahmed
  Repo: REPO
  Branch: feature/sprint-2-cache-ci
```

### Technical Support

```yaml
Documentation:
  - README.md - Project overview
  - QUICK_START.md - Quick start guide
  - DEPLOYMENT_GUIDE.md - Deployment instructions
  - API_DOCUMENTATION.md - API reference
  - TECHNICAL_DOCUMENTATION.md - Technical details (this file)

For Issues:
  - Check existing documentation
  - Review error logs
  - Contact development team
```

### Development Team

```yaml
Backend Development: NestJS/TypeScript
Frontend Development: Next.js/React
Database: PostgreSQL
DevOps: Docker/Nginx
Cloud: Hostinger VPS
```

---

## 📝 ملاحظات ختامية

### Best Practices

```markdown
1. **Security First**
   - Always use environment variables for secrets
   - Never commit sensitive data
   - Regular security audits
   - Keep dependencies updated

2. **Code Quality**
   - Follow TypeScript best practices
   - Write meaningful tests
   - Code reviews before merge
   - Consistent code formatting

3. **Performance**
   - Monitor application metrics
   - Optimize database queries
   - Use caching effectively
   - Regular performance audits

4. **Documentation**
   - Keep documentation updated
   - Document API changes
   - Comment complex logic
   - Update changelog

5. **Deployment**
   - Test in staging first
   - Have rollback plan
   - Monitor after deployment
   - Regular backups
```

### Maintenance Schedule

```yaml
Daily:
  - Monitor error logs
  - Check system health
  - Review security alerts

Weekly:
  - Database backups verification
  - Performance metrics review
  - Security patches check

Monthly:
  - Dependency updates
  - Security audit
  - Performance optimization
  - Database maintenance

Quarterly:
  - Major version updates
  - Infrastructure review
  - Disaster recovery test
  - Documentation update
```

---

<div align="center">

## 🎉 المشروع جاهز للإنتاج!

**AquaFarm Pro** - نظام إدارة مزارع الاستزراع المائي المتكامل

[![Live](https://img.shields.io/badge/Live-aquafarm.cloud-success)](https://aquafarm.cloud)
[![API](https://img.shields.io/badge/API-api.aquafarm.cloud-blue)](https://api.aquafarm.cloud)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-green)](https://aquafarm.cloud)

---

**تم التوثيق بتاريخ:** 3 أكتوبر 2025  
**الإصدار:** 0.1.0  
**الحالة:** ✅ جاهز للإنتاج

</div>
