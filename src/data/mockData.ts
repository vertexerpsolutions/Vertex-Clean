import {
  GoldFeatureMeta,
  ERPModuleMeta,
  SystemEngineMeta,
  SetupWizardData,
  AuditLog,
  NotificationItem
} from '../types';

export const INITIAL_GOLD_FEATURES: GoldFeatureMeta[] = [
  {
    id: 'VGF-01',
    code: 'VGF-01',
    name: 'معالج الإعداد للتشغيل الأول',
    description: 'تسلسل التشغيل المؤسسي الموجه، تهيئة المخطط، إعداد شجرة الحسابات، وتهيئة سياسات المحركات.',
    status: 'completed',
    category: 'الإعداد والنشر',
    version: 'v1.0.0'
  },
  {
    id: 'VGF-02',
    code: 'VGF-02',
    name: 'مركز الترحيل',
    description: 'مستورد بيانات ERP القديمة، خط أنابيب التحقق، تعيين الكيانات، والمزامنة الفروقية الآلية.',
    status: 'completed',
    category: 'إدارة البيانات',
    version: 'v1.1.0'
  },
  {
    id: 'VGF-03',
    code: 'VGF-03',
    name: 'محرك الدمج',
    description: 'كشف الكيانات المكررة، دمج السجلات، وإعادة ربط السجل السجلي للمعاملات.',
    status: 'completed',
    category: 'نزاهة البيانات',
    version: 'v1.1.0'
  },
  {
    id: 'VGF-04',
    code: 'VGF-04',
    name: 'تمديد اليوم التجاري',
    description: 'ضوابط الفترات المالية، أقفال الترحيل متعددة المناطق الزمنية، وقواعد وقت القطع الممتدة.',
    status: 'completed',
    category: 'الحوكمة المالية',
    version: 'v1.2.0'
  },
  {
    id: 'VGF-05',
    code: 'VGF-05',
    name: 'النسخ الاحتياطي الذكي',
    description: 'مولد اللقطات التراكمية في نقطة زمنية محددة، التصدير السحابي المشفر، ومدقق التعافي من الكوارث.',
    status: 'completed',
    category: 'مرونة النظام',
    version: 'v1.2.0'
  },
  {
    id: 'VGF-06',
    code: 'VGF-06',
    name: 'أنماط إدخال المبيعات',
    description: 'إدخال مبيعات موحد يدعم الفاتورة القياسية، قارئ الباركود لنقاط البيع، ونمط الأزرار باللمس.',
    status: 'completed',
    category: 'العمليات التجارية',
    version: 'v1.3.0'
  },
  {
    id: 'VGF-07',
    code: 'VGF-07',
    name: 'مدير الرؤية',
    description: 'نظام التحكم بالرؤية المؤسسية لإخفاء الكيانات دون حذفها، مع الحفاظ على سلامة التواريخ والتقارير.',
    status: 'completed',
    category: 'الأمان والامتثال',
    version: 'v1.3.0'
  },
  {
    id: 'VGF-08',
    code: 'VGF-08',
    name: 'سياسة إعادة الطلب الذكية',
    description: 'مصفوفة إعادة تجديد المخزون الآلية المؤسسية مع كمية الطلب الاقتصادية، حد الأمان، والتوصيات للشراء.',
    status: 'completed',
    category: 'الذكاء الاصطناعي لسلسلة الإمداد',
    version: 'v1.4.0'
  },
  {
    id: 'VGF-09',
    code: 'VGF-09',
    name: 'سجل المستندات',
    description: 'مسار تدقيق دورة الحياة الكاملة، مقارنة فروق النسخ، استعادة الحذف المؤقت، وشبكات المستندات المترابطة.',
    status: 'completed',
    category: 'دورة حياة المستندات',
    version: 'v1.4.0'
  },
  {
    id: 'VGF-10',
    code: 'VGF-10',
    name: 'الخط الزمني للتدقيق المتقدم',
    description: 'خط زمني للأنشطة تم التحقق منه تشفيرياً ومقاوم للتلاعب، تتبع المستخدمين، والتدقيق الامتثالي.',
    status: 'completed',
    category: 'الطب الشرعي والتدقيق',
    version: 'v1.5.0'
  }
];

