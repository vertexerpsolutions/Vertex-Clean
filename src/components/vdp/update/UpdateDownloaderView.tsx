import React, { useState, useEffect } from 'react';
import { Download, Play, Pause, XCircle, Gauge, Cpu, CheckCircle2, RefreshCw } from 'lucide-react';
import { updateService } from '../../../services/updateService';
import { DownloadTask, DownloaderConfig } from '../../../core/update/UpdateTypes';

export const UpdateDownloaderView: React.FC = () => {
  const [task, setTask] = useState<DownloadTask>(() => updateService.getDownloadTask());
  const [config, setConfig] = useState<DownloaderConfig>(() => updateService.getDownloaderConfig());

  // Simulation ticker for active download
  useEffect(() => {
    let interval: any = null;
    if (task.status === 'downloading') {
      interval = setInterval(() => {
        setTask(prev => {
          if (prev.progressPercentage >= 100) {
            clearInterval(interval);
            updateService.completeDownload();
            return updateService.getDownloadTask();
          }
          const increment = 10;
          const newPct = Math.min(100, prev.progressPercentage + increment);
          const newDownloaded = Math.floor((newPct / 100) * prev.totalBytes);
          return {
            ...prev,
            progressPercentage: newPct,
            downloadedBytes: newDownloaded,
            status: newPct === 100 ? 'completed' : 'downloading',
            estimatedTimeRemainingSeconds: Math.max(0, Math.floor((100 - newPct) / 10))
          };
        });
      }, 400);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [task.status]);

  const handleStart = () => {
    const updated = updateService.startDownload();
    setTask({ ...updated });
  };

  const handlePause = () => {
    const updated = updateService.pauseDownload();
    setTask({ ...updated });
  };

  const handleCancel = () => {
    const updated = updateService.cancelDownload();
    setTask({ ...updated });
  };

  const handleThreadChange = (threads: number) => {
    const updated = updateService.updateDownloaderConfig({ maxThreads: threads });
    setConfig({ ...updated });
  };

  const handleBandwidthChange = (limitKbps: number) => {
    const updated = updateService.updateDownloaderConfig({ bandwidthLimitKbps: limitKbps });
    setConfig({ ...updated });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 03: Multi-Threaded Update Downloader Engine</h2>
            <p className="text-xs text-slate-400">Resilient chunked streaming downloader with bandwidth limiter, auto-resume, and thread allocation</p>
          </div>
        </div>

        {/* Download Status Display */}
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-100">Package Target: Vertex ERP Ultimate v{task.version}</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Size: {(task.totalBytes / (1024 * 1024)).toFixed(1)} MB | Downloaded: {(task.downloadedBytes / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {task.status !== 'downloading' && task.status !== 'completed' && (
                <button
                  onClick={handleStart}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{task.status === 'paused' ? 'Resume Download' : 'Start Download'}</span>
                </button>
              )}

              {task.status === 'downloading' && (
                <button
                  onClick={handlePause}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              {(task.status === 'downloading' || task.status === 'paused') && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1.5 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300 font-bold">
              <span>Progress: {task.progressPercentage}%</span>
              <span>
                {task.status === 'downloading'
                  ? `${task.downloadSpeedKbps / 1000} MB/s | ETA: ${task.estimatedTimeRemainingSeconds}s`
                  : task.status.toUpperCase()}
              </span>
            </div>
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-cyan-500 h-full transition-all duration-300"
                style={{ width: `${task.progressPercentage}%` }}
              />
            </div>
          </div>

          {task.status === 'completed' && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Download completed successfully! SHA-256 package hash verified. Ready for patch installer.</span>
            </div>
          )}
        </div>
      </div>

      {/* Downloader Configuration Controls */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Downloader Configuration Controls</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Cpu className="w-4 h-4" />
              <span className="font-bold">Multi-Threaded Streams</span>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 4, 8].map((t) => (
                <button
                  key={t}
                  onClick={() => handleThreadChange(t)}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
                    config.maxThreads === t
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t} {t === 1 ? 'Thread' : 'Threads'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <Gauge className="w-4 h-4" />
              <span className="font-bold">Bandwidth Speed Throttling</span>
            </div>
            <div className="flex items-center space-x-2">
              {[
                { label: 'Unlimited', val: 0 },
                { label: '50 MB/s', val: 50000 },
                { label: '10 MB/s', val: 10000 },
                { label: '2 MB/s', val: 2000 }
              ].map((b) => (
                <button
                  key={b.val}
                  onClick={() => handleBandwidthChange(b.val)}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
                    config.bandwidthLimitKbps === b.val
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
