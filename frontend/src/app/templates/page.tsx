'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Search, Filter, MoreVertical, Check, X } from 'lucide-react';
import { templatesApi } from '@/lib/api';
import { Template } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Form schema
const templateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  triggerIntent: z.string().min(2, 'Trigger intent must be at least 2 characters'),
  replyText: z.string().min(1, 'Reply text is required'),
  isUrgentAcknowledgement: z.boolean().optional(),
  responseType: z.enum(['text', 'template', 'interactive']).optional(),
  priority: z.number().min(0).max(100).optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

// Mock data for demo
const mockTemplates: Template[] = [
  {
    id: '1',
    userId: 'user-1',
    name: 'Urgent Acknowledgement',
    triggerIntent: 'urgent help needed immediately',
    triggerEmbedding: null,
    replyText: 'Thank you for your message. We will respond shortly.',
    active: true,
    isUrgentAcknowledgement: true,
    responseType: 'text',
    metadata: {},
    usageCount: 15,
    lastUsedAt: new Date().toISOString(),
    priority: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'user-1',
    name: 'Greeting Response',
    triggerIntent: 'hello hi hey',
    triggerEmbedding: null,
    replyText: 'Hello! How can we help you today?',
    active: true,
    isUrgentAcknowledgement: false,
    responseType: 'text',
    metadata: {},
    usageCount: 25,
    lastUsedAt: new Date().toISOString(),
    priority: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    userId: 'user-1',
    name: 'Pricing Inquiry',
    triggerIntent: 'price cost how much',
    triggerEmbedding: null,
    replyText: 'Our pricing starts at $10/month. Please visit our website for detailed plans.',
    active: false,
    isUrgentAcknowledgement: false,
    responseType: 'text',
    metadata: {},
    usageCount: 8,
    lastUsedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'urgent'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Use React Query for data fetching
  const queryClient = useQueryClient();
  
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      // In a real implementation, fetch from API
      // const response = await templatesApi.list();
      // return response.data.templates;
      return mockTemplates;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      // In a real implementation
      // return templatesApi.create(data);
      return { data: { ...data, id: `template-${Date.now()}` } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template created successfully');
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create template');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateFormData> }) => {
      // In a real implementation
      // return templatesApi.update(id, data);
      return { data: { id, ...data } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template updated successfully');
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update template');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // In a real implementation
      // return templatesApi.delete(id);
      return { data: { success: true } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete template');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      // In a real implementation
      // return templatesApi.toggle(id);
      return { data: { id, active: true } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to toggle template');
    },
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      triggerIntent: '',
      replyText: '',
      isUrgentAcknowledgement: false,
      responseType: 'text',
      priority: 0,
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    reset({
      name: template.name,
      triggerIntent: template.triggerIntent,
      replyText: template.replyText,
      isUrgentAcknowledgement: template.isUrgentAcknowledgement,
      responseType: template.responseType,
      priority: template.priority,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const filteredTemplates = (templates || []).filter((template) => {
    // Filter by status
    if (filter === 'all') return true;
    if (filter === 'active' && !template.active) return false;
    if (filter === 'inactive' && template.active) return false;
    if (filter === 'urgent' && !template.isUrgentAcknowledgement) return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.triggerIntent.toLowerCase().includes(query) ||
        template.replyText.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Templates</h1>
            <p className="text-muted-foreground">Manage your auto-reply templates</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Add Template'}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate
                    ? 'Update your template settings'
                    : 'Create a new template for auto-replies'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Greeting Response"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="triggerIntent">Trigger Intent</Label>
                  <Input
                    id="triggerIntent"
                    placeholder="e.g., hello hi hey"
                    {...register('triggerIntent')}
                  />
                  <p className="text-sm text-muted-foreground">
                    Words or phrases that trigger this template
                  </p>
                  {errors.triggerIntent && (
                    <p className="text-sm text-destructive">{errors.triggerIntent.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="replyText">Reply Text</Label>
                  <Textarea
                    id="replyText"
                    placeholder="e.g., Hello! How can we help you today?"
                    rows={4}
                    {...register('replyText')}
                  />
                  {errors.replyText && (
                    <p className="text-sm text-destructive">{errors.replyText.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responseType">Response Type</Label>
                    <Select defaultValue="text" {...register('responseType')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="template">Template</SelectItem>
                        <SelectItem value="interactive">Interactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={0}
                      {...register('priority', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isUrgentAcknowledgement"
                    {...register('isUrgentAcknowledgement')}
                  />
                  <Label htmlFor="isUrgentAcknowledgement" className="cursor-pointer">
                    Urgent Acknowledgement Template
                  </Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                    {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filter} onValueChange={setFilter as any}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="urgent">Urgent Acknowledgement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Templates</CardTitle>
            <CardDescription>
              {filteredTemplates.length} templates found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">Error loading templates</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No templates found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Reply</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        {template.name}
                        {template.isUrgentAcknowledgement && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Urgent
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {template.triggerIntent}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {template.replyText}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.responseType}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {template.usageCount} uses
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={template.active}
                          onCheckedChange={() => handleToggle(template.id)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the template.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(template.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
