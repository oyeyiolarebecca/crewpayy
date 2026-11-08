import React, { useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { CrewPayMark } from '../ui/Brand';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: 'company' | 'employee';
    companyName: string;
    preferredCurrency: string;
}

interface AuthPageProps {
    onAuthenticated: (user: AuthUser, token: string) => void;
}

type AuthMode = 'login' | 'register';

const API_URL = import.meta.env.VITE_API_URL || '';

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        companyName: '',
        role: 'company' as 'company' | 'employee',
    });

    const updateForm = (field: keyof typeof form, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
        setError('');
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/auth/${mode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    mode === 'login'
                        ? { email: form.email, password: form.password }
                        : {
                            name: form.name,
                            email: form.email,
                            password: form.password,
                            companyName: form.companyName,
                            role: form.role,
                        }
                ),
            });
            const responseText = await response.text();
            if (response.status === 502 || response.status === 503 || response.status === 504) {
                throw new Error('The CrewPay backend is unavailable. Restart with `npm run dev`, then try again.');
            }
            let payload: { error?: string; user?: AuthUser; token?: string } = {};
            try {
                payload = responseText ? JSON.parse(responseText) : {};
            } catch {
                throw new Error('The authentication service returned an invalid response. Check that the backend is running.');
            }
            if (!response.ok) throw new Error(payload.error || 'Unable to authenticate.');
            if (!payload.user || !payload.token) throw new Error('The authentication response was incomplete.');
            onAuthenticated(payload.user, payload.token);
        } catch (requestError) {
            setError(
                requestError instanceof TypeError
                    ? 'CrewPay could not reach the authentication service. Start the backend with `npm run server`, then try again.'
                    : requestError instanceof Error
                        ? requestError.message
                        : 'Unable to authenticate.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#14213D] text-[#252A34] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full border border-[#4169E1]/30" />
            <div className="absolute -bottom-48 -left-20 w-[28rem] h-[28rem] rounded-full border border-[#C9F2DF]/15" />

            <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] bg-[#FAF9F6] rounded-[26px] overflow-hidden shadow-2xl">
                <section className="hidden lg:flex flex-col justify-between p-12 bg-[#1B2C50] text-white min-h-[650px]">
                    <div>
                        <CrewPayMark />
                        <div className="mt-24 max-w-md">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-[#C9F2DF] font-semibold">Global payroll, made calm</p>
                            <h1 className="font-display text-5xl leading-[1.05] font-bold mt-4">
                                Move every crew member forward.
                            </h1>
                            <p className="text-white/65 text-sm leading-6 mt-6 max-w-sm">
                                One workspace for payroll cycles, approvals, treasury balances, and compliant international payouts.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                        {['Multi-currency', 'Dual control', 'Blaaiz rails'].map((item) => (
                            <div key={item} className="border-t border-white/15 pt-3 text-white/65 flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-[#C9F2DF]" />
                                {item}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="p-6 sm:p-10 lg:p-12 bg-[#FAF9F6]">
                    <div className="lg:hidden mb-10">
                        <CrewPayMark onLight />
                    </div>
                    <div className="max-w-md mx-auto">
                        <div className="flex gap-6 border-b border-[#14213D]/10 mb-8">
                            {(['login', 'register'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => { setMode(tab); setError(''); }}
                                    className={`pb-3 text-sm font-bold capitalize border-b-2 transition-colors ${mode === tab ? 'text-[#14213D] border-[#4169E1]' : 'text-[#252A34]/45 border-transparent'}`}
                                >
                                    {tab === 'login' ? 'Sign in' : 'Create account'}
                                </button>
                            ))}
                        </div>

                        <div className="mb-7">
                            <h2 className="font-display text-3xl font-bold text-[#14213D]">
                                {mode === 'login' ? 'Welcome back' : 'Start with CrewPay'}
                            </h2>
                            <p className="text-sm text-[#252A34]/60 mt-2">
                                {mode === 'login' ? 'Sign in to your finance operations workspace.' : 'Set up a secure workspace for your distributed team.'}
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            {mode === 'register' && (
                                <>
                                    <label className="block">
                                        <span className="text-xs font-bold text-[#14213D]">Full name</span>
                                        <div className="relative mt-1.5">
                                            <UserRound className="absolute left-3 top-3 w-4 h-4 text-[#252A34]/40" />
                                            <input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} className="auth-input pl-10" placeholder="Your name" />
                                        </div>
                                    </label>
                                    <label className="block">
                                        <span className="text-xs font-bold text-[#14213D]">Workspace name</span>
                                        <input required value={form.companyName} onChange={(event) => updateForm('companyName', event.target.value)} className="auth-input mt-1.5" placeholder="Acme Global Inc." />
                                    </label>
                                    <div>
                                        <span className="text-xs font-bold text-[#14213D]">I am joining as</span>
                                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                                            {(['company', 'employee'] as const).map((role) => (
                                                <button key={role} type="button" onClick={() => updateForm('role', role)} className={`py-2.5 rounded-lg border text-xs font-bold capitalize ${form.role === role ? 'border-[#4169E1] bg-[#EEEAFE] text-[#14213D]' : 'border-[#14213D]/15 text-[#252A34]/60'}`}>
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <label className="block">
                                <span className="text-xs font-bold text-[#14213D]">Work email</span>
                                <div className="relative mt-1.5">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-[#252A34]/40" />
                                    <input required type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} className="auth-input pl-10" placeholder="you@company.com" />
                                </div>
                            </label>
                            <label className="block">
                                <span className="text-xs font-bold text-[#14213D]">Password</span>
                                <div className="relative mt-1.5">
                                    <LockKeyhole className="absolute left-3 top-3 w-4 h-4 text-[#252A34]/40" />
                                    <input required type={showPassword ? 'text' : 'password'} minLength={mode === 'register' ? 12 : undefined} value={form.password} onChange={(event) => updateForm('password', event.target.value)} className="auth-input pl-10 pr-10" placeholder={mode === 'register' ? '12 characters minimum' : 'Enter your password'} />
                                    <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-2.5 text-[#252A34]/45 hover:text-[#14213D]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </label>

                            {error && <div className="rounded-lg border border-[#B94A48]/20 bg-[#FFE0D1]/60 px-3 py-2.5 text-xs text-[#8F3331]">{error}</div>}

                            <button disabled={isSubmitting} type="submit" className="w-full min-h-11 rounded-lg bg-[#4169E1] hover:bg-[#3158D2] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                {isSubmitting ? 'Securing workspace...' : mode === 'login' ? 'Sign in to CrewPay' : 'Create secure workspace'}
                                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </form>

                        <div className="mt-7 flex items-start gap-2 text-[11px] leading-5 text-[#252A34]/55">
                            <ShieldCheck className="w-4 h-4 text-[#4169E1] shrink-0 mt-0.5" />
                            Your session is protected with server-side authentication and role-based access controls.
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
};