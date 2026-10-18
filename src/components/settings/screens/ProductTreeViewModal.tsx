import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FolderTree, 
  Folder, 
  FolderOpen, 
  Package, 
  Search, 
  X, 
  ChevronDown, 
  ChevronLeft, 
  Printer, 
  FileSpreadsheet, 
  ChevronsDown, 
  ChevronsUp, 
  Layers, 
  Eye, 
  Plus, 
  ShoppingCart, 
  Check 
} from 'lucide-react';
import { CategoryTreeNode, FastProductItem, SubCategoryTreeNode } from './CategoryMasterListView';
import { desktopService } from '../../../services/desktopService';

export interface ProductTreeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryTree: CategoryTreeNode[];
  products: FastProductItem[];
  levelMode?: '2-level' | '3-level';
  onSelectProduct?: (product: FastProductItem) => void;
  selectionTitle?: string;
  isSelectionMode?: boolean;
}

export const ProductTreeViewModal: React.FC<ProductTreeViewModalProps> = ({
  isOpen,
  onClose,
  categoryTree,
  products,
  levelMode = '2-level',
  onSelectProduct,
  selectionTitle,
  isSelectionMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const [expandedSubGroupIds, setExpandedSubGroupIds] = useState<Set<string>>(new Set());
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Initialize expanded groups when modal opens
  useEffect(() => {
    if (isOpen) {
      const allGroupIds = new Set<string>();
      const allSubIds = new Set<string>();

      categoryTree.forEach(cat => {
        allGroupIds.add(cat.id);
        if (cat.children) {
          cat.children.forEach(sub => allSubIds.add(sub.id));
        }
      });

      setExpandedGroupIds(allGroupIds);
      setExpandedSubGroupIds(allSubIds);
      setSearchQuery('');
      setIsPrintPreviewOpen(false);
    }
  }, [isOpen, categoryTree]);

  // =========================================================================
  // 1. DATA COMPUTATION FOR 2-LEVEL (Main Group -> Products)
  // =========================================================================
  const tree2LevelData = useMemo(() => {
    return categoryTree.map(cat => {
      const groupProducts = products.filter(p => 
        p.category === cat.name || 
        p.code.startsWith(cat.id)
      );

      return {
        group: cat,
        products: groupProducts,
        totalProducts: groupProducts.length
      };
    });
  }, [categoryTree, products]);

  // Filtered 2-Level Data
  const filteredTree2LevelData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tree2LevelData;

    return tree2LevelData.map(item => {
      const groupCodeMatch = item.group.id.toLowerCase().includes(q);
      const groupNameMatch = item.group.name.toLowerCase().includes(q);

      if (groupCodeMatch || groupNameMatch) {
        return item;
      }

      const matchingProds = item.products.filter(p => 
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );

      if (matchingProds.length > 0) {
        return {
          ...item,
          products: matchingProds
        };
      }

      return null;
    }).filter((g): g is NonNullable<typeof g> => g !== null);
  }, [tree2LevelData, searchQuery]);

  // =========================================================================
  // 2. DATA COMPUTATION FOR 3-LEVEL (Main Group -> Sub Groups -> Products)
  // =========================================================================
  const tree3LevelData = useMemo(() => {
    return categoryTree.map(mainCat => {
      const children = mainCat.children || [];
      
      const subNodes = children.map(subCat => {
        const subProds = products.filter(p => 
          (p.category === mainCat.name && p.subCategory === subCat.name) ||
          p.code.startsWith(subCat.id)
        );
        return {
          subCategory: subCat,
          products: subProds
        };
      });

      // Products attached to main without sub category
      const subNames = new Set(children.map(s => s.name));
      const unassignedProds = products.filter(p => {
        const isMain = p.category === mainCat.name || p.code.startsWith(mainCat.id);
        const hasSub = p.subCategory && subNames.has(p.subCategory);
        return isMain && !hasSub;
      });

      if (unassignedProds.length > 0 && children.length === 0) {
        subNodes.push({
          subCategory: {
            id: `${mainCat.id}001`,
            name: 'عام',
            level: 2,
            itemCount: unassignedProds.length
          },
          products: unassignedProds
        });
      }

      const totalProdsInMain = subNodes.reduce((acc, s) => acc + s.products.length, 0);

      return {
        mainCategory: mainCat,
        subGroups: subNodes,
        totalProducts: totalProdsInMain
      };
    });
  }, [categoryTree, products]);

  // Filtered 3-Level Data
  const filteredTree3LevelData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tree3LevelData;

    return tree3LevelData.map(group => {
      const mainCodeMatch = group.mainCategory.id.toLowerCase().includes(q);
      const mainNameMatch = group.mainCategory.name.toLowerCase().includes(q);

      if (mainCodeMatch || mainNameMatch) {
        return group;
      }

      const filteredSubGroups = group.subGroups.map(sub => {
        const subCodeMatch = sub.subCategory.id.toLowerCase().includes(q);
        const subNameMatch = sub.subCategory.name.toLowerCase().includes(q);

        if (subCodeMatch || subNameMatch) {
          return sub;
        }

        const matchingProds = sub.products.filter(p => 
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
        );

        if (matchingProds.length > 0) {
          return {
            ...sub,
            products: matchingProds
          };
        }

        return null;
      }).filter((s): s is NonNullable<typeof s> => s !== null);

      if (filteredSubGroups.length > 0) {
        return {
          ...group,
          subGroups: filteredSubGroups,
          totalProducts: filteredSubGroups.reduce((acc, s) => acc + s.products.length, 0)
        };
      }

      return null;
    }).filter((g): g is NonNullable<typeof g> => g !== null);
  }, [tree3LevelData, searchQuery]);

  // Auto-expand all matching nodes on search
  useEffect(() => {
    if (searchQuery.trim()) {
      if (levelMode === '2-level') {
        const newExpanded = new Set<string>();
        filteredTree2LevelData.forEach(g => newExpanded.add(g.group.id));
        setExpandedGroupIds(newExpanded);
      } else {
        const newMain = new Set<string>();
        const newSub = new Set<string>();
        filteredTree3LevelData.forEach(g => {
          newMain.add(g.mainCategory.id);
          g.subGroups.forEach(s => newSub.add(s.subCategory.id));
        });
        setExpandedGroupIds(newMain);
        setExpandedSubGroupIds(newSub);
      }
    }
  }, [searchQuery, levelMode, filteredTree2LevelData, filteredTree3LevelData]);

  // Toggle single group expand/collapse
  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // Toggle single sub group expand/collapse (for 3-level mode)
  const toggleSubGroup = (subId: string) => {
    setExpandedSubGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  // Expand all groups
  const handleExpandAll = () => {
    const allIds = new Set<string>();
    const allSub = new Set<string>();
    categoryTree.forEach(c => {
      allIds.add(c.id);
      c.children?.forEach(s => allSub.add(s.id));
    });
    setExpandedGroupIds(allIds);
    setExpandedSubGroupIds(allSub);
  };

  // Collapse all groups
  const handleCollapseAll = () => {
    setExpandedGroupIds(new Set());
    setExpandedSubGroupIds(new Set());
  };

  // Open Print Preview
  const handleOpenPrintPreview = () => {
    setIsPrintPreviewOpen(true);
  };

  // Execute Print with Default Printer & Electron Support
  const handleExecutePrint = async () => {
    setIsPrinting(true);

    try {
      const win = window as any;
      const isElectron = Boolean(
        win.electron || 
        win.electronAPI || 
        win.ipcRenderer || 
        win.process?.versions?.electron ||
        win.__ELECTRON__
      );

      const title = levelMode === '2-level'
        ? 'تقرير شجرة الأصناف (مستويان) - VERTEX ERP'
        : 'تقرير شجرة الأصناف (3 مستويات) - VERTEX ERP';

      if (isElectron) {
        let detectedDefaultPrinter = 'Default Printer';
        
        if (win.electronAPI?.getDefaultPrinter) {
          const printerInfo = await win.electronAPI.getDefaultPrinter();
          if (printerInfo?.name) detectedDefaultPrinter = printerInfo.name;
        } else if (win.ipcRenderer?.invoke) {
          try {
            const printers = await win.ipcRenderer.invoke('get-printers');
            const defaultPrn = Array.isArray(printers) ? printers.find((p: any) => p.isDefault) : null;
            if (defaultPrn?.name) detectedDefaultPrinter = defaultPrn.name;
          } catch {
            // fallback silently
          }
        }

        desktopService.triggerPrintJob(
          title,
          detectedDefaultPrinter,
          Math.max(1, Math.ceil(products.length / 28))
        );

        if (win.electronAPI?.print) {
          await win.electronAPI.print({
            silent: false,
            printBackground: true,
            pageSize: 'A4'
          });
          setIsPrinting(false);
          return;
        }

        if (win.ipcRenderer?.invoke) {
          try {
            await win.ipcRenderer.invoke('print-document', {
              silent: false,
              pageSize: 'A4'
            });
            setIsPrinting(false);
            return;
          } catch {
            // fallback to window.print()
          }
        }
      } else {
        desktopService.triggerPrintJob(
          title,
          'Default System Printer',
          Math.max(1, Math.ceil(products.length / 28))
        );
      }

      window.print();
    } catch (err) {
      console.error('Error initiating print:', err);
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 800);
    }
  };

  // Real Excel (.xlsx) Export
  const handleExportExcel = () => {
    if (levelMode === '2-level') {
      const headers = [
        'كود المجموعة',
        'اسم المجموعة',
        'كود الصنف',
        'اسم الصنف',
        'الوحدة الأساسية',
        'الوحدة الفرعية',
        'معامل التحويل',
        'نوع الصنف',
        'الباركود'
      ];

      const data: (string | number)[][] = [headers];

      categoryTree.forEach(cat => {
        const groupProducts = products.filter(p => 
          p.category === cat.name || 
          p.code.startsWith(cat.id)
        );

        if (groupProducts.length === 0) {
          data.push([cat.id, cat.name, '', '', '', '', '', '', '']);
        } else {
          groupProducts.forEach(prod => {
            data.push([
              cat.id,
              cat.name,
              prod.code,
              prod.name,
              prod.basicUnit || prod.unit || 'عدد',
              prod.subUnit || '',
              prod.conversionFactor !== undefined && prod.conversionFactor !== null ? prod.conversionFactor : '',
              prod.type === 'stockable' ? 'مخزني' : 'خدمي',
              prod.barcode || ''
            ]);
          });
        }
      });

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      worksheet['!cols'] = [
        { wch: 16 }, // كود المجموعة
        { wch: 28 }, // اسم المجموعة
        { wch: 18 }, // كود الصنف
        { wch: 36 }, // اسم الصنف
        { wch: 14 }, // الوحدة الأساسية
        { wch: 14 }, // الوحدة الفرعية
        { wch: 14 }, // معامل التحويل
        { wch: 14 }, // نوع الصنف
        { wch: 20 }  // الباركود
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'شجرة الأصناف');
      XLSX.writeFile(workbook, 'Product_Tree_2Levels.xlsx');
    } else {
      // 3-Level Excel Export
      const headers = [
        'كود المجموعة الرئيسية',
        'اسم المجموعة الرئيسية',
        'كود المجموعة الفرعية',
        'اسم المجموعة الفرعية',
        'كود الصنف',
        'اسم الصنف',
        'الوحدة الأساسية',
        'الوحدة الفرعية',
        'معامل التحويل',
        'نوع الصنف',
        'الباركود',
        'الرصيد الحالي'
      ];

      const data: (string | number)[][] = [headers];

      categoryTree.forEach(mainCat => {
        const children = mainCat.children || [];
        if (children.length === 0) {
          const mainProds = products.filter(p => p.category === mainCat.name || p.code.startsWith(mainCat.id));
          if (mainProds.length === 0) {
            data.push([mainCat.id, mainCat.name, '', '', '', '', '', '', '', '', '', 0]);
          } else {
            mainProds.forEach(prod => {
              data.push([
                mainCat.id,
                mainCat.name,
                '',
                '',
                prod.code,
                prod.name,
                prod.basicUnit || prod.unit || 'عدد',
                prod.subUnit || '',
                prod.conversionFactor !== undefined && prod.conversionFactor !== null ? prod.conversionFactor : '',
                prod.type === 'stockable' ? 'مخزني' : 'خدمي',
                prod.barcode || '',
                prod.stockQty || 0
              ]);
            });
          }
        } else {
          children.forEach(subCat => {
            const subProds = products.filter(p => 
              (p.category === mainCat.name && p.subCategory === subCat.name) ||
              p.code.startsWith(subCat.id)
            );

            if (subProds.length === 0) {
              data.push([mainCat.id, mainCat.name, subCat.id, subCat.name, '', '', '', '', '', '', '', 0]);
            } else {
              subProds.forEach(prod => {
                data.push([
                  mainCat.id,
                  mainCat.name,
                  subCat.id,
                  subCat.name,
                  prod.code,
                  prod.name,
                  prod.basicUnit || prod.unit || 'عدد',
                  prod.subUnit || '',
                  prod.conversionFactor !== undefined && prod.conversionFactor !== null ? prod.conversionFactor : '',
                  prod.type === 'stockable' ? 'مخزني' : 'خدمي',
                  prod.barcode || '',
                  prod.stockQty || 0
                ]);
              });
            }
          });
        }
      });

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      worksheet['!cols'] = [
        { wch: 18 }, // كود المجموعة الرئيسية
        { wch: 26 }, // اسم المجموعة الرئيسية
        { wch: 18 }, // كود المجموعة الفرعية
        { wch: 28 }, // اسم المجموعة الفرعية
        { wch: 16 }, // كود الصنف
        { wch: 34 }, // اسم الصنف
        { wch: 14 }, // الوحدة الأساسية
        { wch: 14 }, // الوحدة الفرعية
        { wch: 12 }, // معامل التحويل
        { wch: 12 }, // نوع الصنف
        { wch: 18 }, // الباركود
        { wch: 12 }  // الرصيد الحالي
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'شجرة الأصناف 3 مستويات');
      XLSX.writeFile(workbook, 'Product_Tree_3Levels.xlsx');
    }
  };

  const totalMainGroups = categoryTree.length;
  const totalSubGroups = categoryTree.reduce((acc, c) => acc + (c.children?.length || 0), 0);
  const totalProductsCount = products.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-fadeIn" dir="rtl">
      
      {/* ========================================================================= */}
      {/* A4 PRINT CSS RULES */}
      {/* ========================================================================= */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 10mm 10mm 10mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #product-tree-printable-document,
          #product-tree-printable-document * {
            visibility: visible !important;
          }
          #product-tree-printable-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            display: block !important;
          }
          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          .print-group-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. PRINT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isPrintPreviewOpen ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-fadeIn">
          {/* Print Preview Toolbar */}
          <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 no-print">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <h3 className="text-sm sm:text-base font-black text-slate-100">
                    معاينة الطباعة — تقرير شجرة الأصناف ({levelMode === '2-level' ? 'مستويان' : '3 مستويات'})
                  </h3>
                  <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                    A4 Portrait
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {levelMode === '2-level'
                    ? 'معاينة النسخة المجهزة للطباعة للمجموعات والأصناف التابعة لها'
                    : 'معاينة النسخة المجهزة للطباعة للمجموعات الرئيسية والفرعية والأصناف'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                type="button"
                onClick={handleExecutePrint}
                disabled={isPrinting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer disabled:opacity-50"
                title="إرسال أمر الطباعة"
              >
                <Printer className="w-4 h-4" />
                <span>{isPrinting ? 'جاري الطباعة...' : 'طباعة'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintPreviewOpen(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>

          {/* Print Preview Scrollable Canvas */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/60 flex justify-center">
            <div className="w-full max-w-[210mm] bg-white text-slate-900 rounded-lg shadow-xl p-8 border border-slate-300 font-sans text-right" dir="rtl">
              
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-5 flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">VERTEX ERP SYSTEM</div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0">
                    تقرير شجرة الأصناف والتصنيفات
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    {levelMode === '2-level'
                      ? 'تصنيف هرمي للمجموعات والأصناف التابعة لها'
                      : 'تصنيف هرمي ثلاثي المستويات (مجموعة رئيسية ← مجموعة فرعية ← صنف)'}
                  </p>
                </div>
                <div className="text-left text-xs text-slate-600 space-y-1">
                  <div><strong>تاريخ التقرير:</strong> {new Date().toLocaleDateString('ar-EG')}</div>
                  <div><strong>وقت الطباعة:</strong> {new Date().toLocaleTimeString('ar-EG')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {levelMode === '2-level' ? (
                      <>المجموعات: <span className="font-bold text-slate-800">{totalMainGroups}</span> • الأصناف: <span className="font-bold text-slate-800">{totalProductsCount}</span></>
                    ) : (
                      <>رئيسية: <span className="font-bold text-slate-800">{totalMainGroups}</span> • فرعية: <span className="font-bold text-slate-800">{totalSubGroups}</span> • أصناف: <span className="font-bold text-slate-800">{totalProductsCount}</span></>
                    )}
                  </div>
                </div>
              </div>

              {/* 2-Level Print Preview Content */}
              {levelMode === '2-level' ? (
                <div className="space-y-4">
                  {tree2LevelData.map(({ group, products: groupProds }) => (
                    <div key={group.id} className="border border-slate-300 rounded-md overflow-hidden print-group-block">
                      {/* Group Header */}
                      <div className="bg-slate-900 text-white px-3.5 py-2 flex justify-between items-center">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="font-mono text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                            {group.id}
                          </span>
                          <span className="font-bold text-sm text-white">
                            {group.name}
                          </span>
                        </div>
                        <span className="text-xs text-slate-300 font-mono">
                          ({groupProds.length} صنف)
                        </span>
                      </div>

                      {/* Products Table */}
                      {groupProds.length > 0 ? (
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px]">
                              <th className="py-1.5 px-3 text-right font-bold w-10">م</th>
                              <th className="py-1.5 px-3 text-right font-bold w-28">كود الصنف</th>
                              <th className="py-1.5 px-3 text-right font-bold">اسم الصنف</th>
                              <th className="py-1.5 px-2 text-center font-bold w-24">الوحدة الأساسية</th>
                              <th className="py-1.5 px-2 text-center font-bold w-28">الوحدة الفرعية</th>
                              <th className="py-1.5 px-2 text-center font-bold w-20">نوع الصنف</th>
                              <th className="py-1.5 px-2 text-center font-bold w-28">الباركود</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {groupProds.map((prod, idx) => (
                              <tr key={prod.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="py-1.5 px-3 text-slate-500 font-mono text-[10px]">{idx + 1}</td>
                                <td className="py-1.5 px-3 font-mono font-bold text-slate-900 text-[11px]">{prod.code}</td>
                                <td className="py-1.5 px-3 font-medium text-slate-800">{prod.name}</td>
                                <td className="py-1.5 px-2 text-center text-slate-700">{prod.basicUnit || prod.unit || 'عدد'}</td>
                                <td className="py-1.5 px-2 text-center text-slate-600 text-[10px] font-mono">
                                  {prod.subUnit && prod.conversionFactor ? `${prod.subUnit} (${prod.conversionFactor})` : '—'}
                                </td>
                                <td className="py-1.5 px-2 text-center text-slate-700">
                                  {prod.type === 'stockable' ? 'مخزني' : 'خدمي'}
                                </td>
                                <td className="py-1.5 px-2 text-center font-mono text-[10px] text-slate-600">
                                  {prod.barcode || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-3 text-xs text-slate-400 italic text-center bg-slate-50/50">
                          لا توجد أصناف مسجلة في هذه المجموعة
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* 3-Level Print Preview Content */
                <div className="space-y-5">
                  {tree3LevelData.map(({ mainCategory, subGroups, totalProducts: mainTotalProds }) => (
                    <div key={mainCategory.id} className="border-2 border-slate-800 rounded-md overflow-hidden print-group-block">
                      {/* Main Group Header */}
                      <div className="bg-slate-900 text-white px-3.5 py-2 flex justify-between items-center">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="font-mono text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                            {mainCategory.id}
                          </span>
                          <span className="font-bold text-sm text-white">
                            المجموعة الرئيسية: {mainCategory.name}
                          </span>
                        </div>
                        <span className="text-xs text-slate-300 font-mono">
                          ({subGroups.length} مجموعات فرعية • {mainTotalProds} صنف)
                        </span>
                      </div>

                      {/* Sub Groups */}
                      <div className="p-2 space-y-3 bg-slate-50">
                        {subGroups.map(({ subCategory, products: subProds }) => (
                          <div key={subCategory.id} className="border border-slate-300 rounded bg-white overflow-hidden">
                            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex justify-between items-center">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 border border-blue-300 px-1.5 py-0.2 rounded">
                                  {subCategory.id}
                                </span>
                                <span className="font-bold text-xs text-slate-800">
                                  {subCategory.name}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-600 font-mono">
                                ({subProds.length} صنف)
                              </span>
                            </div>

                            {subProds.length > 0 ? (
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px]">
                                    <th className="py-1 px-2.5 text-right font-bold w-10">م</th>
                                    <th className="py-1 px-2.5 text-right font-bold w-24">كود الصنف</th>
                                    <th className="py-1 px-2.5 text-right font-bold">اسم الصنف</th>
                                    <th className="py-1 px-2 text-center font-bold w-20">الوحدة الأساسية</th>
                                    <th className="py-1 px-2 text-center font-bold w-28">الوحدة الفرعية</th>
                                    <th className="py-1 px-2 text-center font-bold w-16">النوع</th>
                                    <th className="py-1 px-2 text-center font-bold w-24">الباركود</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-150">
                                  {subProds.map((prod, idx) => (
                                    <tr key={prod.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                      <td className="py-1 px-2.5 text-slate-500 font-mono text-[10px]">{idx + 1}</td>
                                      <td className="py-1 px-2.5 font-mono font-bold text-slate-900 text-[11px]">{prod.code}</td>
                                      <td className="py-1 px-2.5 font-medium text-slate-800">{prod.name}</td>
                                      <td className="py-1 px-2 text-center text-slate-700">{prod.basicUnit || prod.unit || 'عدد'}</td>
                                      <td className="py-1 px-2 text-center text-slate-600 text-[10px] font-mono">
                                        {prod.subUnit && prod.conversionFactor ? `${prod.subUnit} (${prod.conversionFactor})` : '—'}
                                      </td>
                                      <td className="py-1 px-2 text-center text-slate-700">
                                        {prod.type === 'stockable' ? 'مخزني' : 'خدمي'}
                                      </td>
                                      <td className="py-1 px-2 text-center font-mono text-[10px] text-slate-600">
                                        {prod.barcode || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-2 text-xs text-slate-400 italic text-center">
                                لا توجد أصناف مسجلة في هذه المجموعة الفرعية
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Signatures */}
              <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-center text-xs text-slate-500">
                <div>طبع بواسطة: مستخدم النظام المعتمد</div>
                <div>اعتماد مدير إدارة المخازن: .................................</div>
                <div>صفحة 1 من 1</div>
              </div>

            </div>
          </div>
        </div>
      ) : (

        /* ========================================================================= */
        /* 2. MAIN INTERACTIVE TREE MODAL */
        /* ========================================================================= */
        <div 
          id="product-tree-modal-box"
          className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        >
          {/* HEADER */}
          <div className="p-3.5 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className={`p-2 rounded-xl border shrink-0 ${
                onSelectProduct || isSelectionMode
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                {onSelectProduct || isSelectionMode ? <ShoppingCart className="w-5 h-5" /> : <FolderTree className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                  <h3 className="text-sm sm:text-base font-black text-slate-100">
                    {selectionTitle || (onSelectProduct || isSelectionMode ? 'شجرة الأصناف — اختيار الصنف لفاتورة البيع' : 'شجرة الأصناف')}
                  </h3>
                  <span className={`text-[10px] border px-2 py-0.5 rounded-full font-mono font-bold ${
                    levelMode === '2-level'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {levelMode === '2-level' ? 'مستويان (مجموعة رئيسية ← صنف)' : '3 مستويات (مجموعة رئيسية ← فرعية ← صنف)'}
                  </span>
                  {(onSelectProduct || isSelectionMode) && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      {levelMode === '2-level' ? 'المسار: مجموعة رئيسية ← صنف ← إضافة للفاتورة' : 'المسار: رئيسية ← فرعية ← صنف ← إضافة للفاتورة'}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 space-x-reverse mt-0.5 text-[11px] text-slate-400">
                  {levelMode === '2-level' ? (
                    <>
                      <span>المجموعات: <strong className="text-slate-200 font-mono">{totalMainGroups}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>الأصناف: <strong className="text-slate-200 font-mono">{totalProductsCount}</strong></span>
                    </>
                  ) : (
                    <>
                      <span>رئيسية: <strong className="text-slate-200 font-mono">{totalMainGroups}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>فرعية: <strong className="text-slate-200 font-mono">{totalSubGroups}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>أصناف: <strong className="text-slate-200 font-mono">{totalProductsCount}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1.5 space-x-reverse flex-wrap gap-y-1.5">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/60 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 space-x-reverse cursor-pointer"
                title="توسيع كافة المجموعات"
              >
                <ChevronsDown className="w-3.5 h-3.5" />
                <span>توسيع الكل</span>
              </button>

              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-700/60 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 space-x-reverse cursor-pointer"
                title="طي كافة المجموعات"
              >
                <ChevronsUp className="w-3.5 h-3.5" />
                <span>طي الكل</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPrintPreview}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-blue-400 border border-slate-700/60 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 space-x-reverse cursor-pointer"
                title="معاينة وطباعة شجرة الأصناف"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 space-x-reverse cursor-pointer"
                title="تصدير إلى ملف Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer mr-1"
                title="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 no-print">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  levelMode === '2-level'
                    ? "بحث بكود المجموعة، اسم المجموعة، كود الصنف، أو اسم الصنف..."
                    : "بحث بكود أو اسم المجموعة الرئيسية، الفرعية، كود الصنف، أو الباركود..."
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {searchQuery.trim() && (
              <div className="text-[11px] text-amber-400 font-bold hidden sm:block">
                عرض النتائج المطابقة للبحث
              </div>
            )}
          </div>

          {/* SCROLLABLE TREE BODY */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-slate-950 font-sans">
            {levelMode === '2-level' ? (
              /* ================= 2-LEVEL RENDER ================= */
              filteredTree2LevelData.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <FolderTree className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                  <p className="text-sm font-bold text-slate-400">لا توجد نتائج مطابقة للبحث</p>
                  <p className="text-xs text-slate-600">جرّب البحث بكلمات أخرى أو كود مختلف</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTree2LevelData.map(({ group, products: groupProds }) => {
                    const isExpanded = expandedGroupIds.has(group.id);

                    return (
                      <div 
                        key={group.id} 
                        className="border border-slate-800/90 rounded-xl bg-slate-900/40 overflow-hidden shadow-xs transition-all"
                      >
                        {/* Group Header */}
                        <div
                          onClick={() => toggleGroup(group.id)}
                          className={`flex items-center justify-between p-2.5 px-3 select-none cursor-pointer transition-colors ${
                            isExpanded ? 'bg-slate-900/90 border-b border-slate-800 text-amber-400' : 'hover:bg-slate-900/70 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 space-x-reverse flex-1 min-w-0">
                            <div className="text-slate-400 hover:text-slate-200 transition-transform">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-amber-400" />
                              ) : (
                                <ChevronLeft className="w-4 h-4" />
                              )}
                            </div>

                            <div className="text-amber-400 shrink-0">
                              {isExpanded ? (
                                <FolderOpen className="w-4 h-4" />
                              ) : (
                                <Folder className="w-4 h-4" />
                              )}
                            </div>

                            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                              {group.id}
                            </span>

                            <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                              {group.name}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                              {groupProds.length} صنف
                            </span>
                          </div>
                        </div>

                        {/* Products List */}
                        {isExpanded && (
                          <div className="p-2 sm:p-2.5 bg-slate-950/80">
                            {groupProds.length > 0 ? (
                              <div className="space-y-1 pr-3 sm:pr-4">
                                {groupProds.map(prod => {
                                  const isSelected = recentlyAddedId === prod.id;
                                  return (
                                    <div
                                      key={prod.id}
                                      onClick={() => {
                                        if (onSelectProduct) {
                                          setRecentlyAddedId(prod.id);
                                          setTimeout(() => setRecentlyAddedId(null), 1500);
                                          onSelectProduct(prod);
                                        }
                                      }}
                                      className={`flex items-center justify-between p-2 rounded-lg border transition-all text-xs ${
                                        onSelectProduct 
                                          ? 'cursor-pointer hover:border-emerald-500/60 hover:bg-emerald-500/5 bg-slate-900/40 border-slate-800/60' 
                                          : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/60'
                                      } ${isSelected ? 'border-emerald-500 bg-emerald-500/20' : ''}`}
                                    >
                                      <div className="flex items-center space-x-2.5 space-x-reverse min-w-0 flex-1">
                                        <div className="text-slate-600 text-xs font-mono select-none">└──</div>
                                        <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        
                                        <span className="font-mono text-emerald-400 font-bold shrink-0 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]">
                                          {prod.code}
                                        </span>

                                        <span className="font-medium text-slate-100 truncate">
                                          {prod.name}
                                        </span>

                                        {prod.barcode && (
                                          <span className="hidden md:inline-block font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                                            باركود: {prod.barcode}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center space-x-2 space-x-reverse shrink-0 mr-2 text-[11px]">
                                        {prod.sellingPrice !== undefined && prod.sellingPrice > 0 && (
                                          <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            ${prod.sellingPrice.toFixed(2)}
                                          </span>
                                        )}

                                        <span className="text-slate-300 bg-slate-850 px-2 py-0.5 rounded border border-slate-700/60">
                                          {prod.basicUnit || prod.unit || 'عدد'}
                                        </span>

                                        {prod.subUnit && prod.conversionFactor && (
                                          <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono text-[10px]">
                                            1 {prod.basicUnit || prod.unit} = {prod.conversionFactor} {prod.subUnit}
                                          </span>
                                        )}

                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          prod.type === 'stockable' 
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        }`}>
                                          {prod.type === 'stockable' ? 'مخزني' : 'خدمي'}
                                        </span>

                                        {onSelectProduct && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRecentlyAddedId(prod.id);
                                              setTimeout(() => setRecentlyAddedId(null), 1500);
                                              onSelectProduct(prod);
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 space-x-reverse cursor-pointer ${
                                              isSelected
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 shadow-xs'
                                            }`}
                                            title="إضافة هذا الصنف إلى فاتورة البيع"
                                          >
                                            {isSelected ? (
                                              <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>تمت الإضافة</span>
                                              </>
                                            ) : (
                                              <>
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>إضافة للفاتورة</span>
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-2.5 text-center text-xs text-slate-500 italic">
                                لا توجد أصناف مسجلة في هذه المجموعة
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* ================= 3-LEVEL RENDER ================= */
              filteredTree3LevelData.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <FolderTree className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                  <p className="text-sm font-bold text-slate-400">لا توجد نتائج مطابقة للبحث</p>
                  <p className="text-xs text-slate-600">جرّب البحث بكلمات أخرى أو كود مختلف</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTree3LevelData.map(({ mainCategory, subGroups, totalProducts: mainTotalProds }) => {
                    const isMainExpanded = expandedGroupIds.has(mainCategory.id);

                    return (
                      <div 
                        key={mainCategory.id} 
                        className="border border-slate-800 rounded-2xl bg-slate-900/50 overflow-hidden shadow-sm transition-all"
                      >
                        {/* LEVEL 1: MAIN GROUP HEADER */}
                        <div
                          onClick={() => toggleGroup(mainCategory.id)}
                          className={`flex items-center justify-between p-3 px-3.5 select-none cursor-pointer transition-colors ${
                            isMainExpanded ? 'bg-slate-900 border-b border-slate-800 text-amber-400' : 'hover:bg-slate-900/80 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 space-x-reverse flex-1 min-w-0">
                            <div className="text-slate-400 hover:text-slate-200 transition-transform">
                              {isMainExpanded ? (
                                <ChevronDown className="w-4 h-4 text-amber-400" />
                              ) : (
                                <ChevronLeft className="w-4 h-4" />
                              )}
                            </div>

                            <div className="text-amber-400 shrink-0">
                              {isMainExpanded ? (
                                <FolderOpen className="w-4 h-4" />
                              ) : (
                                <Folder className="w-4 h-4" />
                              )}
                            </div>

                            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                              {mainCategory.id}
                            </span>

                            <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                              {mainCategory.name}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-blue-300 border border-slate-700/60">
                              {subGroups.length} مجموعات فرعية
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                              {mainTotalProds} صنف
                            </span>
                          </div>
                        </div>

                        {/* LEVEL 2 & 3 CONTAINER */}
                        {isMainExpanded && (
                          <div className="p-2 sm:p-3 bg-slate-950/70 space-y-2.5">
                            {subGroups.length > 0 ? (
                              subGroups.map(({ subCategory, products: subProds }) => {
                                const isSubExpanded = expandedSubGroupIds.has(subCategory.id);

                                return (
                                  <div
                                    key={subCategory.id}
                                    className="border border-slate-800/80 rounded-xl bg-slate-900/60 overflow-hidden"
                                  >
                                    {/* LEVEL 2: SUB GROUP HEADER */}
                                    <div
                                      onClick={() => toggleSubGroup(subCategory.id)}
                                      className={`flex items-center justify-between p-2.5 px-3 select-none cursor-pointer transition-colors ${
                                        isSubExpanded ? 'bg-slate-900/90 border-b border-slate-800/60 text-blue-400' : 'hover:bg-slate-900/70 text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0 pr-2">
                                        <div className="text-slate-500 hover:text-slate-300">
                                          {isSubExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                                          ) : (
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                          )}
                                        </div>

                                        <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />

                                        <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                          {subCategory.id}
                                        </span>

                                        <span className="text-xs font-bold text-slate-200 truncate">
                                          {subCategory.name}
                                        </span>
                                      </div>

                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-850 text-slate-400 border border-slate-800">
                                        {subProds.length} صنف
                                      </span>
                                    </div>

                                    {/* LEVEL 3: PRODUCTS */}
                                    {isSubExpanded && (
                                      <div className="p-2 bg-slate-950/90">
                                        {subProds.length > 0 ? (
                                          <div className="space-y-1 pr-4 sm:pr-6">
                                            {subProds.map(prod => {
                                              const isSelected = recentlyAddedId === prod.id;
                                              return (
                                                <div
                                                  key={prod.id}
                                                  onClick={() => {
                                                    if (onSelectProduct) {
                                                      setRecentlyAddedId(prod.id);
                                                      setTimeout(() => setRecentlyAddedId(null), 1500);
                                                      onSelectProduct(prod);
                                                    }
                                                  }}
                                                  className={`flex items-center justify-between p-2 rounded-lg border transition-all text-xs ${
                                                    onSelectProduct 
                                                      ? 'cursor-pointer hover:border-emerald-500/60 hover:bg-emerald-500/5 bg-slate-900/40 border-slate-800/50' 
                                                      : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/50'
                                                  } ${isSelected ? 'border-emerald-500 bg-emerald-500/20' : ''}`}
                                                >
                                                  <div className="flex items-center space-x-2 space-x-reverse min-w-0 flex-1">
                                                    <div className="text-slate-600 text-xs font-mono select-none">└──</div>
                                                    <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                    
                                                    <span className="font-mono text-emerald-400 font-bold shrink-0 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[11px]">
                                                      {prod.code}
                                                    </span>

                                                    <span className="font-medium text-slate-100 truncate">
                                                      {prod.name}
                                                    </span>

                                                    {prod.barcode && (
                                                      <span className="hidden md:inline-block font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                                                        باركود: {prod.barcode}
                                                      </span>
                                                    )}
                                                  </div>

                                                  <div className="flex items-center space-x-2 space-x-reverse shrink-0 mr-2 text-[11px]">
                                                    {prod.sellingPrice !== undefined && prod.sellingPrice > 0 && (
                                                      <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                        ${prod.sellingPrice.toFixed(2)}
                                                      </span>
                                                    )}

                                                    <span className="text-slate-300 bg-slate-850 px-2 py-0.5 rounded border border-slate-700/60">
                                                      {prod.basicUnit || prod.unit || 'عدد'}
                                                    </span>

                                                    {prod.subUnit && prod.conversionFactor && (
                                                      <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono text-[10px]">
                                                        1 {prod.basicUnit || prod.unit} = {prod.conversionFactor} {prod.subUnit}
                                                      </span>
                                                    )}

                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                      prod.type === 'stockable' 
                                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    }`}>
                                                      {prod.type === 'stockable' ? 'مخزني' : 'خدمي'}
                                                    </span>

                                                    {onSelectProduct && (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setRecentlyAddedId(prod.id);
                                                          setTimeout(() => setRecentlyAddedId(null), 1500);
                                                          onSelectProduct(prod);
                                                        }}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 space-x-reverse cursor-pointer ${
                                                          isSelected
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 shadow-xs'
                                                        }`}
                                                        title="إضافة هذا الصنف إلى فاتورة البيع"
                                                      >
                                                        {isSelected ? (
                                                          <>
                                                            <Check className="w-3.5 h-3.5" />
                                                            <span>تمت الإضافة</span>
                                                          </>
                                                        ) : (
                                                          <>
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>إضافة للفاتورة</span>
                                                          </>
                                                        )}
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="py-2 pr-6 text-xs text-slate-500 italic">
                                            لا توجد أصناف مسجلة في هذه المجموعة الفرعية
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="py-3 text-center text-xs text-slate-500 italic">
                                لا توجد مجموعات فرعية مسجلة في هذه المجموعة الرئيسية
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* MODAL FOOTER */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 no-print">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {levelMode === '2-level'
                  ? 'نظام شجرة الأصناف (المجموعة ← الأصناف التابعة)'
                  : 'نظام شجرة الأصناف (مجموعة رئيسية ← مجموعة فرعية ← صنف)'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED HIDDEN PRINTABLE CONTAINER FOR HARDWARE / BROWSER PRINTING */}
      {/* ========================================================================= */}
      <div id="product-tree-printable-document" className="hidden print:block text-right" dir="rtl">
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>VERTEX ERP SYSTEM</div>
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0', color: '#0f172a' }}>
              تقرير شجرة الأصناف والتصنيفات
            </h1>
            <p style={{ fontSize: '10pt', color: '#475569', margin: '4px 0 0 0' }}>
              {levelMode === '2-level'
                ? 'تصنيف هرمي للمجموعات والأصناف التابعة لها'
                : 'نظام التصنيف الهرمي ثلاثي المستويات (مجموعة رئيسية ← مجموعة فرعية ← صنف)'}
            </p>
          </div>
          <div style={{ textAlign: 'left', fontSize: '9pt', color: '#475569' }}>
            <p style={{ margin: 0 }}><strong>تاريخ التقرير:</strong> {new Date().toLocaleDateString('ar-EG')}</p>
            <p style={{ margin: '2px 0 0 0' }}><strong>الوقت:</strong> {new Date().toLocaleTimeString('ar-EG')}</p>
            <p style={{ margin: '4px 0 0 0' }}>
              {levelMode === '2-level' ? (
                <><strong>المجموعات:</strong> {totalMainGroups} • <strong>الأصناف:</strong> {totalProductsCount}</>
              ) : (
                <><strong>رئيسية:</strong> {totalMainGroups} • <strong>فرعية:</strong> {totalSubGroups} • <strong>أصناف:</strong> {totalProductsCount}</>
              )}
            </p>
          </div>
        </div>

        {levelMode === '2-level' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {tree2LevelData.map(({ group, products: groupProds }) => (
              <div key={group.id} className="print-group-block" style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '9pt', backgroundColor: '#f59e0b', color: '#0f172a', padding: '2px 6px', borderRadius: '3px' }}>
                      {group.id}
                    </span>
                    <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                      {group.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '8.5pt', color: '#94a3b8', fontFamily: 'monospace' }}>
                    ({groupProds.length} صنف)
                  </span>
                </div>

                {groupProds.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                        <th style={{ padding: '5px 8px', textAlign: 'right', width: '5%' }}>م</th>
                        <th style={{ padding: '5px 8px', textAlign: 'center', width: '18%' }}>كود الصنف</th>
                        <th style={{ padding: '5px 8px', textAlign: 'right', width: '42%' }}>اسم الصنف</th>
                        <th style={{ padding: '5px 8px', textAlign: 'center', width: '15%' }}>الوحدة الأساسية</th>
                        <th style={{ padding: '5px 8px', textAlign: 'center', width: '10%' }}>النوع</th>
                        <th style={{ padding: '5px 8px', textAlign: 'center', width: '10%' }}>الباركود</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupProds.map((prod, idx) => (
                        <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                          <td style={{ padding: '4px 8px', color: '#64748b', fontFamily: 'monospace' }}>{idx + 1}</td>
                          <td style={{ padding: '4px 8px', fontFamily: 'monospace', fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }}>
                            {prod.code}
                          </td>
                          <td style={{ padding: '4px 8px', fontWeight: '500', color: '#1e293b' }}>
                            {prod.name}
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', color: '#475569' }}>
                            {prod.basicUnit || prod.unit || 'عدد'}
                            {prod.subUnit && prod.conversionFactor ? ` (${prod.subUnit} × ${prod.conversionFactor})` : ''}
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', color: '#475569' }}>
                            {prod.type === 'stockable' ? 'مخزني' : 'خدمي'}
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', fontFamily: 'monospace', color: '#64748b' }}>
                            {prod.barcode || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '8pt', fontStyle: 'italic' }}>
                    لا توجد أصناف مسجلة في هذه المجموعة
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {tree3LevelData.map(({ mainCategory, subGroups, totalProducts: mainTotalProds }) => (
              <div key={mainCategory.id} className="print-group-block" style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '9pt', backgroundColor: '#f59e0b', color: '#0f172a', padding: '2px 6px', borderRadius: '3px' }}>
                      {mainCategory.id}
                    </span>
                    <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                      {mainCategory.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '8.5pt', color: '#94a3b8', fontFamily: 'monospace' }}>
                    ({subGroups.length} مجموعات فرعية • {mainTotalProds} صنف)
                  </span>
                </div>

                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8fafc' }}>
                  {subGroups.map(({ subCategory, products: subProds }) => (
                    <div key={subCategory.id} style={{ border: '1px solid #e2e8f0', borderRadius: '3px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '8.5pt', color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '1px 5px', borderRadius: '3px' }}>
                            {subCategory.id}
                          </span>
                          <span style={{ fontWeight: 'bold', fontSize: '9pt', color: '#1e293b' }}>
                            {subCategory.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '8pt', color: '#64748b', fontFamily: 'monospace' }}>
                          ({subProds.length} صنف)
                        </span>
                      </div>

                      {subProds.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                              <th style={{ padding: '4px 6px', textAlign: 'right', width: '4%' }}>م</th>
                              <th style={{ padding: '4px 6px', textAlign: 'center', width: '15%' }}>كود الصنف</th>
                              <th style={{ padding: '4px 6px', textAlign: 'right', width: '38%' }}>اسم الصنف</th>
                              <th style={{ padding: '4px 6px', textAlign: 'center', width: '11%' }}>الوحدة الأساسية</th>
                              <th style={{ padding: '4px 6px', textAlign: 'center', width: '14%' }}>الوحدة الفرعية</th>
                              <th style={{ padding: '4px 6px', textAlign: 'center', width: '8%' }}>النوع</th>
                              <th style={{ padding: '4px 6px', textAlign: 'center', width: '10%' }}>الباركود</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subProds.map((prod, idx) => (
                              <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                                <td style={{ padding: '3px 6px', color: '#64748b', fontFamily: 'monospace' }}>{idx + 1}</td>
                                <td style={{ padding: '3px 6px', fontFamily: 'monospace', fontWeight: 'bold', color: '#0f172a', textAlign: 'center' }}>{prod.code}</td>
                                <td style={{ padding: '3px 6px', fontWeight: '500', color: '#1e293b' }}>{prod.name}</td>
                                <td style={{ padding: '3px 6px', textAlign: 'center', color: '#475569' }}>{prod.basicUnit || prod.unit || 'عدد'}</td>
                                <td style={{ padding: '3px 6px', textAlign: 'center', color: '#64748b', fontFamily: 'monospace' }}>
                                  {prod.subUnit && prod.conversionFactor ? `${prod.subUnit} (${prod.conversionFactor})` : '—'}
                                </td>
                                <td style={{ padding: '3px 6px', textAlign: 'center', color: '#475569' }}>{prod.type === 'stockable' ? 'مخزني' : 'خدمي'}</td>
                                <td style={{ padding: '3px 6px', textAlign: 'center', fontFamily: 'monospace', color: '#64748b' }}>{prod.barcode || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ padding: '6px', textAlign: 'center', color: '#94a3b8', fontSize: '7.5pt', fontStyle: 'italic' }}>
                          لا توجد أصناف مسجلة في هذه المجموعة الفرعية
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#64748b' }}>
          <div>نظام VERTEX ERP المتكامل — تقرير إدارة شجرة الأصناف والتصنيفات</div>
          <div>صفحة 1 من 1</div>
        </div>
      </div>

    </div>
  );
};