export const APPROVED_ERP_MODULES: ERPModuleMeta[] = [
  { id: 'MOD-GL', code: 'GL-101', name: 'دفتر الأستاذ العام والمحاسبة', category: 'المالية', status: 'approved', recordCount: 1420, description: 'القيد المزدوج، سندات اليومية، الفترات المالية، والقوائم المالية.', iconName: 'BookOpen' },
  { id: 'MOD-AR', code: 'AR-102', name: 'العملاء (حسابات المبيعات)', category: 'المالية', status: 'approved', recordCount: 890, description: 'إدارة العملاء الموحدة، الفواتير، الحدود الائتمانية، وأعمار الديون.', iconName: 'Users' },
  { id: 'MOD-AP', code: 'AP-103', name: 'حسابات الموردين والمشتريات', category: 'المالية', status: 'approved', recordCount: 640, description: 'فواتير الموردين، المطابقة الثلاثية، دورات الدفع، وطلبات الشراء.', iconName: 'CreditCard' },
  { id: 'MOD-INV', code: 'INV-201', name: 'المخزون والمستودعات', category: 'اللوجستيات', status: 'approved', recordCount: 3820, description: 'تتبع المستودعات، الأرقام التسلسلية والدفعات، وحركات المخزون.', iconName: 'Package' },
  { id: 'MOD-HR', code: 'HR-301', name: 'الموارد البشرية والرواتب', category: 'الموارد البشرية', status: 'approved', recordCount: 310, description: 'سجلات الموظفين، الحضور والانصراف، مسيرات الرواتب، والاستقطاعات.', iconName: 'Users' },
  { id: 'MOD-FA', code: 'FA-104', name: 'إدارة الأصول الثابتة', category: 'المالية', status: 'approved', recordCount: 185, description: 'سجل الأصول، جداول الإهلاك، انخفاض القيمة، والتخلص من الأصول.', iconName: 'Building2' },
  { id: 'MOD-CRM', code: 'CRM-401', name: 'إدارة علاقات العملاء', category: 'التجارية', status: 'approved', recordCount: 2150, description: 'مراحل المبيعات، تتبع الفرص، سجلات الاتصال، والتنبؤ بالصفقات.', iconName: 'Target' },
  { id: 'MOD-MFG', code: 'MFG-501', name: 'التصنيع وقائمة المواد', category: 'العمليات', status: 'approved', recordCount: 420, description: 'قوائم المواد، أوامر الشغل، التوجيه، وتخطيط احتیاجات المواد.', iconName: 'Factory' },
  { id: 'MOD-SCM', code: 'SCM-202', name: 'سلسلة الإمداد واللوجستيات', category: 'اللوجستيات', status: 'approved', recordCount: 1100, description: 'بوابات الموردين، تتبع الشحنات، تكاليف الشحن، والتكلفة المنزلة.', iconName: 'Truck' },
  { id: 'MOD-PM', code: 'PM-601', name: 'إدارة المشاريع والتكاليف', category: 'العمليات', status: 'approved', recordCount: 95, description: 'هيكل تفكيك العمل، فواتير المراحل، توزيع الموارد، وتتبع الوقت.', iconName: 'Briefcase' },
  { id: 'MOD-POS', code: 'POS-402', name: 'نقاط البيع (POS)', category: 'التجارية', status: 'approved', recordCount: 15400, description: 'واجهة الكاشير، المزامنة غير المتصلة، الإيصالات الرقمية، ودرج النقدية.', iconName: 'ShoppingBag' },
  { id: 'MOD-QM', code: 'QM-502', name: 'إدارة الجودة', category: 'العمليات', status: 'approved', recordCount: 230, description: 'خطط الفحص، تقارير عدم المطابقة، وتتبع الإجراءات التصحيحية.', iconName: 'ShieldCheck' },
  { id: 'MOD-TR', code: 'TR-105', name: 'الخزينة وإدارة النقدية', category: 'المالية', status: 'approved', recordCount: 780, description: 'التسوية البنكية، التنبؤ بالسيولة النقدية، وإدارة العملات الأجنبية.', iconName: 'Landmark' },
  { id: 'MOD-FLEET', code: 'FLEET-701', name: 'إدارة الأسطول والمعدات', category: 'الأصول', status: 'approved', recordCount: 64, description: 'سجلات صيانة المركبات، سجلات الوقود، وتعيين السائقين.', iconName: 'Car' },
  { id: 'MOD-BI', code: 'BI-801', name: 'محرك التحليلات وذكاء الأعمال', category: 'التحليلات', status: 'approved', recordCount: 48, description: 'لوحات القيادة التنفيذية، مؤشرات الأداء، والتقارير المجدولة.', iconName: 'BarChart3' }
];

