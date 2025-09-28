# Sprint 2 Backlog (Phase 2 Kickoff: Infra & Quality Enablement)

**Sprint Code:** S2
**Target Dates:** 28 سبتمبر 2025 → 7 أكتوبر 2025 (10 أيام تقويمية / 7 أيام عمل)
**Sprint Goal (هدف السبرنت):** تأسيس طبقة البنية التحتية والتشغيل (Infra & Observability & Security Baselines) مع تمهيد توسيع الصلاحيات (RBAC) وتفعيل إمكانات التوسع الأفقي (Redis) وتحسين الاختبارات والجودة.

---

## 🎯 Objectives (الأهداف)

1. تمكين Redis واستخدامه كبنية مستقبلية للبث (SSE/WebSocket) وعمليات caching الخفيفة.
2. رفع أساس المراقبة (Prometheus metrics + Health + Basic Dashboard JSON).
3. تحسين خط CI/CD لإدخال جودة الكود والفحص الأمني وتشغيل الاختبارات تلقائياً.
4. إضافة Retry-After وNamed Throttler لتجربة مستخدم أفضل وحماية محسّنة.
5. توحيد التوثيق للصفحات عبر مخطط OpenAPI عام (Paginated\<T\>) لإزالة التكرار.
6. إنشاء مصفوفة صلاحيات (RBAC Matrix) كبداية للحد من الاعتماد على الأدوار النصية.
7. تنفيذ سياسات RLS أولية (Farms/Ponds) + إعداد قناة تمرير tenant_id إلى Postgres (GUC) تمهيداً لتوسيع الحماية لاحقاً.
8. تحسين تغطية الاختبارات بتمديد (SSE integration + RBAC negative + RLS enforcement tests).
9. إدخال وسيط caching مبسط لترجمة tenant code → UUID.

---

## 📦 Deliverables (المخرجات)

| رقم | المخرج | الوصف المختصر | يعتمد على |
|-----|--------|---------------|-----------|
| D1 | Redis Module مدمج | تثبيت redis client + Config + HealthIndicator | لا شيء |
| D2 | Metrics Endpoint | مسار /metrics (Prometheus) + 3 مقاييس مخصصة | D1 (اختياري) |
| D3 | Grafana Dashboard JSON | لوحة أولية (HTTP Req Rate, Errors, SSE clients) | D2 |
| D4 | CI Pipeline موسّع | lint + test + build + npm audit + markdown lint | لا شيء |
| D5 | Throttler Guard محسن | Named profile + Retry-After header | D4 (اختبار) |
| D6 | PaginatedResponse Decorator | إعادة استخدام موحّد في جميع المتحكمات | لا شيء |
| D7 | RBAC Matrix (permissions.json) | تعريف granular permissions + Loader | لا شيء |
| D8 | RLS Policies Migration | تمكين RLS + سياسات farms/ponds | D9 (GUC) |
| D9 | Postgres GUC Tenant Setter | Middleware / interceptor يضبط set_config | لا شيء |
| D10 | SSE Integration Test | يحاكي إنشاء إشعار والتقاط حدث | D1 (اختياري لاحق لRedis) |
| D11 | RBAC Negative Tests | رفض وصول بدون صلاحية | D7 |
| D12 | RLS Enforcement Tests | محاولة وصول cross-tenant تفشل بدون WHERE | D8 |
| D13 | Tenant Code Cache | In-memory Map + TTL (لاحقاً Redis) | D1 |

---

## 🗂️ Work Items (User Stories / Tasks)

