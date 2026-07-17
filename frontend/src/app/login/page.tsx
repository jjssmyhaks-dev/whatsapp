'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

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
      {/* Left panel — brand */}
      <div className="hidden lg:flex w-1/2 bg-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent/90 to-accent/70" />
        <div className="relative flex flex-col justify-end p-16">
          <p className="text-xs tracking-widest uppercase text-accent-foreground/50 mb-4">WhatsApp Copilot</p>
          <h1 className="text-5xl font-light text-accent-foreground leading-tight">
            Messages that matter,<br />handled with care.
          </h1>
          <p className="mt-6 text-sm text-accent-foreground/60 max-w-sm font-light">
            Smart triage for every WhatsApp message. Urgent things surface. Routine things answer themselves.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">WhatsApp Copilot</p>
            <h2 className="text-3xl font-light">Sign in</h2>
          </div>

          <h2 className="hidden lg:block text-3xl font-light mb-8">Sign in</h2>

          {error && <div className="mb-6 p-3 border border-destructive/20 bg-destructive/5 text-sm text-destructive rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs tracking-wide text-muted-foreground mb-1.5">Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-0 py-2 bg-transparent border-0 border-b border-border focus:border-foreground outline-none text-base font-light transition-colors placeholder:text-muted-foreground/40"
                placeholder="you@example.com" autoFocus disabled={loading} />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs tracking-wide text-muted-foreground mb-1.5">Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-0 py-2 bg-transparent border-0 border-b border-border focus:border-foreground outline-none text-base font-light transition-colors placeholder:text-muted-foreground/40"
                placeholder="••••••••" disabled={loading} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-foreground text-background text-sm font-light tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-sm text-muted-foreground font-light text-center">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-foreground hover:underline underline-offset-4">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
