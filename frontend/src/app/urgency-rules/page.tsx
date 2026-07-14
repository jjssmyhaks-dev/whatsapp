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
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { UrgencyRule } from '@/types';

// Form schema
const urgencyRuleSchema = z.object({
  keywordOrPhrase: z.string().min(1, 'Keyword or phrase is required'),
  urgencyLevel: z.enum(['urgent', 'important', 'routine']),
  matchType: z.enum(['contains', 'exact', 'regex', 'starts_with', 'ends_with']).optional(),
  isCaseSensitive: z.boolean().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().min(0).max(100).optional(),
});

type UrgencyRuleFormData = z.infer<typeof urgencyRuleSchema>;

// Mock data for demo
const mockUrgencyRules: UrgencyRule[] = [
  {
    id: '1',
    userId: 'user-1',
    keywordOrPhrase: 'urgent',
    urgencyLevel: 'urgent',
    matchType: 'contains',
    isCaseSensitive: false,
    isActive: true,
    priority: 10,
    usageCount: 15,
    lastTriggeredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'user-1',
    keywordOrPhrase: 'emergency',
    urgencyLevel: 'urgent',
    matchType: 'contains',
    isCaseSensitive: false,
    isActive: true,
    priority: 10,
    usageCount: 8,
    lastTriggeredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    userId: 'user-1',
    keywordOrPhrase: 'ASAP',
    urgencyLevel: 'urgent',
    matchType: 'exact',
    isCaseSensitive: true,
    isActive: true,
    priority: 8,
    usageCount: 5,
    lastTriggeredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    userId: 'user-1',
    keywordOrPhrase: 'help',
    urgencyLevel: 'important',
    matchType: 'contains',
    isCaseSensitive: false,
    isActive: true,
    priority: 5,
    usageCount: 22,
    lastTriggeredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    userId: 'user-1',
    keywordOrPhrase: 'support',
    urgencyLevel: 'important',
    matchType: 'contains',
    isCaseSensitive: false,
    isActive: false,
    priority: 3,
    usageCount: 12,
    lastTriggeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Urgency level colors
function getUrgencyColor(level: string): string {
  switch (level) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'important':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'routine':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export default function UrgencyRulesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'urgent' | 'important' | 'routine'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<UrgencyRule | null>(null);
  const [rules, setRules] = useState<UrgencyRule[]>(mockUrgencyRules);

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
  } = useForm<UrgencyRuleFormData>({
    resolver: zodResolver(urgencyRuleSchema),
    defaultValues: {
      keywordOrPhrase: '',
      urgencyLevel: 'urgent',
      matchType: 'contains',
      isCaseSensitive: false,
      isActive: true,
      priority: 0,
    },
  });

  const onSubmit = (data: UrgencyRuleFormData) => {
    if (editingRule) {
      // Update rule
      setRules(
        rules.map((rule) =>
          rule.id === editingRule.id
            ? {
                ...rule,
                keywordOrPhrase: data.keywordOrPhrase,
                urgencyLevel: data.urgencyLevel,
                matchType: data.matchType || rule.matchType,
                isCaseSensitive: data.isCaseSensitive || rule.isCaseSensitive,
                isActive: data.isActive !== undefined ? data.isActive : rule.isActive,
                priority: data.priority || rule.priority,
              }
            : rule,
        ),
      );
    } else {
      // Add new rule
      const newRule: UrgencyRule = {
        id: `rule-${Date.now()}`,
        userId: 'user-1',
        keywordOrPhrase: data.keywordOrPhrase,
        urgencyLevel: data.urgencyLevel,
        matchType: data.matchType || 'contains',
        isCaseSensitive: data.isCaseSensitive || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
        priority: data.priority || 0,
        usageCount: 0,
        lastTriggeredAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRules([...rules, newRule]);
    }

    setIsDialogOpen(false);
    setEditingRule(null);
    reset();
  };

  const handleEdit = (rule: UrgencyRule) => {
    setEditingRule(rule);
    reset({
      keywordOrPhrase: rule.keywordOrPhrase,
      urgencyLevel: rule.urgencyLevel,
      matchType: rule.matchType,
      isCaseSensitive: rule.isCaseSensitive,
      isActive: rule.isActive,
      priority: rule.priority,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const handleToggle = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, isActive: !rule.isActive } : rule,
      ),
    );
  };

  const filteredRules = rules.filter((rule) => {
    // Filter by status
    if (filter === 'all') return true;
    if (filter === 'active' && !rule.isActive) return false;
    if (filter === 'inactive' && rule.isActive) return false;
    if (filter === 'urgent' && rule.urgencyLevel !== 'urgent') return false;
    if (filter === 'important' && rule.urgencyLevel !== 'important') return false;
    if (filter === 'routine' && rule.urgencyLevel !== 'routine') return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        rule.keywordOrPhrase.toLowerCase().includes(query) ||
        rule.urgencyLevel.toLowerCase().includes(query)
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
            <h1 className="text-2xl font-bold">Urgency Rules</h1>
            <p className="text-muted-foreground">Configure keywords and phrases for urgency detection</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Rule' : 'Add Rule'}
                </DialogTitle>
                <DialogDescription>
                  {editingRule
                    ? 'Update your urgency detection rule'
                    : 'Create a new rule for detecting urgent messages'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keywordOrPhrase">Keyword or Phrase</Label>
                  <Input
                    id="keywordOrPhrase"
                    placeholder="e.g., urgent, emergency, ASAP"
                    {...register('keywordOrPhrase')}
                  />
                  {errors.keywordOrPhrase && (
                    <p className="text-sm text-destructive">{errors.keywordOrPhrase.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgencyLevel">Urgency Level</Label>
                  <Select defaultValue="urgent" {...register('urgencyLevel')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="routine">Routine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matchType">Match Type</Label>
                    <Select defaultValue="contains" {...register('matchType')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="exact">Exact</SelectItem>
                        <SelectItem value="regex">Regex</SelectItem>
                        <SelectItem value="starts_with">Starts With</SelectItem>
                        <SelectItem value="ends_with">Ends With</SelectItem>
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

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isCaseSensitive"
                      {...register('isCaseSensitive')}
                    />
                    <Label htmlFor="isCaseSensitive" className="cursor-pointer">
                      Case Sensitive
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      defaultChecked
                      {...register('isActive')}
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Active
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    setEditingRule(null);
                    reset();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
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
              placeholder="Search rules..."
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
              <SelectItem value="all">All Rules</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="important">Important</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Urgency Rules</CardTitle>
            <CardDescription>
              {filteredRules.length} rules found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No rules found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword/Phrase</TableHead>
                    <TableHead>Urgency Level</TableHead>
                    <TableHead>Match Type</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {rule.keywordOrPhrase}
                      </TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(rule.urgencyLevel)}>
                          {rule.urgencyLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {rule.matchType}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {rule.usageCount} triggers
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => handleToggle(rule.id)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(rule)}
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
                                  This action cannot be undone. This will permanently delete the rule.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(rule.id)}>
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

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How Urgency Rules Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Urgency rules are checked first in the triage pipeline. When a message contains a keyword or phrase from an active rule, it is immediately classified with the specified urgency level without calling the AI model.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Contains:</strong> Message contains the keyword anywhere</li>
                <li><strong>Exact:</strong> Message exactly matches the keyword</li>
                <li><strong>Regex:</strong> Use regular expressions for complex patterns</li>
                <li><strong>Starts With:</strong> Message starts with the keyword</li>
                <li><strong>Ends With:</strong> Message ends with the keyword</li>
              </ul>
              <p className="text-muted-foreground">
                <strong>Priority:</strong> Rules are checked in priority order (highest first). Once a rule matches, no further rules are checked.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
