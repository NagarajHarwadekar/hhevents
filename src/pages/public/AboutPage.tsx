import React from 'react';
import {
  Building2,
  ShieldCheck,
  Award,
  Users,
  Clock,
  CheckCircle,
  FileText,
  ThermometerSnowflake,
  Zap,
  Car,
  ExternalLink,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { VENUE_INFO } from '../../services/hallData';
import { useVenuePhotos } from '../../hooks/useVenuePhotos';

interface AboutPageProps {
  navigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  const { getPhotoUrl } = useVenuePhotos();
  const exteriorPhoto = getPhotoUrl('gal-01') || getPhotoUrl('hero');

  return (
    <div className="space-y-16 pb-24 bg-[#FDFBF9] text-[#161210]">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#F6F5F4] py-14 sm:py-18 border-b border-[#E8E5E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackButton fallback="/" variant="light" />
          </div>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#9A6611] bg-[#FAF2E4] px-3.5 py-1.5 rounded-full border border-[#E8D7BE] inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#C88D23]" />
              About H H Events &amp; Conventions
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#161210] tracking-tight font-serif-heading">
              A Premier Venue for Celebrations &amp; Conventions
            </h1>
            <p className="text-base sm:text-lg text-[#58453E] leading-relaxed">
              Conveniently situated opposite Juma Masjid in Panemangalore, H H Events &amp; Conventions provides an exceptional setting for weddings, Nikah, receptions, cultural gatherings, and corporate conventions.
            </p>
          </div>
        </div>
      </section>

      {/* Main Philosophy & Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#9A6611] bg-[#FAF2E4] px-3.5 py-1.5 rounded-full border border-[#E8D7BE]">
              <Building2 className="w-3.5 h-3.5 text-[#C88D23]" /> Venue Vision &amp; Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#161210] font-serif-heading">
              Designed For Unforgettable Celebrations
            </h2>
            <p className="text-[#58453E] text-sm leading-relaxed">
              H H Events &amp; Conventions was built with modern event logistics in mind. Featuring two independently bookable halls — Hall 1 and Hall 2 — hosts can configure either an intimate family celebration or a grand dual-hall convention with simultaneous ceremony and feast turnover.
            </p>
            <p className="text-[#58453E] text-sm leading-relaxed">
              Every detail is planned for guest convenience: two independent halls bookable separately or combined, comfortable dining wings configured for traditional seated feasting or modern buffet service, and dedicated kitchen facilities included in all official packages.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white border border-[#E8E5E1] shadow-2xs">
                <span className="text-xl sm:text-2xl font-bold text-[#161210] block">Dual Halls</span>
                <span className="text-xs text-[#C88D23] font-medium">Independent Ingress</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E8E5E1] shadow-2xs">
                <span className="text-xl sm:text-2xl font-bold text-[#161210] block">600 Persons</span>
                <span className="text-xs text-[#C88D23] font-medium">Seating Capacity</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E8E5E1] shadow-2xs">
                <span className="text-xl sm:text-2xl font-bold text-[#161210] block">AC / Non-AC</span>
                <span className="text-xs text-[#C88D23] font-medium">Configurable Options</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#E8E5E1] bg-[#FAF8F5] min-h-[360px] flex items-center justify-center p-2.5">
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-[#FAF8F5]">
              {exteriorPhoto ? (
                <img
                  src={exteriorPhoto}
                  alt="H H Events & Conventions Campus"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-[#7E7873]">
                  <Building2 className="w-12 h-12 text-[#C88D23] mb-2" />
                  <h4 className="text-base font-bold text-[#161210]">H H Events &amp; Conventions Campus</h4>
                  <p className="text-xs">Opposite Juma Masjid, Panemangalore</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Checklist */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E5E1] shadow-sm space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#161210] font-serif-heading">
              Our Core Promises to Hosts
            </h3>
            <p className="text-xs sm:text-sm text-[#58453E]">
              From arrival to final departure, our facilities ensure your family and guests feel respected and comfortable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] space-y-2">
              <ShieldCheck className="w-6 h-6 text-[#C88D23]" />
              <h4 className="font-bold text-sm text-[#161210]">Acoustic &amp; Visual Privacy</h4>
              <p className="text-xs text-[#58453E] leading-relaxed">
                Independent entrances and foyers ensure your celebration has total exclusivity.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] space-y-2">
              <Zap className="w-6 h-6 text-[#C88D23]" />
              <h4 className="font-bold text-sm text-[#161210]">Zero Power Interruption</h4>
              <p className="text-xs text-[#58453E] leading-relaxed">
                Industrial generator backup covers all air conditioning units and stage equipment.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] space-y-2">
              <Car className="w-6 h-6 text-[#C88D23]" />
              <h4 className="font-bold text-sm text-[#161210]">Spacious Parking</h4>
              <p className="text-xs text-[#58453E] leading-relaxed">
                On-campus parking slots for wedding convoys and buses with wheelchair-friendly entry.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] space-y-2">
              <Clock className="w-6 h-6 text-[#C88D23]" />
              <h4 className="font-bold text-sm text-[#161210]">3-Hour Buffer Guarantee</h4>
              <p className="text-xs text-[#58453E] leading-relaxed">
                Dedicated sanitation and decor setup windows between Day and Evening slots.
              </p>
            </div>
          </div>

          <div className="pt-4 text-center">
            <Button
              onClick={() => navigate('/book')}
              variant="gold"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Plan Your Event With Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
