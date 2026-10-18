# المواصفات القياسية للتصميم البصري لواجهات VERTEX ERP
## VERTEX Settings & Master Views UI Design Standard

> **الحالة الحالية للمعيار:** مسودة تشغيلية مرجعية مبنية على فحص وتدقيق النوافذ الفعلية — **قيد الاعتماد النهائي**.
> **تاريخ التحديث:** أكتوبر 2026

---

## 1. الغرض والهدف
يوثّق هذا الملف المعايير البصرية المستخرجة من شاشات نظام **VERTEX ERP** (مع التركيز على شاشات الإعدادات والبطاقات التعريفية Master Views ونوافذ استعراض السجلات Records Modals).
الهدف هو توفير مرجع موحد لأي مراجعة أو تطوير بصري للشاشات القادمة دون الإخلال بالوظائف البرمجية أو كسر اتساق واجهة المستخدم.

> **تنبيه منهجي:** لا تعتبر جميع قيم وأصناف Tailwind الواردة هنا قواعد إلزامية مطلقة تطبق حرفياً على كافة الشاشات؛ فلكل شاشة طبيعة بيانات وتفاعلات قد تتطلب مرونة هندسية. الغرض هو الحفاظ على الروح البصرية الموحدة (Visual Harmony).

---

## 2. الشاشة المرجعية الأساسية: «سجلات المخازن ودليل المخازن»
* **المكوّن المسؤول:** `src/components/warehouses/WarehouseRecordsModal.tsx`
* **الحالة:** مرجع بصري قيد الاعتماد النهائي (Benchmark Reference).

### المواصفات المتحقق منها فعليًا (Verified in Code):

#### أ. الألوان وخلفيات الإطار (Backgrounds & Surfaces)
- **خلفية التعتيم الشاملة للنافذة (Backdrop):**
  - كود Tailwind: `fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md`
  - اللون: كحلي داكن شفاف جداً مع ضبابية خلفية لعزل الشاشة الأم.
- **جسم النافذة المنبثقة (Modal Container):**
  - كود Tailwind: `bg-[#090d16] border border-slate-800`
  - اللون: لون داكن فاخر كحلي مسود (`#090d16`) مع إطار رمادي فحمي رقيق (`border-slate-800`).
- **شريط عنوان النافذة (Header):**
  - كود Tailwind: `bg-slate-900/90 border-b border-slate-800/80 px-6 py-4`
  - اللون: شريط مائل للسواد بدرجة أفتح قليلاً لإبراز الترويسة مع حد سفلي فاصل.
- **حاوية الفلاتر والبحث (Filter Bar):**
  - كود Tailwind: `bg-slate-900/60 border-b border-slate-800/60 p-4`
- **شريط المعلومات والإحصائيات السفلي (Footer Bar):**
  - كود Tailwind: `bg-slate-900/90 border-t border-slate-800/80 px-6 py-3.5`

#### ب. حقول الإدخال، شريط البحث، والفلاتر (Inputs & Filters)
*ملاحظة: تم اعتماد الخلفية البيضاء الصريحة داخل هذه الحقول لتحقيق أعلى درجات المقروءة للبيانات والكلمات المكتوبة.*
- **حقل البحث (Search Input):**
  - كود Tailwind: `bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm`
  - الخلفية: أبيض صريح (`#ffffff`).
  - لون النص: أسود/كحلي داكن (`#0f172a`).
  - لون نص التلميح: رمادي متوسط (`#94a3b8`).
- **القوائم المنسدلة للفلاتر (Selects):**
  - كود Tailwind: `bg-white text-slate-900 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold shadow-sm`
  - خيارات المنسدلة: عناصر `<option>` نصوصها داكنة واضحة على خلفية بيضاء.

#### ج. الطباعة والخطوط (Typography & Text Hierarchy)
- **عائلة الخط المعتمدة:** خط **Cairo** مع خطوط احتياطية قياسية:
  - `font-['Cairo',sans-serif]`
  - الاتجاه: من اليمين لليسار إلزاميًا (`dir="rtl"`).
- **العناوين الرئيسية (Modal Title):**
  - حجم الخط: `text-lg font-black text-white` (18px وزن 900 أو 800) مصحوب بأيقونة في كبسولة عنبرية متوهجة (`bg-amber-500/10 text-amber-400 border border-amber-500/30 p-2 rounded-xl`).
- **العناوين الفرعية ونصوص الشرح (Subtitles):**
  - حجم الخط: `text-xs text-slate-400 font-medium`.
- **ترويسة أعمدة الجدول (Table Header Cells):**
  - كود Tailwind: `text-[11px] font-black uppercase text-slate-400 tracking-wider py-3 px-3.5 text-right`
