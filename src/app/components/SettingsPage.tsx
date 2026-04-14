import { useState } from 'react';
import { ArrowLeft, User, Bell, Lock, Palette, Globe, Shield, Download, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTheme } from './ThemeContext';
import { userAPI, handleApiError } from '../../utils/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinDate?: string;
}

interface SettingsPageProps {
  user: User;
  onBack: () => void;
  onNavigateToProfile: () => void;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: any) => void;
}

export function SettingsPage({ user, onBack, onNavigateToProfile, onLogout, onUserUpdate }: SettingsPageProps) {
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile form state
  const nameParts = (user.name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState(user.role || '');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const updatedUser = await userAPI.updateProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
        role: jobTitle,
        phone,
        bio,
        company,
        department,
      } as any);

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      handleApiError(error, 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const accentColors = [
    { value: 'blue', lightClass: 'bg-blue-600', darkClass: 'bg-cyan-400', label: 'Blue → Cyan' },
    { value: 'purple', lightClass: 'bg-purple-600', darkClass: 'bg-fuchsia-400', label: 'Purple → Magenta' },
    { value: 'green', lightClass: 'bg-green-600', darkClass: 'bg-lime-400', label: 'Green → Lime' },
    { value: 'orange', lightClass: 'bg-orange-600', darkClass: 'bg-amber-400', label: 'Orange → Gold' },
    { value: 'pink', lightClass: 'bg-pink-600', darkClass: 'bg-rose-400', label: 'Pink → Coral' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onNavigateToProfile}>
              View Profile
            </Button>
            <Button variant="outline" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="account">
              <User className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Globe className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-gray-900 dark:text-gray-200">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-gray-900 dark:text-gray-200">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-900 dark:text-gray-200">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-900 dark:text-gray-200">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-gray-900 dark:text-gray-200">Job Title</Label>
                    <Input
                      id="role"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio" className="text-gray-900 dark:text-gray-200">Bio</Label>
                    <textarea
                      id="bio"
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
                <Button
                  className="mt-6 btn-accent"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Organization</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company" className="text-gray-900 dark:text-gray-200">Company Name</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Your Company"
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department" className="text-gray-900 dark:text-gray-200">Department</Label>
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Marketing, Engineering"
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                </div>
                <Button className="mt-6" variant="outline" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Update Organization'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">All Email Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications for all activities</p>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Task Reminders</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get reminders about upcoming tasks</p>
                    </div>
                    <Switch checked={taskReminders} onCheckedChange={setTaskReminders} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Weekly Report</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive weekly summary of your activities</p>
                    </div>
                    <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Push Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications on your device</p>
                    </div>
                    <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">New Messages</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when you receive new messages</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Task Updates</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Notifications when tasks are updated</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Schedule</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-900 dark:text-gray-200">Quiet Hours</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Mute notifications during these hours</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quietStart" className="text-gray-900 dark:text-gray-200">From</Label>
                        <Input id="quietStart" type="time" defaultValue="22:00" className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <Label htmlFor="quietEnd" className="text-gray-900 dark:text-gray-200">To</Label>
                        <Input id="quietEnd" type="time" defaultValue="08:00" className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-gray-900 dark:text-gray-200">Current Password</Label>
                    <Input id="currentPassword" type="password" className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="text-gray-900 dark:text-gray-200">New Password</Label>
                    <Input id="newPassword" type="password" className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-gray-200">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                </div>
                <Button className="mt-6 btn-accent">
                  Update Password
                </Button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Enable 2FA</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                  </div>
                  <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                </div>
                {twoFactorAuth && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      Two-factor authentication is enabled. You'll need to enter a code from your authenticator app when signing in.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  {[
                    { device: 'Chrome on MacBook Pro', location: 'San Francisco, CA', lastActive: 'Active now' },
                    { device: 'Safari on iPhone', location: 'San Francisco, CA', lastActive: '2 hours ago' },
                  ].map((session, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{session.device}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{session.location} • {session.lastActive}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme</h3>
                <div className="space-y-6">
                  <div>
                    <Label className="text-gray-900 dark:text-gray-200">Color Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {theme === 'light' && 'Using light theme'}
                      {theme === 'dark' && 'Using dark theme'}
                      {theme === 'auto' && 'Follows your system preference'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-900 dark:text-gray-200">Accent Color</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Choose your preferred accent color. Dark mode uses brighter variants.
                    </p>
                    <div className="flex gap-3">
                      {accentColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-12 h-12 rounded-xl ${theme === 'dark' ? color.darkClass : color.lightClass} transition-all shadow-md ${
                            color.value === accentColor 
                              ? 'ring-4 ring-offset-2 dark:ring-offset-gray-800 ring-gray-400 dark:ring-gray-500 scale-110' 
                              : 'hover:scale-105'
                          }`}
                          onClick={() => setAccentColor(color.value as any)}
                          title={color.label}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      Current: <span className="font-medium text-gray-900 dark:text-white">{accentColors.find(c => c.value === accentColor)?.label}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Display</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-900 dark:text-gray-200">Font Size</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Compact Mode</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Show more content on screen</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className="bg-accent-gradient rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Preview</h3>
                <p className="text-white/90 mb-4">This is how your accent color looks in the current theme</p>
                <div className="flex gap-2">
                  <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    Sample Button
                  </div>
                  <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    Another Element
                  </div>
                </div>
              </div>

              {/* Color Mapping Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dark Mode Color Palette</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Each accent color transforms to a vibrant variant optimized for dark backgrounds:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Blue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">transforms to</span>
                      <div className="w-8 h-8 rounded-lg bg-cyan-400"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Electric Cyan</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-600"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Purple</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">transforms to</span>
                      <div className="w-8 h-8 rounded-lg bg-fuchsia-400"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Vibrant Magenta</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-600"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Green</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">transforms to</span>
                      <div className="w-8 h-8 rounded-lg bg-lime-400"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Neon Lime</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-600"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Orange</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">transforms to</span>
                      <div className="w-8 h-8 rounded-lg bg-amber-400"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Rich Gold</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-600"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Pink</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">transforms to</span>
                      <div className="w-8 h-8 rounded-lg bg-rose-400"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Coral Rose</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Preferences Settings */}
          <TabsContent value="preferences">
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Language & Region</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-900 dark:text-gray-200">Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-900 dark:text-gray-200">Timezone</Label>
                    <Select defaultValue="pst">
                      <SelectTrigger className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pst">(GMT-8:00) Pacific Time</SelectItem>
                        <SelectItem value="est">(GMT-5:00) Eastern Time</SelectItem>
                        <SelectItem value="gmt">(GMT+0:00) London</SelectItem>
                        <SelectItem value="cet">(GMT+1:00) Central European Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-900 dark:text-gray-200">Date Format</Label>
                    <Select defaultValue="mdy">
                      <SelectTrigger className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data & Privacy</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Download Your Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}