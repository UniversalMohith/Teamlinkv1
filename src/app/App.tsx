import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { ChatInterface } from './components/ChatInterface';
import { ProfilePage } from './components/ProfilePage';
import { SettingsPage } from './components/SettingsPage';
import { NotificationsPage } from './components/NotificationsPage';
import { ThemeProvider } from './components/ThemeContext';
import { authAPI, userAPI, handleApiError } from '../utils/api';
import { User } from '../utils/supabase';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'kanban' | 'chat' | 'profile' | 'settings' | 'notifications';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if OAuth callback (access_token in URL hash)
        const hasOAuthCallback = window.location.hash.includes('access_token');

        if (hasOAuthCallback) {
          // OAuth or recovery callback detected - go to login page to process it
          setCurrentPage('login');
          setIsLoading(false);
          return;
        }

        const { user, session } = await authAPI.getSession();
        if (user && session) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          setCurrentPage('dashboard');

          // Update user status to online
          await userAPI.updateStatus(user.id, 'online');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Update user status to offline when window is closed
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser) {
        await userAPI.updateStatus(currentUser.id, 'offline');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { user, session } = await authAPI.signin(email, password);
      setCurrentUser(user);
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
      toast.success(`Welcome back, ${user.first_name}!`);
    } catch (error: any) {
      handleApiError(error, 'Login failed');
      throw error;
    }
  };

  const handleSignup = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { user, session } = await authAPI.signup(email, password, firstName, lastName);

      // User is automatically logged in after signup
      setCurrentUser(user);
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
      toast.success(`Welcome to TeamLink, ${firstName}!`);
    } catch (error: any) {
      handleApiError(error, 'Signup failed');
      throw error;
    }
  };

  const handleOAuthLogin = async (accessToken: string, userData: { email: string, name: string }) => {
    try {
      // Store the access token
      localStorage.setItem('access_token', accessToken);

      // Call backend to create/get OAuth user
      const { user } = await authAPI.oauthLogin(accessToken, userData);

      setCurrentUser(user);
      setIsLoggedIn(true);
      setCurrentPage('dashboard');

      const firstName = user.first_name || userData.name.split(' ')[0];
      toast.success(`Welcome, ${firstName}!`);
    } catch (error: any) {
      handleApiError(error, 'OAuth login failed');
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      if (currentUser) {
        await userAPI.updateStatus(currentUser.id, 'offline');
      }
      await authAPI.signout();
      setCurrentUser(null);
      setIsLoggedIn(false);
      setCurrentPage('landing');
      setSelectedProject(null);
      setSelectedTeam(null);
      toast.success('Logged out successfully');
    } catch (error) {
      handleApiError(error, 'Logout failed');
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setCurrentPage('kanban');
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
    setCurrentPage('chat');
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  // Transform User for components that expect different format
  const transformUserForProfile = (user: User) => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'User';

    return {
      id: user.id,
      name: fullName,
      email: user.email || '',
      avatar: user.avatar_initials || 'U',
      role: user.role || 'Team Member',
      joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently',
    };
  };

  // Show loading state while checking session
  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Toaster position="top-right" />
        {currentPage === 'landing' && (
          <LandingPage 
            onNavigateToLogin={() => navigateTo('login')}
            onProjectSelect={handleProjectSelect}
          />
        )}
        {currentPage === 'login' && (
          <LoginPage
            onLogin={handleLogin}
            onSignup={handleSignup}
            onOAuthLogin={handleOAuthLogin}
            onBack={() => navigateTo('landing')}
          />
        )}
        {currentPage === 'dashboard' && currentUser && (
          <Dashboard 
            user={currentUser}
            onProjectSelect={handleProjectSelect}
            onTeamSelect={handleTeamSelect}
            onNavigateToKanban={() => navigateTo('kanban')}
            onNavigateToChat={() => navigateTo('chat')}
            onNavigateToProfile={() => navigateTo('profile')}
            onNavigateToSettings={() => navigateTo('settings')}
            onNavigateToNotifications={() => navigateTo('notifications')}
            onLogout={handleLogout}
          />
        )}
        {currentPage === 'kanban' && currentUser && (
          <KanbanBoard 
            user={currentUser}
            projectId={selectedProject}
            onBack={() => navigateTo('dashboard')}
            onOpenChat={handleTeamSelect}
            onNavigateToProfile={() => navigateTo('profile')}
            onNavigateToSettings={() => navigateTo('settings')}
            onNavigateToNotifications={() => navigateTo('notifications')}
            onLogout={handleLogout}
          />
        )}
        {currentPage === 'chat' && currentUser && (
          <ChatInterface 
            user={currentUser}
            teamId={selectedTeam}
            onBack={() => navigateTo('dashboard')}
            onNavigateToProfile={() => navigateTo('profile')}
            onNavigateToSettings={() => navigateTo('settings')}
            onNavigateToNotifications={() => navigateTo('notifications')}
            onLogout={handleLogout}
          />
        )}
        {currentPage === 'profile' && currentUser && (
          <ProfilePage
            user={transformUserForProfile(currentUser)}
            onBack={() => navigateTo('dashboard')}
            onNavigateToSettings={() => navigateTo('settings')}
            onLogout={handleLogout}
            onUserUpdate={(updatedUser) => {
              setCurrentUser({
                ...currentUser,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                role: updatedUser.role,
              });
            }}
          />
        )}
        {currentPage === 'settings' && currentUser && (
          <SettingsPage
            user={transformUserForProfile(currentUser)}
            onBack={() => navigateTo('dashboard')}
            onNavigateToProfile={() => navigateTo('profile')}
            onLogout={handleLogout}
            onUserUpdate={(updatedUser) => {
              setCurrentUser({
                ...currentUser,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                role: updatedUser.role,
              });
            }}
          />
        )}
        {currentPage === 'notifications' && currentUser && (
          <NotificationsPage 
            user={currentUser}
            onBack={() => navigateTo('dashboard')}
            onNavigateToProfile={() => navigateTo('profile')}
            onLogout={handleLogout}
          />
        )}
      </div>
    </ThemeProvider>
  );
}