| ID | النوع | العنوان | الوصف | التقدير (نقاط) | أولوية | قبول | ملاحظات |
|----|-------|---------|-------|----------------|---------|------|----------|
| S2-1 | Infra | إضافة حزمة redis وتهيئة RedisModule | استخدام ioredis أو node-redis + config عبر env + HealthIndicator | 3 | عالية | اتصال ناجح + HEALTH يمر | مهيأ للتبديل إلى connection pool |
| S2-2 | Observability | إضافة @willsoto/nestjs-prometheus أو بديل بسيط | /metrics + default + custom (http_requests_total, sse_clients, notifications_emitted) | 3 | عالية | جمع مقاييس عبر curl | بديل: manual Registry من prom-client |
| S2-3 | Observability | لوحة Grafana JSON أولية | ملف dashboard.json داخل docs/monitoring | 2 | متوسطة | JSON صالح وموثق | يعتمد على توفر المقاييس |
| S2-4 | CI/CD | تحديث workflow GitHub Actions | خطوات: install, lint, test, build, audit, markdown-lint | 5 | عالية | نجاح pipeline + شارة | إضافة caching للاعتماديات |
| S2-5 | Security/Perf | Throttler Guard + Retry-After | استنساخ المحاولة السابقة مع معالجة CRLF وإرجاع header | 2 | عالية | 429 يحوي Retry-After | يخص login فقط مبدئياً |
| S2-6 | DX / Docs | Decorator عام PaginatedResponse | @PaginatedResponse(Model) يولد schema reuse | 2 | متوسطة | إزالة جداول مكررة من Swagger | يسهّل لاحقاً code generation |
| S2-7 | Security | RBAC permissions.json + Service | تعريف map: resource: [actions]; حارس يتحقق من claim | 5 | عالية | منع عملية بدون إذن | توسعة لاحقة للدور الديناميكي |
| S2-8 | Data Security | RLS Migration (farms, ponds) | ALTER TABLE ENABLE RLS + CREATE POLICY ... | 5 | عالية | SELECT خارج التينانت يفشل بدون WHERE | يتطلب set_config للـ tenant_id |
| S2-9 | Data Security | Postgres Tenant GUC Setter | Middleware يستدعي: SET LOCAL app.tenant_id | 3 | عالية | استعلامات بدون WHERE تفشل (بوجود RLS) | مع pool: run per request using connection.run |
| S2-10 | Testing | SSE Integration Test | يحاكي POST إنشاء إشعار ثم يستمع للstream | 3 | متوسطة | test ينجح ويغلق الاتصال | استخدم supertest + event parser |
| S2-11 | Testing | RBAC Negative Tests | user بدون permission يحاول create farm | 2 | عالية | 403 | بعد S2-7 |
| S2-12 | Testing | RLS Enforcement Tests | حذف WHERE عمداً (service bypass) للتأكد من الحظر | 3 | عالية | خطأ أمني أو 0 نتائج | قد يتطلب mock raw query |
| S2-13 | Performance | Tenant Code Cache | Map<string, {uuid, ts}> + TTL 5m + fallback DB | 2 | متوسطة | hits > 0 بعد استدعاءين | Redis لاحقاً |
| S2-14 | Housekeeping | Markdown Lint خطوة pipeline | إعداد markdownlint-cli2 | 1 | متوسطة | فشل عند مخالفات | يحافظ على الاتساق |
| S2-15 | Docs | تحديث README و roadmap بالإنجازات | تلخيص ما أضيف في S2 | 1 | متوسطة | merged PR | نهاية السبرنت |

إجمالي النقاط (مبدئي): 40 نقطة (يُراجع حسب القدرة الفعلية للفريق).

---

## ⚖️ Capacity & Load

- Team Effective Capacity (افتراضي): 32–36 نقطة (مطوران خلفية + دعم مساعد).
- تجاوز طفيف مقبول مع إمكانية ترحيل بنود منخفضة الأولوية (S2-3, S2-6, S2-13) إذا لزم.

---

## 🔗 Dependencies & Sequencing

1. S2-9 (GUC) قبل تفعيل سياسة RLS Runtime (جزء من S2-8 التحقق النهائي).
2. S2-8 و S2-12 متلازمان (اختبار يعتمد على تفعيل RLS).
3. S2-7 يجب أن يسبق S2-11.
4. S2-2 قبل S2-3 (جمع المقاييس قبل بناء لوحة).
5. S2-4 مبكر لتأمين جودة بقية البنود.

---

## ✅ Acceptance Criteria (معايير القبول التفصيلية)

- Redis: أمر PING يعود PONG وHealth endpoint يعكس status=up.
- /metrics: يعرض http_requests_total وتزداد القيمة بعد استدعاءات تجريبية.
- Retry-After: عند تجاوز login throttle يعاد header بثواني الانتظار.
- PaginatedResponse: لا تكرار لجداول meta في Swagger؛ نموذج واحد مشارك.
- RBAC: إضافة permission farm.create يمنح القدرة، حذفها ينتج 403.
- RLS: تنفيذ SELECT * FROM farms بدون WHERE (عبر اختبار raw query) يعرض فقط سجلات tenant الحالي أو يرفض (بحسب السياسة). محاولة حقن tenant آخر تفشل.
- SSE Test: استقبال حدث notification خلال timeout < 2s بعد trigger.
- Markdown Lint: pipeline يفشل عند إدراج قائمة بخلاف النمط المعتمد.

