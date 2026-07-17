'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
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
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-accent relative">
        <div className="relative flex flex-col justify-end p-16">
          <p className="text-xs tracking-widest uppercase text-accent-foreground/50 mb-4">WhatsApp Copilot</p>
          <h1 className="text-4xl font-light text-accent-foreground leading-tight">
            Set up in under<br />two minutes.
          </h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-2">WhatsApp Copilot</p>
            <h2 className="text-3xl font-light">Create account</h2>
          </div>

          <h2 className="hidden lg:block text-3xl font-light mb-8">Create your account</h2>

          {error && <div className="mb-6 p-3 border border-destructive/20 bg-destructive/5 text-sm text-destructive rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { id: 'orgName', label: 'Organization', type: 'text', placeholder: 'Your business name' },
              { id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
              { id: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
              { id: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat password' },
            ].map(f => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-xs tracking-wide text-muted-foreground mb-1.5">{f.label}</label>
                <input id={f.id} type={f.type} value={(form as any)[f.id]} onChange={e => update(f.id, e.target.value)}
                  className="w-full px-0 py-2 bg-transparent border-0 border-b border-border focus:border-foreground outline-none text-base font-light transition-colors placeholder:text-muted-foreground/40"
                  placeholder={f.placeholder} disabled={loading} />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-foreground text-background text-sm font-light tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-sm text-muted-foreground font-light text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground hover:underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
