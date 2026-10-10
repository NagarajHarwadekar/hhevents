export type HallTarget = 'hall_1' | 'hall_2' | 'both';
export type SlotTarget = 'day' | 'evening';

export interface DaySlotsState {
  day: boolean; // true = Available, false = Unavailable
  evening: boolean; // true = Available, false = Unavailable
}

export interface DateAvailabilityEntry {
  date: string; // YYYY-MM-DD
  hall_1: DaySlotsState;
  hall_2: DaySlotsState;
  notes?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'hh_manager_controlled_availability_v2';

// In-memory cache
let availabilityCache: Record<string, DateAvailabilityEntry> = {};
let listeners: Array<() => void> = [];

// Initialize from localStorage
function initCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      availabilityCache = JSON.parse(raw);
    } else {
      availabilityCache = {};
    }
  } catch (e) {
    console.warn('Failed to load manager availability:', e);
    availabilityCache = {};
  }
}

initCache();

function persist(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(availabilityCache));
  } catch (e) {
    console.error('Failed to persist manager availability:', e);
  }
  notifyListeners();
}

function notifyListeners(): void {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeAvailability(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

/**
 * Returns the availability entry for a date.
 * If not yet explicitly customized by manager, defaults to 100% available for all halls and slots.
 */
export function getManagerAvailability(date: string): DateAvailabilityEntry {
  if (availabilityCache[date]) {
    return availabilityCache[date];
  }
  // Default: clean open slate (Available)
  return {
    date,
    hall_1: { day: true, evening: true },
    hall_2: { day: true, evening: true },
    notes: '',
    updatedAt: '',
  };
}

export function getAllManagerAvailability(): Record<string, DateAvailabilityEntry> {
  return { ...availabilityCache };
}

/**
 * Check if a specific slot is available.
 * Hall 1 and Hall 2 are independent.
 * Combined Hall ('both') is available ONLY IF both Hall 1 AND Hall 2 are available.
 */
export function isSlotAvailable(hall: HallTarget, date: string, slot: SlotTarget): boolean {
  const entry = getManagerAvailability(date);

  if (hall === 'hall_1') {
    return entry.hall_1[slot] !== false;
  }
  if (hall === 'hall_2') {
    return entry.hall_2[slot] !== false;
  }
  // 'both' (Combined Hall): requires both halls to be available
  return entry.hall_1[slot] !== false && entry.hall_2[slot] !== false;
}

/**
 * Check whole-day availability for a hall.
 * - 'available': both day and evening are available
 * - 'partial': one slot available, one unavailable
 * - 'unavailable': both slots unavailable
 */
export function getDayAvailabilitySummary(
  hall: HallTarget,
  date: string
): 'available' | 'partial' | 'unavailable' {
  const dayAvail = isSlotAvailable(hall, date, 'day');
  const eveAvail = isSlotAvailable(hall, date, 'evening');

  if (dayAvail && eveAvail) return 'available';
  if (!dayAvail && !eveAvail) return 'unavailable';
  return 'partial';
}

/**
 * Set availability for a single slot on a date.
 * If hall is 'both', applies to both Hall 1 and Hall 2.
 */
export function setSlotAvailability(
  hall: HallTarget,
  date: string,
  slot: SlotTarget,
  available: boolean,
  notes?: string
): DateAvailabilityEntry {
  const current = getManagerAvailability(date);

  const updated: DateAvailabilityEntry = {
    date,
    hall_1: { ...current.hall_1 },
    hall_2: { ...current.hall_2 },
    notes: notes !== undefined ? notes : current.notes,
    updatedAt: new Date().toISOString(),
  };

  if (hall === 'hall_1') {
    updated.hall_1[slot] = available;
  } else if (hall === 'hall_2') {
    updated.hall_2[slot] = available;
  } else {
    // 'both': updates both halls
    updated.hall_1[slot] = available;
    updated.hall_2[slot] = available;
  }

  availabilityCache[date] = updated;
  persist();
  return updated;
}

/**
 * Set whole-day availability (both Day and Evening slots) for a hall on a date.
 */
export function setDayAvailability(
  hall: HallTarget,
  date: string,
  available: boolean,
  notes?: string
): DateAvailabilityEntry {
  const current = getManagerAvailability(date);

  const updated: DateAvailabilityEntry = {
    date,
    hall_1: { ...current.hall_1 },
    hall_2: { ...current.hall_2 },
    notes: notes !== undefined ? notes : current.notes,
    updatedAt: new Date().toISOString(),
  };

  if (hall === 'hall_1') {
    updated.hall_1.day = available;
    updated.hall_1.evening = available;
  } else if (hall === 'hall_2') {
    updated.hall_2.day = available;
    updated.hall_2.evening = available;
  } else {
    // 'both'
    updated.hall_1.day = available;
    updated.hall_1.evening = available;
    updated.hall_2.day = available;
    updated.hall_2.evening = available;
  }

  availabilityCache[date] = updated;
  persist();
  return updated;
}

/**
 * Reset a date back to default (all available).
 */
export function resetDateToDefault(date: string): void {
  delete availabilityCache[date];
  persist();
}

/**
 * Clear all manager overrides (resets entire calendar to default Available).
 */
export function clearAllManagerAvailability(): void {
  availabilityCache = {};
  persist();
}
