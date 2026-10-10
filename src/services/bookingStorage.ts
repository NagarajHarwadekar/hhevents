import {
  BookingRequest,
  HallId,
  SlotType,
  ACOption,
  BookingStatus,
  AuditLogRecord,
  MaintenanceRecord,
} from '../types';
import {
  getBookings,
  saveBooking,
  updateBooking,
  deleteBooking,
  checkSlotAvailability,
  getBookingByIdAndPhone,
  generateBookingId,
  getAuditLogs,
  logAuditAction,
} from './storageService';
import { INITIAL_MAINTENANCE_SCHEDULE, VENUE_INFO } from './hallData';

export {
  getBookings,
  saveBooking,
  updateBooking,
  deleteBooking,
  checkSlotAvailability,
  getBookingByIdAndPhone,
  generateBookingId,
};

export function trackBooking(query: string): BookingRequest | null {
  const clean = (query || '').trim().toLowerCase();
  if (!clean) return null;
  const cleanPhone = clean.replace(/\D/g, '');
  const all = getBookings();
  return (
    all.find((b) => {
      const idMatch = (b.id || '').toLowerCase() === clean;
      const phoneDigits = (b.phone || b.applicantPhone || '').replace(/\D/g, '');
      const phoneMatch = cleanPhone.length >= 6 && (phoneDigits.includes(cleanPhone) || cleanPhone.includes(phoneDigits));
      const emailMatch = (b.email || b.applicantEmail || '').toLowerCase() === clean;
      return idMatch || phoneMatch || emailMatch;
    }) || null
  );
}

export function getStoredBookings(): BookingRequest[] {
  return getBookings();
}

export function saveStoredBookings(bookings: BookingRequest[]): void {
  try {
    localStorage.setItem('hh_events_bookings_v4', JSON.stringify(bookings));
  } catch (e) {}
}

export function getStoredAuditLogs(): AuditLogRecord[] {
  return getAuditLogs();
}

export function saveAuditLog(record: Omit<AuditLogRecord, 'id' | 'timestamp'>): void {
  logAuditAction(record.action, record.targetId, record.details);
}

