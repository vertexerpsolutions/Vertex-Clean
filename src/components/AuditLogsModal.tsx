import React, { useState, useEffect } from 'react';
import { X, History, Shield, RefreshCw, Filter, Search } from 'lucide-react';
import { auditEngine } from '../services/auditEngine';
import { AuditLog } from '../types';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshLogs = () => {
    setLogs(auditEngine.getLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(
    l =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">محرك التدقيق والخط الزمني الجنائي</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  سجل غير قابل للتعديل
                </span>
              </div>
              <p className="text-xs text-slate-400">سجل معاملات النظام القابل للتحقق تشفيرياً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Refresh Filter Bar */}
        <div className="p-4 bg-slate-950/30 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث في مسار التدقيق..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={refreshLogs}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث</span>
            </button>
            <span className="text-xs text-slate-400 font-mono">
              {filteredLogs.length} سجلات
            </span>
          </div>
        </div>

        {/* Log Table */}
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                لم يتم العثور على سجلات تدقيق مطابقة.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold">
                        {log.id}
                      </span>
                      <span className="font-bold text-slate-200">{log.action}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                      <span>{new Date(log.timestamp).toLocaleString('ar')}</span>
                      <span className="text-slate-600">•</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed mb-2 font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
                    {log.details}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">المستخدم:</span>
                      <span className="text-slate-300 font-medium">{log.userName} ({log.userId})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">النظام:</span>
                      <span className="text-indigo-400 font-medium">{log.module}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
