import { supabase, getCurrentUser, User } from './supabase';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from './info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-aece0672`;

// ==================== AUTH API ====================

export const authAPI = {
  signup: async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const name = `${firstName} ${lastName}`;
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      if (data.session?.access_token) {
        localStorage.setItem('access_token', data.session.access_token);
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
        avatar_initials: data.user.avatar,
        status: data.user.status,
        role: data.user.role,
        last_active: data.user.lastActive,
      };

      return { user, session: data.session };
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  },

  signin: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signin failed');
      }

      if (data.session?.access_token) {
        localStorage.setItem('access_token', data.session.access_token);
      }

      const nameParts = (data.user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
        avatar_initials: data.user.avatar,
        status: data.user.status,
        role: data.user.role,
        last_active: data.user.lastActive,
      };

      return { user, session: data.session };
    } catch (error: any) {
      console.error('Signin error:', error);
      throw new Error(error.message || 'Signin failed');
    }
  },

  signout: async () => {
    try {
      const accessToken = localStorage.getItem('access_token');

      if (accessToken) {
        await fetch(`${API_URL}/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }

      localStorage.removeItem('access_token');
    } catch (error: any) {
      console.error('Signout error:', error);
      throw new Error(error.message || 'Signout failed');
    }
  },

  getSession: async () => {
    try {
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) return { user: null, session: null };

      const response = await fetch(`${API_URL}/auth/session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!data.user) {
        localStorage.removeItem('access_token');
        return { user: null, session: null };
      }

      const nameParts = (data.user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
        avatar_initials: data.user.avatar,
        status: data.user.status,
        role: data.user.role,
        last_active: data.user.lastActive,
      };

      return { user, session: data.session };
    } catch (error) {
      console.error('Get session error:', error);
      localStorage.removeItem('access_token');
      return { user: null, session: null };
    }
  },

  oauthLogin: async (accessToken: string, userData: { email: string, name: string }) => {
    try {
      const response = await fetch(`${API_URL}/auth/oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OAuth login failed');
      }

      const nameParts = (data.user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
        avatar_initials: data.user.avatar,
        status: data.user.status,
        role: data.user.role,
        last_active: data.user.lastActive,
      };

      return { user, session: data.session };
    } catch (error: any) {
      console.error('OAuth login error:', error);
      throw new Error(error.message || 'OAuth login failed');
    }
  },
};

// ==================== USER API ====================

export const userAPI = {
  getProfile: async (userId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user profile');
      }

      const nameParts = (data.user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
        avatar_initials: data.user.avatar,
        status: data.user.status,
        role: data.user.role,
        last_active: data.user.lastActive,
      };
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  updateProfile: async (userId: string, updates: Partial<User> & any) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const backendUpdates: any = {};
      if (updates.first_name || updates.last_name) {
        backendUpdates.name = `${updates.first_name || ''} ${updates.last_name || ''}`.trim();
      }
      if (updates.status) backendUpdates.status = updates.status;
      if (updates.role) backendUpdates.role = updates.role;
      if (updates.avatar_initials) backendUpdates.avatar = updates.avatar_initials;
      if (updates.phone !== undefined) backendUpdates.phone = updates.phone;
      if (updates.bio !== undefined) backendUpdates.bio = updates.bio;
      if (updates.company !== undefined) backendUpdates.company = updates.company;
      if (updates.department !== undefined) backendUpdates.department = updates.department;

      const response = await fetch(`${API_URL}/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(backendUpdates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      const nameParts = (data.user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
        avatar_initials: data.user.avatar,
        status: data.user.status,
        role: data.user.role,
        last_active: data.user.lastActive,
      };
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  updateStatus: async (userId: string, status: 'online' | 'offline') => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/user/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      const nameParts = (data.user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        id: data.user.id,
        email: data.user.email,
        first_name: firstName,
        last_name: lastName,
        avatar_initials: data.user.avatar,
        status: data.user.status,
        role: data.user.role,
        last_active: data.user.lastActive,
      };
    } catch (error: any) {
      console.error('Update status error:', error);
      throw error;
    }
  },

  searchUsers: async (query: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      return data.users.map((user: any) => {
        const nameParts = (user.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          avatar_initials: user.avatar,
          status: user.status,
          role: user.role,
          last_active: user.lastActive,
        };
      });
    } catch (error: any) {
      console.error('Search users error:', error);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/search?q=`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get users');
      }

      return data.users.map((user: any) => {
        const nameParts = (user.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          avatar_initials: user.avatar,
          status: user.status,
          role: user.role,
          last_active: user.lastActive,
        };
      });
    } catch (error: any) {
      console.error('Get all users error:', error);
      throw error;
    }
  },
};

// ==================== CONNECTIONS/FRIENDS API ====================

export const connectionsAPI = {
  getFriends: async (userId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/user/${userId}/friends`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get friends');
      }

      return data.friends.map((friend: any) => {
        const nameParts = (friend.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          id: friend.id,
          email: friend.email,
          first_name: firstName,
          last_name: lastName,
          avatar_initials: friend.avatar,
          status: friend.status,
          role: friend.role,
          last_active: friend.lastActive,
        };
      });
    } catch (error: any) {
      console.error('Get friends error:', error);
      throw error;
    }
  },

  addFriend: async (userId: string, friendId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/user/${userId}/friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ friendId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add friend');
      }
    } catch (error: any) {
      console.error('Add friend error:', error);
      throw error;
    }
  },

  removeFriend: async (userId: string, friendId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/user/${userId}/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove friend');
      }
    } catch (error: any) {
      console.error('Remove friend error:', error);
      throw error;
    }
  },
};

