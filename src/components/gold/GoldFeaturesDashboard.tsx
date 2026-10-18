import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  BarChart3, 
  Clock, 
  Activity, 
  Cpu, 
  Box, 
  ExternalLink 
} from 'lucide-react';
import { goldFeatureManager } from '../../core/gold/GoldFeatureManager';
import { GOLD_FEATURE_DEFINITIONS } from '../../core/gold/GoldConstants';
import { GoldHeader } from './shared/GoldHeader';
import { GoldStatistics } from './shared/GoldStatistics';
import { GoldSection } from './shared/GoldSection';
import { GoldCard } from './shared/GoldCard';
import { GoldStatusBadge } from './shared/GoldStatusBadge';

interface GoldFeaturesDashboardProps {
  onSelectFeature?: (featureId: string) => void;
}

export const GoldFeaturesDashboard: React.FC<GoldFeaturesDashboardProps> = ({ onSelectFeature }) => {
  const stats = goldFeatureManager.getPlatformStats();
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(GOLD_FEATURE_DEFINITIONS.map(f => f.category)))];

  const filteredFeatures = filterCategory === 'All'
    ? GOLD_FEATURE_DEFINITIONS
    : GOLD_FEATURE_DEFINITIONS.filter(f => f.category === filterCategory);

  const recentActivities = [
    { time: 'الآن', action: 'تم إكمال تحسين بنية المنصة', feature: 'Gold Engine v1.0', icon: Sparkles },
    { time: 'منذ 5 دقائق', action: 'تم إكمال الجدول الزمني المتقدم للمراجعة VGF-10', feature: 'VGF-10', icon: CheckCircle2 },
    { time: 'منذ 12 دقيقة', action: 'تم التحقق من دورة حياة تاريخ المستندات VGF-09', feature: 'VGF-09', icon: CheckCircle2 },
    { time: 'منذ 25 دقيقة', action: 'تم تكامل سياسة إعادة الطلب الذكية VGF-08', feature: 'VGF-08', icon: CheckCircle2 },
    { time: 'منذ 40 دقيقة', action: 'تم تطبيق قواعد الرؤية على مستوى الحقول VGF-07', feature: 'VGF-07', icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <GoldHeader
        code="GOLD-CORE"
        title="لوحة تحكم الميزات الذهبية لنظام Vertex"
        description="مركز التحكم الشامل لبنية الميزات الذهبية العشر للمؤسسة (VGF-01 إلى VGF-10). جميع الميزات جاهزة للإنتاج ومعتمدة ومشفرة."
        version={stats.platformVersion}
        isCompleted={stats.isFullyCompleted}
        icon={Award}
      />

      {/* Main KPI Statistics */}
      <GoldStatistics
        columns={4}
        stats={[
          {
            label: 'إجمالي الميزات الذهبية',
            value: `${stats.completedFeatures} / ${stats.totalFeatures}`,
            subtext: '100% مكتملة ونشطة',
            icon: Award,
            variant: 'emerald'
          },
          {
            label: 'إجمالي المراحل المكتملة',
            value: `${stats.completedPhases} / ${stats.totalPhases}`,
            subtext: '6 مراحل فرعية لكل ميزة ذهبية',
            icon: Layers,
            variant: 'amber'
          },
          {
            label: 'جودة البنية التحتية',
            value: 'جاهز للإنتاج',
            subtext: 'محسنة وموحدة بالكامل',
            icon: ShieldCheck,
            variant: 'indigo'
          },
          {
            label: 'إصدار المنصة',
            value: stats.platformVersion,
            subtext: 'الميزات الذهبية لمنصة Vertex v1.0',
            icon: Cpu,
            variant: 'default'
          }
        ]}
      />

      {/* Feature Registry Overview Grid */}
      <GoldSection
        title="سجل الميزات الذهبية الرسمي (VGF-01 إلى VGF-10)"
        subtitle="انقر على أي ميزة ذهبية لفتح واجهة إدارتها التفاعلية."
        icon={Box}
        actions={
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">تصفية حسب الفئة:</span>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'الكل' : c}</option>
              ))}
            </select>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeatures.map(feat => (
            <GoldCard
              key={feat.id}
              hoverable
              onClick={() => onSelectFeature && onSelectFeature(feat.id)}
              className="space-y-3 relative group border-slate-800/80 hover:border-amber-500/50"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                    {feat.code}
                  </span>
                  <GoldStatusBadge status={feat.status} label={feat.status} />
                </div>
                <span className="text-[10px] font-mono text-slate-500">v{feat.version}</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors flex items-center justify-between">
                  <span>{feat.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {feat.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{feat.category}</span>
                <span className="text-emerald-400 font-bold">{feat.completedPhasesCount}/{feat.phasesCount} مراحل</span>
              </div>
            </GoldCard>
          ))}
        </div>
      </GoldSection>

      {/* Activity Timeline & Integration Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GoldSection title="مصفوفة تكامل الميزات الذهبية (VPI-03)" subtitle="الربط بين الوحدات والأنظمة والخدمات المشتركة" icon={Zap}>
            <div className="space-y-3 font-mono text-xs">
              {goldFeatureManager.getAllIntegrationBindings().map((b) => (
                <div key={b.code} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        {b.code}
                      </span>
                      <span className="font-bold text-slate-100 font-sans">{b.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      {b.status === 'active' ? 'نشط' : b.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-900">
                    <div>
                      <span className="text-slate-500 block text-[10px]">الوحدات المربوطة ({b.boundModuleIds.length})</span>
                      <span className="text-indigo-300">{b.boundModuleIds.length === 15 ? 'جميع الـ 15 وحدة' : b.boundModuleIds.join(', ')}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">المحركات المربوطة</span>
                      <span className="text-cyan-300">{b.boundEngineCodes.join(', ')}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">الخدمات المشتركة</span>
                      <span className="text-emerald-300">{b.sharedServiceBindings.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GoldSection>

          <GoldSection title="نشاطات المنصة الأخيرة" subtitle="سجل المراجعة للتحديثات والتحسينات" icon={Activity}>
            <div className="space-y-3 font-mono text-xs">
              {recentActivities.map((act, i) => {
                const Icon = act.icon;
                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{act.action}</p>
                        <p className="text-[10px] text-slate-500">{act.feature}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{act.time}</span>
                  </div>
                );
              })}
            </div>
          </GoldSection>
        </div>

        <div>
          <GoldSection title="سلامة المنصة والتكامل" subtitle="مؤشرات الجاهزية VPI-03" icon={Zap}>
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">حالة تكامل الميزات الذهبية</span>
                <p className="text-emerald-400 font-bold">10 / 10 متكاملة بالكامل</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">تغطية وحدات ERP</span>
                <p className="text-emerald-400 font-bold">15 / 15 وحدة مربوطة</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">التوافق مع المحركات</span>
                <p className="text-emerald-400 font-bold">8 / 8 محركات منصة Vertex</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">الخدمات المشتركة</span>
                <p className="text-amber-400 font-bold">المراجعة المركزية، الإعدادات، والإشعارات</p>
              </div>
            </div>
          </GoldSection>
        </div>
      </div>
    </div>
  );
};
