# NEO NOVA — Field Ops Console
## دليل الإعداد السريع

---

### هيكل المشروع

```
neo-nova/
├── index.html
├── supabase_schema.sql       ← تشغّله في Supabase مرة واحدة
└── assets/
    ├── css/
    │   └── style.css
    └── js/
        ├── config.js         ← ضع هنا بيانات Supabase
        ├── status.js         ← ثوابت وـ helpers
        ├── pdf.js            ← تصدير PDF
        └── app.js            ← منطق التطبيق الرئيسي
```

---

### خطوات الإعداد

#### 1. إنشاء مشروع Supabase
1. اذهب إلى [supabase.com](https://supabase.com) وسجّل دخول
2. اضغط **New Project** واختر اسماً ومنطقة
3. انتظر حتى يتم إنشاء المشروع (دقيقة أو دقيقتين)

#### 2. تهيئة قاعدة البيانات
1. افتح **SQL Editor** من القائمة الجانبية
2. انسخ محتوى ملف `supabase_schema.sql` بالكامل والصقه
3. اضغط **Run** — سيتم إنشاء كل الجداول والسياسات تلقائياً

#### 3. إضافة بيانات الاتصال
1. افتح **Project Settings → API** في Supabase
2. انسخ **Project URL** و **anon public key**
3. افتح `assets/js/config.js` وضعهم:

```js
export const SUPABASE_URL    = "https://xxxx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGci...";
```

#### 4. إنشاء مستخدمين
1. افتح **Authentication → Users** في Supabase
2. اضغط **Invite user** وأضف إيميل وكلمة مرور لكل مهندس
3. المستخدم يدخل بإيميله وكلمة مروره مباشرة من شاشة Login

#### 5. تشغيل التطبيق
- **تطوير محلي:** استخدم أي static server مثل:
  ```bash
  npx serve .
  # أو
  python -m http.server 8080
  ```
- **نشر:** ارفع المجلد كاملاً على Netlify / Vercel / أي hosting ثابت

---

### ملاحظات مهمة

- **Storage bucket** اسمه `unit-photos` يُنشأ تلقائياً عند تشغيل الـ SQL
- الملف `index.html` يستدعي `assets/js/app.js` كـ ES module — لا يعمل عبر `file://` مباشرة، لازم web server
- جميع الحالات المتاحة: `pending` · `in_progress` · `done` · `issue` · `blocked`
