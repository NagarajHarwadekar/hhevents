import { useState, useEffect } from 'react';
import {
  getRealPhoto,
  getAllRealPhotos,
  subscribePhotos,
  RealPhotoRecord,
} from '../services/photoStorage';

export function useVenuePhotos() {
  const [photos, setPhotos] = useState<Record<string, RealPhotoRecord>>(getAllRealPhotos());

  useEffect(() => {
    return subscribePhotos(() => {
      setPhotos(getAllRealPhotos());
    });
  }, []);

  const getPhotoUrl = (slotId: string, fallbackUrl?: string): string | null => {
    return photos[slotId]?.url || fallbackUrl || null;
  };

  return { photos, getPhotoUrl };
}

export function useSlotPhoto(slotId: string, fallbackUrl?: string) {
  const [url, setUrl] = useState<string | null>(getRealPhoto(slotId) || fallbackUrl || null);

  useEffect(() => {
    const update = () => {
      setUrl(getRealPhoto(slotId) || fallbackUrl || null);
    };
    update();
    return subscribePhotos(update);
  }, [slotId, fallbackUrl]);

  return url;
}
