# دليل إعداد DNS لـ AquaFarm Pro

**التاريخ:** 1 أكتوبر 2025  
**الحالة:** جاهز للتنفيذ  
**الأولوية:** حرجة جداً ⚠️

---

## 📋 معلومات النطاق والخادم

### النطاق

- **Domain:** aquafarm.cloud
- **Registrar:** Hostinger
- **Current Status:** Parking (غير نشط)

### VPS Server

- **Hostname:** srv1029413.hstgr.cloud
- **IP Address:** 72.60.187.58
- **Provider:** Hostinger KVM 4 VPS
- **Location:** [تحديد الموقع]

---

## 🚨 المشكلة الحالية

النطاق aquafarm.cloud يشير حالياً إلى nameservers خاصة بـ parking:

```text
ns1.dns-parking.com
ns2.dns-parking.com
```

هذا يمنع النشر الفعلي للإنتاج ويجعل النطاق غير قابل للوصول.

---

## ✅ الحل: خطوات التنفيذ

### المرحلة 1: تحديث Nameservers (أولوية قصوى)

#### الخطوة 1: تسجيل الدخول إلى Hostinger

1.اذهب إلى: https://hpanel.hostinger.com/
2. سجل الدخول بحسابك
3. اذهب إلى **Domains** من القائمة الجانبية

#### الخطوة 2: اختيار النطاق

1.ابحث عن **aquafarm.cloud**
2. انقر على **Manage**

#### الخطوة 3: تغيير Nameservers

1.اذهب إلى تبويب **DNS / Nameservers**
2. انقر على **Change nameservers**
3. اختر **Use Hostinger nameservers**
4. الـ nameservers الصحيحة يجب أن تكون:

   ```text
   ns1.dns.hostinger.com
   ns2.dns.hostinger.com
   ns3.dns.hostinger.com
   ns4.dns.hostinger.com
   ```

5.احفظ التغييرات

**⏱️ الوقت المتوقع للانتشار:** 24-48 ساعة

---

### المرحلة 2: إضافة DNS Records

#### الخطوة 1: الوصول إلى DNS Zone

1.من صفحة إدارة النطاق، اذهب إلى **DNS / Name servers**
2. انقر على **Manage DNS records** أو **DNS Zone Editor**

#### الخطوة 2: إضافة A Records

أضف السجلات التالية:

##### 1. النطاق الرئيسي

```text
Type: A
Name: @ (أو aquafarm.cloud)
Points to: 72.60.187.58
TTL: 14400 (4 hours)
```

##### 2. API Subdomain

```text
Type: A
Name: api
Points to: 72.60.187.58
TTL: 14400
```

##### 3. Admin Subdomain

```text
Type: A
Name: admin
Points to: 72.60.187.58
TTL: 14400
```

##### 4. WWW Subdomain

```text
Type: A
Name: www
Points to: 72.60.187.58
TTL: 14400
```

##### 5. Wildcard (اختياري للمستقبل)

```text
Type: A
Name: *
Points to: 72.60.187.58
TTL: 14400
```

#### الخطوة 3: حفظ التغييرات

1.احفظ كل سجل بعد إضافته
2. تحقق من ظهور جميع السجلات في القائمة

---

### المرحلة 3: التحقق من الإعدادات

#### 1. التحقق الفوري (في لوحة Hostinger)

- تأكد من ظهور جميع السجلات في DNS Zone
- تحقق من عدم وجود أخطاء

#### 2. التحقق الخارجي (بعد 1-2 ساعة)

استخدم الأوامر التالية:

```bash
# التحقق من النطاق الرئيسي
nslookup aquafarm.cloud

# التحقق من API subdomain
nslookup api.aquafarm.cloud

# التحقق من Admin subdomain
nslookup admin.aquafarm.cloud

# التحقق من Nameservers
nslookup -type=NS aquafarm.cloud
```

**النتيجة المتوقعة:**

```text
Server:  [DNS Server]
Address: [DNS IP]

Name:    aquafarm.cloud
Address: 72.60.187.58
```

#### 3. التحقق عبر أدوات الإنترنت

استخدم هذه المواقع للتحقق:

- https://dnschecker.org/
- https://www.whatsmydns.net/
- https://mxtoolbox.com/SuperTool.aspx

أدخل النطاق وتحقق من انتشار DNS عالمياً.

---

### المرحلة 4: إعداد SSL Certificates

بعد انتشار DNS، سيتم إصدار SSL certificates تلقائياً عبر Let's Encrypt.

#### Nginx Configuration (جاهز مسبقاً)

الملف: `infra/nginx/aquafarm.conf`

