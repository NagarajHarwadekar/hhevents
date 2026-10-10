import {
  BookingRequest,
  HallId,
  SlotType,
  ACOption,
  BookingStatus,
  AvailabilityOverride,
  ManagerSession,
  AuditLogRecord,
} from '../types';
import { MANAGER_CREDENTIALS, validateCredentials } from '../config/managerCredentials';
import { INITIAL_BOOKINGS, INITIAL_AUDIT_LOGS, VENUE_INFO } from './hallData';
import { isSlotAvailable } from './availabilityManager';

const BOOKINGS_KEY = 'hh_events_bookings_v4';
const AVAILABILITY_OVERRIDES_KEY = 'hh_events_availability_overrides_v4';
const MANAGER_SESSION_KEY = 'hh_events_manager_session_v4';
const AUDIT_LOGS_KEY = 'hh_events_audit_logs_v4';

// ==========================================
// 1. BOOKINGS STORAGE
// ==========================================

export function getBookings(): BookingRequest[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Ensure no legacy fake/mock bookings with HH-2026-10x pollute the store
    const realBookings = parsed.filter(
      (b) => !b.id || !b.id.startsWith('HH-2026-10')
    );
    return realBookings;
  } catch (e) {
    console.error('Failed to parse bookings from localStorage:', e);
    return [];
  }
}

export function saveBooking(booking: BookingRequest): BookingRequest {
  const current = getBookings();
  // Ensure newest at the top
  const updated = [booking, ...current.filter((b) => b.id !== booking.id)];
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save booking to localStorage:', e);
  }
  return booking;
}

export function updateBooking(id: string, updates: Partial<BookingRequest>): boolean {
  const current = getBookings();
  const index = current.findIndex((b) => b.id === id);
  if (index === -1) return false;

  const updatedBooking: BookingRequest = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedBooking;
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(current));
    return true;
  } catch (e) {
    console.error('Failed to update booking in localStorage:', e);
    return false;
  }
}

export function deleteBooking(id: string): boolean {
  const current = getBookings();
  const filtered = current.filter((b) => b.id !== id);
  if (filtered.length === current.length) return false;
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Verification for /track-booking: requires matching Booking ID AND Customer Mobile Phone
 */
export function getBookingByIdAndPhone(id: string, rawPhone: string): BookingRequest | null {
  const cleanId = (id || '').trim().toUpperCase();
  const cleanPhone = (rawPhone || '').replace(/\D/g, ''); // strip spaces, hyphens

  if (!cleanId || !cleanPhone) return null;

  const bookings = getBookings();
  const found = bookings.find((b) => {
    const bId = (b.id || '').toUpperCase();
    const bPhone = (b.phone || b.applicantPhone || '').replace(/\D/g, '');
    return bId === cleanId && (bPhone.endsWith(cleanPhone) || cleanPhone.endsWith(bPhone));
  });

  return found || null;
}

export function generateBookingId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `CH-2026-${randomNum}`;
}

// ==========================================
// 2. AVAILABILITY & CONFLICT LOGIC
// ==========================================

