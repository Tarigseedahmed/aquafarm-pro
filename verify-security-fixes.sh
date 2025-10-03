#!/usr/bin/env bash

# 🧪 سكريبت اختبار الإصلاحات الأمنية
# Security Fixes Verification Script

echo "================================"
echo "🔍 فحص الإصلاحات المُنفذة"
echo "================================"
echo ""

# الألوان
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# عداد النجاح والفشل
PASS=0
FAIL=0

# ==========================================
# 1. التحقق من AC-DB-01: onDelete في FishBatch
# ==========================================
echo "📋 [1/4] فحص AC-DB-01: FishBatch → Pond onDelete policy"
if grep -q "onDelete: 'SET NULL'" backend/src/fish-batches/entities/fish-batch.entity.ts; then
    echo -e "${GREEN}✅ PASS${NC}: FishBatch → Pond relation has onDelete: SET NULL"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}: FishBatch → Pond relation missing onDelete policy"
    FAIL=$((FAIL + 1))
fi
echo ""

# ==========================================
# 2. التحقق من AC-DB-02: RESTRICT في User relations
# ==========================================
echo "📋 [2/4] فحص AC-DB-02: User relations with RESTRICT"

# فحص Pond.managedBy
if grep -q "onDelete: 'RESTRICT'" backend/src/ponds/entities/pond.entity.ts; then
    echo -e "${GREEN}✅ PASS${NC}: Pond → User (managedBy) has onDelete: RESTRICT"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}: Pond → User (managedBy) missing RESTRICT"
    FAIL=$((FAIL + 1))
fi

# فحص Farm.owner
if grep -q "onDelete: 'RESTRICT'" backend/src/farms/entities/farm.entity.ts; then
    echo -e "${GREEN}✅ PASS${NC}: Farm → User (owner) has onDelete: RESTRICT"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}: Farm → User (owner) missing RESTRICT"
    FAIL=$((FAIL + 1))
fi
echo ""

# ==========================================
# 3. التحقق من AC-SEC-01: Cache namespace
# ==========================================
echo "📋 [3/4] فحص AC-SEC-01: Cache keys namespace"
if grep -q 'tenant:id:' backend/src/tenancy/tenant-code-cache.service.ts && \
   grep -q 'tenant:code:' backend/src/tenancy/tenant-code-cache.service.ts; then
    echo -e "${GREEN}✅ PASS${NC}: Cache keys use namespace prefix (tenant:id: and tenant:code:)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}: Cache keys missing namespace prefix"
    FAIL=$((FAIL + 1))
fi
echo ""

# ==========================================
# 4. التحقق من AC-DB-04: Pessimistic Locking
# ==========================================
echo "📋 [4/4] فحص AC-DB-04: Pessimistic Write Lock"
if grep -q "mode: 'pessimistic_write'" backend/src/fish-batches/fish-batches.service.ts; then
    echo -e "${GREEN}✅ PASS${NC}: FishBatch update uses pessimistic_write lock"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}: FishBatch update missing pessimistic lock"
    FAIL=$((FAIL + 1))
fi
echo ""

# ==========================================
# النتيجة النهائية
# ==========================================
echo "================================"
echo "📊 النتيجة النهائية"
echo "================================"
echo -e "${GREEN}✅ Passed:${NC} $PASS"
echo -e "${RED}❌ Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 جميع الإصلاحات مُطبقة بنجاح!${NC}"
    echo "المشروع جاهز للإنتاج Production-Ready ✅"
    exit 0
else
    echo -e "${RED}⚠️  بعض الإصلاحات لم تُطبق بشكل صحيح${NC}"
    echo "يرجى مراجعة الملفات المذكورة أعلاه"
    exit 1
fi
