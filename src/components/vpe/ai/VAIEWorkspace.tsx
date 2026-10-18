import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  Brain, 
  TrendingUp, 
  ShieldAlert, 
  FileText, 
  Lightbulb, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Zap, 
  Cpu, 
  BarChart2, 
  Activity, 
  FileSearch, 
  Sliders, 
  BookOpen, 
  RefreshCw, 
  Check, 
  Clock, 
  Layers, 
  ArrowUpRight, 
  HelpCircle,
  Upload
} from 'lucide-react';
import { 
  aiManager, 
  AIModelConfig, 
  AIPredictionResult, 
  AIAnomalyAlert, 
  AIDocumentExtraction, 
  AICopilotMessage, 
  AIRecommendation 
} from '../../../core/vpe/ai';

interface VAIEWorkspaceProps {
  onOpenGlobalSearch?: () => void;
}

export const VAIEWorkspace: React.FC<VAIEWorkspaceProps> = ({ onOpenGlobalSearch }) => {
  const [activeTab, setActiveTab] = useState<'copilot' | 'forecasting' | 'anomalies' | 'ocr' | 'insights' | 'models' | 'docs'>('copilot');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // File upload simulation for OCR
  const [uploadFileName, setUploadFileName] = useState<string>('Vendor_Contract_Aug2026.pdf');

  // Trigger state reads
  const models = aiManager.getModels();
  const predictions = aiManager.getPredictions();
  const anomalies = aiManager.getAnomalies();
  const extractions = aiManager.getExtractions();
  const copilotHistory = aiManager.getCopilotHistory();
  const recommendations = aiManager.getRecommendations();

  const handleSendCopilot = () => {
    if (!userPrompt.trim()) return;
    const query = userPrompt;
    setUserPrompt('');
    aiManager.sendCopilotQuery(query);
  };

  const handleResolveAnomaly = (id: string, res: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'RESOLVED') => {
    aiManager.resolveAnomaly(id, res);
    setStatusMsg(`Anomaly ${id} marked as ${res.replace('_', ' ')}.`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleSimulateOCR = () => {
    const doc = aiManager.parseDocumentFile(uploadFileName, 'VENDOR_INVOICE');
    setStatusMsg(`Parsed ${doc.fileName} with ${(doc.confidenceScore * 100).toFixed(1)}% field accuracy.`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg shadow-md">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">VPE-08 Vertex AI Engine (VAIE)</h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                    v8.0.0 Operational
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gemini 2.5 Copilot Assistant, Predictive Financial Forecaster, Real-time Fraud Detector & OCR Document Parser
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenGlobalSearch && (
              <button
                onClick={onOpenGlobalSearch}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              >
                <Search className="w-3.5 h-3.5 text-purple-400" />
                <span>Search AI Index (VSE)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('copilot')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Gemini Copilot</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 mt-6 pt-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'copilot'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Gemini Copilot</span>
          </button>

          <button
            onClick={() => setActiveTab('forecasting')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'forecasting'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Predictive Forecaster ({predictions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('anomalies')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'anomalies'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Fraud & Anomalies ({anomalies.filter(a => a.status === 'UNREVIEWED').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'ocr'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>OCR Document Extractor</span>
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'insights'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Smart Recommendations</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'models'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Model Registry ({models.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'docs'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>AI Developer Guide</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-purple-700 hover:text-purple-900 text-xs">Dismiss</button>
        </div>
      )}

      {/* TAB 1: GEMINI COPILOT */}
      {activeTab === 'copilot' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[550px]">
          {/* Copilot Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Vertex Copilot (Powered by Gemini 2.5 Pro)</h2>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
              Live Latency: 42ms
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {copilotHistory.map(msg => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3.5 rounded-xl text-xs space-y-2 ${
                    msg.sender === 'USER' 
                      ? 'bg-purple-600 text-white rounded-br-none shadow-sm' 
                      : 'bg-slate-100 border border-slate-200 text-slate-900 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>

                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-200/60 mt-2">
                      {msg.suggestedActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => aiManager.sendCopilotQuery(act.label)}
                          className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 font-semibold rounded border border-purple-200 text-[10px] transition shadow-2xs"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`text-[9px] ${msg.sender === 'USER' ? 'text-purple-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prompt Input Area */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center space-x-2">
            <input
              type="text"
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendCopilot()}
              placeholder="Ask Vertex Copilot about Q3 Revenue, Anomaly Alerts, or Inventory reorders..."
              className="flex-1 p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
            <button
              onClick={handleSendCopilot}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm transition inline-flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PREDICTIVE FORECASTING */}
      {activeTab === 'forecasting' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {predictions.map(p => (
              <div key={p.predictionId} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-600">{p.predictionId}</span>
                    <h3 className="text-sm font-bold text-slate-900">{p.targetMetric}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                    Confidence: {(p.confidenceScore * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-baseline space-x-3">
                  <div className="text-3xl font-extrabold text-slate-900">${p.predictedValue.toLocaleString()} {p.unit}</div>
                  <div className="text-xs font-bold text-emerald-600 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    +{p.historicalComparisonChangePercent}% vs Prior Period
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {p.summaryReasoning}
                </p>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Key Neural Impact Factors:</h4>
                  <div className="space-y-1.5">
                    {p.factors.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="font-medium text-slate-800">{f.name}</span>
                        <span className={`font-bold ${f.impact === 'POSITIVE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {f.impact} ({Math.round(f.weight * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ANOMALIES & FRAUD */}
      {activeTab === 'anomalies' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Real-time Fraud & Anomaly Detector</h2>
            <p className="text-xs text-slate-500">Isolation Forest neural net scanning General Ledger, Claims, and Invoices for risk outliers.</p>
          </div>

          <div className="space-y-4">
            {anomalies.map(a => (
              <div key={a.anomalyId} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getSeverityBadge(a.severity)}`}>
                        {a.severity} ({a.riskScore}/100 Risk)
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-800 rounded">
                        {a.sourceModule}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">{a.title}</h3>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Entity Target: <strong className="font-mono text-slate-900">{a.entityId}</strong></div>
                  </div>

                  {a.status === 'UNREVIEWED' ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleResolveAnomaly(a.anomalyId, 'CONFIRMED_FRAUD')}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold rounded shadow-2xs transition"
                      >
                        Confirm Fraud
                      </button>
                      <button
                        onClick={() => handleResolveAnomaly(a.anomalyId, 'RESOLVED')}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded shadow-2xs transition"
                      >
                        Approve & Clear
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded-full">
                      Status: {a.status}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{a.description}</p>
                <div className="text-xs font-semibold text-purple-900 bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                  AI Mitigation: {a.suggestedMitigation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: OCR DOCUMENT EXTRACTOR */}
      {activeTab === 'ocr' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulator Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">OCR Parser Simulator</h3>
              <p className="text-xs text-slate-500">Upload vendor invoices or contracts for sub-50ms field extraction.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Document File Name</label>
                <input
                  type="text"
                  value={uploadFileName}
                  onChange={e => setUploadFileName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                onClick={handleSimulateOCR}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-sm transition inline-flex items-center justify-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Parse Document with Gemini 2.5</span>
              </button>
            </div>
          </div>

          {/* Extractions Results */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Extracted Document Metadata Ledger</h3>

            <div className="space-y-4">
              {extractions.map(ext => (
                <div key={ext.documentId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-600">{ext.documentId}</span>
                      <h4 className="text-xs font-bold text-slate-900">{ext.fileName}</h4>
                    </div>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                      OCR Confidence: {(ext.confidenceScore * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                    {ext.extractedFields.map((f, i) => (
                      <div key={i}>
                        <span className="text-slate-500 block text-[10px]">{f.fieldName}</span>
                        <strong className="text-slate-900 text-xs">{f.fieldValue}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SMART RECOMMENDATIONS */}
      {activeTab === 'insights' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Cross-Module AI Recommendations Engine</h2>
            <p className="text-xs text-slate-500">Automated optimizations across Finance, Inventory, CRM, and HR.</p>
          </div>

          <div className="space-y-4">
            {recommendations.map(r => (
              <div key={r.recommendationId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded">
                      {r.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{r.title}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-extrabold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                    Est. Financial Impact: {r.potentialImpactValue}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{r.description}</p>
                <div className="text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                  Action Step: {r.actionableStep}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MODEL REGISTRY */}
      {activeTab === 'models' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">AI Model Registry & Performance Metrics</h2>
            <p className="text-xs text-slate-500">Operational status, latency benchmarks, and accuracy scores for all active models.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map(m => (
              <div key={m.modelId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600">{m.modelId}</span>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                    {m.isOperational ? 'OPERATIONAL' : 'OFFLINE'}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900">{m.name}</h3>
                <p className="text-xs text-slate-600">{m.description}</p>

                <div className="grid grid-cols-3 gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <div>Provider: <strong className="block text-slate-900">{m.provider}</strong></div>
                  <div>Latency: <strong className="block text-purple-600">{m.latencyMs}ms</strong></div>
                  <div>Accuracy: <strong className="block text-emerald-600">{m.accuracyRating}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: DEVELOPER DOCS */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Vertex AI Engine (VAIE) Developer Integration Guide</h2>
            <p className="text-xs text-slate-500">How to call AI copilot, forecaster, and anomaly detector programmatically.</p>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-lg space-y-2 font-mono text-xs">
            <div className="text-purple-400 font-bold">// Programmatic AI Copilot Execution</div>
            <div>import &#123; aiManager &#125; from './core/vpe/ai';</div>
            <br />
            <div>const response = aiManager.sendCopilotQuery('Project Q3 revenue forecast');</div>
            <div>console.log('Gemini 2.5 Copilot Response:', response.text);</div>
          </div>
        </div>
      )}
    </div>
  );
};
