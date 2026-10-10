import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Building2,
  Check,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { FormInput, FormSelect, FormTextarea } from '../../components/ui/FormFields';
import { useToast } from '../../context/ToastContext';
import {
  fetchMaintenanceAsync,
  createMaintenanceRecordAsync,
  updateMaintenanceStatusAsync
} from '../../services/bookingStorage';
import { MaintenanceRecord } from '../../types';
import { INITIAL_FACILITIES } from '../../services/hallData';

interface AdminMaintenancePageProps {
  navigate: (path: string) => void;
}

export const AdminMaintenancePage: React.FC<AdminMaintenancePageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MaintenanceRecord['category']>('hvac');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
  );
  const [slot, setSlot] = useState<MaintenanceRecord['slot']>('full_day');
  const [selectedFacility, setSelectedFacility] = useState<string>('grand-auditorium');
  const [technicianName, setTechnicianName] = useState('');
  const [technicianPhone, setTechnicianPhone] = useState('');
  const [notes, setNotes] = useState('');

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMaintenanceAsync();
      setMaintenanceRecords(data);
    } catch (err: any) {
      showToast(err?.message || 'Failed to fetch maintenance records from Firestore', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !technicianName) {
      showToast('Please specify task title and technician name.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await createMaintenanceRecordAsync({
        title,
        category,
        scheduledDate,
        startDate: scheduledDate,
        endDate: scheduledDate,
        slot,
        facilityIds: [selectedFacility],
        status: 'scheduled',
        notes,
        technicianName,
        technicianPhone,
      });

      await loadRecords();
      setIsCreateOpen(false);
      setTitle('');
      setNotes('');
      setTechnicianName('');
      setTechnicianPhone('');
      showToast('Facility maintenance window successfully scheduled.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to create maintenance in Firestore', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: MaintenanceRecord['status']) => {
    setIsProcessing(true);
    try {
      await updateMaintenanceStatusAsync(id, newStatus);
      await loadRecords();
      showToast(`Task status updated to ${newStatus.replace('_', ' ')}`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update maintenance status in Firestore', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminLayout
      currentPath="/admin/maintenance"
      navigate={navigate}
      title="Facility Maintenance & Sanitation Hub"
      subtitle="Manage hall facility upkeep, climate control inspections, and dining wing turnover"
      actionButton={
        <div className="flex items-center gap-2">
          <Button
            onClick={loadRecords}
            variant="outline"
            size="sm"
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Schedule Maintenance
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <Card className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Fetching maintenance windows from Cloud Firestore...</p>
          </Card>
        ) : maintenanceRecords.length === 0 ? (
          <Card className="p-12 text-center text-slate-500 space-y-3">
            <Wrench className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-700">No Scheduled Maintenance Records</h3>
            <p className="text-xs text-slate-400">All facility wings are operating at prime specification.</p>
            <Button variant="gold" size="sm" onClick={() => setIsCreateOpen(true)}>
              Schedule New Maintenance Window
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maintenanceRecords.map((rec) => {
              const isDone = rec.status === 'completed';
              const isInProgress = rec.status === 'in_progress';

              return (
                <Card key={rec.id} className="p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {rec.category}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rec.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{rec.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{rec.notes || 'Routine preventative audit'}</p>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{rec.scheduledDate} {rec.slot ? `(${rec.slot.replace('_', ' ')})` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{rec.technicianName} ({rec.technicianPhone})</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">{rec.id}</span>
                    <div className="flex items-center gap-2">
                      {rec.status === 'scheduled' && (
                        <button
                          onClick={() => handleStatusUpdate(rec.id, 'in_progress')}
                          disabled={isProcessing}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                        >
                          Mark In-Progress
                        </button>
                      )}
                      {rec.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusUpdate(rec.id, 'completed')}
                          disabled={isProcessing}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          Complete Task
                        </button>
                      )}
                      {isDone && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Certified
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Schedule Dialog */}
        {isCreateOpen && (
          <Dialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            title="Schedule Facility Maintenance Window"
            maxWidth="md"
          >
            <form onSubmit={handleCreateRecord} className="space-y-4">
              <FormInput
                id="mnt-title"
                label="Task Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Semi-Annual HVAC Compressor Servicing"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  id="mnt-category"
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  options={[
                    { value: 'hvac', label: 'HVAC & Climate Control' },
                    { value: 'electrical', label: 'Electrical & Lighting' },
                    { value: 'plumbing', label: 'Plumbing & Sanitation' },
                    { value: 'acoustics', label: 'Audio & Acoustics' },
                    { value: 'cleaning', label: 'Deep Sanitation Turnover' },
                    { value: 'civil', label: 'Civil & Painting' },
                  ]}
                />
                <FormSelect
                  id="mnt-facility"
                  label="Affected Wing"
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  options={INITIAL_FACILITIES.map((f) => ({ value: f.id, label: f.name }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  id="mnt-date"
                  label="Scheduled Date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
                <FormSelect
                  id="mnt-slot"
                  label="Time Slot Blackout"
                  value={slot}
                  onChange={(e) => setSlot(e.target.value as any)}
                  options={[
                    { value: 'morning', label: 'Morning Slot Only' },
                    { value: 'evening', label: 'Evening Slot Only' },
                    { value: 'full_day', label: 'Full Day Blackout' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  id="mnt-tech-name"
                  label="Technician / Agency"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  placeholder="e.g. Daikin Authorized Services"
                  required
                />
                <FormInput
                  id="mnt-tech-phone"
                  label="Technician Phone"
                  value={technicianPhone}
                  onChange={(e) => setTechnicianPhone(e.target.value)}
                  placeholder="+91 98451 22340"
                  required
                />
              </div>

              <FormTextarea
                id="mnt-notes"
                label="Scope of Work & Protocol"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include safety precautions, noise concerns, and testing steps..."
                rows={3}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button variant="gold" size="sm" type="submit" isLoading={isProcessing}>
                  Register Maintenance Block
                </Button>
              </div>
            </form>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};
