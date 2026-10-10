import React, { useState, useEffect } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BackButton } from '../../components/ui/BackButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigation } from '../../context/NavigationContext';
import { MANAGER_CREDENTIALS } from '../../config/managerCredentials';

interface AdminLoginPageProps {
  navigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ navigate }) => {
  const { goBack } = useNavigation();
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to admin dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !phone.trim() || !password.trim()) {
      setErrorMessage('Please provide Manager Email, Phone Number, and Password.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email.trim(), phone.trim(), password);
      showToast('Welcome to H H Events & Conventions Management Console', 'success', 'Authenticated');
      navigate('/admin/dashboard');
    } catch (err: any) {
      // Single generic failure message without revealing which credential failed
      setErrorMessage('Invalid manager credentials');
      showToast('Invalid manager credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-start">
          <BackButton fallback="/" variant="dark" label="Back to Website" />
        </div>

        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-serif-heading">
            H H Events &amp; Conventions
          </h1>
          <p className="text-xs text-amber-400 font-semibold tracking-wider uppercase">
            Administrative Management Console
          </p>
          <p className="text-xs text-slate-400">
            Secure manager access for bookings, scheduling, and hall availability
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 md:p-8 bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Access Denied:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Manager Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Manager Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="hheventsconvention@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Manager Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Manager Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="9448133378"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            {/* Manager Password with Show/Hide Control */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Manager Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="gold"
                size="lg"
                isLoading={isLoading}
                className="w-full justify-center text-slate-950 font-bold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Authenticate &amp; Access Dashboard
              </Button>
            </div>
          </form>

          {/* Return link */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => goBack('/')}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
            >
              <span>← Return to H H Events &amp; Conventions Website</span>
            </button>
          </div>
        </Card>

        {/* Development & security note */}
        <p className="text-center text-[11px] text-slate-500">
          Authorized personnel only. Access sessions are verified on this device.
        </p>
      </div>
    </div>
  );
};