---

## 🧪 Test Plan Additions

| نوع الاختبار | سيناريو جديد |
|---------------|--------------|
| Integration | SSE notification stream emits after create |
| Security | RLS blocks cross-tenant SELECT via raw query |
| Unit | RBAC service resolves permissions map correctly |
| E2E | Login throttle returns Retry-After |
| Performance (Light) | قياس زمن /metrics بعد 100 طلب (لا يتدهور > 20%) |

---

## 🔐 RLS Draft (مقتطف Migration SQL)

```sql
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponds ENABLE ROW LEVEL SECURITY;

-- Assume GUC app.tenant_id is set per request
CREATE POLICY farms_tenant_isolation ON farms
USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY ponds_tenant_isolation ON ponds
USING (farm_id IN (
  SELECT id FROM farms WHERE tenant_id = current_setting('app.tenant_id')::uuid
));
```

ملاحظة: يتطلب إعداد `SET LOCAL app.tenant_id = '<uuid>'` مع كل سياق طلب (Transaction boundary أو interceptor يحقن عبر queryRunner.connection).

---

## 🛡️ RBAC Matrix (نسخة أولية)

```json
{
  "farm": ["create", "read", "update", "delete"],
  "pond": ["create", "read", "update", "delete"],
  "notification": ["read", "mark_read"],
  "user": ["read_self", "read_tenant"],
  "admin": ["impersonate", "settings"]
}
```
سيتم ربط الدور مستقبلاً بقائمة أذونات (role_permissions). مؤقتاً: خريطة ثابتة داخل service مع إمكانية التبديل لاحقاً لجدول DB.
 

---

## 📉 Risks & Mitigations

| خطر | وصف | تأثير | احتمال | تخفيف |
|------|-----|-------|--------|--------|
| تعقيد تنفيذ RLS مبكر | تداخل مع ORM أو كسر استعلامات خام | عالي | متوسط | تطبيق تدريجي + Feature Flag |
| فشل Redis أو تأخير | توقف بث إشعارات مستقبلية | متوسط | منخفض | fallback EventEmitter محلي |
| تسريب أذونات خاطئة | أدوار تمنح صلاحيات زائدة | عالي | منخفض | اختبارات Negative + مراجعة يدوية |
| حمل زائد على /metrics | استهلاك CPU | متوسط | منخفض | معدل جلب 15s + تجميع داخلي |
| تعارض throttler مع اختبارات | 429 غير متوقع يعرقل CI | منخفض | متوسط | bypass header X-Test-Bypass في بيئة test |

---

## 🧪 Definition of Done (سبرنت)

1. جميع البنود عالية الأولوية (High) منجزة أو مبررة رسمياً للترحيل.
2. لا أخطاء lint (TS + Markdown) في الفرع الرئيسي.
3. تغطية الاختبارات تزيد أو تبقى ≥ baseline الحالي.
4. وثائق README + roadmap محدثة بملخص الإنجازات.
5. تشغيل اختبار SSE متكرر يمر مرتين متتاليتين.
6. تنفيذ مراجعة أمنية خفيفة للتغييرات (Self-review checklist).

---

## 📜 Change Log (Sprint Scope Adjustments)

| التاريخ | التغيير | السبب |
|---------|---------|-------|
| 2025-09-28 | إنشاء Sprint 2 Backlog | بداية المرحلة 2 |

---

## 🔄 Potential Stretch (إن توفر وقت)

- تفعيل Redis Pub/Sub للبث بدلاً من EventEmitter المحلي.
- إعداد WebSocket Gateway تجريبي.
- إضافة Dashboard Request Tracing عبر OpenTelemetry.

---

## ✅ Next Step

عند تأكيدك، سيتم:

1. إنشاء فرع: `feature/sprint-2`.
2. تنفيذ البنود حسب ترتيب الأولوية.
3. فتح PR تجميعي يومي للتقدم.

أرسل: (ابدأ Sprint 2) لبدء التنفيذ.
