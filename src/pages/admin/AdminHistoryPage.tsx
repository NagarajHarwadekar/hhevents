import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  FileText,
  UserCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fetchAuditLogsAsync } from '../../services/bookingStorage';
import { AuditLogRecord } from '../../types';
import { useToast } from '../../context/ToastContext';

interface AdminHistoryPageProps {
  navigate: (path: string) => void;
}

export const AdminHistoryPage: React.FC<AdminHistoryPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLogsAsync();
      setLogs(data);
    } catch (err: any) {
      showToast(err?.message || 'Failed to fetch audit records from Firestore', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'all') return true;
    return log.action.toLowerCase().includes(filterAction.toLowerCase());
  });

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hhevents_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Audit log export initiated.', 'success');
  };

  return (
    <AdminLayout
      currentPath="/admin/history"
      navigate={navigate}
      title="Audit Trail & System History"
      subtitle="Chronological record of administrative clearances, status transitions, and facility operations"
      actionButton={
        <div className="flex items-center gap-2">
          <Button
            onClick={loadLogs}
            variant="outline"
            size="sm"
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            onClick={handleExportLogs}
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Audit Logs (JSON)
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <div className="flex items-center gap-2 bg-white p-4 rounded-2xl border border-slate-200 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 mr-2 shrink-0">Filter Action:</span>
          {['all', 'created', 'status', 'approved', 'maintenance', 'payment'].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors shrink-0 ${
                filterAction === act
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        {/* Audit Timeline */}
        <Card className="p-6">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading audit records from Cloud Firestore...</span>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
              {filteredLogs.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-xs" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 uppercase font-mono">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        Target: {log.targetId}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">{log.details}</p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    <span>Officer: {log.performedBy}</span>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <p className="text-xs text-slate-400 py-6 italic">No audit records found matching criteria.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};
