import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, KeyRound, Shield, Check, X, User } from 'lucide-react';

interface LoginFormProps {
  identifier: string;
  setIdentifier: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e?: React.FormEvent) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  identifier,
  setIdentifier,
  password,
  setPassword,
  loading,
  error,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput) return;
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSuccess(`Password reset instructions have been sent to ${forgotInput}`);
    }, 700);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotInput('');
    setForgotSuccess(null);
  };

  return (
    <div className="w-full flex flex-col justify-center min-h-screen p-6 sm:p-10 lg:p-14 bg-white text-slate-800 relative overflow-y-auto">
      {/* Mobile Top Branding */}
      <div className="lg:hidden mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-indigo-600 p-0.5 shadow-lg shadow-orange-500/20 mb-3">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-2xl text-orange-500">
            M
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Money<span className="text-orange-500">MB</span>
        </h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
          Smart Financial Portal
        </p>
      </div>

      <div className="max-w-md w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
              Partner Authentication
            </span>
            <span className="text-[11px] text-slate-400 font-mono font-semibold">MoneyMB v2.4</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Sign In to MoneyMB
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Enter your User ID / Email and Password to access your portal account
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-3 shadow-xs animate-shake">
            <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs">
              !
            </div>
            <div className="leading-relaxed font-semibold">{error}</div>
          </div>
        )}

        {/* Clean Sign In Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          {/* User ID / Email Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              User ID / Email / Mobile
            </label>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. retailer@moneymb.in or 9876543210"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs"
                required
              />
            </div>
          </div>

          {/* Password Input with Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">
                Remember me on this browser
              </span>
            </label>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all active:scale-[0.99] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-white" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to MoneyMB</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer Notice */}
        <div className="mt-12 pt-6 border-t border-slate-100 text-center flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <Shield size={15} className="text-emerald-500" />
          <span>256-Bit TLS Secured • ISO 27001 Certified • MoneyMB</span>
        </div>
      </div>

      {/* Forgot Password Light Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mb-4">
              <KeyRound size={24} />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
              Enter your registered MoneyMB User ID, Email, or Mobile Number to receive password reset instructions.
            </p>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                  <Check size={18} />
                  <span>Reset Link Sent!</span>
                </div>
                <p className="leading-relaxed font-semibold">{forgotSuccess}</p>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    User ID / Email / Mobile
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      placeholder="e.g. retailer@moneymb.in or 9876543210"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? <Loader2 size={16} className="animate-spin" /> : <span>Send Reset Link</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
