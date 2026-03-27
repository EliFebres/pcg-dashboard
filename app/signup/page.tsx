'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, CheckCircle, ChevronDown } from 'lucide-react';

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  hasError?: boolean;
}

function GlassSelect({ value, onChange, options, placeholder, hasError }: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const borderClass = hasError
    ? 'border-red-500/50 focus-within:border-red-500/50'
    : 'border-zinc-700/50 focus-within:border-cyan-500/50';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-zinc-800/40 backdrop-blur-sm border rounded-lg text-sm transition-colors focus:outline-none focus:ring-1 ${hasError ? 'focus:ring-red-500/20' : 'focus:ring-cyan-500/30'} ${borderClass} ${value ? 'text-zinc-100' : 'text-zinc-500'}`}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-lg shadow-xl overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                value === opt
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-zinc-200 hover:bg-white/[0.06]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TEAMS = [
  'Portfolio Consulting Group',
  'Equity Specialist',
  'Fixed Income Specialist',
] as const;

const OFFICES = ['Charlotte', 'Austin', 'Santa Monica', 'UK', 'Sydney'] as const;

export default function SignupPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    title: '',
    team: '',
    office: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<'pending' | null>(null);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    };
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'Required';
    if (!form.lastName.trim()) errors.lastName = 'Required';
    if (!form.email.trim()) {
      errors.email = 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Invalid email address';
    }
    if (!form.password) {
      errors.password = 'Required';
    } else if (form.password.length < 8) {
      errors.password = 'Must be at least 8 characters';
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Required';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!form.title.trim()) errors.title = 'Required';
    if (!form.team) errors.team = 'Required';
    if (!form.office) errors.office = 'Required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Registration failed. Please try again.');
        return;
      }

      if (data.isFirstUser) {
        window.location.href = '/dashboard/client-interactions';
        return;
      }

      setSuccess('pending');
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (success === 'pending') {
    return (
      <div className="min-h-screen bg-[#111113] flex items-center justify-center p-4 font-[family-name:var(--font-inter)]">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-wide">
              PCG Tools
            </h1>
          </div>
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Registration Submitted</h2>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Your account is pending admin approval. You&apos;ll be able to sign in once an admin approves your request.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111113] flex items-center justify-center p-4 font-[family-name:var(--font-inter)]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-wide">
            PCG Tools
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Portfolio Consulting Group</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-zinc-100 mb-6">Request account access</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">First name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  className={`w-full px-3 py-2.5 bg-zinc-800/60 border rounded-lg text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors ${fieldErrors.firstName ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-zinc-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/30'}`}
                  placeholder="First"
                  autoComplete="given-name"
                />
                {fieldErrors.firstName && <p className="text-red-400 text-xs mt-1">{fieldErrors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Last name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  className={`w-full px-3 py-2.5 bg-zinc-800/60 border rounded-lg text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors ${fieldErrors.lastName ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-zinc-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/30'}`}
                  placeholder="Last"
                  autoComplete="family-name"
                />
                {fieldErrors.lastName && <p className="text-red-400 text-xs mt-1">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                className={`w-full px-3 py-2.5 bg-zinc-800/60 border rounded-lg text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors ${fieldErrors.email ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-zinc-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/30'}`}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className={`w-full px-3 py-2.5 bg-zinc-800/60 border rounded-lg text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors pr-10 ${fieldErrors.password ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-zinc-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/30'}`}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  className={`w-full px-3 py-2.5 bg-zinc-800/60 border rounded-lg text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors pr-10 ${fieldErrors.confirmPassword ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-zinc-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/30'}`}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                className={`w-full px-3 py-2.5 bg-zinc-800/60 border rounded-lg text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors ${fieldErrors.title ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-zinc-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/30'}`}
                placeholder="e.g. Associate, Analyst"
                autoComplete="organization-title"
              />
              {fieldErrors.title && <p className="text-red-400 text-xs mt-1">{fieldErrors.title}</p>}
            </div>

            {/* Team + Office row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Team</label>
                <GlassSelect
                  value={form.team}
                  onChange={v => { setForm(prev => ({ ...prev, team: v })); setFieldErrors(prev => ({ ...prev, team: '' })); }}
                  options={TEAMS}
                  placeholder="Select team"
                  hasError={!!fieldErrors.team}
                />
                {fieldErrors.team && <p className="text-red-400 text-xs mt-1">{fieldErrors.team}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Office</label>
                <GlassSelect
                  value={form.office}
                  onChange={v => { setForm(prev => ({ ...prev, office: v })); setFieldErrors(prev => ({ ...prev, office: '' })); }}
                  options={OFFICES}
                  placeholder="Select office"
                  hasError={!!fieldErrors.office}
                />
                {fieldErrors.office && <p className="text-red-400 text-xs mt-1">{fieldErrors.office}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all mt-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isLoading ? 'Submitting...' : 'Request access'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