// ==================== PROJECT API ====================

export const projectAPI = {
  getAll: async (userId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get projects');
      }

      return data.projects;
    } catch (error: any) {
      console.error('Get projects error:', error);
      throw error;
    }
  },

  getById: async (projectId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get project');
      }

      return data.project;
    } catch (error: any) {
      console.error('Get project error:', error);
      throw error;
    }
  },

  create: async (userId: string, title: string, dueDate?: string, description?: string, color?: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title,
          dueDate,
          description,
          color: color || 'bg-blue-500',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      return data.project;
    } catch (error: any) {
      console.error('Create project error:', error);
      throw error;
    }
  },

  update: async (projectId: string, updates: any) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project');
      }

      return data.project;
    } catch (error: any) {
      console.error('Update project error:', error);
      throw error;
    }
  },

  delete: async (projectId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }
    } catch (error: any) {
      console.error('Delete project error:', error);
      throw error;
    }
  },

  getStats: async (userId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get stats');
      }

      return {
        activeProjects: data.activeProjects || 0,
        totalTasks: data.totalTasks || 0,
        completedTasks: data.completedTasks || 0,
      };
    } catch (error: any) {
      console.error('Get stats error:', error);
      throw error;
    }
  },
};

// ==================== TASK API ====================

export const taskAPI = {
  getByProject: async (projectId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get tasks');
      }

      return data.tasks;
    } catch (error: any) {
      console.error('Get tasks error:', error);
      throw error;
    }
  },

  create: async (task: {
    title: string;
    project_id: string;
    description?: string;
    status?: string;
    assignee_id?: string;
    due_date?: string;
    labels?: string[];
  }) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/projects/${task.project_id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status || 'todo',
          assignee: task.assignee_id,
          dueDate: task.due_date,
          labels: task.labels || [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      return data.task;
    } catch (error: any) {
      console.error('Create task error:', error);
      throw error;
    }
  },

  update: async (taskId: string, updates: any) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      return data.task;
    } catch (error: any) {
      console.error('Update task error:', error);
      throw error;
    }
  },

  delete: async (taskId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }
    } catch (error: any) {
      console.error('Delete task error:', error);
      throw error;
    }
  },
};

// ==================== TEAM API ====================
// Teams are backed by Projects — each project acts as a chat channel.
// teamAPI.getAll fetches projects and maps them to channel objects so
// ChatInterface has a real list to render instead of [].

