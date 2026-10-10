import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Receipt,
  PhoneCall,
  ThermometerSnowflake,
  Wind,
  Users,
  Info,
  MessageCircle,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { useToast } from '../../context/ToastContext';
import { HALL_STRUCTURE, COMBINED_PACKAGE, VENUE_INFO, TIMING_SLOTS, OFFICIAL_TARIFF_SCHEDULE } from '../../services/hallData';
import { checkSlotAvailability, createBooking } from '../../services/bookingStorage';
import { HallId, SlotType, ACOption, BookingRequest } from '../../types';

interface BookPageProps {
  navigate: (path: string) => void;
}

type BookingStep = 'date' | 'hall' | 'time' | 'climate' | 'details' | 'summary' | 'confirmation';

export const BookPage: React.FC<BookPageProps> = ({ navigate }) => {
  const { showToast } = useToast();

  // Parse URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const paramHall = (urlParams.get('hall') as HallId) || 'hall_1';
  const paramDate = urlParams.get('date');
  const paramSlot = (urlParams.get('slot') as SlotType) || 'day';

  // Multi-step state: DATE → HALL → TIME → AC / NON-AC → HOST INFO → SUMMARY → CONFIRMATION
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');

  // State
  const [selectedHall, setSelectedHall] = useState<HallId>(paramHall);
  const [acOption, setAcOption] = useState<ACOption>('ac');
  const [date, setDate] = useState<string>(
    paramDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [slot, setSlot] = useState<SlotType>(paramSlot);

  // Customer Contact Fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState<number | ''>('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Real-time conflict feedback
  const [conflictReason, setConflictReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<BookingRequest | null>(null);

  // Re-check conflict on field changes
  useEffect(() => {
    if (date && slot && selectedHall) {
      const res = checkSlotAvailability(selectedHall, date, slot);
      if (!res.available) {
        setConflictReason(res.conflictReason || 'Slot is already booked for this hall.');
      } else {
        setConflictReason(null);
      }
    }
  }, [selectedHall, date, slot]);

  // Pricing Calculation strictly from official tariff schedule
  const getBaseTariff = () => {
    if (selectedHall === 'both') {
      return acOption === 'ac' ? COMBINED_PACKAGE.pricing.ac : COMBINED_PACKAGE.pricing.nonAc;
    }
    const hall = HALL_STRUCTURE.find((h) => h.id === selectedHall);
    if (!hall) return 0;
    return acOption === 'ac' ? hall.pricing.ac : hall.pricing.nonAc;
  };

  const totalAmount = getBaseTariff();

  const stepsList: { id: BookingStep; label: string; number: number }[] = [
    { id: 'date', label: 'Date', number: 1 },
    { id: 'hall', label: 'Hall Space', number: 2 },
    { id: 'time', label: 'Session Slot', number: 3 },
    { id: 'climate', label: 'AC / Climate', number: 4 },
    { id: 'details', label: 'Host Details', number: 5 },
    { id: 'summary', label: 'Summary', number: 6 },
  ];

  const currentStepIndex = stepsList.findIndex((s) => s.id === currentStep);

  const handleNextStep = () => {
    if (currentStep === 'date') {
      if (!date) {
        showToast('Please select a reservation date.', 'error');
        return;
      }
      setCurrentStep('hall');
    } else if (currentStep === 'hall') {
      setCurrentStep('time');
    } else if (currentStep === 'time') {
      if (conflictReason) {
        showToast(conflictReason, 'error', 'Slot Conflict');
        return;
      }
      setCurrentStep('climate');
    } else if (currentStep === 'climate') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (!customerName.trim() || !phone.trim() || !email.trim()) {
        showToast('Please provide your name, phone number, and email address.', 'error', 'Required Fields');
        return;
      }
      setCurrentStep('summary');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'hall') setCurrentStep('date');
    else if (currentStep === 'time') setCurrentStep('hall');
    else if (currentStep === 'climate') setCurrentStep('time');
    else if (currentStep === 'details') setCurrentStep('climate');
    else if (currentStep === 'summary') setCurrentStep('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !phone.trim() || !email.trim()) {
      showToast('Please provide your name, phone number, and email address.', 'error', 'Missing Fields');
      return;
    }

    if (!termsAccepted) {
      showToast('Please confirm the booking notice acknowledgment.', 'warning', 'Acknowledgment Required');
      return;
    }

    if (conflictReason) {
      showToast(conflictReason, 'error', 'Slot Conflict');
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        date,
        slot,
        hall: selectedHall,
        acOption,
        expectedAttendees: expectedAttendees ? Number(expectedAttendees) : undefined,
        additionalInfo: additionalInfo.trim() || undefined,
        estimatedAmount: totalAmount,
      };

      const result = createBooking(bookingData);
      if (result.success && result.booking) {
        setSubmittedBooking(result.booking);
        setCurrentStep('confirmation');
        showToast('Reservation request submitted successfully!', 'success', 'Request Created');
      } else {
        showToast(result.error || 'Failed to submit reservation.', 'error', 'Submission Error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit reservation.', 'error', 'Submission Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyBookingId = () => {
    if (submittedBooking) {
      navigator.clipboard.writeText(submittedBooking.id);
      showToast('Booking ID copied to clipboard.', 'info');
    }
  };

  return (
    <div className="space-y-16 pb-24 bg-[#FDFBF9] text-[#161210]">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#FAF8F5] via-[#FFFDF9] to-[#F6F5F4] py-14 sm:py-18 border-b border-[#E8E5E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackButton fallback="/availability" variant="light" />
          </div>
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-[#9A6611] bg-[#FAF2E4] px-3.5 py-1.5 rounded-full border border-[#E8D7BE] inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#C88D23]" />
              Guided Reservation Experience
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#161210] tracking-tight font-serif-heading">
              Reserve H H Events &amp; Conventions
            </h1>
            <p className="text-base sm:text-lg text-[#58453E] leading-relaxed">
              Step-by-step reservation with transparent official pricing, real-time availability validation, and kitchen facilities included in all packages.
            </p>
          </div>
        </div>
      </section>

      {/* Main Reservation Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {currentStep === 'confirmation' && submittedBooking ? (
          /* Confirmation Success Card */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E5E1] shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C88D23]">
                Reservation Request Registered
              </span>
              <h2 className="text-3xl font-bold text-[#161210] font-serif-heading">
                Thank You, {submittedBooking.customerName}!
              </h2>
              <p className="text-xs sm:text-sm text-[#58453E]">
                Your reservation request for H H Events &amp; Conventions has been securely recorded in the venue management system.
              </p>
            </div>

            {/* Reference Box */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] flex items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-xs text-[#7E7873] uppercase tracking-wide block">Reference ID</span>
                <span className="text-lg sm:text-xl font-mono font-bold text-[#161210]">
                  {submittedBooking.id}
                </span>
              </div>
              <button
                type="button"
                onClick={copyBookingId}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E8E5E1] text-xs font-semibold text-[#161210] hover:bg-[#F3EFE9] flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/919448133378?text=Hello%20H%20H%20Events%20%26%20Conventions,%20I%20have%20submitted%20booking%20request%20${submittedBooking.id}%20for%20${submittedBooking.date}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </a>
              <Button
                onClick={() => navigate(`/track-booking?id=${submittedBooking.id}`)}
                variant="gold"
                size="md"
                className="w-full sm:w-auto"
              >
                Track Booking Status
              </Button>
            </div>
          </div>
        ) : (
          /* Multi-Step Flow Container */
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Step Progress Tracker Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E5E1] shadow-2xs">
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0">
                {stepsList.map((st, i) => {
                  const isCurrent = st.id === currentStep;
                  const isPassed = currentStepIndex > i;

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        if (isPassed) setCurrentStep(st.id);
                      }}
                      disabled={!isPassed && !isCurrent}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#C88D23] text-white font-bold shadow-xs'
                          : isPassed
                          ? 'bg-[#FAF2E4] text-[#9A6611] hover:bg-[#F3E5CF] border border-[#EAD8BF]'
                          : 'bg-[#F6F5F4] text-[#7E7873] cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent ? 'bg-white text-[#C88D23]' : isPassed ? 'bg-[#9A6611] text-white' : 'bg-[#E0DCD7] text-[#7E7873]'
                      }`}>
                        {isPassed ? <Check className="w-3 h-3" /> : st.number}
                      </span>
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Content Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E5E1] shadow-md space-y-8 min-h-[420px] flex flex-col justify-between">
              <div>
                {/* STEP 1: DATE */}
                {currentStep === 'date' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C88D23]">Step 1 of 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#161210] font-serif-heading">
                        Select Your Event Date
                      </h2>
                      <p className="text-xs sm:text-sm text-[#58453E]">
                        Choose the calendar date for your celebration at H H Events &amp; Conventions.
                      </p>
                    </div>

                    <div className="max-w-md space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#161210] mb-2 uppercase tracking-wide">
                          Event Date *
                        </label>
                        <input
                          type="date"
                          value={date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#D8D3CC] text-base text-[#161210] focus:ring-2 focus:ring-[#C88D23] focus:outline-none bg-white"
                          required
                        />
                      </div>

                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E5E1] text-xs text-[#58453E] space-y-1">
                        <span className="font-bold text-[#161210] block">Selected Date:</span>
                        <p className="text-[#C88D23] text-sm font-semibold">
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-[11px] text-[#7E7873] pt-1">
                          Official tariff schedule: <strong>All Sunday, Monday &amp; Thursday</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: HALL */}
                {currentStep === 'hall' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C88D23]">Step 2 of 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#161210] font-serif-heading">
                        Select Venue Section
                      </h2>
                      <p className="text-xs sm:text-sm text-[#58453E]">
                        Hall 1 and Hall 2 operate independently with dedicated dining wings and kitchens.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedHall('hall_1')}
                        className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                          selectedHall === 'hall_1'
                            ? 'bg-[#FAF2E4] text-[#9A6611] border-[#EAD8BF] font-bold shadow-2xs ring-2 ring-[#C88D23]/30'
                            : 'bg-white text-[#161210] border-[#E8E5E1] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C88D23] text-white inline-block mb-2">
                          Independent Hall
                        </span>
                        <h4 className="text-lg font-bold">Hall 1</h4>
                        <p className="text-xs mt-1 text-[#58453E]">
                          Main Convention Hall + Dining Wing + Kitchen
                        </p>
                        <span className="text-sm font-black text-[#C88D23] block mt-3">From ₹25,000.00</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedHall('hall_2')}
                        className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                          selectedHall === 'hall_2'
                            ? 'bg-[#FAF2E4] text-[#9A6611] border-[#EAD8BF] font-bold shadow-2xs ring-2 ring-[#C88D23]/30'
                            : 'bg-white text-[#161210] border-[#E8E5E1] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C88D23] text-white inline-block mb-2">
                          Independent Hall
                        </span>
                        <h4 className="text-lg font-bold">Hall 2</h4>
                        <p className="text-xs mt-1 text-[#58453E]">
                          Main Convention Hall + Dining Wing + Kitchen
                        </p>
                        <span className="text-sm font-black text-[#C88D23] block mt-3">From ₹25,000.00</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedHall('both')}
                        className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                          selectedHall === 'both'
                            ? 'bg-[#FAF2E4] text-[#9A6611] border-[#EAD8BF] font-bold shadow-2xs ring-2 ring-[#C88D23]/30'
                            : 'bg-white text-[#161210] border-[#E8E5E1] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C88D23] text-white inline-block mb-2">
                          Full Campus
                        </span>
                        <h4 className="text-lg font-bold">Combined Hall</h4>
                        <p className="text-xs mt-1 text-[#58453E]">
                          Hall 1 &amp; Hall 2 Combined + Dual Dining + Kitchen
                        </p>
                        <span className="text-sm font-black text-[#C88D23] block mt-3">From ₹50,000.00</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: TIME SLOT */}
                {currentStep === 'time' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C88D23]">Step 3 of 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#161210] font-serif-heading">
                        Select Session Slot
                      </h2>
                      <p className="text-xs sm:text-sm text-[#58453E]">
                        Operational session timings for {date}.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {TIMING_SLOTS.map((ts) => {
                        const isSelected = slot === ts.id;
                        return (
                          <button
                            key={ts.id}
                            type="button"
                            onClick={() => setSlot(ts.id as SlotType)}
                            className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#FAF2E4] text-[#9A6611] border-[#EAD8BF] font-bold shadow-2xs ring-2 ring-[#C88D23]/30'
                                : 'bg-white text-[#161210] border-[#E8E5E1] hover:bg-[#FAF8F5]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-base font-bold">{ts.label}</h4>
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E8E5E1]">
                                {ts.timeRange}
                              </span>
                            </div>
                            <p className="text-xs text-[#58453E] leading-relaxed">
                              {ts.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {conflictReason && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{conflictReason}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: CLIMATE CONFIGURATION */}
                {currentStep === 'climate' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C88D23]">Step 4 of 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#161210] font-serif-heading">
                        Air Conditioning Configuration
                      </h2>
                      <p className="text-xs sm:text-sm text-[#58453E]">
                        Select whether you require full air conditioning for your celebration.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setAcOption('ac')}
                        className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                          acOption === 'ac'
                            ? 'bg-[#FAF2E4] text-[#9A6611] border-[#EAD8BF] font-bold shadow-2xs ring-2 ring-[#C88D23]/30'
                            : 'bg-white text-[#161210] border-[#E8E5E1] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <ThermometerSnowflake className="w-5 h-5 text-sky-600" />
                          <h4 className="text-base font-bold">Air Conditioned (AC Hall)</h4>
                        </div>
                        <p className="text-xs text-[#58453E] leading-relaxed">
                          Comfortable temperature control with industrial chillers and heavy generator backup.
                        </p>
                        <span className="text-sm font-black text-[#C88D23] block mt-3">
                          Total: ₹{totalAmount.toLocaleString()}.00
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAcOption('non_ac')}
                        className={`p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                          acOption === 'non_ac'
                            ? 'bg-[#FAF2E4] text-[#9A6611] border-[#EAD8BF] font-bold shadow-2xs ring-2 ring-[#C88D23]/30'
                            : 'bg-white text-[#161210] border-[#E8E5E1] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Wind className="w-5 h-5 text-emerald-600" />
                          <h4 className="text-base font-bold">Natural Ventilation (Non AC)</h4>
                        </div>
                        <p className="text-xs text-[#58453E] leading-relaxed">
                          Natural ventilation with high-velocity industrial fans throughout the hall and dining.
                        </p>
                        <span className="text-sm font-black text-[#C88D23] block mt-3">
                          Total: ₹{totalAmount.toLocaleString()}.00
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5: HOST CONTACT INFORMATION */}
                {currentStep === 'details' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C88D23]">Step 5 of 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#161210] font-serif-heading">
                        Host Contact Details
                      </h2>
                      <p className="text-xs sm:text-sm text-[#58453E]">
                        Please provide your contact information for reservation confirmation and venue liaison.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#161210] uppercase mb-1.5">
                          Host Full Name *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Mohammed Farooq"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#D8D3CC] text-sm text-[#161210] focus:ring-2 focus:ring-[#C88D23] focus:outline-none bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#161210] uppercase mb-1.5">
                          Phone Number (WhatsApp) *
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 9845012345"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#D8D3CC] text-sm text-[#161210] focus:ring-2 focus:ring-[#C88D23] focus:outline-none bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#161210] uppercase mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. farooq@gmail.com"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#D8D3CC] text-sm text-[#161210] focus:ring-2 focus:ring-[#C88D23] focus:outline-none bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#161210] uppercase mb-1.5">
                          Expected Attendees (Approximate)
                        </label>
                        <input
                          type="number"
                          value={expectedAttendees}
                          onChange={(e) => setExpectedAttendees(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 500"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#D8D3CC] text-sm text-[#161210] focus:ring-2 focus:ring-[#C88D23] focus:outline-none bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#161210] uppercase mb-1.5">
                          Special Requirements or Notes
                        </label>
                        <textarea
                          rows={2}
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          placeholder="Stage backdrop requirements, catering team details, etc."
                          className="w-full px-4 py-2.5 rounded-xl border border-[#D8D3CC] text-sm text-[#161210] focus:ring-2 focus:ring-[#C88D23] focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: SUMMARY & CONFIRMATION */}
                {currentStep === 'summary' && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C88D23]">Step 6 of 6</span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#161210] font-serif-heading">
                        Review Reservation Request
                      </h2>
                      <p className="text-xs sm:text-sm text-[#58453E]">
                        Please confirm your celebration details before submitting.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E5E1] space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-[#7E7873] block uppercase">Event Date</span>
                          <span className="font-bold text-[#161210] text-sm">{date}</span>
                        </div>
                        <div>
                          <span className="text-[#7E7873] block uppercase">Venue Space</span>
                          <span className="font-bold text-[#161210] text-sm">
                            {selectedHall === 'both' ? 'Combined Hall' : selectedHall === 'hall_1' ? 'Hall 1' : 'Hall 2'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#7E7873] block uppercase">Session</span>
                          <span className="font-bold text-[#161210] text-sm uppercase">
                            {slot} Session
                          </span>
                        </div>
                        <div>
                          <span className="text-[#7E7873] block uppercase">Climate</span>
                          <span className="font-bold text-[#161210] text-sm uppercase">
                            {acOption.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#E8E5E1] flex items-baseline justify-between">
                        <div>
                          <span className="text-xs text-[#7E7873] uppercase block">Total Package Rent</span>
                          <span className="text-2xl font-black text-[#C88D23]">
                            ₹{totalAmount.toLocaleString()}.00
                          </span>
                        </div>
                        <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          Kitchen Included
                        </span>
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="p-4 rounded-xl bg-white border border-[#E8E5E1] flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-[#C88D23] rounded cursor-pointer"
                        required
                      />
                      <label htmlFor="terms" className="text-xs text-[#58453E] cursor-pointer">
                        I confirm that the details provided are accurate and acknowledge the official venue schedule ({OFFICIAL_TARIFF_SCHEDULE}). Kitchen facilities are included with the booking.
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Step Navigation Controls */}
              <div className="pt-6 border-t border-[#F0ECE7] flex items-center justify-between gap-4">
                {currentStepIndex > 0 ? (
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    size="md"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep === 'summary' ? (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    variant="gold"
                    size="md"
                    isLoading={isSubmitting}
                  >
                    Confirm &amp; Submit Reservation
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    variant="gold"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
