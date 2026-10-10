import React from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { RealPhotoManager } from '../../components/photos/RealPhotoManager';

interface AdminPhotosPageProps {
  navigate: (path: string) => void;
}

export const AdminPhotosPage: React.FC<AdminPhotosPageProps> = ({ navigate }) => {
  return (
    <AdminLayout
      navigate={navigate}
      title="Venue Photo Manager"
      subtitle="Upload and manage the exact real photographs of H H Events & Conventions"
      currentPath="/admin/photos"
    >
      <div className="space-y-6">
        {/* Informational Guidance Card */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Camera className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold text-sm block">Direct Real Photography Integration:</strong>
            <p className="leading-relaxed">
              Upload the actual photographs of H H Events &amp; Conventions directly from your computer or phone.
              You can upload individual pictures for the Hero Background, Hall 1, Hall 2, Dining Wing, and each of the 15 Gallery slots, or use <strong>Batch Import</strong> to upload all your photos in one go.
            </p>
          </div>
        </div>

        <RealPhotoManager standalone />
      </div>
    </AdminLayout>
  );
};
