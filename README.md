<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# VERTEX ERP Ultimate – التشغيل المحلي خارج المنصة

يحتوي هذا المجلد على كامل ملفات المشروع، وهو مهيأ ومُجهز للتشغيل الفوري على جهازك المحلي سواء كبرنامج سطح مكتب مستقل (**Desktop Electron**) أو عبر المتصفح (**Web Browser**).

---

## متطلبات التشغيل (Prerequisites)
* تثبيت بيئة **[Node.js](https://nodejs.org)** (الإصدار 18 أو 20 أو 22 LTS).

---

## 1. التشغيل بنقرة واحدة على Windows (الأسهل)
إذا كنت تستخدم نظام ويندوز:
* اضغط نقراً مزدوجاً على ملف:
  **`START_VERTEX.bat`**
  سيقوم الملف تلقائياً بالتحقق من الحزم وتشغيل التطبيق وفتح نافذة **VERTEX Desktop** مباشرة.

أو عبر PowerShell:
* تشغيل **`START_VERTEX.ps1`**.

---

## 2. التشغيل عبر سطر الأوامر (Terminal / Command Line)

### الخطوة 1: تثبيت الحزم (تُجرى أول مرة فقط)
```bash
npm install
```

### الخطوة 2: خيارات التشغيل
* **تشغيل نسخة سطح المكتب (Desktop App):**
  ```bash
  npm run desktop
  ```
  *(يقوم تلقائياً بتشغيل خادم Vite والانتظار حتى جاهزية المنفذ 3000 ثم فتح نافذة Electron مباشرة)*

* **تشغيل عبر المتصفح (Web Browser):**
  ```bash
  npm run dev
  ```
  ثم افتح الرابط: `http://localhost:3000`

* **بناء نسخة الإنتاج (Production Build):**
  ```bash
  npm run build
  ```

