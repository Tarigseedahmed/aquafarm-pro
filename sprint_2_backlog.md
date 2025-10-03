# Sprint 2 Backlog (Phase 2 Kickoff: Infra & Quality Enablement)

**Sprint Code:** S2
**Target Dates:** 28 سبتمبر 2025 → 7 أكتوبر 2025 (10 أيام تقويمية / 7 أيام عمل)
**Sprint Goal (هدف السبرنت):** تأسيس طبقة البنية التحتية والتشغيل (Infra & Observability & Security Baselines) مع تمهيد توسيع الصلاحيات (RBAC) وتفعيل إمكانات التوسع الأفقي (Redis) وتحسين الاختبارات والجودة.

> حالة التنفيذ (محدثة 30 سبتمبر 2025 – بدء فعلي للسبرنت): تم إنجاز بعض العناصر مسبقاً قبل فتح السبرنت رسمياً، لذا تم تصنيف الإنجاز أدناه لتعديل النطاق ومنع تكرار الجهد.

## 📌 Sprint Status Snapshot

| البند | الحالة | ملاحظات مختصرة |
|-------|--------|----------------|
| D1 Redis Module | ✅ منجز | Redis و HealthIndicator مدمجين (ملفات redis module) |
| D2 Metrics Endpoint | ✅ منجز | `/metrics` + عدادات مخصصة (requests, rate_limit, sse, notifications) |
| D3 Grafana Dashboard | ✅ منجز | موجود في `infra/grafana/dashboards/aquafarm-observability.json` |
| D4 CI Pipeline موسّع | ⏳ جزئي | أساس CI موجود، يلزم إضافة markdown lint + تحسين caching + فصل security job (قائم) |
| D5 Throttler Guard محسن | ✅ منجز | Retry-After + حارس مخصص + عداد rate_limit_exceeded_total |
| D6 PaginatedResponse Decorator | ✅ منجز | PaginationInterceptor + توحيد حقل meta، consolidation لاحقة بسيطة مطلوبة للـ schema الموحد |
| D7 RBAC Matrix | ✅ منجز | permissions enum/guard + تصميم مفصل في `docs/rbac-design.md` |
| D8 RLS Policies Migration | ✅ منجز | ترحيلات RLS موجودة (`1758880...`, `1758881...`) + اختبارات E2E |
| D9 Postgres GUC Tenant Setter | ✅ منجز جزئياً | إعداد مبدئي داخل interceptor؛ تحسين set_config مع اتصال Postgres فعلي مطلوب لاحقاً |
| D10 SSE Integration Test | ✅ منجز | ملف `notifications-sse.e2e-spec.ts` + pub/sub Redis لاحقاً مدعوم |
| D11 RBAC Negative Tests | ✅ منجز | موجودة اختبارات رفض صلاحيات (403) |
| D12 RLS Enforcement Tests | ✅ منجز | اختبارات عزل موارد + سياسة RLS |
| D13 Tenant Code Cache | ⏳ مخطط | لم يُنفذ بعد (in-memory map + TTL) |

إجمالي المتبقي الفعلي الآن: تنفيذ D13 + تحسينات تكميلية (CI lint markdown + توحيد schema OpenAPI النهائي).

---

## 🎯 Objectives (الأهداف)

1. تمكين Redis واستخدامه كبنية مستقبلية للبث (SSE/WebSocket) وعمليات caching الخفيفة.
1. رفع أساس المراقبة (Prometheus metrics + Health + Basic Dashboard JSON).
1. تحسين خط CI/CD لإدخال جودة الكود والفحص الأمني وتشغيل الاختبارات تلقائياً.
1. إضافة Retry-After وNamed Throttler لتجربة مستخدم أفضل وحماية محسّنة.
1. توحيد التوثيق للصفحات عبر مخطط OpenAPI عام (Paginated<T>) لإزالة التكرار.
1. إنشاء مصفوفة صلاحيات (RBAC Matrix) كبداية للحد من الاعتماد على الأدوار النصية.
1. تنفيذ سياسات RLS أولية (Farms/Ponds) + إعداد قناة تمرير tenant_id إلى Postgres (GUC) تمهيداً لتوسيع الحماية لاحقاً.
1. تحسين تغطية الاختبارات بتمديد (SSE integration + RBAC negative + RLS enforcement tests).
1. إدخال وسيط caching مبسط لترجمة tenant code → UUID.

---

## 📦 Deliverables (المخرجات)

