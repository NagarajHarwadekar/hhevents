import React, { useState, useEffect } from 'react';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  Clock,
  ArrowRight,
  RefreshCw,
  Sliders,
  CalendarDays,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookingStatusBadge } from '../../components/ui/Badge';
import {
  getBookings,
  checkSlotAvailability,
  approveBooking,
  rejectBooking,
} from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { BookingRequest } from '../../types';

interface AdminDashboardPageProps {
  navigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    setIsLoading(true);
    try {
      const all = getBookings();
      setBookings(all);
    } catch (e: any) {
      showToast(e?.message || 'Error loading dashboard statistics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const pendingBookings = bookings.filter(
    (b) => (b.status || '').toUpperCase() === 'PENDING'
  );
  const approvedBookings = bookings.filter(
    (b) => (b.status || '').toUpperCase() === 'APPROVED' || (b.status || '').toUpperCase() === 'CONFIRMED'
  );
  const rejectedBookings = bookings.filter(
    (b) => (b.status || '').toUpperCase() === 'REJECTED'
  );
  const upcomingBookings = approvedBookings.filter((b) => b.date >= today);

  // Hall 1 & Hall 2 Today's Real-time Status
  const hall1TodayDay = checkSlotAvailability('hall_1', today, 'day');
  const hall1TodayEve = checkSlotAvailability('hall_1', today, 'evening');
  const hall2TodayDay = checkSlotAvailability('hall_2', today, 'day');
  const hall2TodayEve = checkSlotAvailability('hall_2', today, 'evening');

  return (
    <AdminLayout
      currentPath="/admin/dashboard"
      navigate={navigate}
      title="Management Dashboard"
      subtitle="H H Events & Conventions reservation control center and hall operations"
      actionButton={
        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/admin/bookings')}
            variant="gold"
            size="sm"
            leftIcon={<Inbox className="w-4 h-4" />}
          >
            Manage Bookings ({pendingBookings.length})
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Requirement 19: Dashboard Cards */}
        {/* Row 1: The 4 Core Booking Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Pending Requests */}
          <Card className="p-5 flex items-center justify-between border-slate-200 hover:border-amber-400 transition-colors shadow-2xs">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Requests
              </span>
              <h3 className="text-3xl font-extrabold text-amber-600 mt-1">
                {pendingBookings.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting manager clearance</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </Card>

          {/* 2. Approved Bookings */}
          <Card className="p-5 flex items-center justify-between border-slate-200 hover:border-emerald-400 transition-colors shadow-2xs">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Approved Bookings
              </span>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
                {approvedBookings.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Confirmed on master schedule</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </Card>

          {/* 3. Rejected Bookings */}
          <Card className="p-5 flex items-center justify-between border-slate-200 hover:border-rose-400 transition-colors shadow-2xs">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rejected Bookings
              </span>
              <h3 className="text-3xl font-extrabold text-rose-600 mt-1">
                {rejectedBookings.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Declined or conflicted requests</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          </Card>

          {/* 4. Upcoming Bookings */}
          <Card className="p-5 flex items-center justify-between border-slate-200 hover:border-sky-400 transition-colors shadow-2xs">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Upcoming Bookings
              </span>
              <h3 className="text-3xl font-extrabold text-sky-600 mt-1">
                {upcomingBookings.length}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Scheduled for today &amp; future</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Row 2: Hall 1 Status & Hall 2 Status (Requirement 19) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Hall 1 Status Card */}
          <Card className="p-6 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                  H1
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-serif-heading">
                    Hall 1 Status (Main Hall)
                  </h4>
                  <p className="text-xs text-slate-500">600 Seating • AC &amp; Non-AC Configurable</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">Today: {today}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div
                className={`p-3.5 rounded-xl border ${
                  hall1TodayDay.available
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 block uppercase">
                  Morning (10 AM–3 PM)
                </span>
                <span
                  className={`text-sm font-extrabold mt-1 inline-block ${
                    hall1TodayDay.available ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {hall1TodayDay.available ? 'AVAILABLE' : 'RESERVED'}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  hall1TodayEve.available
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 block uppercase">
                  Evening (6 PM–10 PM)
                </span>
                <span
                  className={`text-sm font-extrabold mt-1 inline-block ${
                    hall1TodayEve.available ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {hall1TodayEve.available ? 'AVAILABLE' : 'RESERVED'}
                </span>
              </div>
            </div>
          </Card>

          {/* Hall 2 Status Card */}
          <Card className="p-6 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                  H2
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-serif-heading">
                    Hall 2 Status (Banquet Hall)
                  </h4>
                  <p className="text-xs text-slate-500">600 Dining • Independent Reservation</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">Today: {today}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div
                className={`p-3.5 rounded-xl border ${
                  hall2TodayDay.available
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 block uppercase">
                  Morning (10 AM–3 PM)
                </span>
                <span
                  className={`text-sm font-extrabold mt-1 inline-block ${
                    hall2TodayDay.available ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {hall2TodayDay.available ? 'AVAILABLE' : 'RESERVED'}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  hall2TodayEve.available
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-rose-50/60 border-rose-200'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-500 block uppercase">
                  Evening (6 PM–10 PM)
                </span>
                <span
                  className={`text-sm font-extrabold mt-1 inline-block ${
                    hall2TodayEve.available ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {hall2TodayEve.available ? 'AVAILABLE' : 'RESERVED'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Priority Pending Queue Table */}
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="p-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-heading">
                Pending Booking Requests Awaiting Action
              </h3>
              <p className="text-xs text-slate-500">
                Customer applications pending manager approval or availability clearance
              </p>
            </div>
            <Button
              onClick={() => navigate('/admin/bookings')}
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All Bookings
            </Button>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              No pending applications in queue. All booking requests have been processed.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Hall</th>
                    <th className="py-3 px-4">Slot</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">AC Option</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingBookings.slice(0, 5).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {b.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {b.customerName || b.applicantName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {b.phone || b.applicantPhone}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {b.hall === 'hall_1' ? 'Hall 1' : b.hall === 'hall_2' ? 'Hall 2' : 'Both Halls'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {b.slot === 'day' ? '10 AM–3 PM' : '6 PM–10 PM'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-900">
                        {b.date}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {b.acOption}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          onClick={() => navigate('/admin/bookings')}
                          variant="gold"
                          size="sm"
                        >
                          Review &amp; Act
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};
