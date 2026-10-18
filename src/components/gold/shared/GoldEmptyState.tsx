import React from 'react';
import { Inbox, RefreshCw, AlertTriangle } from 'lucide-react';

interface StateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export const GoldEmptyState: React.FC<StateProps> = ({
  title = 'No Data Available',
  message = 'There are no records matching your current request or filters.',
  action
}) => {
  return (
    <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <Inbox className="w-10 h-10 text-slate-500 mx-auto" />
      <h4 className="text-sm font-bold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-md mx-auto">{message}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export const GoldLoadingState: React.FC<StateProps> = ({
  title = 'Loading Gold Engine',
  message = 'Processing request and syncing encrypted platform state...'
}) => {
  return (
    <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
      <h4 className="text-sm font-bold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400">{message}</p>
    </div>
  );
};

export const GoldErrorState: React.FC<StateProps> = ({
  title = 'Platform Exception',
  message = 'An unexpected condition was encountered during operation execution.',
  action
}) => {
  return (
    <div className="p-8 text-center rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
      <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
      <h4 className="text-sm font-bold text-rose-300">{title}</h4>
      <p className="text-xs text-rose-200/80 max-w-md mx-auto">{message}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
