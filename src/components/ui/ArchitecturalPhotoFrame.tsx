import React, { useState } from 'react';
import { Camera, Building2, Maximize2 } from 'lucide-react';

interface ArchitecturalPhotoFrameProps {
  src?: string | null;
  alt: string;
  title?: string;
  category?: string;
  className?: string;
  aspectRatioClass?: string;
  onClick?: () => void;
  showOverlay?: boolean;
  priority?: boolean;
}

export const ArchitecturalPhotoFrame: React.FC<ArchitecturalPhotoFrameProps> = ({
  src,
  alt,
  title,
  category,
  className = '',
  aspectRatioClass = 'aspect-4/3',
  onClick,
  showOverlay = true,
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const hasValidImage = !!src && !imageError;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-slate-950 rounded-2xl border border-white/10 select-none ${aspectRatioClass} ${
        onClick ? 'cursor-pointer hover:border-amber-500/40' : ''
      } ${className}`}
    >
      {hasValidImage ? (
        <>
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            onLoad={() => setIsLoaded(true)}
            className={`w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-105 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
              <Building2 className="w-8 h-8 text-amber-500/40" />
            </div>
          )}
        </>
      ) : (
        /* Luxury Architectural Fallback Canvas (Zero Broken Image) */
        <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden">
          {/* Subtle architectural geometric grid lines */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(217,119,6,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(217,119,6,0.3) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top Category Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-amber-500/30">
              {category || 'H H Events'}
            </span>
            <Building2 className="w-4 h-4 text-amber-500/50" />
          </div>

          {/* Center Graphic */}
          <div className="relative z-10 my-auto text-center space-y-2 py-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white font-serif-heading max-w-xs mx-auto line-clamp-2">
              {title || alt}
            </h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto line-clamp-1">
              Official Venue Perspective
            </p>
          </div>

          {/* Bottom subtle bar */}
          <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5">
            <span>Panemangalore, Bantwal</span>
            <span className="text-amber-400/80">Tap to inspect</span>
          </div>
        </div>
      )}

      {/* Measured contrast scrim */}
      {showOverlay && hasValidImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />
      )}

      {/* Bottom Title Bar overlay on real image */}
      {showOverlay && title && hasValidImage && (
        <div className="absolute bottom-0 inset-x-0 p-5 text-white pointer-events-none">
          {category && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
              {category}
            </span>
          )}
          <h4 className="text-sm sm:text-base font-bold leading-snug line-clamp-2 font-serif-heading">
            {title}
          </h4>
        </div>
      )}

      {/* Expand icon on hover */}
      {onClick && (
        <div className="absolute top-3 right-3 p-2 rounded-lg bg-slate-950/70 backdrop-blur-md text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none">
          <Maximize2 className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
