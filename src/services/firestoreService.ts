import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { getDb, getFirebaseAuth, isFirebaseConfigured } from './firebase';
import {
  BookingRequest,
  BookingStatus,
  FacilityWing,
  MaintenanceRecord,
  AuditLogRecord,
  HallSettings,
  AdminUser
} from '../types';
import { INITIAL_FACILITIES, VENUE_SETTINGS, INITIAL_BOOKINGS, INITIAL_MAINTENANCE_SCHEDULE, SEED_AUDIT_LOGS } from './hallData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const auth = isFirebaseConfigured() ? getFirebaseAuth() : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Security / Operation Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot as recommended in Skill
export async function testFirestoreConnection(): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not yet configured with VITE_FIREBASE_* variables. Using local fallback.');
    return false;
  }
  try {
    const db = getDb();
    await getDocFromServer(doc(db, 'settings', 'general'));
    console.log('Firebase Firestore connection verified with server.');
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline') || error?.code === 'unavailable') {
      console.warn('Firebase client is offline or network unreachable. Check Firebase configuration.');
    }
    return false;
  }
}

// -------------------------------------------------------------
// 1. PROFILES & ROLES
// -------------------------------------------------------------
export async function getProfile(uid: string): Promise<AdminUser | null> {
  if (!isFirebaseConfigured()) return null;
  const path = `profiles/${uid}`;
  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'profiles', uid));
    if (snap.exists()) {
      return snap.data() as AdminUser;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createOrUpdateProfile(profile: AdminUser): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const path = `profiles/${profile.uid}`;
  try {
    const db = getDb();
    await setDoc(doc(db, 'profiles', profile.uid), {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// 2. HALLS / FACILITIES (Public Information)
// -------------------------------------------------------------
export async function getHallsFromFirestore(): Promise<FacilityWing[]> {
  if (!isFirebaseConfigured()) {
    return INITIAL_FACILITIES;
  }
  const path = 'halls';
  try {
    const db = getDb();
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      // Seed default halls so the database is populated with initial data
      await seedInitialHalls();
      return INITIAL_FACILITIES;
    }
    return snap.docs.map((d) => d.data() as FacilityWing);
  } catch (error) {
    console.warn('Could not fetch halls from Firestore, falling back to initial data:', error);
    return INITIAL_FACILITIES;
  }
}

export async function seedInitialHalls(): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const db = getDb();
    for (const hall of INITIAL_FACILITIES) {
      await setDoc(doc(db, 'halls', hall.id), hall, { merge: true });
    }
  } catch (e) {
    console.warn('Failed seeding halls to Firestore:', e);
  }
}

// -------------------------------------------------------------
// 3. BOOKING REQUESTS (Confidential) & PUBLIC BOOKINGS (Sanitized)
// -------------------------------------------------------------

export interface PublicBookingSlot {
  id: string;
  eventType: string;
  eventDate: string;
  timeSlot: 'morning' | 'evening' | 'full_day';
  status: BookingStatus;
  totalEstimate: number;
  advancePaymentStatus: string;
  submittedAt: string;
}

// Submit new booking request
export async function submitBookingToFirestore(
  payload: Omit<BookingRequest, 'id' | 'status' | 'submittedAt' | 'updatedAt'>
): Promise<BookingRequest> {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const id = `HH-2026-${randomNum}`;
  const now = new Date().toISOString();

  const newBooking: BookingRequest = {
    ...payload,
    id,
    status: 'pending',
    submittedAt: now,
    updatedAt: now
  };

  // Sanitized public projection containing ZERO applicant PII (no phone, no email, no remarks)
  const publicSlot: PublicBookingSlot = {
    id,
    eventType: payload.eventType || 'event',
    eventDate: payload.eventDate || payload.date || '',
    timeSlot: (payload.timeSlot || payload.slot || 'day') as any,
    status: 'pending',
    totalEstimate: payload.totalEstimate || payload.estimatedAmount || 0,
    advancePaymentStatus: 'unpaid',
    submittedAt: now
  };

  if (!isFirebaseConfigured()) {
    // Local fallback
    const local = JSON.parse(localStorage.getItem('hhevents_bookings_v3') || '[]');
    local.unshift(newBooking);
    localStorage.setItem('hhevents_bookings_v3', JSON.stringify(local));
    return newBooking;
  }

  const bookingPath = `bookingRequests/${id}`;
  const publicPath = `publicBookings/${id}`;

  try {
    const db = getDb();
    // 1. Write confidential booking request
    await setDoc(doc(db, 'bookingRequests', id), newBooking);

    // 2. Write sanitized public projection for public availability and tracking
    await setDoc(doc(db, 'publicBookings', id), publicSlot);

    // 3. Log audit event
    await addAuditLogToFirestore(
      'BOOKING_SUBMITTED',
      payload.applicantEmail || payload.email || 'customer',
      'booking',
      id,
      `Lodged reservation request for ${payload.eventTitle || payload.additionalInfo || 'Hall Event'} on ${payload.eventDate || payload.date}`
    );

    return newBooking;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, bookingPath);
  }
}