| رقم | المخرج | الوصف المختصر | يعتمد على | الحالة |
|-----|--------|---------------|-----------|---------|
| D1 | Redis Module مدمج | تثبيت redis client + Config + HealthIndicator | لا شيء | ✅ |
| D2 | Metrics Endpoint | مسار /metrics + عدادات مخصصة | D1 (اختياري) | ✅ |
| D3 | Grafana Dashboard JSON | لوحة رصد أساسية | D2 | ✅ |
| D4 | CI Pipeline موسّع | lint + test + build + audit + md-lint | لا شيء | ⏳ جزئي |
| D5 | Throttler Guard محسن | Named profile + Retry-After header | D4 (اختبار) | ✅ |
| D6 | PaginatedResponse Decorator | إعادة استخدام موحّد | لا شيء | ✅ |
| D7 | RBAC Matrix | granular permissions | لا شيء | ✅ |
| D8 | RLS Policies Migration | تمكين RLS + سياسات | D9 (منطقي) | ✅ |
| D9 | Postgres GUC Tenant Setter | set_config GUC | لا شيء | ♻️ تحسين |
| D10 | SSE Integration Test | بث وإلتقاط حدث | D1 (اختياري) | ✅ |
| D11 | RBAC Negative Tests | رفض وصول | D7 | ✅ |
| D12 | RLS Enforcement Tests | عزل موارد | D8 | ✅ |
| D13 | Tenant Code Cache | Map + TTL 5m | D1 | 🔜 |

---

## 🗂️ Work Items (User Stories / Tasks)

| ID | النوع | العنوان | الوصف | التقدير (نقاط) | أولوية | قبول | ملاحظات |
|----|-------|---------|-------|----------------|---------|------|----------|
| S2-1 | Infra | إضافة حزمة redis وتهيئة RedisModule | (منجز) | 0 | - | مثبت | اكتمل مسبقاً |
| S2-2 | Observability | إضافة Prometheus metrics | (منجز) | 0 | - | مثبت | عدادات موجودة |
| S2-3 | Observability | لوحة Grafana JSON | (منجز) | 0 | - | مثبت | موجودة |
| S2-4 | CI/CD | تحسين workflow (markdownlint + cache) | استكمال المرحلة المتبقية | 3 | عالية | Pipeline أخضر | مطلوب تنفيذ الآن |
| S2-5 | Security/Perf | Throttler Guard + Retry-After | (منجز) | 0 | - | 429 يحوي header | تم دمجه |
| S2-6 | DX / Docs | Decorator عام PaginatedResponse | (منجز) | 0 | - | توحيد schema | يحتاج توثيق إضافي بسيط |
| S2-7 | Security | RBAC permissions.json + Service | (منجز) | 0 | - | منع غير المخولين | جاهز |
| S2-8 | Data Security | RLS Migration | (منجز) | 0 | - | سياسات فعالة | اختبارات نجحت |
| S2-9 | Data Security | Postgres Tenant GUC Setter | تحسين الاتصال الفعلي | 2 | متوسطة | يعمل جزئياً | يتطلب بيئة Postgres حقيقية |
| S2-10 | Testing | SSE Integration Test | (منجز) | 0 | - | حدث مستلم <2s | جاهز |
| S2-11 | Testing | RBAC Negative Tests | (منجز) | 0 | - | 403 | موجود |
| S2-12 | Testing | RLS Enforcement Tests | (منجز) | 0 | - | عزل صحيح | موجود |
| S2-13 | Performance | Tenant Code Cache | Map + TTL 5m | 2 | متوسطة | hits تتحسن | لم يبدأ |
| S2-14 | Housekeeping | Markdown Lint خطوة pipeline | إضافة action md-lint | 1 | متوسطة | فشل عند المخالفة | لم يبدأ |
| S2-15 | Docs | تحديث README / roadmap | توثيق منجزات | 1 | متوسطة | دمج PR | لم يبدأ |
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
1. S2-8 و S2-12 متلازمان (اختبار يعتمد على تفعيل RLS).
1. S2-7 يجب أن يسبق S2-11.
1. S2-2 قبل S2-3 (جمع المقاييس قبل بناء لوحة).
1. S2-4 مبكر لتأمين جودة بقية البنود.

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
1. لا أخطاء lint (TS + Markdown) في الفرع الرئيسي.
1. تغطية الاختبارات تزيد أو تبقى ≥ baseline الحالي.
1. وثائق README + roadmap محدثة بملخص الإنجازات.
1. تشغيل اختبار SSE متكرر يمر مرتين متتاليتين.
1. تنفيذ مراجعة أمنية خفيفة للتغييرات (Self-review checklist).

---

## 📜 Change Log (Sprint Scope Adjustments)

| التاريخ | التغيير | السبب |
|---------|---------|-------|
| 2025-09-28 | إنشاء Sprint 2 Backlog | بداية المرحلة 2 |
| 2025-09-30 | تحديث حالة مبكر قبل البدء الرسمي | تصنيف البنود المنجزة وتقليص النطاق |

---

## 🔄 Potential Stretch (إن توفر وقت)

- تفعيل Redis Pub/Sub للبث بدلاً من EventEmitter المحلي.
- إعداد WebSocket Gateway تجريبي.
- إضافة Dashboard Request Tracing عبر OpenTelemetry.

---

## ✅ Next Step

عند تأكيدك، سيتم:

1. إنشاء فرع: `feature/sprint-2`.
1. تنفيذ البنود حسب ترتيب الأولوية.
1. فتح PR تجميعي يومي للتقدم.

أرسل: (ابدأ Sprint 2) لبدء التنفيذ.
