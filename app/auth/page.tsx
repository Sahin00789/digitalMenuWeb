'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaEnvelope, FaLock, FaSpinner, FaArrowRight, FaUser,
    FaKey, FaShieldAlt, FaRedo, FaUtensils, FaTimes
} from 'react-icons/fa';
import Link from 'next/link';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [showForgot, setShowForgot] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');

    // Login/Register States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // OTP States
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpTimer, setOtpTimer] = useState(30);
    const [resendingOtp, setResendingOtp] = useState(false);

    // Forgot Password States
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotEmail, setForgotEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const {
        login, register, forgotPassword, resetPassword,
        verifyOtp, resendOtp
    } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const initialMode = searchParams.get('mode');
        if (initialMode === 'register') setMode('register');
        const initialEmail = searchParams.get('email');
        if (initialEmail) {
            setOtpEmail(initialEmail);
            setShowOtp(true);
        }
    }, [searchParams]);

    useEffect(() => {
        let interval: any;
        if (showOtp && otpTimer > 0) {
            interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [showOtp, otpTimer]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const result = await login(email, password);
            if (result?.notVerified) {
                setOtpEmail(email);
                setShowOtp(true);
            } else {
                router.push('/admin');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            await register(email, password);
            setOtpEmail(email);
            setShowOtp(true);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendForgotOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await forgotPassword(forgotEmail);
            setForgotStep(2);
        } catch (err) {
            // Handled in context
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await resetPassword(forgotEmail, otp.join(''), newPassword);
            setShowForgot(false);
            setMode('login');
            setForgotStep(1);
        } catch (err) {
            // Handled in context
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await verifyOtp(otpEmail, otp.join(''));
            router.push('/admin');
        } catch (err) {
            // Handled in context
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (otpTimer > 0) return;
        setResendingOtp(true);
        try {
            await resendOtp(otpEmail);
            setOtpTimer(30);
        } catch (err) {
            // Handled in context
        } finally {
            setResendingOtp(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
            {/* Background Blobs (Softer for Light Theme) */}
            <div className="absolute top-0 -left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute top-0 -right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-20 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

            <div className="hidden lg:flex w-full max-w-4xl relative z-10 h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-slate-200 transition-all duration-700">

                {/* Left Side: Login Form */}
                <div className={`w-1/2 h-full p-12 flex flex-col justify-center transition-all duration-700 ease-in-out ${mode === 'register' ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2 font-outfit tracking-tight">Welcome Back</h2>
                        <p className="text-slate-500">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="relative group">
                            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="relative group">
                            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => { setShowForgot(true); setForgotStep(1); }}
                            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors block text-right w-full"
                        >
                            Forgot Password?
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? <FaSpinner className="animate-spin" /> : <>Sign In <FaArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </form>
                </div>

                {/* Right Side: Register Form */}
                <div className={`w-1/2 h-full p-12 flex flex-col justify-center transition-all duration-700 ease-in-out absolute right-0 ${mode === 'login' ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2 font-outfit tracking-tight">Create Account</h2>
                        <p className="text-slate-500">Join our digital dining platform</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="relative group">
                            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="relative group">
                            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="relative group">
                            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? <FaSpinner className="animate-spin" /> : <>Sign Up <FaArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
                        </button>
                    </form>
                </div>

                {/* Sliding Overlay */}
                <div className={`absolute top-0 w-1/2 h-full bg-indigo-600 transition-all duration-700 ease-in-out flex flex-col items-center justify-center p-12 text-center text-white z-20 ${mode === 'login' ? 'translate-x-full' : 'translate-x-0'}`}>
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-6">
                            <FaUtensils className="text-indigo-600 text-3xl" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4">{mode === 'login' ? 'Welcome Back!' : 'Hello Friend!'}</h1>
                        <p className="text-indigo-100 mb-8">
                            {mode === 'login' ? 'To keep connected with us please login with your personal info.' : 'Enter your details and start your journey with us.'}
                        </p>
                        <button
                            onClick={toggleMode}
                            className="border-2 border-white px-10 py-3 rounded-2xl font-bold hover:bg-white hover:text-indigo-600 transition-all active:scale-95"
                        >
                            {mode === 'login' ? 'SIGN UP' : 'SIGN IN'}
                        </button>
                    </div>
                </div>
            </div>



            {/* Mobile View */}
            <div className="flex lg:hidden w-full max-w-md relative z-10 flex-col space-y-6">
                <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
                        <FaUtensils className="text-white text-xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Digital<span className="text-indigo-600">Menu</span></h1>
                </div>

                <div className="backdrop-blur-xl bg-white border border-slate-200 p-8 rounded-3xl shadow-2xl overflow-hidden min-h-[460px] flex flex-col relative shadow-slate-300">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                                <p className="text-slate-500 text-sm">{mode === 'login' ? 'Sign in to your account' : 'Join our digital dining platform'}</p>
                            </div>

                            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                                <div className="relative group">
                                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="relative group">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                {mode === 'register' && (
                                    <div className="relative group">
                                        <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>
                                )}

                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => { setShowForgot(true); setForgotStep(1); }}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 block text-right w-full font-medium"
                                    >
                                        Forgot Password?
                                    </button>
                                )}

                                {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <FaSpinner className="animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Sign Up')}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={toggleMode}
                                    className="text-gray-400 text-sm hover:text-white transition-colors underline decoration-indigo-500/50"
                                >
                                    {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm flex items-center justify-center space-x-2">
                    <span>←</span>
                    <span>Back to website</span>
                </Link>
            </div>

            {/* SHARED OVERLAYS (Outside desktop/mobile containers for common visibility) */}
            {/* Bottom Slide: Forgot Password */}
            <AnimatePresence>
                {showForgot && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[100] bg-white p-6 md:p-12 flex flex-col"
                    >
                        <button
                            onClick={() => setShowForgot(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>

                        <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Reset Password</h2>
                                <p className="text-slate-500 text-sm md:text-base">
                                    {forgotStep === 1 ? "Enter your email to receive a reset code" : "Enter the code and your new password"}
                                </p>
                            </div>

                            {forgotStep === 1 ? (
                                <form onSubmit={handleSendForgotOtp} className="space-y-6">
                                    <div className="relative group">
                                        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" />
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <FaSpinner className="animate-spin" /> : "Send Code"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleResetPassword} className="space-y-6">
                                    <div className="flex justify-between gap-1">
                                        {otp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                id={`otp-${idx}`}
                                                type="text"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                className="w-10 h-12 md:w-12 md:h-14 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg md:text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                maxLength={1}
                                            />
                                        ))}
                                    </div>
                                    <div className="relative group">
                                        <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600" />
                                        <input
                                            type="password"
                                            placeholder="New Password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <FaSpinner className="animate-spin" /> : "Reset Password"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OTP Overlay */}
            <AnimatePresence>
                {showOtp && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[110] bg-white flex flex-col justify-center items-center p-6 md:p-12 text-center"
                    >
                        <button
                            onClick={() => setShowOtp(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                        <FaShieldAlt className="text-4xl md:text-5xl text-indigo-600 mb-6" />
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Verify OTP</h2>
                        <p className="text-slate-500 mb-8 text-sm md:text-base">Code sent to {otpEmail}</p>

                        <form onSubmit={handleVerifyOtp} className="max-w-md w-full space-y-8">
                            <div className="flex justify-between gap-2">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-verify-${idx}`}
                                        type="text"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        className="w-10 h-12 md:w-12 md:h-14 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg md:text-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                        maxLength={1}
                                    />
                                ))}
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || otp.some(v => !v)}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                            >
                                {isLoading ? <FaSpinner className="animate-spin" /> : "Verify & Continue"}
                            </button>

                            <div className="text-sm">
                                {otpTimer > 0 ? (
                                    <span className="text-slate-400">Resend in {otpTimer}s</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resendingOtp}
                                        className="text-indigo-600 font-bold hover:underline flex items-center gap-2 mx-auto"
                                    >
                                        {resendingOtp ? <FaSpinner className="animate-spin" /> : <FaRedo size={12} />} Resend Code
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
