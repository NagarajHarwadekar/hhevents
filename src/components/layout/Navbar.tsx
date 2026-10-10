import React, { useState, useEffect } from 'react';
import {
  Building2,
  CalendarDays,
  Search,
  Menu,
  X,
  ShieldAlert,
  PhoneCall,
  Clock,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { VENUE_INFO } from '../../services/hallData';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Halls & Spaces', path: '/halls' },
    { label: 'Availability', path: '/availability' },
    { label: 'Tariff & Packages', path: '/pricing' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Facilities', path: '/facilities' },
    { label: 'About', path: '/about' },
    { label: 'Location', path: '/location' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleLinkClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isAdminRoute = currentPath.startsWith('/admin');

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-[#E8E5E1] shadow-xs'
            : 'bg-white border-b border-[#E8E5E1]'
        }`}
      >
        {/* Top Info Bar (Signature Banquet Hall Pro Element) */}
        <div className="bg-[#FAF8F5] border-b border-[#EBE7E1] text-[#58453E] text-xs py-2 px-4 hidden md:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-[#161210] font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#C88D23]" />
                Opposite Juma Masjid, Akkarangadi, Panemangalore 574231
              </span>
              <span className="text-[#D8D3CC]">|</span>
              <span className="flex items-center gap-1.5 text-[#58453E]">
                <Clock className="w-3.5 h-3.5 text-[#C88D23]" />
                Sessions: 10:00 AM – 3:00 PM &bull; 6:00 PM – 10:00 PM
              </span>
            </div>

            <div className="flex items-center gap-4 text-[12px]">
              <a
                href={`tel:${VENUE_INFO.primaryPhone}`}
                className="flex items-center gap-1.5 font-semibold text-[#161210] hover:text-[#C88D23] transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#C88D23]" />
                <span>{VENUE_INFO.primaryPhone}</span>
              </a>
              <span className="text-[#D8D3CC]">|</span>
              <button
                type="button"
                onClick={() => handleLinkClick(isAdminRoute ? '/admin/dashboard' : '/admin/login')}
                className="inline-flex items-center gap-1 text-[#58453E] hover:text-[#C88D23] transition-colors font-medium cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#C88D23]" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Header / Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Wordmark (Clean bespoke typography, no generic AI box logo) */}
            <button
              type="button"
              onClick={() => handleLinkClick('/')}
              className="flex flex-col text-left group focus:outline-none cursor-pointer py-1"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#161210] font-serif-heading leading-tight group-hover:text-[#C88D23] transition-colors">
                  H H Events
                </span>
                <span className="text-[11px] font-bold text-[#C88D23] uppercase tracking-widest hidden sm:inline">
                  &amp; Conventions
                </span>
              </div>
              <p className="text-[11px] text-[#7E7873] font-medium tracking-wide">
                Panemangalore &bull; Bantwal
              </p>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleLinkClick(link.path)}
                    className={`relative px-3.5 py-2 text-[13px] font-semibold tracking-normal transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#C88D23] font-bold'
                        : 'text-[#161210] hover:text-[#C88D23] hover:bg-[#FAF8F5] rounded-lg'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C88D23] rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleLinkClick('/track-booking')}
                className="p-2.5 rounded-xl text-[#58453E] hover:text-[#161210] hover:bg-[#F6F5F4] transition-colors border border-[#E8E5E1] cursor-pointer"
                title="Track Booking Reference"
                aria-label="Track Booking Status"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleLinkClick('/book')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C88D23] hover:bg-[#B37B1B] text-white font-semibold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Book Venue</span>
              </button>
            </div>

            {/* Mobile Buttons */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => handleLinkClick('/book')}
                className="px-3.5 py-2 rounded-xl bg-[#C88D23] text-white font-semibold text-xs uppercase tracking-wider shadow-xs active:scale-95"
              >
                Book
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-xl bg-[#F6F5F4] border border-[#E8E5E1] text-[#161210] hover:bg-[#ECEAE8] transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-[#C88D23]" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Banquet Hall Pro Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border-t border-[#E8E5E1]">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#F0ECE7] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <span className="font-bold text-[#161210] text-lg font-serif-heading block">H H Events &amp; Conventions</span>
                <span className="text-[11px] text-[#7E7873] font-medium">Panemangalore, Bantwal</span>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-white border border-[#E8E5E1] text-[#58453E] hover:text-[#161210]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-[#C88D23]" />
              </button>
            </div>

            {/* Links */}
            <div className="p-4 space-y-1 overflow-y-auto flex-1">
              {navLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => handleLinkClick(link.path)}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#FAF2E4] text-[#9A6611] font-bold border border-[#EAD8BF]'
                        : 'text-[#161210] hover:bg-[#F6F5F4]'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowRight className={`w-4 h-4 ${isActive ? 'text-[#C88D23]' : 'text-[#A8A29E]'}`} />
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleLinkClick('/track-booking')}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-sm font-semibold text-[#58453E] hover:bg-[#F6F5F4] border border-dashed border-[#E0DCD7] mt-2"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#C88D23]" />
                  Track Reservation Status
                </span>
                <ArrowRight className="w-4 h-4 text-[#A8A29E]" />
              </button>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-[#F0ECE7] bg-[#FAF8F5] space-y-3 pb-safe">
              <button
                type="button"
                onClick={() => handleLinkClick('/book')}
                className="w-full py-3.5 px-4 rounded-xl bg-[#C88D23] hover:bg-[#B37B1B] text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <CalendarDays className="w-5 h-5" />
                <span>Reserve Venue Now</span>
              </button>

              <div className="flex items-center justify-between text-xs text-[#58453E] pt-1">
                <a
                  href={`tel:${VENUE_INFO.primaryPhone}`}
                  className="flex items-center gap-1.5 text-[#161210] hover:underline font-semibold"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#C88D23]" />
                  <span>{VENUE_INFO.primaryPhone}</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleLinkClick('/admin/login')}
                  className="text-[#7E7873] hover:text-[#161210]"
                >
                  Admin Portal &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