export function getStoredMaintenance(): MaintenanceRecord[] {
  try {
    const raw = localStorage.getItem('hh_events_maintenance_v4');
    if (!raw) {
      localStorage.setItem('hh_events_maintenance_v4', JSON.stringify(INITIAL_MAINTENANCE_SCHEDULE));
      return INITIAL_MAINTENANCE_SCHEDULE;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MAINTENANCE_SCHEDULE;
  }
}

export function saveStoredMaintenance(records: MaintenanceRecord[]): void {
  try {
    localStorage.setItem('hh_events_maintenance_v4', JSON.stringify(records));
  } catch (e) {}
}

export interface BookingCreationInput {
  customerName: string;
  phone: string;
  email: string;
  hall: HallId;
  acOption: ACOption;
  date: string;
  slot: SlotType;
  expectedAttendees?: number;
  additionalInfo?: string;
  estimatedAmount?: number;
}

export function createBooking(input: BookingCreationInput): {
  success: boolean;
  booking?: BookingRequest;
  error?: string;
} {
  const avail = checkSlotAvailability(input.hall, input.date, input.slot);
  if (!avail.available) {
    return {
      success: false,
      error: avail.conflictReason || 'The selected hall and slot is already reserved for this date.',
    };
  }

  const newId = generateBookingId();
  const now = new Date().toISOString();

  const newBooking: BookingRequest = {
    id: newId,
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    hall: input.hall,
    acOption: input.acOption,
    date: input.date,
    slot: input.slot,
    expectedAttendees: input.expectedAttendees,
    additionalInfo: input.additionalInfo?.trim(),
    status: 'PENDING',
    estimatedAmount: input.estimatedAmount,
    submittedAt: now,
    updatedAt: now,
    // Compatibility fields
    applicantName: input.customerName.trim(),
    applicantPhone: input.phone.trim(),
    applicantEmail: input.email.trim(),
    eventDate: input.date,
    timeSlot: input.slot,
    advancePaymentStatus: 'unpaid',
    adminRemarks: 'Pending administrative review and manager confirmation.',
  };

  saveBooking(newBooking);
  logAuditAction('Booking Submitted', newId, `Customer ${input.customerName} submitted reservation for ${input.hall} on ${input.date}`);

  return { success: true, booking: newBooking };
}

export function approveBooking(
  id: string,
  userEmail: string = 'manager@hhevents.in'
): { success: boolean; error?: string } {
  const current = getBookings();
  const booking = current.find((b) => b.id === id);
  if (!booking) return { success: false, error: 'Booking reference not found' };

  // Perform a final real-time conflict check before approval
  const bookings = getBookings();
  const hasConflict = bookings.some((b) => {
    if (b.id === id) return false;
    const st = (b.status || '').toUpperCase();
    if (st !== 'APPROVED' && st !== 'CONFIRMED') return false;
    if (b.date !== booking.date || b.slot !== booking.slot) return false;

    if (booking.hall === 'both') return true;
    return b.hall === booking.hall || b.hall === 'both';
  });

  if (hasConflict) {
    return {
      success: false,
      error: `Cannot approve: Conflict detected for ${booking.hall} on ${booking.date} (${booking.slot}). Another approved booking already exists.`,
    };
  }

  updateBooking(id, {
    status: 'APPROVED',
    adminRemarks: 'Booking approved by management. Ready for token advance payment and agreement execution.',
  });

  logAuditAction('Booking Approved', id, `Booking approved by ${userEmail}`);
  return { success: true };
}

export function rejectBooking(
  id: string,
  reason: string,
  userEmail: string = 'manager@hhevents.in'
): { success: boolean; error?: string } {
  const current = getBookings();
  const booking = current.find((b) => b.id === id);
  if (!booking) return { success: false, error: 'Booking reference not found' };

  updateBooking(id, {
    status: 'REJECTED',
    rejectionReason: reason || 'Hall unavailable on requested date/slot.',
    adminRemarks: reason || 'Application declined by management.',
  });

  logAuditAction('Booking Rejected', id, `Booking rejected: ${reason}`);
  return { success: true };
}

export function cancelBooking(
  id: string,
  reason?: string,
  userEmail: string = 'manager@hhevents.in'
): { success: boolean; error?: string } {
  const current = getBookings();
  const booking = current.find((b) => b.id === id);
  if (!booking) return { success: false, error: 'Booking reference not found' };

  updateBooking(id, {
    status: 'CANCELLED',
    adminRemarks: reason || 'Booking cancelled at request of customer/manager.',
  });

  logAuditAction('Booking Cancelled', id, `Booking cancelled: ${reason || 'N/A'}`);
  return { success: true };
}

// Async bridge functions for component compatibility
export async function fetchBookingsAsync(): Promise<BookingRequest[]> {
  return getBookings();
}

export async function fetchMaintenanceAsync(): Promise<MaintenanceRecord[]> {
  return getStoredMaintenance();
}

export async function updateBookingStatusAsync(
  id: string,
  newStatus: BookingStatus | string,
  remarks?: string,
  userEmail: string = 'manager@hhevents.in'
): Promise<void> {
  const upper = (newStatus || '').toUpperCase();
  if (upper === 'APPROVED' || upper === 'CONFIRMED') {
    const res = approveBooking(id, userEmail);
    if (!res.success) throw new Error(res.error || 'Failed to approve booking');
  } else if (upper === 'REJECTED') {
    const res = rejectBooking(id, remarks || 'Not available on requested date', userEmail);
    if (!res.success) throw new Error(res.error || 'Failed to reject booking');
  } else if (upper === 'CANCELLED') {
    const res = cancelBooking(id, remarks, userEmail);
    if (!res.success) throw new Error(res.error || 'Failed to cancel booking');
  } else {
    updateBooking(id, {
      status: newStatus as BookingStatus,
      adminRemarks: remarks,
    });
  }
}

export async function updatePaymentStatusAsync(
  id: string,
  paymentStatus: 'unpaid' | 'paid' | 'waived' | 'advance_paid' | 'fully_paid' | string
): Promise<void> {
  updateBooking(id, { advancePaymentStatus: paymentStatus as any });
}

export async function createBookingRequestAsync(payload: any): Promise<BookingRequest> {
  const result = createBooking({
    customerName: payload.customerName || payload.applicantName || 'Valued Guest',
    phone: payload.phone || payload.applicantPhone || '',
    email: payload.email || payload.applicantEmail || '',
    hall: payload.hall || 'hall_1',
    acOption: payload.acOption || 'ac',
    date: payload.date || payload.eventDate || new Date().toISOString().split('T')[0],
    slot: payload.slot || (payload.timeSlot === 'evening' ? 'evening' : 'day'),
    expectedAttendees: payload.expectedAttendees || payload.estimatedAttendees,
    additionalInfo: payload.additionalInfo || payload.specialRequirements,
    estimatedAmount: payload.totalEstimate || payload.estimatedAmount || 30000,
  });

  if (!result.success || !result.booking) {
    throw new Error(result.error || 'Conflict detected or unable to process reservation');
  }
  return result.booking;
}

export const createBookingRequest = createBooking;

export async function fetchAuditLogsAsync(): Promise<AuditLogRecord[]> {
  return getAuditLogs();
}

export async function createMaintenanceRecordAsync(payload: Omit<MaintenanceRecord, 'id'>): Promise<MaintenanceRecord> {
  const current = getStoredMaintenance();
  const newRec: MaintenanceRecord = {
    ...payload,
    id: `MNT-${Date.now()}`,
  };
  current.unshift(newRec);
  saveStoredMaintenance(current);
  return newRec;
}

export async function updateMaintenanceStatusAsync(
  id: string,
  status: MaintenanceRecord['status']
): Promise<void> {
  const current = getStoredMaintenance();
  const idx = current.findIndex((m) => m.id === id);
  if (idx !== -1) {
    current[idx].status = status;
    saveStoredMaintenance(current);
  }
}