export function getAvailabilityOverrides(): AvailabilityOverride[] {
  try {
    const raw = localStorage.getItem(AVAILABILITY_OVERRIDES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveAvailabilityOverride(
  override: Omit<AvailabilityOverride, 'id' | 'updatedAt'>
): AvailabilityOverride {
  const list = getAvailabilityOverrides();
  const newOverride: AvailabilityOverride = {
    ...override,
    id: `OVR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    updatedAt: new Date().toISOString(),
  };

  // Remove existing identical date/hall/slot override if exists
  const filtered = list.filter(
    (item) => !(item.date === override.date && item.hall === override.hall && item.slot === override.slot)
  );
  filtered.push(newOverride);

  try {
    localStorage.setItem(AVAILABILITY_OVERRIDES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save availability override:', e);
  }
  return newOverride;
}

export function removeAvailabilityOverride(id: string): void {
  const list = getAvailabilityOverrides();
  const filtered = list.filter((i) => i.id !== id);
  try {
    localStorage.setItem(AVAILABILITY_OVERRIDES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to remove availability override:', e);
  }
}

/**
 * Independent Booking Conflict Logic (Requirement 8 & 17)
 * A booking conflicts ONLY when:
 * - Same Date
 * - Same Hall (or 'both' requested and either hall occupied)
 * - Same Time Slot (10 AM - 3 PM or 6 PM - 10 PM)
 * - Existing booking is APPROVED / CONFIRMED
 * Hall 1 and Hall 2 are completely independent resources!
 */
export function checkSlotAvailability(
  hall: HallId,
  date: string,
  slot: SlotType,
  ignoreBookingId?: string
): { available: boolean; conflictReason?: string; booking?: BookingRequest; reason?: string } {
  // 1. Manager-Controlled Availability: Authoritative source of truth
  const managerOpen = isSlotAvailable(hall, date, slot);
  if (!managerOpen) {
    const hallName = hall === 'hall_1' ? 'Hall 1' : hall === 'hall_2' ? 'Hall 2' : 'Combined Hall';
    const slotName = slot === 'day' ? 'Day Session (10:00 AM – 3:00 PM)' : 'Evening Session (6:00 PM – 10:00 PM)';
    const msg = `${hallName} is marked Unavailable for ${slotName} on ${date}.`;
    return {
      available: false,
      conflictReason: msg,
      reason: msg,
    };
  }

  // 2. Check for existing approved customer reservations
  const bookings = getBookings();
  const activeBookings = bookings.filter((b) => {
    if (ignoreBookingId && b.id === ignoreBookingId) return false;
    const statusUpper = (b.status || '').toUpperCase();
    return statusUpper === 'APPROVED' || statusUpper === 'CONFIRMED';
  });

  for (const b of activeBookings) {
    if (b.date !== date) continue;
    if (b.slot !== slot) continue;

    if (hall === 'both') {
      const msg = `Full Campus conflict: ${
        b.hall === 'hall_1' ? 'Hall 1' : b.hall === 'hall_2' ? 'Hall 2' : 'Full Campus'
      } is already reserved for this session on ${date}.`;
      return {
        available: false,
        conflictReason: msg,
        reason: msg,
        booking: b,
      };
    }

    if (b.hall === hall || b.hall === 'both') {
      const msg = `${
        hall === 'hall_1' ? 'Hall 1' : 'Hall 2'
      } is already reserved for this session on ${date}.`;
      return {
        available: false,
        conflictReason: msg,
        reason: msg,
        booking: b,
      };
    }
  }

  return { available: true };
}

export function approveBooking(id: string): { success: boolean; error?: string } {
  const current = getBookings();
  const booking = current.find((b) => b.id === id);
  if (!booking) return { success: false, error: 'Booking not found' };

  // Final frontend conflict check against other approved bookings
  const avail = checkSlotAvailability(booking.hall, booking.date, booking.slot, booking.id);
  if (!avail.available) {
    return {
      success: false,
      error: avail.conflictReason || 'Conflict detected: this hall slot is already approved for another party.',
    };
  }

  const ok = updateBooking(id, {
    status: 'APPROVED',
    rejectionReason: undefined,
  });

  if (ok) {
    logAuditAction('APPROVE_BOOKING', id, `Booking ${id} approved for ${booking.hall} on ${booking.date} (${booking.slot})`);
    return { success: true };
  }
  return { success: false, error: 'Failed to update booking status in storage' };
}

export function rejectBooking(id: string, reason?: string): { success: boolean; error?: string } {
  const ok = updateBooking(id, {
    status: 'REJECTED',
    rejectionReason: reason?.trim() || 'Declined by venue management.',
  });

  if (ok) {
    logAuditAction('REJECT_BOOKING', id, `Booking ${id} rejected. Reason: ${reason || 'N/A'}`);
    return { success: true };
  }
  return { success: false, error: 'Failed to update booking status in storage' };
}

// ==========================================
// 3. MANAGER AUTHENTICATION & SESSION
// ==========================================

export function validateManagerCredentials(email: string, phone: string, pass: string): boolean {
  return validateCredentials(email, phone, pass);
}

export function getSession(): ManagerSession | null {
  try {
    const raw =
      (typeof localStorage !== 'undefined' ? localStorage.getItem(MANAGER_SESSION_KEY) : null) ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(MANAGER_SESSION_KEY) : null);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setSession(session: ManagerSession): void {
  try {
    const serialized = JSON.stringify(session);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MANAGER_SESSION_KEY, serialized);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(MANAGER_SESSION_KEY, serialized);
    }
  } catch (e) {
    console.error('Failed to set manager session:', e);
  }
}

export function clearSession(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(MANAGER_SESSION_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(MANAGER_SESSION_KEY);
    }
  } catch (e) {
    console.error('Failed to clear manager session:', e);
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

// ==========================================
// 4. AUDIT LOGS (LOCAL)
// ==========================================

export function getAuditLogs(): AuditLogRecord[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_AUDIT_LOGS;
  }
}

export function logAuditAction(action: string, targetId: string, details: string): void {
  const session = getSession();
  const logs = getAuditLogs();
  const newLog: AuditLogRecord = {
    id: `LOG-${Date.now()}`,
    action,
    performedBy: session?.email || 'manager@hhevents.in',
    targetEntity: 'booking',
    targetId,
    details,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {}
}
