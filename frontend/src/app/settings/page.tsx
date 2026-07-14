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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, User, Key, Bell, CreditCard, Database, Shield } from 'lucide-react';
import { authApi } from '@/lib/api';

// Profile form schema
const profileSchema = z.object({
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

// Password form schema
const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: errorsProfile },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authApi.updateProfile(data);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      setSuccess('Password changed successfully');
      resetPassword();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full md:w-auto md:grid-cols-5">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="password">
              <Key className="h-4 w-4 mr-2" />
              Password
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      defaultValue="My Business"
                      {...registerProfile('orgName')}
                    />
                    {errorsProfile.orgName && (
                      <p className="text-sm text-destructive">{errorsProfile.orgName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="user@example.com"
                      {...registerProfile('email')}
                    />
                    {errorsProfile.email && (
                      <p className="text-sm text-destructive">{errorsProfile.email.message}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...registerPassword('currentPassword')}
                    />
                    {errorsPassword.currentPassword && (
                      <p className="text-sm text-destructive">{errorsPassword.currentPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...registerPassword('newPassword')}
                    />
                    {errorsPassword.newPassword && (
                      <p className="text-sm text-destructive">{errorsPassword.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...registerPassword('confirmPassword')}
                    />
                    {errorsPassword.confirmPassword && (
                      <p className="text-sm text-destructive">{errorsPassword.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications for urgent and important messages
                    </p>
                    <Button variant="outline" size="sm">
                      <Bell className="h-4 w-4 mr-2" />
                      Test Notification
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email summaries of daily activity
                    </p>
                    <Button variant="outline" size="sm">
                      Configure Email
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Notification Preferences</Label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Urgent Messages</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify me immediately for urgent messages
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Important Messages</Label>
                          <p className="text-sm text-muted-foreground">
                            Notify me for important messages
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Daily Summary</Label>
                          <p className="text-sm text-muted-foreground">
                            Send daily summary email
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Current Plan</h3>
                        <p className="text-sm text-muted-foreground">Free Tier</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Upgrade
                      </Button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Messages this month</p>
                        <p className="text-2xl font-bold">128 / 100</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Usage</p>
                        <p className="text-2xl font-bold text-orange-500">128%</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Available Plans</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      {["Free", "Starter", "Growth", "Enterprise"].map((plan) => (
                        <div key={plan} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{plan}</h4>
                          <p className="text-sm text-muted-foreground">
                            {plan === 'Free' ? '100 messages/month' :
                             plan === 'Starter' ? '1,000 messages/month' :
                             plan === 'Growth' ? '10,000 messages/month' :
                             'Custom'}
                          </p>
                          <Button variant="outline" size="sm" className="mt-2">
                            {plan === 'Free' ? 'Current' : 'Select'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Payment Methods</h3>
                    <p className="text-sm text-muted-foreground">
                      No payment methods configured
                    </p>
                    <Button variant="outline" size="sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Sessions</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your active login sessions
                    </p>
                    <Button variant="outline" size="sm">
                      View Sessions
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Data Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Export your data for backup or migration
                    </p>
                    <Button variant="outline" size="sm">
                      <Database className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-red-500">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
