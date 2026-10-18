import { ConnectorDefinition } from './IntegrationTypes';

export const BUILT_IN_CONNECTORS: ConnectorDefinition[] = [
  {
    id: 'CONN-EXCEL-01',
    code: 'CON-EXCEL',
    name: 'Microsoft Excel Data Connector',
    category: 'SPREADSHEET',
    protocol: 'REST',
    authType: 'OAUTH2',
    description: 'Bi-directional integration with Microsoft 365 Excel Online workbooks for automated financial ledger syncing and batch imports.',
    iconName: 'FileSpreadsheet',
    supportedDataFormats: ['EXCEL', 'CSV', 'JSON'],
    isBuiltIn: true,
    version: '2.1.0',
    configSchema: {
      tenantId: { type: 'string', label: 'Azure Tenant ID', required: true },
      workbookPath: { type: 'string', label: 'SharePoint Workbook Path', required: true }
    }
  },
  {
    id: 'CONN-OUTLOOK-02',
    code: 'CON-OUTLOOK',
    name: 'Microsoft Outlook Email & Calendar Hub',
    category: 'EMAIL_CALENDAR',
    protocol: 'REST',
    authType: 'OAUTH2',
    description: 'Graph API connector for dispatching automated ERP invoices, workflow notifications, and calendar meeting schedules.',
    iconName: 'Mail',
    supportedDataFormats: ['JSON', 'PDF'],
    isBuiltIn: true,
    version: '2.4.0',
    configSchema: {
      clientAppId: { type: 'string', label: 'Microsoft Client App ID', required: true },
      scopes: { type: 'array', label: 'Graph Scopes', required: true }
    }
  },
  {
    id: 'CONN-GWORKSPACE-03',
    code: 'CON-GWORKSPACE',
    name: 'Google Workspace Integration Suite',
    category: 'WORKSPACE',
    protocol: 'REST',
    authType: 'OAUTH2',
    description: 'Deep integration with Google Drive, Sheets, and Gmail for automated report archival and multi-user spreadsheet sync.',
    iconName: 'Globe',
    supportedDataFormats: ['JSON', 'EXCEL', 'CSV', 'PDF'],
    isBuiltIn: true,
    version: '3.0.0',
    configSchema: {
      serviceAccountJson: { type: 'string', label: 'Service Account JSON Credentials', required: true }
    }
  },
  {
    id: 'CONN-SMTP-04',
    code: 'CON-SMTP',
    name: 'Enterprise SMTP Relay Server',
    category: 'EMAIL_CALENDAR',
    protocol: 'SMTP',
    authType: 'BASIC',
    description: 'High-throughput TLS-encrypted SMTP mail server connector for dispatching transactional VNE notifications and PDFs.',
    iconName: 'Send',
    supportedDataFormats: ['PDF', 'JSON'],
    isBuiltIn: true,
    version: '1.5.0',
    configSchema: {
      host: { type: 'string', label: 'SMTP Hostname', required: true },
      port: { type: 'number', label: 'Port (e.g. 587)', required: true }
    }
  },
  {
    id: 'CONN-SFTP-05',
    code: 'CON-SFTP',
    name: 'Secure FTP / SFTP File Gateway',
    category: 'FILE_TRANSFER',
    protocol: 'SFTP',
    authType: 'CERTIFICATE',
    description: 'Automated encrypted batch transfer of daily EDI, XML, and CSV files to banking or external partner endpoints.',
    iconName: 'Server',
    supportedDataFormats: ['CSV', 'XML', 'BINARY'],
    isBuiltIn: true,
    version: '2.0.0',
    configSchema: {
      sftpHost: { type: 'string', label: 'SFTP Host IP/Domain', required: true },
      sshPrivateKey: { type: 'string', label: 'RSA Private Key', required: true }
    }
  },
  {
    id: 'CONN-CLOUD-06',
    code: 'CON-CLOUDSTORAGE',
    name: 'Cloud Object Storage Connector',
    category: 'CLOUD_STORAGE',
    protocol: 'REST',
    authType: 'API_KEY',
    description: 'Secure connection to AWS S3, Google Cloud Storage, or Azure Blob Containers for archiving large document attachments.',
    iconName: 'Cloud',
    supportedDataFormats: ['BINARY', 'PDF', 'EXCEL', 'JSON'],
    isBuiltIn: true,
    version: '3.2.0',
    configSchema: {
      bucketName: { type: 'string', label: 'Target Storage Bucket', required: true },
      region: { type: 'string', label: 'Cloud Region', required: true }
    }
  },
  {
    id: 'CONN-PAYMENT-07',
    code: 'CON-PAYMENT',
    name: 'Stripe & Banking Payment Gateway',
    category: 'PAYMENT_GATEWAY',
    protocol: 'REST',
    authType: 'API_KEY',
    description: 'Real-time online payment capture, customer tokenization, automated webhook reconciliation, and refund processing.',
    iconName: 'CreditCard',
    supportedDataFormats: ['JSON'],
    isBuiltIn: true,
    version: '4.1.0',
    configSchema: {
      publishableKey: { type: 'string', label: 'Publishable API Key', required: true },
      secretKey: { type: 'string', label: 'Secret API Key', required: true }
    }
  },
  {
    id: 'CONN-HARDWARE-08',
    code: 'CON-HARDWARE',
    name: 'Barcode & QR Terminal Device Hub',
    category: 'HARDWARE_DEVICE',
    protocol: 'WEBSOCKET',
    authType: 'JWT',
    description: 'Low-latency streaming socket connection for handheld barcode scanners, POS receipt printers, and RFID gates.',
    iconName: 'QrCode',
    supportedDataFormats: ['JSON', 'BINARY'],
    isBuiltIn: true,
    version: '1.2.0',
    configSchema: {
      terminalEndpoint: { type: 'string', label: 'WebSocket Terminal Endpoint', required: true }
    }
  },
  {
    id: 'CONN-GOVT-09',
    code: 'CON-GOVT-TAX',
    name: 'Government E-Invoicing & Tax API Gateway',
    category: 'GOVERNMENT_TAX_API',
    protocol: 'REST',
    authType: 'CERTIFICATE',
    description: 'Official government compliance gateway for automated e-invoicing submission, digital signatures, and VAT validation.',
    iconName: 'Building2',
    supportedDataFormats: ['XML', 'JSON', 'PDF'],
    isBuiltIn: true,
    version: '2.8.0',
    configSchema: {
      taxAuthorityId: { type: 'string', label: 'Tax Authority Jurisdiction ID', required: true },
      digitalCertPem: { type: 'string', label: 'Digital X.509 Certificate (PEM)', required: true }
    }
  }
];
