export interface RealPhotoRecord {
  slotId: string;
  url: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
}

const STORAGE_KEY = 'hh_venue_real_photos_cache';

// In-memory cache
let photoCache: Record<string, RealPhotoRecord> = {};
let listeners: Array<() => void> = [];

// Initialize from localStorage
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    photoCache = JSON.parse(saved);
  }
} catch (e) {
  console.warn('Failed to parse cached photos:', e);
}

// Fetch from backend API
export async function syncPhotosFromBackend(): Promise<Record<string, RealPhotoRecord>> {
  try {
    const res = await fetch('/api/photos');
    if (res.ok) {
      const data = await res.json();
      if (data.photos) {
        photoCache = { ...photoCache, ...data.photos };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(photoCache));
        } catch (e) {}
        notifyListeners();
      }
    }
  } catch (err) {
    console.warn('Could not sync photos from backend, using local cache:', err);
  }
  return photoCache;
}

// Auto-sync on startup
if (typeof window !== 'undefined') {
  syncPhotosFromBackend();
}

export function getRealPhoto(slotId: string): string | null {
  return photoCache[slotId]?.url || null;
}

export function getAllRealPhotos(): Record<string, RealPhotoRecord> {
  return { ...photoCache };
}

export async function saveRealPhoto(
  slotId: string,
  filename: string,
  dataUrl: string
): Promise<{ success: boolean; url: string }> {
  const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  // 1. Save locally first for instant reactive update
  const localRecord: RealPhotoRecord = {
    slotId,
    url: dataUrl,
    filename,
    mimeType,
    uploadedAt: new Date().toISOString(),
  };

  photoCache[slotId] = localRecord;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photoCache));
  } catch (e) {
    // If local storage is full, keep in memory
  }
  notifyListeners();

  // 2. Persist to backend server so it saves as actual file in public/assets/venue/photos/
  try {
    const res = await fetch('/api/photos/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, filename, dataUrl }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.url) {
        // Update URL to the real static file URL
        photoCache[slotId] = {
          ...localRecord,
          url: json.url,
          filename: json.filename || filename,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(photoCache));
        } catch (e) {}
        notifyListeners();
        return { success: true, url: json.url };
      }
    }
  } catch (err) {
    console.error('Backend photo upload failed, persisted locally:', err);
  }

  return { success: true, url: dataUrl };
}

export async function removeRealPhoto(slotId: string): Promise<void> {
  delete photoCache[slotId];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photoCache));
  } catch (e) {}
  notifyListeners();

  try {
    await fetch(`/api/photos/${slotId}`, { method: 'DELETE' });
  } catch (e) {}
}

export function subscribePhotos(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}
