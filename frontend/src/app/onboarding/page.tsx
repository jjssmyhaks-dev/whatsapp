'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, Sparkles, Zap, MessageCircleReply } from 'lucide-react';

const STEPS = [
  { title: 'Account created', desc: 'Welcome! Let\'s get you set up in under 5 minutes.' },
  { title: 'Connect WhatsApp', desc: 'Link your WhatsApp Business number. No new SIM needed.' },
  { title: 'Set your context', desc: 'Business hours, urgent keywords, and starter reply templates.' },
  { title: 'Go live', desc: 'Your AI agent is ready to handle messages.' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const seg = params.get('segment') || 'contractor';
  const [step, setStep] = useState(0);

  // If first visit direct to onboarding, redirect to dashboard
  if (step > 3) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-foreground text-background"><Sparkles className="h-3.5 w-3.5" /></div>
            <span className="text-base font-semibold tracking-tight">Triage</span>
          </div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">Step {step + 1} of {STEPS.length}</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 pt-16 pb-24">
        {step === 0 && (
          <div className="text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 mx-auto mb-6">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Account created!</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {seg === 'business' ? 'Your team account is ready. Let\'s set up your AI workforce.' : 'Your account is ready. Let\'s get you set up in 5 minutes.'}
            </p>
            <div className="mt-10 flex justify-center">
              <button onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background shadow-lg hover:opacity-90">
                Start Setup <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Connect your WhatsApp</h2>
            <p className="mt-2 text-muted-foreground">
              Link your existing WhatsApp Business number through Meta's embedded signup. Takes 2 minutes.
            </p>

            <div className="mt-8 rounded-2xl border-2 border-dashed border-border p-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#25D366]/10 mx-auto mb-4">
                <MessageCircleReply className="h-7 w-7 text-[#25D366]" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">Click below to open Meta's secure WhatsApp Business setup</p>
              <button onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium text-white hover:opacity-90 shadow-lg">
                Connect WhatsApp Business
              </button>
              <p className="mt-4 text-xs text-muted-foreground">
                You can also skip this and connect later from Settings → WhatsApp
              </p>
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(0)} className="text-sm text-muted-foreground hover:text-foreground transition">← Back</button>
              <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground transition">Skip for now →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Set your business context</h2>
            <p className="mt-2 text-muted-foreground">This helps the AI match your tone and know what matters to you.</p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-border bg-background p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />Urgent Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {['urgent', 'emergency', 'asap', 'critical', 'broken', 'help immediately', 'server down'].map(k => (
                    <span key={k} className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium">{k}</span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Pre-filled — you can edit these anytime in Settings</p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><MessageCircleReply className="h-4 w-4 text-primary" />Starter Auto-Replies</h3>
                <div className="space-y-2">
                  {[
                    { trigger: 'What are your business hours?', reply: 'We\'re open 9 AM – 6 PM, Monday to Saturday. For urgent requests, just say "urgent" and we\'ll respond ASAP.' },
                    { trigger: 'What are your rates?', reply: 'Our rates depend on the scope of work. Can you share a few details so I can give you an accurate quote?' },
                  ].map((t, i) => (
                    <div key={i} className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">When someone asks:</p>
                      <p className="text-sm font-medium">"{t.trigger}"</p>
                      <p className="text-xs text-muted-foreground mt-2 mb-1">Auto-reply:</p>
                      <p className="text-sm text-muted-foreground">"{t.reply}"</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">You can add, edit, or remove templates anytime</p>
              </div>

              {seg === 'business' && (
                <div className="rounded-2xl border border-border bg-background p-5">
                  <h3 className="font-semibold text-sm mb-3">Active Agents</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Triage Agent', desc: 'Classifies and auto-replies to inbound messages', enabled: true },
                      { name: 'Sales Agent', desc: 'Tracks leads, sends follow-ups, flags when you\'re needed', enabled: true },
                      { name: 'Outreach Agent', desc: 'Runs campaigns and drip sequences (requires approved templates)', enabled: false },
                      { name: 'Internal-Ops Agent', desc: 'Handles team messages, task status, and assignments', enabled: false },
                    ].map(a => (
                      <div key={a.name} className="flex items-center justify-between py-2">
                        <div><p className="text-sm font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{a.desc}</p></div>
                        <span className={`text-xs rounded-full px-2.5 py-0.5 ${a.enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {a.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground transition">← Back</button>
              <button onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 mx-auto mb-6">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">You're live!</h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Your AI agent is now watching your WhatsApp. Messages will be triaged, auto-replied, and you'll be alerted for anything that needs your attention.
            </p>

            <div className="mt-10 max-w-xs mx-auto rounded-2xl border border-border bg-background p-5 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium">Status: Live</span>
              </div>
              <p className="text-xs text-muted-foreground">All systems running. You're ready to receive messages.</p>
            </div>

            <div className="mt-10 flex justify-center gap-3">
              <button onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background shadow-lg hover:opacity-90">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
