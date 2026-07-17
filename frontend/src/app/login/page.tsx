'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try {
      setLoading(true);
      const res = await authApi.login({ email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      router.push('/');
    } catch (err: any) {
      setError('Invalid credentials');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — brand */}
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
            Messages that<br />matter, handled.
          </h1>
          <p className="mt-4 text-sm text-background/60 max-w-sm">
            Smart triage for every WhatsApp message. Urgent things surface. Routine things answer themselves.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-base font-semibold tracking-tight">Triage</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
          </div>

          <h2 className="hidden lg:block text-3xl font-semibold tracking-tight mb-8">Sign in</h2>

          {error && (
            <div className="mb-6 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-muted-foreground/40"
                placeholder="you@example.com" autoFocus disabled={loading} />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-muted-foreground/40"
                placeholder="••••••••" disabled={loading} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50">
              {loading ? 'Signing in…' : 'Sign in'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-foreground font-medium hover:underline underline-offset-4">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
