'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Sparkles, Bell, ShieldCheck, Smartphone, Radar, TrendingUp, Megaphone, Users, LayoutDashboard, MapPin, MessageCircleReply } from 'lucide-react';

type Segment = 'contractor' | 'business';

const copy: Record<Segment, {
  ctaNav: string; heroLabel: string; heroSub: string; cta: string; cta2: string;
  problemHeader: string; problemItems: string[];
  steps: { t: string; d: string }[];
  features: { icon: React.ComponentType<{ className?: string }>; t: string; d: string }[];
  pricingHeader: string; pricingSub: string;
  proof: string; finalHeadline: string; finalCta: string;
}> = {
  contractor: {
    ctaNav: 'Start Free Trial',
    heroLabel: 'For solo operators & freelancers',
    heroSub: 'Triage reads every message, alerts you the second something\'s urgent, and auto-replies to the routine stuff — so you can stay on-site and still never miss a lead.',
    cta: 'Start Free — No Credit Card',
    cta2: 'See it in action (30 sec)',
    problemHeader: 'Sound familiar?',
    problemItems: [
      'Important client messages get buried under "hi", "you there?", and routine questions.',
      'You find out about an emergency call three hours after it came in.',
      'You\'re typing the same "yes I\'m available", "here\'s my rate" for the fifth time today.',
      'No way to see what actually needs you right now without scrolling through everything.',
    ],
    steps: [
      { t: 'Connect your WhatsApp Business number', d: '5-minute guided setup. No new SIM, no new app.' },
      { t: 'Tell it what matters', d: 'Business hours, urgent keywords, a few starter reply templates.' },
      { t: 'Go live', d: 'It triages every message, alerts you instantly for anything real, and handles the rest.' },
    ],
    features: [
      { icon: Bell, t: 'Instant Alerts', d: 'Urgent messages push straight to your phone, with sender + snippet, the moment they land.' },
      { icon: MessageCircleReply, t: 'Smart Auto-Reply', d: 'Routine questions get answered automatically, in your tone, without you lifting a finger.' },
      { icon: ShieldCheck, t: 'Never Ghost a Client', d: 'If you haven\'t replied in time, it sends a holding message so no one feels ignored.' },
      { icon: Smartphone, t: 'Zero Learning Curve', d: 'Lives inside WhatsApp. No new app to check, no dashboard you\'re forced to live in.' },
    ],
    pricingHeader: 'Simple pricing. One number.',
    pricingSub: 'Priced per WhatsApp number and message volume — built for solo use, no per-seat complexity.',
    proof: 'Trusted by solo operators across India',
    finalHeadline: 'Stop losing clients in your own inbox.',
    finalCta: 'Start Free — Set Up in 5 Minutes',
  },
  business: {
    ctaNav: 'Book a Demo',
    heroLabel: 'For teams running sales, support & ops on WhatsApp',
    heroSub: 'Triage, outreach, sales follow-up, marketing campaigns and internal team comms — one AI layer across every conversation, so nothing falls through and nobody\'s buried in chats.',
    cta: 'Start Free Trial',
    cta2: 'Book a Demo',
    problemHeader: 'WhatsApp scales your reach. It doesn\'t scale your team.',
    problemItems: [
      'Leads go cold because nobody replied within the hour.',
      'Marketing broadcasts and sales follow-ups live in someone\'s personal phone, not a system.',
      'Internal team updates get lost in the same inbox as customer messages.',
      'No visibility into response times, missed messages, or what\'s actually working.',
    ],
    steps: [
      { t: 'Connect your WhatsApp Business numbers', d: 'Supports multiple numbers and team members.' },
      { t: 'Set your business context', d: 'Catalog, pricing, tone, policies — feeds every agent so replies sound like you.' },
      { t: 'Deploy the agents you need', d: 'Triage & alerts, sales follow-up, outreach campaigns, internal comms.' },
      { t: 'Watch it work from one dashboard', d: 'Thread view, analytics, full control whenever you want to step in.' },
    ],
    features: [
      { icon: Radar, t: 'AI Triage Across Every Thread', d: 'Every inbound message classified and routed — urgent, important, routine, spam.' },
      { icon: TrendingUp, t: 'Sales Follow-Up, Automated', d: 'Leads tracked by stage; the agent nudges, follows up, and flags when a human\'s needed.' },
      { icon: Megaphone, t: 'Outreach & Marketing Campaigns', d: 'WhatsApp-compliant broadcast and drip sequences without manual sending.' },
      { icon: Users, t: 'Internal Team Comms', d: 'Task updates and status checks handled through the same AI layer, separate from customer chats.' },
      { icon: LayoutDashboard, t: 'One Dashboard, Full Visibility', d: 'Every category, agent, and metric — response time, missed-message rate, conversion.' },
      { icon: MapPin, t: 'Built for India', d: 'Hindi/regional language support, Razorpay billing, DPDP-compliant data handling.' },
    ],
    pricingHeader: 'Pricing that scales with your team.',
    pricingSub: 'Tiered by message volume, connected numbers, and active agents. Add agents as you grow.',
    proof: 'Trusted by growing teams across India',
    finalHeadline: 'Give your team an AI workforce that lives in WhatsApp.',
    finalCta: 'Start Free Trial / Book a Demo',
  },
};

