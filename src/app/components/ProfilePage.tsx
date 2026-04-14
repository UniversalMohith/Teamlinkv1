import { useState } from 'react';
import { ArrowLeft, Mail, MapPin, Calendar, Edit, Camera, Award, Briefcase, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { userAPI, handleApiError } from '../../utils/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinDate: string;
}

interface ProfilePageProps {
  user: User;
  onBack: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
  onUserUpdate?: (updatedUser: any) => void;
}

export function ProfilePage({ user, onBack, onNavigateToSettings, onLogout, onUserUpdate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const nameParts = (user.name || '').split(' ');
  const [editedFirstName, setEditedFirstName] = useState(nameParts[0] || '');
  const [editedLastName, setEditedLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [editedRole, setEditedRole] = useState(user.role || '');
  const [editedBio, setEditedBio] = useState('');

  const stats = [
    { label: 'Projects', value: '12', icon: Briefcase },
    { label: 'Tasks Completed', value: '142', icon: Award },
    { label: 'Team Members', value: '8', icon: Users },
  ];

  const projects = [
    { name: 'Website Redesign', role: 'Lead Designer', progress: 75, status: 'Active' },
    { name: 'Marketing Campaign', role: 'Project Manager', progress: 45, status: 'Active' },
    { name: 'Mobile App', role: 'Developer', progress: 90, status: 'Completed' },
    { name: 'Brand Guidelines', role: 'Designer', progress: 30, status: 'Active' },
  ];

  const activities = [
    { action: 'Completed task "Homepage Design"', time: '2 hours ago', project: 'Website Redesign' },
    { action: 'Added comment on "UX Research"', time: '5 hours ago', project: 'Marketing Campaign' },
    { action: 'Updated project status', time: 'Yesterday', project: 'Mobile App' },
    { action: 'Uploaded design files', time: '2 days ago', project: 'Website Redesign' },
  ];

  const skills = [
    { name: 'Project Management', level: 90 },
    { name: 'UI/UX Design', level: 85 },
    { name: 'Team Leadership', level: 80 },
    { name: 'Communication', level: 95 },
  ];

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const updatedUser = await userAPI.updateProfile(user.id, {
        first_name: editedFirstName,
        last_name: editedLastName,
        role: editedRole,
        bio: editedBio,
      } as any);

      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      handleApiError(error, 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onNavigateToSettings}>
              Settings
            </Button>
            <Button variant="outline" onClick={onLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-bold">
                    {user.avatar}
                  </div>
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mt-4">{user.name}</h2>
                <p className="text-gray-600 mt-1">{user.role}</p>
                
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {user.joinDate}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">San Francisco, CA</span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{stat.label}</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">{stat.value}</span>
                    </div>
                  );
                })}
              </div>

              <Button 
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {isEditing ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Edit Profile Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={editedFirstName}
                            onChange={(e) => setEditedFirstName(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={editedLastName}
                            onChange={(e) => setEditedLastName(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          value={editedRole}
                          onChange={(e) => setEditedRole(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                          id="bio"
                          rows={4}
                          value={editedBio}
                          onChange={(e) => setEditedBio(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold mb-4">About</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Experienced project manager with a passion for leading cross-functional teams 
                        and delivering high-quality projects. Specializing in agile methodologies and 
                        user-centered design. Always looking for new challenges and opportunities to grow.
                      </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
                      <div className="space-y-3">
                        {[
                          { title: 'Completed 100 Tasks', date: 'Feb 15, 2026', icon: '🎯' },
                          { title: 'Led 5 Successful Projects', date: 'Feb 10, 2026', icon: '🏆' },
                          { title: 'Team Player Award', date: 'Jan 28, 2026', icon: '⭐' },
                        ].map((achievement, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <span className="text-2xl">{achievement.icon}</span>
                            <div>
                              <p className="font-medium text-gray-900">{achievement.title}</p>
                              <p className="text-sm text-gray-500">{achievement.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">My Projects</h3>
                  <div className="space-y-4">
                    {projects.map((project, idx) => (
                      <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{project.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{project.role}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            project.status === 'Active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {activities.map((activity, idx) => (
                      <div key={idx} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-gray-900">{activity.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{activity.time}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-blue-600">{activity.project}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Skills & Expertise</h3>
                  <div className="space-y-4">
                    {skills.map((skill, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                          <span className="text-sm text-gray-600">{skill.level}%</span>
                        </div>
                        <Progress value={skill.level} className="h-2" />
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-6">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Skills
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
