# تشغيل صاينترا على Windows وVS Code

**هذه نسخة تطوير، وليست تنفيذًا مكتملًا لكل مراحل المشروع.** تعمل الحسابات والعملاء والأجهزة واستلام طلب الصيانة وإسناده وفحصه. المخزون والفواتير والمدفوعات والتتبع والضمان غير مكتملة في هذه النسخة.

## البرامج المطلوبة

- PHP 8.3 أو أحدث وComposer. يمكنك استخدام Laravel Herd لتوفير PHP.
- Node.js 22 أو 24 LTS.
- MySQL 8 يعمل على جهازك. تثبيت Herd وحده لا يعني أن MySQL موجود.
- VS Code.

فك الضغط وافتح مجلد `sayntra` في VS Code. المشروع يحتوي مجلدين منفصلين:

- `backend`: Laravel، وفيه ملف `artisan`.
- `frontend`: Next.js.

## 1. قاعدة البيانات

أنشئ قاعدة `sayntra` بحروف `utf8mb4` عبر MySQL Workbench أو أداة MySQL. ستحتاج اسم المستخدم وكلمة مروره. أمثلة SQL كاملة في `docs/LOCAL_SETUP_WINDOWS.md`.

## 2. تشغيل Laravel

افتح Terminal في VS Code من نوع PowerShell:

```powershell
cd backend
composer install
Copy-Item .env.example .env
```

افتح `backend/.env` واضبط `DB_HOST` و`DB_PORT` و`DB_DATABASE` و`DB_USERNAME` و`DB_PASSWORD` لتطابق MySQL عندك. ثم:

```powershell
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

اترك هذه النافذة تعمل.

## 3. تشغيل Next.js

افتح Terminal ثانيًا من مجلد المشروع الرئيسي:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

افتح **http://localhost:3000**. لا تنتقل بين `localhost` و`127.0.0.1` في المتصفح. خادم Laravel يستقبل طلبات Next.js داخليًا على المنفذ 8000.

**لا تحتاج Python.** أمر `npm run dev` يشغّل Next.js فعلًا، لكنه لا يشغّل MySQL أو Laravel تلقائيًا.

## 4. حساب تجريبي اختياري

افتح Terminal ثالثًا داخل `backend` واكتب كلمة مرور تختارها أنت:

```powershell
$env:DEMO_SEED_PASSWORD = 'ChooseYourOwnStrongPassword123!'
php artisan db:seed
Remove-Item Env:DEMO_SEED_PASSWORD
```

سجّل الدخول بالبريد `owner@sayntra.test` وكلمة المرور التي كتبتها. يوجد أيضًا الفني `technician@sayntra.test` بنفس كلمة مرور التهيئة الأولى. البذر لا يغيّر كلمات مرور حسابات سبق إنشاؤها.

أو سجّل مؤسسة جديدة من صفحة التسجيل. في الإعداد المحلي، رابط تأكيد البريد يظهر داخل `backend/storage/logs/laravel.log` لأن البريد مضبوط على `log`. افتحه في نفس جلسة المتصفح. هذا لا يعني أن رسالة بريد حقيقية أُرسلت.

## 5. جرّب المسار المتاح

1. أضف عميلًا من «العملاء».
2. سجّل جهازًا واربطه بالعميل.
3. أنشئ طلب صيانة من «طلبات الصيانة».
4. افتح الطلب وأسنده إلى الفني التجريبي.
5. سجّل نتائج الفحص والعمل الموصى به.
6. أعد تحميل الصفحة: البيانات محفوظة في MySQL.

توقّف عند المراحل المتاحة؛ لا توجد دورة مالية وتسليم مكتملة في هذا الإصدار. راجع `STATUS.md` للنواقص.