export const SYSTEM_ENGINES: SystemEngineMeta[] = [
  { id: 'ENG-AUDIT', name: 'محرك التدقيق', description: 'يسجل بشكل غير قابل للتعديل جميع المعاملات والتغييرات ومحاولات المصادقة.', status: 'active', latencyMs: 2, subsystems: ['سجل الكتابة', 'التحقق من سلسلة التشفير', 'منظف الاحتفاظ'] },
  { id: 'ENG-NOTIF', name: 'محرك الإشعارات', description: 'موزع تنبيهات متعدد القنوات يعالج التنبيهات الفورية والبريد الإلكتروني والمهام.', status: 'active', latencyMs: 4, subsystems: ['موزع التنبيهات', 'بوابة البريد الإلكتروني', 'طابور الأولوية'] },
  { id: 'ENG-WORKFLOW', name: 'محرك سير العمل', description: 'مدقق حالة المستندات يعالج الاعتمادات متعددة المستويات ومؤقتات التصعيد.', status: 'active', latencyMs: 8, subsystems: ['مقيم آلة الحالة', 'مؤقت التصعيد', 'محلل الشروط'] },
  { id: 'ENG-PERM', name: 'محرك الصلاحيات', description: 'مقيم التحكم في الوصول القائم على الأدوار والخصائص (RBAC/ABAC) مع التخزين المؤقت.', status: 'active', latencyMs: 1, subsystems: ['سجل الأدوار', 'محرك السياسات', 'ذاكرة التخزين المؤقت'] },
  { id: 'ENG-SEARCH', name: 'محرك البحث', description: 'فهرس بحث شامل في جميع وحدات ERP الـ 15 وسجلات النظام.', status: 'active', latencyMs: 12, subsystems: ['مفهرس Trie', 'المطابق الضبابي', 'البحث عن الكيانات'] },
  { id: 'ENG-VIS', name: 'محرك الرؤية', description: 'مرشح قناع البيانات على مستوى الحقول والسجلات المطبق قبل تسلسل الاستجابة.', status: 'active', latencyMs: 3, subsystems: ['قناع PII', 'مرشح الصفوف', 'محول البيانات'] },
  { id: 'ENG-BIZDAY', name: 'محرك اليوم التجاري', description: 'يحدد تواريخ الترحيل النشطة، تعديلات نهاية الأسبوع، وأقفال الفترات المالية.', status: 'active', latencyMs: 2, subsystems: ['محرك التقويم', 'مراقب قفل الترحيل', 'معدل المنطقة الزمنية'] },
  { id: 'ENG-MERGE', name: 'محرك الدمج', description: 'يوفق بين سجلات البيانات الرئيسية المكررة بأمان ويحدث جميع المراجع العلاقاتية.', status: 'standby', latencyMs: 15, subsystems: ['مفتش العلاقات', 'مُعيد ربط البيانات', 'مصد التراجع'] },
  { id: 'ENG-BACKUP', name: 'محرك النسخ الاحتياطي', description: 'يؤتمت إنشاء لقطات قاعدة البيانات، تصدير الجداول، والتكرار السحابي.', status: 'active', latencyMs: 25, subsystems: ['مولد اللقطات', 'مشفر AES-256', 'مرفع S3/GCS'] },
  { id: 'ENG-IO', name: 'محرك الاستيراد والتصدير', description: 'محول جماعي عالي السرعة لـ CSV/Excel/JSON مع التحقق من المخطط والتقارير.', status: 'active', latencyMs: 18, subsystems: ['محلل التدفق', 'مخطط الأعمدة', 'محرك سجل الأخطاء'] },
  { id: 'ENG-REPORT', name: 'محرك التقارير', description: 'عارض قوالب PDF/Excel ديناميكي للقوائم المالية والسندات التشغيلية.', status: 'active', latencyMs: 35, subsystems: ['مترجم القوالب', 'محرك PDF', 'خط أنابيب التنسيق'] },
  { id: 'ENG-DASH', name: 'محرك لوحات القيادة', description: 'يجمع مؤشرات الأداء والرسوم البيانية في الوقت الفعلي مع التخزين المؤقت.', status: 'active', latencyMs: 6, subsystems: ['مزود العناصر', 'مجمع المؤشرات', 'الذاكرة المؤقتة'] },
  { id: 'ENG-LICENSE', name: 'محرك التراخيص', description: 'يتحقق من رموز الترخيص التشفيرية، حدود المقاعد، وأعلام الميزات المؤسسية.', status: 'active', latencyMs: 1, subsystems: ['مدقق مفتاح RSA', 'عداد المقاعد', 'سجل أعلام الميزات'] },
  { id: 'ENG-UPDATE', name: 'محرك التحديثات', description: 'يعالج الرقع السريعة بدون توقف، ترحيل قواعد البيانات، ومزامنة أعلام الميزات.', status: 'standby', latencyMs: 5, subsystems: ['مشغل الترحيل', 'مدقق الرقع', 'وسيط التبديل السريع'] },
  { id: 'ENG-PLUGIN', name: 'محرك الإضافات', description: 'بيئة تشغيل معزولة تسمح بخطافات العمل المخصصة وخطافات الويب الخارجية.', status: 'active', latencyMs: 9, subsystems: ['بيئة التشغيل المعزولة', 'موزع Webhook', 'ناقل الأحداث'] }
];