// Fetch all bookings (Admin only)
export async function getBookingsFromFirestore(): Promise<BookingRequest[]> {
  if (!isFirebaseConfigured()) {
    try {
      const raw = localStorage.getItem('hhevents_bookings_v3');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_BOOKINGS;
  }

  const path = 'bookingRequests';
  try {
    const db = getDb();
    const q = query(collection(db, path), orderBy('submittedAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) {
      // Seed default bookings for administrative review if collection is completely fresh
      for (const b of INITIAL_BOOKINGS) {
        await setDoc(doc(db, 'bookingRequests', b.id), b, { merge: true });
        await setDoc(doc(db, 'publicBookings', b.id), {
          id: b.id,
          eventType: b.eventType,
          eventDate: b.eventDate,
          timeSlot: b.timeSlot,
          status: b.status,
          totalEstimate: b.totalEstimate,
          advancePaymentStatus: b.advancePaymentStatus,
          submittedAt: b.submittedAt
        }, { merge: true });
      }
      return INITIAL_BOOKINGS;
    }
    return snap.docs.map((d) => d.data() as BookingRequest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Fetch public bookings for availability calendar and public tracking
export async function getPublicBookingsFromFirestore(): Promise<PublicBookingSlot[]> {
  if (!isFirebaseConfigured()) {
    try {
      const raw = localStorage.getItem('hhevents_bookings_v3');
      const all: BookingRequest[] = raw ? JSON.parse(raw) : INITIAL_BOOKINGS;
      return all.map((b) => ({
        id: b.id,
        eventType: b.eventType || 'event',
        eventDate: b.date || b.eventDate || '',
        timeSlot: (b.slot || b.timeSlot || 'day') as any,
        status: b.status,
        totalEstimate: b.estimatedAmount || b.totalEstimate || 0,
        advancePaymentStatus: b.advancePaymentStatus || 'unpaid',
        submittedAt: b.submittedAt
      }));
    } catch {
      return [];
    }
  }

  const path = 'publicBookings';
  try {
    const db = getDb();
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return INITIAL_BOOKINGS.map((b) => ({
        id: b.id,
        eventType: b.eventType || 'event',
        eventDate: b.date || b.eventDate || '',
        timeSlot: (b.slot || b.timeSlot || 'day') as any,
        status: b.status,
        totalEstimate: b.estimatedAmount || b.totalEstimate || 0,
        advancePaymentStatus: b.advancePaymentStatus || 'unpaid',
        submittedAt: b.submittedAt
      }));
    }
    return snap.docs.map((d) => d.data() as PublicBookingSlot);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Track single public booking by reference ID (Zero PII leaked)
export async function getPublicBookingById(id: string): Promise<PublicBookingSlot | null> {
  const cleanId = id.trim().toUpperCase();
  if (!cleanId) return null;

  if (!isFirebaseConfigured()) {
    try {
      const raw = localStorage.getItem('hhevents_bookings_v3');
      const all: BookingRequest[] = raw ? JSON.parse(raw) : INITIAL_BOOKINGS;
      const match = all.find((b) => b.id.toUpperCase() === cleanId);
      if (!match) return null;
      return {
        id: match.id,
        eventType: match.eventType || 'event',
        eventDate: match.date || match.eventDate || '',
        timeSlot: (match.slot || match.timeSlot || 'day') as any,
        status: match.status,
        totalEstimate: match.estimatedAmount || match.totalEstimate || 0,
        advancePaymentStatus: match.advancePaymentStatus || 'unpaid',
        submittedAt: match.submittedAt
      };
    } catch {
      return null;
    }
  }

  const path = `publicBookings/${cleanId}`;
  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'publicBookings', cleanId));
    if (snap.exists()) {
      return snap.data() as PublicBookingSlot;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Update booking status (Admin only)
export async function updateBookingStatusInFirestore(
  id: string,
  newStatus: BookingStatus,
  remarks?: string,
  adminEmail: string = 'admin@hhevents.in'
): Promise<void> {
  const now = new Date().toISOString();

  if (!isFirebaseConfigured()) {
    const local = JSON.parse(localStorage.getItem('hhevents_bookings_v3') || '[]');
    const idx = local.findIndex((b: BookingRequest) => b.id === id);
    if (idx !== -1) {
      local[idx].status = newStatus;
      if (remarks !== undefined) local[idx].adminRemarks = remarks;
      local[idx].updatedAt = now;
      localStorage.setItem('hhevents_bookings_v3', JSON.stringify(local));
    }
    return;
  }

  const bookingPath = `bookingRequests/${id}`;
  try {
    const db = getDb();
    const updateData: any = {
      status: newStatus,
      updatedAt: now
    };
    if (remarks !== undefined) {
      updateData.adminRemarks = remarks;
    }

    await updateDoc(doc(db, 'bookingRequests', id), updateData);
    await updateDoc(doc(db, 'publicBookings', id), {
      status: newStatus
    });

    await addAuditLogToFirestore(
      `BOOKING_${newStatus.toUpperCase()}`,
      adminEmail,
      'booking',
      id,
      `Status changed to ${newStatus}. Remarks: ${remarks || 'None'}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, bookingPath);
  }
}

// Update payment status (Admin only)
export async function updatePaymentStatusInFirestore(
  id: string,
  newPaymentStatus: BookingRequest['advancePaymentStatus'],
  adminEmail: string = 'admin@hhevents.in'
): Promise<void> {
  const now = new Date().toISOString();

  if (!isFirebaseConfigured()) {
    const local = JSON.parse(localStorage.getItem('hhevents_bookings_v3') || '[]');
    const idx = local.findIndex((b: BookingRequest) => b.id === id);
    if (idx !== -1) {
      local[idx].advancePaymentStatus = newPaymentStatus;
      local[idx].updatedAt = now;
      localStorage.setItem('hhevents_bookings_v3', JSON.stringify(local));
    }
    return;
  }

  const bookingPath = `bookingRequests/${id}`;
  try {
    const db = getDb();
    await updateDoc(doc(db, 'bookingRequests', id), {
      advancePaymentStatus: newPaymentStatus,
      updatedAt: now
    });
    await updateDoc(doc(db, 'publicBookings', id), {
      advancePaymentStatus: newPaymentStatus
    });

    const statusVal = newPaymentStatus || 'unpaid';
    await addAuditLogToFirestore(
      `PAYMENT_${statusVal.toUpperCase()}`,
      adminEmail,
      'booking',
      id,
      `Payment status updated to ${statusVal}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, bookingPath);
  }
}

// -------------------------------------------------------------
// 4. MAINTENANCE BLOCKS
// -------------------------------------------------------------
export async function getMaintenanceFromFirestore(): Promise<MaintenanceRecord[]> {
  if (!isFirebaseConfigured()) {
    try {
      const raw = localStorage.getItem('hhevents_maintenance_v3');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_MAINTENANCE_SCHEDULE.map((m) => ({
      id: m.id,
      facilityId: m.facilityId,
      facilityIds: m.facilityIds || (m.facilityId ? [m.facilityId] : ['hall_1']),
      facilityName: m.facilityName || m.facilityId || 'Hall 1',
      title: m.title,
      category: (m.category || 'hvac') as any,
      scheduledDate: m.scheduledDate || m.startDate,
      startDate: m.startDate || m.scheduledDate,
      endDate: m.endDate || m.scheduledDate,
      slot: (m.slot || 'full_day') as any,
      technicianName: m.technicianName || m.assignedContractor || m.assignedTo || 'Assigned Engineer',
      technicianPhone: m.technicianPhone || '+91 9741575078',
      status: m.status,
      notes: m.notes || m.description,
      createdAt: m.createdAt || new Date().toISOString()
    }));
  }

  const path = 'maintenanceBlocks';
  try {
    const db = getDb();
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      // Seed default maintenance
      const seeded: MaintenanceRecord[] = INITIAL_MAINTENANCE_SCHEDULE.map((m) => ({
        id: m.id,
        facilityId: m.facilityId,
        facilityIds: m.facilityIds || (m.facilityId ? [m.facilityId] : ['hall_1']),
        facilityName: m.facilityName || m.facilityId || 'Hall 1',
        title: m.title,
        category: (m.category || 'hvac') as any,
        scheduledDate: m.scheduledDate || m.startDate,
        startDate: m.startDate || m.scheduledDate,
        endDate: m.endDate || m.scheduledDate,
        slot: (m.slot || 'full_day') as any,
        technicianName: m.technicianName || m.assignedContractor || m.assignedTo || 'Assigned Engineer',
        technicianPhone: m.technicianPhone || '+91 9741575078',
        status: m.status,
        notes: m.notes || m.description,
        createdAt: m.createdAt || new Date().toISOString()
      }));
      for (const item of seeded) {
        await setDoc(doc(db, 'maintenanceBlocks', item.id), item, { merge: true });
      }
      return seeded;
    }
    return snap.docs.map((d) => d.data() as MaintenanceRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createMaintenanceInFirestore(
  payload: Omit<MaintenanceRecord, 'id' | 'createdAt'>
): Promise<MaintenanceRecord> {
  const id = `MNT-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();
  const record: MaintenanceRecord = {
    ...payload,
    id,
    startDate: payload.scheduledDate,
    endDate: payload.scheduledDate,
    createdAt: now
  };

  if (!isFirebaseConfigured()) {
    const local = JSON.parse(localStorage.getItem('hhevents_maintenance_v3') || '[]');
    local.unshift(record);
    localStorage.setItem('hhevents_maintenance_v3', JSON.stringify(local));
    return record;
  }

  const path = `maintenanceBlocks/${id}`;
  try {
    const db = getDb();
    await setDoc(doc(db, 'maintenanceBlocks', id), record);
    await addAuditLogToFirestore(
      'MAINTENANCE_SCHEDULED',
      'Admin Officer',
      'maintenance',
      id,
      `Scheduled ${payload.title} on ${payload.scheduledDate}`
    );
    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateMaintenanceStatusInFirestore(
  id: string,
  newStatus: MaintenanceRecord['status']
): Promise<void> {
  if (!isFirebaseConfigured()) {
    const local = JSON.parse(localStorage.getItem('hhevents_maintenance_v3') || '[]');
    const idx = local.findIndex((m: MaintenanceRecord) => m.id === id);
    if (idx !== -1) {
      local[idx].status = newStatus;
      localStorage.setItem('hhevents_maintenance_v3', JSON.stringify(local));
    }
    return;
  }

  const path = `maintenanceBlocks/${id}`;
  try {
    const db = getDb();
    await updateDoc(doc(db, 'maintenanceBlocks', id), {
      status: newStatus
    });
    await addAuditLogToFirestore(
      'MAINTENANCE_STATUS_UPDATED',
      'Admin Officer',
      'maintenance',
      id,
      `Task marked as ${newStatus}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// 5. AUDIT LOGS (Admin Only)
// -------------------------------------------------------------
export async function getAuditLogsFromFirestore(): Promise<AuditLogRecord[]> {
  if (!isFirebaseConfigured()) {
    try {
      const raw = localStorage.getItem('hhevents_audit_logs_v3');
      if (raw) return JSON.parse(raw);
    } catch {}
    return SEED_AUDIT_LOGS;
  }

  const path = 'auditLogs';
  try {
    const db = getDb();
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    if (snap.empty) {
      for (const log of SEED_AUDIT_LOGS) {
        await setDoc(doc(db, 'auditLogs', log.id), log, { merge: true });
      }
      return SEED_AUDIT_LOGS;
    }
    return snap.docs.map((d) => d.data() as AuditLogRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addAuditLogToFirestore(
  action: string,
  performedBy: string,
  targetEntity: 'booking' | 'maintenance' | 'settings' | 'facility',
  targetId: string,
  details: string
): Promise<void> {
  const id = `AUD-${Math.floor(1000 + Math.random() * 9000)}`;
  const record: AuditLogRecord = {
    id,
    action,
    performedBy,
    targetEntity,
    targetId,
    details,
    timestamp: new Date().toISOString()
  };

  if (!isFirebaseConfigured()) {
    const local = JSON.parse(localStorage.getItem('hhevents_audit_logs_v3') || '[]');
    local.unshift(record);
    localStorage.setItem('hhevents_audit_logs_v3', JSON.stringify(local.slice(0, 100)));
    return;
  }

  const path = `auditLogs/${id}`;
  try {
    const db = getDb();
    await setDoc(doc(db, 'auditLogs', id), record);
  } catch (error) {
    // Non-blocking log write failure should not halt the caller
    console.error('Failed writing audit log:', error);
  }
}

// -------------------------------------------------------------
// 6. SETTINGS (Public Read, Admin Write)
// -------------------------------------------------------------
export async function getSettingsFromFirestore(): Promise<HallSettings> {
  if (!isFirebaseConfigured()) {
    return VENUE_SETTINGS;
  }

  const path = 'settings/general';
  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'settings', 'general'));
    if (snap.exists()) {
      return { ...VENUE_SETTINGS, ...snap.data() };
    } else {
      // Initialize general settings
      await setDoc(doc(db, 'settings', 'general'), VENUE_SETTINGS);
      return VENUE_SETTINGS;
    }
  } catch (error) {
    console.warn('Could not read settings from Firestore, returning local defaults:', error);
    return VENUE_SETTINGS;
  }
}

export async function updateSettingsInFirestore(
  updates: Partial<HallSettings>,
  adminEmail: string = 'admin@hhevents.in'
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const path = 'settings/general';
  try {
    const db = getDb();
    await setDoc(doc(db, 'settings', 'general'), {
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await addAuditLogToFirestore(
      'SETTINGS_UPDATED',
      adminEmail,
      'settings',
      'general',
      'Operational and tariff parameters updated'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