export const teamAPI = {
  getAll: async (userId: string) => {
    try {
      const projects = await projectAPI.getAll(userId);
      // Map every project to a lightweight channel descriptor
      return (projects || []).map((p: any) => ({
        id: p.id,
        name: p.title || p.name || 'Unnamed Project',
        description: p.description || '',
        color: p.color || 'bg-blue-500',
        memberCount: p.memberCount || 1,
      }));
    } catch (error: any) {
      console.error('Get teams (projects) error:', error);
      return [];
    }
  },

  getById: async (teamId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/teams/${teamId}/members`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get team');
      }

      return {
        id: teamId,
        members: data.members,
      };
    } catch (error: any) {
      console.error('Get team error:', error);
      // Return empty members rather than crashing
      return { id: teamId, members: [] };
    }
  },

  create: async (userId: string, name: string, description?: string) => {
    // Create a project that doubles as a chat channel
    return projectAPI.create(userId, name, undefined, description);
  },

  addMember: async (teamId: string, userId: string, role: string = 'Member') => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ memberId: userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add team member');
      }
    } catch (error: any) {
      console.error('Add team member error:', error);
      throw error;
    }
  },

  removeMember: async (teamId: string, userId: string) => {
    console.warn('Team member removal not yet implemented');
  },
};

// ==================== MESSAGES API ====================

export const messagesAPI = {
  getByTeam: async (teamId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/chat/${teamId}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get messages');
      }

      return data.messages;
    } catch (error: any) {
      console.error('Get messages error:', error);
      throw error;
    }
  },

  send: async (teamId: string, senderId: string, content: string, imageUrl?: string, fileName?: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/chat/${teamId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content, imageUrl, fileName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      return data.message;
    } catch (error: any) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  // Poll every 5 seconds for new messages. Returns a cleanup function.
  subscribeToTeam: (teamId: string, callback: (messages: any[]) => void): (() => void) => {
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/chat/${teamId}/messages`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (active) callback(data.messages || []);
        }
      } catch (_) {
        // silently ignore poll errors
      }
    };

    const interval = setInterval(poll, 5000);

    // Return cleanup
    return () => {
      active = false;
      clearInterval(interval);
    };
  },
};

// ==================== NOTIFICATIONS API ====================

export const notificationsAPI = {
  getAll: async (userId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/notifications/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get notifications');
      }

      return data.notifications;
    } catch (error: any) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  getRecent: async (userId: string, limit: number = 5) => {
    try {
      const notifications = await notificationsAPI.getAll(userId);
      return notifications.slice(0, limit);
    } catch (error: any) {
      console.error('Get recent notifications error:', error);
      throw error;
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark notification as read');
      }
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/notifications/${userId}/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark all notifications as read');
      }
    } catch (error: any) {
      console.error('Mark all notifications as read error:', error);
      throw error;
    }
  },

  create: async (notification: {
    user_id: string;
    type: string;
    title: string;
    description?: string;
  }) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: notification.user_id,
          type: notification.type,
          title: notification.title,
          description: notification.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create notification');
      }

      return data.notification;
    } catch (error: any) {
      console.error('Create notification error:', error);
      throw error;
    }
  },

  // Poll every 30 seconds for new notifications. Returns a cleanup function.
  subscribeToUser: (userId: string, callback: (notifications: any[]) => void): (() => void) => {
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const accessToken = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/notifications/${userId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (active) callback(data.notifications || []);
        }
      } catch (_) {
        // silently ignore poll errors
      }
    };

    const interval = setInterval(poll, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  },
};

// ==================== SEARCH API ====================

export const searchAPI = {
  global: async (query: string, userId: string) => {
    try {
      if (!query || query.trim().length === 0) {
        return { users: [], teams: [], projects: [] };
      }

      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      const users = (data.users || []).map((user: any) => {
        const nameParts = (user.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          avatar_initials: user.avatar,
          status: user.status,
        };
      });

      return {
        users: users.slice(0, 5),
        teams: (data.teams || []).slice(0, 5),
        projects: (data.projects || []).slice(0, 5),
      };
    } catch (error: any) {
      console.error('Global search error:', error);
      throw error;
    }
  },
};

// ==================== FILE API ====================

export const fileAPI = {
  upload: async (file: File) => {
    try {
      const accessToken = localStorage.getItem('access_token');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'File upload failed');
      }

      return {
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        filePath: data.filePath,
      };
    } catch (error: any) {
      console.error('File upload error:', error);
      throw error;
    }
  },

  delete: async (filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('make-aece0672-files')
        .remove([filePath]);

      if (error) {
        throw new Error(error.message || 'File deletion failed');
      }
    } catch (error: any) {
      console.error('File delete error:', error);
      throw error;
    }
  },
};

// ==================== ERROR HANDLER ====================

export const handleApiError = (error: any, fallbackMessage: string = 'Something went wrong') => {
  const message = error?.message || fallbackMessage;
  console.error(fallbackMessage, error);
  toast.error(message);
};
