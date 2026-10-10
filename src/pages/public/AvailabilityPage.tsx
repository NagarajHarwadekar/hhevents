import React, { useState } from 'react';
import { CalendarDays, CheckCircle2, Building2, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { AvailabilityCalendar } from '../../components/calendar/AvailabilityCalendar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { VENUE_INFO } from '../../services/hallData';

interface AvailabilityPageProps {
  navigate: (path: string) => void;
}

export const AvailabilityPage: React.FC<AvailabilityPageProps> = ({ navigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

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
              <CalendarDays className="w-3.5 h-3.5 text-[#C88D23]" />
              Live Availability Schedule
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#161210] tracking-tight font-serif-heading">
              Hall Availability &amp; Booking Slots
            </h1>
            <p className="text-base sm:text-lg text-[#58453E] leading-relaxed">
              Check live Available and Booked dates for Hall 1, Hall 2, and Combined Hall across Day (10:00 AM – 3:00 PM) and Evening (6:00 PM – 10:00 PM) sessions. Both halls operate independently, allowing separate bookings when available.
            </p>
          </div>
        </div>
      </section>

      {/* Main Calendar Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Calendar Main Column */}
          <div className="lg:col-span-3 space-y-6">
            <AvailabilityCalendar
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              onBookSlot={(hall, date, slot) => {
                navigate(`/book?hall=${hall}&date=${date}&slot=${slot}`);
              }}
            />

            {/* Shift hours card */}
            <div className="p-6 bg-white rounded-3xl border border-[#E8E5E1] shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] space-y-1">
                <span className="text-xs font-bold text-[#C88D23] block uppercase tracking-wider">
                  Day Session
                </span>
                <p className="text-base font-bold text-[#161210] font-mono">
                  {VENUE_INFO.daySlotHours}
                </p>
                <p className="text-[#58453E] text-[11px] pt-1">
                  Ideal for wedding ceremonies, muhurtham rituals, nikah, and lunch feasts.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] space-y-1">
                <span className="text-xs font-bold text-[#C88D23] block uppercase tracking-wider">
                  Evening Session
                </span>
                <p className="text-base font-bold text-[#161210] font-mono">
                  {VENUE_INFO.eveningSlotHours}
                </p>
                <p className="text-[#58453E] text-[11px] pt-1">
                  Ideal for grand receptions, celebratory dinners, cultural galas, and musical stages.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Guidance Panel */}
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-3xl space-y-4 border border-[#E8E5E1] shadow-2xs">
              <div className="flex items-center gap-2 text-[#C88D23]">
                <Building2 className="w-5 h-5 text-[#C88D23]" />
                <h4 className="text-sm font-bold font-serif-heading text-[#161210]">Dual Independence</h4>
              </div>

              <div className="space-y-3 text-xs text-[#58453E] leading-relaxed">
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#161210]">Hall 1 &amp; Hall 2:</strong> Can be booked separately on the same date and slot.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#161210]">Combined Hall:</strong> Reserves both halls together for grand conventions up to 3,000 persons.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#161210]">Buffer Window:</strong> 3-hour sanitation and turnover interval between Day and Evening sessions.</span>
                </p>
              </div>

              <div className="pt-4 border-t border-[#F0ECE7]">
                <Button
                  onClick={() => navigate(`/book?date=${selectedDate}`)}
                  variant="gold"
                  size="md"
                  className="w-full justify-center"
                >
                  Book Date ({selectedDate})
                </Button>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E8E5E1] text-[#161210] space-y-2">
              <div className="flex items-center gap-2 text-[#C88D23]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <h5 className="text-xs font-bold uppercase tracking-wider">Management Notice</h5>
              </div>
              <p className="text-xs text-[#58453E] leading-relaxed">
                {VENUE_INFO.paymentNotice}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
