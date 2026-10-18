import React, { useState } from 'react';
import { Sliders, Search, Plus, Save, Database, Key, ShieldCheck, Mail, HardDrive, Cpu, Award, Globe, Languages } from 'lucide-react';
import { configService } from '../../../services/configService';
import { ConfigCategory, SystemVariable } from '../../../core/config/ConfigTypes';

export const ConfigurationManagerView: React.FC = () => {
  const [variables, setVariables] = useState<SystemVariable[]>(() => configService.getSystemVariables());
  const [selectedCategory, setSelectedCategory] = useState<ConfigCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState('');
  const [savedSuccessKey, setSavedSuccessKey] = useState<string | null>(null);

  const categories: { id: ConfigCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'application', label: 'Application', icon: Sliders },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'api_keys', label: 'API Keys', icon: Key },
    { id: 'authentication', label: 'Auth & JWT', icon: ShieldCheck },
    { id: 'smtp', label: 'SMTP Mail', icon: Mail },
    { id: 'storage', label: 'Object Storage', icon: HardDrive },
    { id: 'ai_providers', label: 'AI Providers', icon: Cpu },
    { id: 'license', label: 'License OEM', icon: Award },
    { id: 'regional', label: 'Regional', icon: Globe },
    { id: 'localization', label: 'Localization', icon: Languages }
  ];

  const filteredVars = variables.filter((v) => {
    const matchesCat = selectedCategory === 'all' || v.category === selectedCategory;
    const matchesSearch = v.key.toLowerCase().includes(searchQuery.toLowerCase()) || v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleStartEdit = (v: SystemVariable) => {
    setEditingKey(v.key);
    setEditingVal(v.value);
  };

  const handleSaveEdit = (key: string) => {
    configService.updateVariable(key, editingVal);
    setVariables([...configService.getSystemVariables()]);
    setEditingKey(null);
    setSavedSuccessKey(key);
    setTimeout(() => setSavedSuccessKey(null), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 03: System Configuration Manager</h2>
            <p className="text-xs text-slate-400">Application, Database, API Keys, Auth, SMTP, Storage, AI Providers, License, Regional & Localization Settings</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none mt-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              selectedCategory === 'all' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories ({variables.length})
          </button>
          {categories.map((c) => {
            const Icon = c.icon;
            const count = variables.filter(v => v.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-amber-500 text-slate-950 font-extrabold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search configuration keys, description or values..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Variables List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-mono text-xs">
        {filteredVars.map((v) => {
          const isEditing = editingKey === v.key;
          const isSaved = savedSuccessKey === v.key;
          return (
            <div
              key={v.key}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-100 text-sm">{v.key}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-400">
                      {v.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {v.source}
                    </span>
                    {v.requiresRestart && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Requires Restart
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{v.description}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {isEditing ? (
                    <button
                      onClick={() => handleSaveEdit(v.key)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center space-x-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(v)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                    >
                      Edit Value
                    </button>
                  )}
                </div>
              </div>

              {/* Value Box */}
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingVal}
                    onChange={(e) => setEditingVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-amber-500 text-amber-300 font-mono text-xs focus:outline-none"
                  />
                ) : (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono break-all flex items-center justify-between">
                    <span>{v.isSecret ? '••••••••••••••••••••••••••••' : v.value}</span>
                    {isSaved && <span className="text-emerald-400 font-bold text-[10px]">Saved!</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