```nginx
server {
    listen 80;
    server_name aquafarm.cloud www.aquafarm.cloud;
    
    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name aquafarm.cloud www.aquafarm.cloud;
    
    # SSL certificates (auto-renewed)
    ssl_certificate /etc/letsencrypt/live/aquafarm.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aquafarm.cloud/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### إصدار SSL Certificates (بعد انتشار DNS)

```bash
# على الخادم
ssh root@72.60.187.58

# إصدار certificates
certbot certonly --webroot \
  -w /var/www/certbot \
  -d aquafarm.cloud \
  -d www.aquafarm.cloud \
  -d api.aquafarm.cloud \
  -d admin.aquafarm.cloud \
  --email support@aquafarm.cloud \
  --agree-tos \
  --non-interactive

# إعادة تشغيل Nginx
docker-compose restart nginx
```

---

## 📝 Checklist التنفيذ

### قبل البدء

- [ ] الوصول إلى حساب Hostinger
- [ ] تأكيد VPS IP: 72.60.187.58
- [ ] نسخة احتياطية من إعدادات DNS الحالية

### أثناء التنفيذ

- [ ] تغيير Nameservers من parking إلى Hostinger
- [ ] إضافة A record للنطاق الرئيسي (@)
- [ ] إضافة A record لـ api
- [ ] إضافة A record لـ admin
- [ ] إضافة A record لـ www
- [ ] (اختياري) إضافة wildcard record (*)

### بعد التنفيذ

- [ ] التحقق من DNS باستخدام nslookup
- [ ] التحقق من انتشار DNS عالمياً
- [ ] الانتظار 24-48 ساعة للانتشار الكامل
- [ ] إصدار SSL certificates
- [ ] اختبار الوصول عبر HTTPS

---

## 🚨 استكشاف الأخطاء

### المشكلة: DNS لم ينتشر بعد 48 ساعة

**الحل:**

1.تحقق من Nameservers في Hostinger
2. امسح DNS cache المحلي:

   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac/Linux
   sudo dscacheutil -flushcache

   ```text
3. تحقق من TTL settings

### المشكلة: SSL Certificate فشل في الإصدار
**الحل:**
1. تأكد من انتشار DNS بالكامل
2. تحقق من فتح port 80 و 443
3. تحقق من إعدادات Nginx
4. راجع logs:
   ```bash
   docker logs nginx
   ```

### المشكلة: النطاق لا يزال يعرض parking page

**الحل:**
1.تأكد من تغيير Nameservers
2. امسح browser cache
3. استخدم Incognito/Private mode
4. انتظر وقت إضافي للانتشار

---

## 📊 Timeline المتوقع

| الوقت | المرحلة | الحالة |
|-------|---------|--------|
| **الآن** | تغيير Nameservers | يدوي |
| **فوراً** | إضافة DNS Records | يدوي |
| **1-2 ساعة** | بداية انتشار DNS | تلقائي |
| **6-12 ساعة** | انتشار DNS في معظم المواقع | تلقائي |
| **24-48 ساعة** | انتشار DNS الكامل عالمياً | تلقائي |
| **بعد DNS** | إصدار SSL Certificates | يدوي |
| **جاهز!** | نشر Production | يدوي |

---

## ✅ التحقق النهائي

بعد إكمال جميع الخطوات، يجب أن تعمل جميع هذه الروابط:

- ✅ https://aquafarm.cloud (Frontend)
- ✅ https://www.aquafarm.cloud (Frontend)
- ✅ https://api.aquafarm.cloud (Backend API)
- ✅ https://api.aquafarm.cloud/health (Health Check)
- ✅ https://api.aquafarm.cloud/api (API Documentation)
- ✅ https://admin.aquafarm.cloud (Admin Panel)

---

## 📞 جهات الاتصال

### Hostinger Support

- **Website:** https://www.hostinger.com/contact
- **Live Chat:** متوفر 24/7
- **Email:** support@hostinger.com
- **Phone:** [حسب المنطقة]

### DevOps Team

- **Primary Contact:** [Tarig H. S. Seedahmed]
- **Backup Contact:** [Tarig H. S. Seedahmed]
- **Emergency:** [+966575494973]

---

## 📚 موارد إضافية

### Documentation

- [Hostinger DNS Management Guide](https://www.hostinger.com/tutorials/dns)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)

### Tools

- [DNS Checker](https://dnschecker.org/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [What's My DNS](https://www.whatsmydns.net/)

---

**آخر تحديث:** 1 أكتوبر 2025  
**الحالة:** جاهز للتنفيذ ⚠️  
**الأولوية:** حرجة - يجب التنفيذ فوراً

---

> **ملاحظة مهمة:** هذه الخطوة ضرورية وحرجة لإكمال النشر. يجب تنفيذها فوراً قبل أي مهام أخرى.

**Next Steps:** بعد إكمال DNS setup، انتقل إلى [خطة النشر](../DEPLOYMENT_GUIDE.md)