export const DEFAULT_SETUP_WIZARD_DATA: SetupWizardData = {
  // Phase 01
  companyName: 'Vertex Global Enterprises Corp',
  commercialName: 'Vertex ERP Solutions',
  businessActivity: 'Information Technology & Industrial Manufacturing',
  legalEntity: 'Corporation (C-Corp / LLC)',
  taxRegistrationNumber: 'TX-9981-88210-ENT',
  commercialRegistrationNumber: 'CR-77402-2026',
  country: 'United States',
  city: 'New York',
  address: '100 Enterprise Way, Suite 500',
  postalCode: '10001',
  phone: '+1 (800) 555-0199',
  email: 'contact@vertex-platform.internal',
  website: 'https://vertex-erp.internal',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',

  // Phase 02
  branches: [
    { id: 'BR-01', code: 'BR-01', name: 'الفرع الرئيسي', city: 'الإسكندرية / القاهرة', isMain: true }
  ],
  warehouses: [
    { id: 'WH-01', code: '1', name: 'مخزن الفرع الرئيسي', branchId: 'BR-01' }
  ],
  treasuries: [
    { id: 'TR-01', code: 'TR-001', name: 'خزينة الفرع الرئيسي', branchId: 'BR-01', currency: 'EGP (ج.م)' }
  ],
  bankAccounts: [
    { id: 'BK-01', code: 'JPM-USD-01', bankName: 'JPMorgan Chase & Co.', accountNumber: '10098827361', iban: 'US39JPMC10098827361', swift: 'CHASUS33', currency: 'USD ($)', companyName: 'Vertex Global Enterprises Corp', branchId: 'BR-01', branchName: 'داتا اليكس للتوريدات العمومية', openingBalance: 0, openingBalanceDate: '2026-01-01' },
    { id: 'BK-02', code: 'HSBC-GBP-01', bankName: 'HSBC UK Commercial', accountNumber: '228391002', iban: 'GB82HSBC228391002', swift: 'MIDLGB22', currency: 'GBP (£)', companyName: 'Vertex Global Enterprises Corp', branchId: 'BR-02', branchName: 'المستودع الإقليمي لندن', openingBalance: 0, openingBalanceDate: '2026-01-01' }
  ],

  // Phase 03
  fiscalYear: 'Jan 1 - Dec 31 (Calendar Year)',
  accountingPeriod: 'monthly',
  baseCurrency: 'USD ($)',
  exchangeRatePolicy: 'daily_central_bank',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  language: 'English',
  timeZone: 'America/New_York (UTC-5)',
  numberFormat: '1,234,567.89',
  taxCalculationMethod: 'exclusive',
  costingMethod: 'wac',
  defaultInventoryPolicy: 'negative_forbidden',

  // Phase 04
  superAdminName: 'System Super Administrator',
  adminUser: 'vtx_sysadmin',
  adminEmail: 'admin@vertex-platform.internal',
  adminPassword: 'Password#2026!Secure',
  securityPolicy: {
    minPasswordLength: 12,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiryDays: 90,
    sessionTimeoutMinutes: 30,
    maxFailedLogins: 5,
    twoFactorMode: 'totp_authenticator'
  },
  defaultRoles: ['Super Administrator', 'Financial Controller', 'Inventory Manager', 'HR Administrator', 'Sales Manager'],
  ipWhitelist: '10.0.0.0/8, 192.168.1.0/24',
  licenseKey: 'VTX-ENT-2026-GOLD-9981-PROD-VGF01',

  // Phase 05
  startMode: 'create_new',
  migrationSource: 'excel',
  chartOfAccountsTemplate: 'standard_corporate',
  accountCodeFormat: '6_digit_segmented',
  activeModuleIds: [
    'MOD-GL', 'MOD-AR', 'MOD-AP', 'MOD-INV', 'MOD-HR',
    'MOD-FA', 'MOD-CRM', 'MOD-MFG', 'MOD-SCM', 'MOD-PM',
    'MOD-POS', 'MOD-QM', 'MOD-TR', 'MOD-FLEET', 'MOD-BI'
  ],
  seedDemoData: true,

  // Phase 06
  isCompleted: false,
  version: '1.0.0'
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-9001',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    userId: 'SYS-00',
    userName: 'Vertex Platform Boot',
    action: 'VGF-01: First Run Setup Wizard Initialized',
    module: 'VGF-01 Setup Wizard',
    details: 'System entry point accessed. Pre-flight environment diagnostics triggered.',
    severity: 'info',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'AUD-9002',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    userId: 'ENG-LICENSE',
    userName: 'License Engine',
    action: 'License Verification Successful',
    module: 'License Engine',
    details: 'Valid Enterprise Tier license key loaded: VTX-ENT-2026-GOLD-9981-PROD-VGF01',
    severity: 'info',
    ipAddress: 'internal'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-1',
    title: 'First Run Setup Wizard Active',
    message: 'Feature VGF-01 is ready for configuration. Please complete the 6 setup steps.',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    type: 'info',
    read: false,
    sourceEngine: 'VGF-01 First Run Setup Wizard'
  },
  {
    id: 'NOTIF-2',
    title: '15 Core ERP Modules Ready',
    message: 'All 15 core business modules are approved and standby for initialization.',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    type: 'success',
    read: false,
    sourceEngine: 'System Core Registry'
  }
];