- **بيانات الخلايا (Table Body Data):**
  - نصوص الأسماء والعناوين: `text-xs font-bold text-slate-200`
  - الأكواد والأرقام المالية: `font-mono text-xs font-extrabold text-amber-400`
  - النصوص التوضيحية: `text-[11px] font-semibold text-slate-400`

#### د. الأبعاد، الاستدارة، والمسافات (Dimensions, Radius & Spacing)
- **استدارة زوايا النافذة الكبرى:** `rounded-3xl` (24px) مع `overflow-hidden`.
- **استدارة زوايا الحقول والأزرار والكبسولات:** `rounded-xl` (12px).
- **ارتفاع حقول الإدخال والبحث:** يتراوح فعليًا بين 36px إلى 40px (`py-2` مع حجم نص `text-xs` أو `text-sm`).
- **هيكل الجدول ومسافات الخلايا:**
  - ترويسة الجدول: ارتفاع يناهز 44px مع حشو داخلي `px-3.5 py-3`.
  - صفوف الجدول: حشو داخلي `px-3.5 py-2.5` مع حدود فاصلة `border-b border-slate-800/40`.
  - تأثير التمرير على الصفوف (Hover): `hover:bg-slate-800/30 transition-colors`.

#### هـ. كبسولات الحالات وأزرار الإجراءات (Badges & Buttons)
- **كبسولة الحالة (Status Pill):**
  - نشط: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black rounded-lg px-2.5 py-1`
  - معطل/غير نشط: `bg-slate-800/60 text-slate-400 border border-slate-700 text-[10px] font-black rounded-lg px-2.5 py-1`
- **أزرار الإجراءات في صف الجدول (Action Buttons):**
  - زر التعديل/التحميل: كبسولة مدمجة زرقاء/سماوية (`bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg p-1.5`).
  - زر العرض/التفاصيل: كبسولة مدمجة عنبرية (`bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg p-1.5`).

---

## 3. التجربة التطبيقية: «شاشة الخزن»
* **المكوّنات المسؤولة:**
  - شاشة البطاقة الرئيسية: `src/components/treasuries/TreasuryMasterView.tsx`
  - نافذة استعراض السجلات: `src/components/treasuries/TreasuryRecordsModal.tsx`
  - نافذة كشف الحركة: `src/components/treasuries/TreasuryStatementModal.tsx`
* **الحالة:** **تجربة ناجحة بحسب المراجعة الحالية** (Successful Trial).
* **الملاحظة التقييمية:** تم تطبيق الخط والسمة الداكنة، وحقول الإدخال البيضاء بنصوص داكنة، والجدول المتناسق، وضبط موضع ظهور نافذة التقويم (Date Picker) بأمان أعلى الحقل لمنع القص. **تحتاج إلى مقارنة بصرية نهائية ميدانية قبل اعتمادها معياراً عاماً نهائياً**.

---

## 4. مقترحات وقيم تحت الدراسة ولم تُعتمد بعد (Proposed & Pending Approval)
1. **توحيد صريح لـ Design Tokens عبر متغيرات CSS:**
   - مقترح: تعريف متغيرات مثل `--erp-bg-surface: #090d16;` و `--erp-input-bg: #ffffff;` داخل `index.css`.
   - الوضع: قيد الدراسة — يتم الاعتماد حاليًا على أصناف Tailwind المباشرة لتجنب أي تعارض في البناء.
2. **شريط الإجراءات السفلي (StandardActionBar):**
   - هل يُعتمد ارتفاع ثابت (مثلاً 56px أو 64px) في كافة الشاشات؟
   - الوضع: قيد الدراسة ومتروك لمتطلبات كل بطاقة وشاشة.
3. **موضع الـ Date Picker القياسي:**
   - الاتجاه المعتمد تجريبياً: الفتح للأعلى عندما يكون الحقل قريباً من أسفل الشاشة أو داخل بطاقة منخفضة الارتفاع، والفتح لأسفل في الحقول العلوية.

---

## 5. ميثاق التعديل المستقبلي
عند الرغبة في توحيد شاشة جديدة:
1. الرجوع لمواصفات `WarehouseRecordsModal.tsx` كنواة بصرية.
2. مراجعة نتائج تجربة شاشة الخزن في `TreasuryRecordsModal.tsx` و `TreasuryMasterView.tsx`.
3. التأكد التام من الحفاظ على كافة الوظائف البرمجية ومفاتيح الربط والبيانات.
4. تسجيل الشاشة وحالتها فوراً في ملف `docs/design/SCREEN_AUDIT_LOG.md`.
