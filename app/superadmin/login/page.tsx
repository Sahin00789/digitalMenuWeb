'use client';

import { useState } from 'react';
import { useSuperadminAuth } from '@/context/SuperadminAuthContext';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Mail, KeyRound, Loader2, ArrowRight } from 'lucide-react';

export default function SuperadminLogin() {
  const [email, setEmail] = useState('sahin401099@gmail.com');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const { requestOTP, verifyOTP } = useSuperadminAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestOTP(email);
      setStep(2);
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOTP(email, otp);
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 transform hover:rotate-6 transition-transform">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Superadmin</h1>
            <p className="text-slate-400 mt-2">Secure Gateway Login</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Admin Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    placeholder="name@gmail.com"
                    required
                    readOnly
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Request OTP
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">One Time Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-400 transition-colors">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-slate-600 tracking-[0.5em] font-mono text-center text-xl"
                    placeholder="••••••"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 text-center mt-2">
                  OTP sent to <span className="text-indigo-400 font-medium">{email}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3.5 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify Login
                      <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="text-xs text-center text-slate-500 uppercase tracking-widest leading-loose">
              System monitoring Dashboard v1.0.0<br/>
              Authorized Access Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
