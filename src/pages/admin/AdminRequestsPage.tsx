import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertCircle,
  Eye,
  Building2,
  Calendar,
  Check,
  X,
  CreditCard,
  RefreshCw,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { BookingStatusBadge, TimeSlotBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  fetchBookingsAsync,
  updateBookingStatusAsync,
  updatePaymentStatusAsync,
  checkSlotAvailability
} from '../../services/bookingStorage';
import { BookingRequest, BookingStatus } from '../../types';
import { INITIAL_FACILITIES } from '../../services/hallData';

interface AdminRequestsPageProps {
  navigate: (path: string) => void;
}

export const AdminRequestsPage: React.FC<AdminRequestsPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);

  // Rejection dialog state
  const [rejectingBooking, setRejectingBooking] = useState<BookingRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBookingsAsync();
      setBookings(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleStatusChange = async (
    id: string,
    newStatus: BookingStatus,
    remarks?: string
  ) => {
    if (newStatus === 'confirmed' || (newStatus as any) === 'approved' || (newStatus as any) === 'APPROVED') {
      const b = bookings.find((item) => item.id === id);
      if (b) {
        const conflict = checkSlotAvailability(b.hall || 'hall_1', b.date || b.eventDate || '', (b.slot || b.timeSlot) as any, b.id);
        if (!conflict.available) {
          showToast(conflict.conflictReason || conflict.reason || 'Conflict detected for this slot.', 'error', 'Conflict Block');
          return;
        }
      }
    }

    setIsProcessing(true);
    try {
      await updateBookingStatusAsync(id, newStatus, remarks, user?.email || 'admin@hhevents.in');
      showToast(`Application ${id} status updated to ${newStatus}.`, 'success');
      await loadBookings();
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({
          ...selectedBooking,
          status: newStatus,
          adminRemarks: remarks || selectedBooking.adminRemarks,
        });
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update booking status in database', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentToggle = async (id: string, current: BookingRequest['advancePaymentStatus']) => {
    const next: BookingRequest['advancePaymentStatus'] =
      current === 'unpaid' ? 'advance_paid' : current === 'advance_paid' ? 'fully_paid' : 'unpaid';

    setIsProcessing(true);
    try {
      await updatePaymentStatusAsync(id, next);
      showToast(`Payment status updated to ${next.replace('_', ' ')}`, 'info');
      await loadBookings();
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, advancePaymentStatus: next });
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update payment status', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingBooking) return;
    setIsProcessing(true);
    try {
      await updateBookingStatusAsync(
        rejectingBooking.id,
        'rejected',
        rejectionReason || 'Scheduling constraint',
        user?.email || 'admin@hhevents.in'
      );
      showToast(`Application ${rejectingBooking.id} rejected.`, 'info');
      await loadBookings();
      setRejectingBooking(null);
      setRejectionReason('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to reject booking in database', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      b.id.toLowerCase().includes(searchLower) ||
      (b.customerName || b.applicantName || '').toLowerCase().includes(searchLower) ||
      (b.additionalInfo || b.eventTitle || '').toLowerCase().includes(searchLower) ||
      (b.phone || b.applicantPhone || '').includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all' ||
      b.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout
      currentPath="/admin/requests"
      navigate={navigate}
      title="Booking Applications & Queue"
      subtitle="Review, approve, confirm, and manage reservations for H H Events & Conventions"
      actionButton={
        <Button
          variant="outline"
          size="sm"
          onClick={loadBookings}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Data
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search reference, applicant, event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['all', 'pending', 'approved', 'confirmed', 'completed', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error / Content */}
        {isLoading ? (
          <Card className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Fetching booking applications from Cloud Firestore...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center text-rose-700 bg-rose-50/50 border-rose-200 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
            <p className="text-sm font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={loadBookings}>
              Retry Connection
            </Button>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            title="No Matching Applications"
            description={
              searchQuery || statusFilter !== 'all'
                ? 'No reservation applications match your current filters.'
                : 'No reservation requests have been submitted yet.'
            }
          />
        ) : (
          /* Requests Table */
          <Card className="overflow-hidden border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Ref ID</th>
                    <th className="py-3 px-4">Applicant Particulars</th>
                    <th className="py-3 px-4">Event & Type</th>
                    <th className="py-3 px-4">Scheduled Slot</th>
                    <th className="py-3 px-4">Estimate</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {b.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{b.applicantName}</span>
                        <span className="text-slate-500">{b.phone || b.applicantPhone}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                          {b.additionalInfo || b.eventTitle || 'Event'}
                        </span>
                        <span className="text-slate-400 capitalize">{b.eventType ? String(b.eventType).replace('_', ' ') : b.hall}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{b.date || b.eventDate}</span>
                        <TimeSlotBadge slot={(b.slot || b.timeSlot || 'day') as any} />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{(b.estimatedAmount || b.totalEstimate || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handlePaymentToggle(b.id, b.advancePaymentStatus || 'unpaid')}
                          disabled={isProcessing}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border transition-opacity ${
                            isProcessing ? 'opacity-50' : 'hover:opacity-80'
                          } ${
                            b.advancePaymentStatus === 'fully_paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : b.advancePaymentStatus === 'advance_paid'
                              ? 'bg-sky-50 text-sky-700 border-sky-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                          title="Click to toggle payment state"
                        >
                          {(b.advancePaymentStatus || 'unpaid').replace('_', ' ')}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <BookingStatusBadge status={b.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(b.id, 'approved', 'Approved by administrative desk')}
                              disabled={isProcessing}
                              className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50"
                              title="Approve Application"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectingBooking(b)}
                              disabled={isProcessing}
                              className="p-1.5 rounded text-rose-600 hover:bg-rose-50"
                              title="Reject Application"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {b.status === 'approved' && (
                          <Button
                            onClick={() => handleStatusChange(b.id, 'confirmed', 'Advance received. Reservation confirmed.')}
                            variant="gold"
                            size="sm"
                            isLoading={isProcessing}
                            className="text-[11px] py-1 px-2.5 h-auto"
                          >
                            Confirm
                          </Button>
                        )}

                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(b.id, 'completed', 'Event successfully hosted')}
                            disabled={isProcessing}
                            className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 hover:underline px-1"
                          >
                            Mark Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Selected Booking Detail Dialog */}
        {selectedBooking && (
          <Dialog
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            title={`Application Dossier — ${selectedBooking.id}`}
            maxWidth="lg"
          >
            <div className="space-y-6 text-xs text-slate-700">
              {/* Header block */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                    {selectedBooking.additionalInfo || selectedBooking.eventTitle || 'Event'}
                  </h3>
                  <span className="text-slate-500 capitalize">{selectedBooking.eventType ? String(selectedBooking.eventType).replace('_', ' ') : selectedBooking.hall}</span>
                </div>
                <BookingStatusBadge status={selectedBooking.status} />
              </div>

              {/* Grid information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
                    Applicant Information
                  </h4>
                  <p className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{selectedBooking.customerName || selectedBooking.applicantName}</strong>
                    {selectedBooking.organizationName && (
                      <span className="text-slate-400">({selectedBooking.organizationName})</span>
                    )}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedBooking.phone || selectedBooking.applicantPhone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedBooking.email || selectedBooking.applicantEmail}</span>
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
                    Reservation Details
                  </h4>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Date: <strong>{selectedBooking.date || selectedBooking.eventDate}</strong></span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <TimeSlotBadge slot={(selectedBooking.slot || selectedBooking.timeSlot || 'day') as any} />
                  </p>
                  <p>
                    Expected Attendees: <strong>{selectedBooking.expectedAttendees || selectedBooking.estimatedAttendees || 0} guests</strong>
                  </p>
                </div>
              </div>

              {/* Facilities and Addons */}
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
                  Allocated Wings &amp; Add-On Services
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                    {selectedBooking.hall === 'hall_1' ? 'Hall 1 (Single Hall)' : selectedBooking.hall === 'hall_2' ? 'Hall 2 (Single Hall)' : 'Both Halls (Full Hall)'} ({selectedBooking.acOption?.toUpperCase() || 'AC'})
                  </span>
                  {selectedBooking.facilityIds?.map((fid) => {
                    const fac = INITIAL_FACILITIES.find((f) => f.id === fid);
                    return (
                      <span key={fid} className="px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        {fac?.name || fid}
                      </span>
                    );
                  })}
                  {selectedBooking.addionalServices?.map((aid) => (
                    <span key={aid} className="px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      + {aid}
                    </span>
                  ))}
                </div>
              </div>

              {/* Special Requirements */}
              {selectedBooking.additionalInfo && (
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-1">Event Notes:</span>
                  <p>{selectedBooking.additionalInfo}</p>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Grand Total Estimate:</span>
                  <span className="font-mono text-base text-amber-600">
                    ₹{(selectedBooking.estimatedAmount || selectedBooking.totalEstimate || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Advance Payment Status:</span>
                  <span className="capitalize font-semibold">{(selectedBooking.advancePaymentStatus || 'unpaid').replace('_', ' ')}</span>
                </div>
                {selectedBooking.adminRemarks && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600">
                    <span className="font-semibold">Officer Remarks:</span> {selectedBooking.adminRemarks}
                  </div>
                )}
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
                  Close
                </Button>
                {selectedBooking.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        setRejectingBooking(selectedBooking);
                        setSelectedBooking(null);
                      }}
                    >
                      Reject Application
                    </Button>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => {
                        handleStatusChange(selectedBooking.id, 'approved', 'Approved by administrative review');
                        setSelectedBooking(null);
                      }}
                    >
                      Approve Application
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Dialog>
        )}

        {/* Rejection Remarks Dialog */}
        {rejectingBooking && (
          <Dialog
            isOpen={!!rejectingBooking}
            onClose={() => setRejectingBooking(null)}
            title="Reject Booking Application"
            maxWidth="md"
          >
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Please provide the reason for declining application <strong>{rejectingBooking.id}</strong>.
                This reason will be recorded for institutional transparency and audit logs.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Facility under scheduled electrical maintenance; conflicting high-priority municipal event..."
                rows={3}
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setRejectingBooking(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={handleConfirmReject}
                  isLoading={isProcessing}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};
