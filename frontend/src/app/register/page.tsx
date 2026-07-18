'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}><RegisterForm /></Suspense>;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seg = searchParams.get('segment') || 'contractor';
  const isBusiness = seg === 'business';
  const [form, setForm] = useState({ orgName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field: string, value: string) { setForm(p => ({ ...p, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    try {
      setLoading(true);
      const res = await authApi.register({ email: form.email, password: form.password, orgName: form.orgName });
      localStorage.setItem('accessToken', res.data.accessToken);
      router.push(`/onboarding?segment=${seg}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(800px 500px at 20% 50%, oklch(0.92 0.11 135 / 0.7), transparent 60%)' }} />
        <div className="relative flex flex-col justify-end p-16">
          <div className="flex items-center gap-2 mb-6">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-background/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Triage</span>
          </div>
          <h1 className="text-5xl font-semibold tracking-tight leading-tight">
            Set up in under<br />two minutes.
          </h1>
          <p className="mt-4 text-sm text-background/60 max-w-sm">
            Connect your WhatsApp Business number, set your preferences, and let AI handle the rest.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-base font-semibold tracking-tight">Triage</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">Create your {isBusiness ? 'team' : ''} account</h2>
          </div>

          <h2 className="hidden lg:block text-3xl font-semibold tracking-tight mb-1">Create your {isBusiness ? 'team' : ''} account</h2>
          <p className="hidden lg:block text-sm text-muted-foreground mb-6">{isBusiness ? 'For teams running sales, support & ops on WhatsApp' : 'For solo operators & freelancers'}</p>

          {error && (
            <div className="mb-6 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: 'orgName', label: 'Organization', type: 'text', placeholder: 'Your business name' },
              { id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
              { id: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
              { id: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat password' },
            ].map(f => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-xs font-medium text-muted-foreground mb-1.5">{f.label}</label>
                <input id={f.id} type={f.type} value={(form as any)[f.id]} onChange={e => update(f.id, e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-muted-foreground/40"
                  placeholder={f.placeholder} disabled={loading} />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50 mt-2">
              {loading ? 'Creating account…' : 'Create account'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground font-medium hover:underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
