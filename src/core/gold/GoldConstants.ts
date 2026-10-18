import { GoldFeatureMetadata } from '../types';

export const PLATFORM_VERSION = 'v1.0.0-GOLD';
export const TOTAL_GOLD_FEATURES = 10;
export const TOTAL_GOLD_PHASES = 60;

export const GOLD_FEATURE_DEFINITIONS: GoldFeatureMetadata[] = [
  {
    id: 'VGF-01',
    code: 'VGF-01',
    name: 'Setup Wizard',
    description: 'Guided enterprise onboarding and initial system setup wizard.',
    version: '1.0.0',
    category: 'Onboarding & System Setup',
    phasesCount: 6,
    completedPhasesCount: 6,
    status: 'completed'
  },
  {
    id: 'VGF-02',
    code: 'VGF-02',
    name: 'Migration Center',
    description: 'Data extraction, validation, transformation, and import suite.',
    version: '1.0.0',
    category: 'Data Migration',
    phasesCount: 6,
    completedPhasesCount: 6,
    status: 'completed'
  },
  {
    id: 'VGF-03',
    code: 'VGF-03',
    name: 'Merge Engine',
    description: 'Entity deduplication and record merging framework.',
    version: '1.0.0',
    category: 'Data Quality & Reconciliation',
    phasesCount: 6,
    completedPhasesCount: 6,
    status: 'completed'
  },
  {
    id: 'VGF-04',
    code: 'VGF-04',
    name: 'Business Day Extension',
    description: 'Flexible fiscal cutoff extensions and post-midnight postings.',
    version: '1.0.0',
    category: 'Fiscal & Operational Accounting',
    phasesCount: 6,
    completedPhasesCount: 6,
    status: 'completed'
  },
  {
    id: 'VGF-05',
    code: 'VGF-05',
    name: 'Smart Backup System',
    description: 'Automated encrypted backups, retention policies, and cloud restores.',
    version: '1.0.0',
    category: 'Disaster Recovery & Security',
    phasesCount: 6,
    completedPhasesCount: 6,
    status: 'completed'
  },
  {
    id: 'VGF-06',
    code: 'VGF-06',
    name: 'Sales Entry Modes',
    description: 'Multi-modal point of sale, wholesale, and rapid keyboard entry.',
    version: '1.0.0',
    category: 'Sales & POS Engine',
    phasesCount: 6,
    completedPhasesCount: 6,
    status: 'completed'
  },
  {
    id: 'VGF-07',
    code: 'VGF-07',
    name: 'Visibility Manager',
    description: 'Granular field-level visibility, masking, and column control rules.',
    version: '1.0.0',
    category: 'Access & Compliance',
    phasesCount: 6,
    completedPhasesCount: 6,
    status: 'completed'
  },
  {
    id: 'VGF-08',
    code: 'VGF-08',
    name: 'Smart Reorder Policy',
    description: 'Automated reorder point, safety stock, and supplier PO engine.',
    version: '1.0.0',
    category: 'Inventory & Procurement',
    phasesCount: 6,
    completedPhasesCount: 6,
    status: 'completed'
  },
  {
    id: 'VGF-09',
    code: 'VGF-09',
    name: 'Document History',
    description: 'Complete lifecycle audit trail, version delta comparison, and relational network.',
    version: '1.0.0',
    category: 'Document Lifecycle',
    phasesCount: 6,
    completedPhasesCount: 6,
    status: 'completed'
  },
  {
    id: 'VGF-10',
    code: 'VGF-10',
    name: 'Advanced Audit Timeline',
    description: 'Cryptographically verified, tamper-proof activity timeline and compliance auditing.',
    version: '1.0.0',
    category: 'Forensics & Audit',
    phasesCount: 6,
    completedPhasesCount: 6,
    status: 'completed'
  }
];
