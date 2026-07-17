'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Zap, Sparkles } from 'lucide-react';
import { templatesApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import type { Template } from '@/types';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', triggerIntent: '', replyText: '', active: true, isUrgentAcknowledgement: false, priority: 0 });

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/login'); return; }
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try { setLoading(true); setError('');
      const res = await templatesApi.list();
      setTemplates(res.data.templates);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to load templates'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditingTpl(null); setForm({ name: '', triggerIntent: '', replyText: '', active: true, isUrgentAcknowledgement: false, priority: 0 }); setDialogOpen(true); }
  function openEdit(tpl: Template) { setEditingTpl(tpl); setForm({ name: tpl.name, triggerIntent: tpl.triggerIntent, replyText: tpl.replyText, active: tpl.active, isUrgentAcknowledgement: tpl.isUrgentAcknowledgement, priority: tpl.priority }); setDialogOpen(true); }

  async function handleSave() {
    if (!form.name.trim() || !form.triggerIntent.trim() || !form.replyText.trim()) return;
    try { setSaving(true); setError('');
      editingTpl ? await templatesApi.update(editingTpl.id, form) : await templatesApi.create(form);
      setDialogOpen(false); fetchTemplates();
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return;
    try { await templatesApi.delete(id); fetchTemplates(); } catch (err: any) { setError(err.response?.data?.message || 'Failed to delete'); }
  }

  async function handleToggle(id: string) {
    try { await templatesApi.toggle(id); fetchTemplates(); } catch (err: any) { setError(err.response?.data?.message || 'Failed to toggle'); }
  }

  const filtered = search ? templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.triggerIntent.toLowerCase().includes(search.toLowerCase())) : templates;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />Auto-Reply Templates
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Smart replies, <span className="italic font-[family-name:var(--font-display)]">zero LLM cost</span>.</h1>
            <p className="mt-2 text-muted-foreground">{templates.length} templates — matches via AI embeddings, auto-replies instantly</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90">
            <Plus className="h-4 w-4" />New Template
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        {error && <div className="mb-4 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">{error}</div>}

        <div className="border-y border-border bg-muted/30">
          <div className="py-4 px-5 flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Templates match incoming messages via embedding similarity (≥85%). When matched, the system auto-replies with <strong className="text-foreground">zero LLM cost</strong>. Build more templates to increase your fast-path rate.
            </p>
          </div>
        </div>

        <div className="relative mt-6 mb-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." className="pl-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="animate-pulse h-40 rounded-2xl bg-muted" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-1">No templates yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first auto-reply template</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"><Plus className="h-4 w-4" />Create Template</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(tpl => (
              <div key={tpl.id} className={`rounded-2xl border bg-background p-6 transition shadow-[0_1px_2px_rgba(0,0,0,.05),0_8px_24px_-8px_rgba(0,0,0,.08)] ${!tpl.active ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{tpl.name}</h3>
                  <Switch checked={tpl.active} onCheckedChange={() => handleToggle(tpl.id)} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {tpl.isUrgentAcknowledgement && <Badge className="text-xs px-1.5 bg-destructive/10 text-destructive">Urgent Ack</Badge>}
                  <Badge variant="outline" className="text-xs">P{tpl.priority}</Badge>
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trigger</p>
                <p className="text-sm mt-0.5 mb-2">{tpl.triggerIntent}</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reply</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 mb-3">{tpl.replyText}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>Used {tpl.usageCount}x</span>
                  {tpl.lastUsedAt && <span>{formatRelativeTime(tpl.lastUsedAt)}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(tpl)} className="flex-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition">Edit</button>
                  <button onClick={() => handleDelete(tpl.id)} className="rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight">{editingTpl ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>Define trigger phrase and auto-reply text. AI embeddings match similar messages.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Template Name *</label>
                <Input placeholder="e.g., Business Hours" className="rounded-xl" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Trigger Intent *</label>
                <Input placeholder="e.g., What are your hours?" className="rounded-xl" value={form.triggerIntent} onChange={e => setForm(p => ({ ...p, triggerIntent: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Reply Text *</label>
                <Textarea placeholder="Auto-reply message..." rows={3} className="rounded-xl" value={form.replyText} onChange={e => setForm(p => ({ ...p, replyText: e.target.value }))} />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.isUrgentAcknowledgement} onCheckedChange={v => setForm(p => ({ ...p, isUrgentAcknowledgement: v }))} /><span className="text-sm">Urgent Ack</span></div>
                <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Priority:</span><Input type="number" className="w-20 rounded-xl" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))} /></div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <button onClick={() => setDialogOpen(false)} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 transition">{saving ? 'Saving…' : editingTpl ? 'Update' : 'Create'}</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