export default function LandingPage() {
  const router = useRouter();
  const [seg, setSeg] = useState<Segment>('contractor');
  const c = copy[seg];

  return (
    <div className="min-h-screen bg-background text-foreground font-[family-name:var(--font-sans)] antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Triage</span>
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#how" className="text-sm text-muted-foreground transition hover:text-foreground">How it works</a>
            <a href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground transition hover:text-foreground">Pricing</a>
            <a href="#faq" className="text-sm text-muted-foreground transition hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="/login" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition">Sign in</a>
            <SegmentToggle compact seg={seg} setSeg={setSeg} />
            <a href={`/register?segment=${seg}`} className="hidden rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 sm:inline-flex">
              {c.ctaNav}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: 'var(--gradient-hero)' }} />
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          {/* Left */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />{c.heroLabel}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.05]">
              {seg === 'contractor' ? (
                <>Never lose a client message in the{' '}
                  <span className="italic font-[family-name:var(--font-display)]">WhatsApp chaos</span> again.</>
              ) : (
                <>Your entire WhatsApp workforce, run by{' '}
                  <span className="italic font-[family-name:var(--font-display)]">AI agents</span>.</>
              )}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">{c.heroSub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`/register?segment=${seg}`} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg transition hover:opacity-90">
                {c.cta} <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-muted/60">
                {c.cta2}
              </a>
            </div>
            <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> 5-min setup</div>
              <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> DPDP compliant</div>
            </div>
          </div>
          {/* Right — mock */}
          <div className="relative">
            {seg === 'contractor' ? (
              <div className="relative mx-auto w-full max-w-sm">
                <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-primary/10 blur-2xl" />
                <div className="rounded-[2.5rem] border-8 border-foreground bg-foreground p-1 shadow-xl">
                  <div className="overflow-hidden rounded-[2rem] bg-[#e5ddd5]">
                    <div className="flex items-center justify-between bg-[#075e54] px-4 py-3 text-background">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-background/20" />
                        <div><div className="text-sm font-medium">Ramesh — Client</div><div className="text-[10px] opacity-80">online</div></div>
                      </div>
                      <div className="text-xs opacity-80">2:14 PM</div>
                    </div>
                    <div className="space-y-2 p-4 text-[13px]">
                      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-background px-3 py-2 shadow-sm">Hey, are you free to look at the wiring issue today?</div>
                      <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm">
                        Hi! I'm on-site till 4pm — I've flagged this and you'll get a reply by then.
                        <div className="mt-1 text-right text-[10px] text-muted-foreground">auto-sent · 2:14 PM ✓✓</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-4 top-16 w-64 rounded-2xl border border-border bg-background p-3 shadow-lg">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-destructive/10"><Bell className="h-4 w-4 text-destructive" /></div>
                    <div><div className="text-xs font-semibold">Urgent — respond now</div><div className="mt-0.5 text-[11px] text-muted-foreground">Ramesh asking about today's availability</div></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative mx-auto w-full max-w-xl">
                <div className="absolute -inset-6 -z-10 rounded-3xl bg-primary/10 blur-2xl" />
                <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
                  <div className="flex items-center justify-between border-b border-border bg-muted/50 px-5 py-3">
                    <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-primary" /><span className="text-sm font-medium">Triage Inbox</span></div>
                    <span className="text-xs text-muted-foreground">All agents live</span>
                  </div>
                  <div className="divide-y divide-border">
                    {[
                      { tag: 'Urgent', color: 'bg-destructive/10 text-destructive', from: 'Priya M.', msg: 'Need quote by EOD — 500 units' },
                      { tag: 'Sales', color: 'bg-primary/15 text-primary', from: 'Arjun Retail', msg: 'Follow-up scheduled · agent handled' },
                      { tag: 'Marketing', color: 'bg-accent/50', from: 'Broadcast', msg: 'Diwali campaign · 1,240 replies' },
                      { tag: 'Internal', color: 'bg-muted', from: 'Ops team', msg: 'Status check → 3 tasks updated' },
                    ].map(r => (
                      <div key={r.tag} className="flex items-center gap-3 px-5 py-4">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.color}`}>{r.tag}</span>
                        <div className="flex-1"><div className="text-sm font-medium">{r.from}</div><div className="text-xs text-muted-foreground">{r.msg}</div></div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 border-t border-border bg-muted/50 px-5 py-4 text-center">
                    {[{ label: 'Response time', value: '42s' }, { label: 'Auto-handled', value: '78%' }, { label: 'Missed', value: '0' }].map(s => (
                      <div key={s.label}><div className="text-lg font-semibold">{s.value}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{c.problemHeader}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {c.problemItems.map((item, i) => (
              <div key={i} className="rounded-2xl border border-border bg-background p-6 text-sm leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
                <div className="mb-3 text-xs font-medium text-muted-foreground">— {String(i + 1).padStart(2, '0')}</div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Set up once. <span className="italic font-[family-name:var(--font-display)]">Runs itself.</span></h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {c.steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
              <div className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{i + 1}</div>
              <h3 className="text-base font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-12">
            <p className="text-sm font-medium text-primary">Features</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need, {seg === 'contractor' ? "nothing you don't." : 'one AI layer.'}</h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-background/10 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.map(f => (
              <div key={f.t} className="bg-foreground p-8 transition hover:bg-background/5">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-6 text-lg font-semibold">{f.t}</h3>
                <p className="mt-2 text-sm text-background/70">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{c.pricingHeader}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{c.pricingSub}</p>
          <a href={`/register?segment=${seg}`} className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90">
            {c.cta} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Social Proof */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">{c.proof}</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <figure key={i} className="rounded-2xl border border-border bg-background p-6 shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)]">
              <blockquote className="text-sm leading-relaxed">"Triage caught three urgent messages I would have missed on my first day. Paid for itself in a week."</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <div><div className="text-sm font-medium">Client {i}</div><div className="text-xs text-muted-foreground">Verified User</div></div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <p className="text-sm font-medium text-primary">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked</h2>
          <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-background">
            {[
              { q: 'Do I need to change my WhatsApp number?', a: 'No, you connect your existing WhatsApp Business number.' },
              { q: 'Is my data safe?', a: 'Yes, encrypted at rest, and we\'re DPDP Act 2023 compliant.' },
              { q: 'Can I turn off auto-reply anytime?', a: 'Yes, full manual override, anytime.' },
              seg === 'contractor'
                ? { q: 'Do I need a dashboard?', a: 'No — it\'s built to live inside WhatsApp. The dashboard is there if you want it, not required.' }
                : { q: 'Can multiple team members use this?', a: 'Yes, role-based access across sales, marketing, and internal-ops agents.' },
              seg === 'business'
                ? { q: 'Does it support outbound campaigns?', a: 'Yes, fully compliant with WhatsApp\'s template and 24-hour messaging rules.' }
                : { q: 'How much does it cost?', a: 'Priced per WhatsApp number and message volume — simple, no hidden fees.' },
            ].map(f => (
              <details key={f.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="text-base font-medium">{f.q}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-20 text-center text-background shadow-lg">
          <div className="absolute inset-0 -z-0 opacity-30" style={{ background: 'var(--gradient-hero)' }} />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">{c.finalHeadline}</h2>
            <a href={`/register?segment=${seg}`} className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground transition hover:opacity-90">
              {c.finalCta} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background"><Sparkles className="h-4 w-4" /></div>
              <span className="text-lg font-semibold tracking-tight">Triage</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">Your WhatsApp, run by AI agents.</p>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function SegmentToggle({ seg, setSeg, compact }: { seg: Segment; setSeg: (s: Segment) => void; compact?: boolean }) {
  return (
    <div className={`relative inline-flex rounded-full border border-border/60 bg-muted/50 p-1 ${compact ? 'text-xs' : 'text-sm'}`}>
      {(['contractor', 'business'] as const).map(s => (
        <button key={s} onClick={() => setSeg(s)}
          className={`relative z-10 rounded-full px-4 py-1.5 font-medium transition ${
            seg === s ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}>
          {s === 'contractor' ? 'Contractors' : 'Businesses'}
        </button>
      ))}
    </div>
  );
}
