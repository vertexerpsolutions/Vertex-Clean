import React, { useState, useMemo, useEffect } from 'react';
import { 
  Region, 
  RegionTreeNode, 
  regionService 
} from '../../services/regionService';
import { 
  FolderTree, 
  Search, 
  X, 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Folder, 
  FolderOpen,
  Eye
} from 'lucide-react';

export interface RegionTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRegion: (region: Region) => void;
  selectedRegionId?: string;
}

export const RegionTreeModal: React.FC<RegionTreeModalProps> = ({
  isOpen,
  onClose,
  onSelectRegion,
  selectedRegionId
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [treeData, setTreeData] = useState<RegionTreeNode[]>([]);
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [currentSelectedId, setCurrentSelectedId] = useState<string | null>(selectedRegionId || null);

  const loadTree = () => {
    const tree = regionService.getRegionTree();
    const list = regionService.getAllRegions();
    setTreeData(tree);
    setAllRegions(list);

    // Default expand all parent nodes
    const parentIds = new Set<string>();
    parentIds.add('ROOT_SYSTEM_NODE');
    list.forEach(r => {
      if (r.childrenCount > 0) {
        parentIds.add(r.id);
      }
    });
    setExpandedNodeIds(parentIds);
  };

  useEffect(() => {
    if (isOpen) {
      loadTree();
      setCurrentSelectedId(selectedRegionId || null);
      setSearchTerm('');
    }
  }, [isOpen, selectedRegionId]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Toggle node expand/collapse
  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    allIds.add('ROOT_SYSTEM_NODE');
    allRegions.forEach(r => allIds.add(r.id));
    setExpandedNodeIds(allIds);
  };

  const collapseAll = () => {
    const minIds = new Set<string>();
    minIds.add('ROOT_SYSTEM_NODE');
    setExpandedNodeIds(minIds);
  };

  // Find selected region object
  const selectedRegion = useMemo(() => {
    if (!currentSelectedId || currentSelectedId === 'ROOT_SYSTEM_NODE') return null;
    return allRegions.find(r => r.id === currentSelectedId) || null;
  }, [currentSelectedId, allRegions]);

  // Calculate breadcrumb path for selected region
  const selectedBreadcrumb = useMemo(() => {
    if (!selectedRegion) return 'المناطق';
    const parts: string[] = [`${selectedRegion.code}.. ${selectedRegion.name}`];
    let curr: Region | undefined = selectedRegion;
    while (curr && curr.parentId) {
      curr = allRegions.find(r => r.id === curr!.parentId);
      if (curr) {
        parts.unshift(`${curr.code}.. ${curr.name}`);
      }
    }
    return `المناطق \\ ` + parts.join(' \\ ');
  }, [selectedRegion, allRegions]);

  // Filtered Tree Nodes (Highlights / Expands matching)
  const isSearchActive = searchTerm.trim().length > 0;

  const matchesSearch = (node: RegionTreeNode): boolean => {
    const term = searchTerm.trim().toLowerCase();
    if (node.name.toLowerCase().includes(term) || node.code.toLowerCase().includes(term)) {
      return true;
    }
    return node.children.some(child => matchesSearch(child));
  };

  const handleConfirmSelect = () => {
    if (selectedRegion) {
      onSelectRegion(selectedRegion);
      onClose();
    }
  };

  const handleNodeDoubleClick = (node: RegionTreeNode) => {
    onSelectRegion(node);
    onClose();
  };

  if (!isOpen) return null;

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: RegionTreeNode, isLastChild: boolean = false) => {
    const isExpanded = expandedNodeIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = currentSelectedId === node.id;
    const isNodeActive = node.status === 'نشط' || node.status === 'active';

    if (isSearchActive && !matchesSearch(node)) {
      return null;
    }

    return (
      <div key={node.id} className="relative select-none text-xs">
        {/* Node Row */}
        <div
          onClick={() => setCurrentSelectedId(node.id)}
          onDoubleClick={() => handleNodeDoubleClick(node)}
          className={`group flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-all ${
            isSelected
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
              : 'hover:bg-slate-800/70 text-slate-300 hover:text-slate-100 border border-transparent'
          }`}
          style={{ paddingRight: `${node.level * 24 + 12}px` }}
        >
          <div className="flex items-center space-x-2 space-x-reverse min-w-0">
            {/* Expand/Collapse Chevron */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 transition-all shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-slate-600 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-slate-400" />
              </span>
            )}

            {/* Folder / Pin Icon */}
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400/80 shrink-0" />
              )
            ) : (
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}

            {/* Region Code & Name */}
            <div className="flex items-center space-x-2 space-x-reverse truncate">
              <span className={`font-mono text-xs px-2 py-0.5 rounded-lg font-bold ${
                hasChildren 
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' 
                  : 'bg-slate-950 text-cyan-400 border border-slate-700'
              }`}>
                {node.code}
              </span>
              <span className={`truncate text-sm ${hasChildren ? 'font-bold text-slate-100' : 'text-slate-200'}`}>
                {node.name}
              </span>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center space-x-2 space-x-reverse shrink-0 pr-2">
            {hasChildren && (
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-medium">
                {node.children.length} فروع
              </span>
            )}
            <span className={`text-xs px-2.5 py-0.5 rounded-full flex items-center space-x-1.5 space-x-reverse font-bold shadow-2xs ${
              isNodeActive 
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-600/40' 
                : 'bg-rose-950/40 text-rose-300 border border-rose-600/40'
            }`}>
              {isNodeActive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>نشط</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>معطل</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="space-y-1 mt-1">
            {node.children.map((child, idx) => 
              renderTreeNode(child, idx === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const isRootExpanded = expandedNodeIds.has('ROOT_SYSTEM_NODE');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none font-['Cairo',sans-serif]" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-[#090d16] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. TOP HEADER BAR                                         */}
        {/* ========================================================= */}
        <div className="px-6 py-5 bg-[#090d16] flex items-center justify-between shrink-0 border-b border-slate-800/40">
          {/* Top-Right: Golden FolderTree Icon */}
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-2xs">
            <FolderTree className="w-5 h-5" />
          </div>

          {/* Center: Title */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide text-center">
            شجرة التوزيع الجغرافي — المناطق
          </h2>

          {/* Top-Left: Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. SEARCH & QUICK ACTIONS BAR                             */}
        {/* ========================================================= */}
        <div className="px-6 pb-3 pt-4 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم أو الكود الهرمي للمنطقة وانتر..."
                className="w-full bg-white border border-slate-300 rounded-xl pr-4 pl-11 py-2.5 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs transition-colors font-['Cairo',sans-serif]"
                autoFocus
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors p-1"
                  title="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>

            {/* Quick Actions (Expand/Collapse All) */}
            <div className="flex items-center space-x-2 space-x-reverse shrink-0">
              <button
                type="button"
                onClick={expandAll}
                className="px-3.5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                توسيع الكل
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3.5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                طي الكل
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. TREE CONTAINER                                         */}
        {/* ========================================================= */}
        <div className="px-6 flex-1 overflow-x-auto overflow-y-auto custom-scrollbar min-h-[300px]">
          {/* System Root Node: "المناطق" */}
          <div className="select-none text-xs mb-2">
            <div
              onClick={() => toggleExpand('ROOT_SYSTEM_NODE')}
              className="flex items-center space-x-2.5 space-x-reverse py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 text-amber-300 font-bold border border-amber-500/30 cursor-pointer shadow-sm transition-colors"
            >
              <button
                type="button"
                className="w-5 h-5 rounded flex items-center justify-center text-amber-400"
              >
                {isRootExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              <FolderTree className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold">المناطق</span>
              <span className="text-[11px] bg-slate-950 text-slate-400 border border-slate-800 px-2.5 py-0.5 rounded-full font-mono mr-auto">
                {allRegions.length} منطقة مسجلة
              </span>
            </div>

            {/* Tree Children */}
            {isRootExpanded && (
              <div className="space-y-1 mt-1.5 pr-3 border-r border-slate-800/80">
                {treeData.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs font-bold">
                    لا توجد مناطق مسجلة بعد.
                  </div>
                ) : (
                  treeData.map((node, idx) => renderTreeNode(node, idx === treeData.length - 1))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. MODAL FOOTER                                           */}
        {/* ========================================================= */}
        <div className="px-6 py-4 bg-[#090d16] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 select-none border-t border-slate-800/40">
          {/* Breadcrumb Preview */}
          <div className="flex-1 w-full text-xs">
            <div className="text-[11px] text-slate-400 font-bold mb-1">المسار المحدد:</div>
            <div className="text-slate-100 font-mono text-xs truncate bg-[#060a12] px-3 py-1.5 rounded-xl border border-slate-800 font-bold text-amber-400">
              {selectedBreadcrumb}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 space-x-reverse shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleConfirmSelect}
              disabled={!selectedRegion}
              className="flex items-center space-x-1.5 space-x-reverse px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-black text-xs border border-amber-300 shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>عرض المنطقة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
