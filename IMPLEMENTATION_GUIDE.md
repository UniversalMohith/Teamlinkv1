# TeamLink Supabase Integration - Implementation Guide

## ⚠️ CRITICAL FIRST STEP

**Before using the application, you MUST run the SQL in `/SUPABASE_SETUP.md` in your Supabase SQL Editor.**

Go to your Supabase Dashboard → SQL Editor → New Query → Paste the entire SQL script → Run.

This creates all necessary tables, indexes, RLS policies, and enables realtime subscriptions.

## What Has Been Completed

✅ **Authentication System**
- Full email/password signup and login with Supabase Auth
- Google and Facebook OAuth ready (requires configuration in Supabase Dashboard)
- Session persistence and auto-login
- Online/offline status tracking
- Proper user profile creation in `users` table

✅ **API Layer** (`/src/utils/api.ts`)
- Complete Supabase client integration
- All CRUD operations for:
  - Users and profiles
  - Projects and project members
  - Tasks with drag-and-drop status updates
  - Teams and team members
  - Messages with realtime subscriptions
  - Notifications with realtime subscriptions
  - Connections/Friends
  - File uploads to Supabase Storage

✅ **Type Definitions** (`/src/utils/supabase.ts`)
- Database schema types
- Helper functions for user session management

✅ **Main App** (`/src/app/App.tsx`)
- Session checking on load
- Auto-login if valid session exists
- Status updates on login/logout
- Proper user type handling

✅ **Login/Signup** (`/src/app/components/LoginPage.tsx`)
- Combined login/signup interface
- Full name collection (first_name, last_name)
- Error handling and loading states
- OAuth buttons (requires Supabase dashboard configuration)

## What Needs To Be Done

### 1. Dashboard Component (`/src/app/components/Dashboard.tsx`)

**Current Status**: Uses hardcoded data  
**Required Changes**:

```typescript
import { useState, useEffect } from 'react';
import { projectAPI, notificationsAPI, handleApiError } from '/src/utils/api';
import { User } from '/src/utils/supabase';
import { getUserFullName, getUserAvatar } from '/src/utils/types';

// In the component:
const [projects, setProjects] = useState([]);
const [stats, setStats] = useState({ activeProjects: 0, totalTasks: 0, completedTasks: 0 });
const [recentActivity, setRecentActivity] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load projects
      const projectsData = await projectAPI.getAll(user.id);
      setProjects(projectsData);
      
      // Load stats
      const statsData = await projectAPI.getStats(user.id);
      setStats(statsData);
      
      // Load recent notifications as activity
      const notifications = await notificationsAPI.getRecent(user.id, 5);
      setRecentActivity(notifications);
    } catch (error) {
      handleApiError(error, 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  loadDashboardData();
}, [user.id]);

// Update handleCreateProject:
const handleCreateProject = async () => {
  if (newProjectTitle.trim()) {
    try {
      const project = await projectAPI.create(
        user.id,
        newProjectTitle,
        newProjectDueDate,
        undefined,
        'bg-purple-500'
      );
      setProjects([project, ...projects]);
      setNewProjectTitle('');
      setNewProjectDueDate('');
      setIsNewProjectDialogOpen(false);
      toast.success('Project created successfully!');
    } catch (error) {
      handleApiError(error, 'Failed to create project');
    }
  }
};

// Display user name:
Replace {user.name} with {getUserFullName(user)}
Replace {user.avatar} with {getUserAvatar(user)}
```

### 2. KanbanBoard Component (`/src/app/components/KanbanBoard.tsx`)

**Current Status**: Uses hardcoded tasks  
**Required Changes**:

```typescript
import { taskAPI, projectAPI, handleApiError } from '/src/utils/api';

const [tasks, setTasks] = useState<Task[]>([]);
const [project, setProject] = useState(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const loadTasks = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      const [tasksData, projectData] = await Promise.all([
        taskAPI.getByProject(projectId),
        projectAPI.getById(projectId)
      ]);
      
      setTasks(tasksData);
      setProject(projectData);
    } catch (error) {
      handleApiError(error, 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  loadTasks();
}, [projectId]);

// Update moveTask (drag and drop):
const moveTask = async (taskId: string, newStatus: string) => {
  try {
    await taskAPI.update(taskId, { status: newStatus });
    
    // Update local state
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  } catch (error) {
    handleApiError(error, 'Failed to update task');
  }
};

// Update handleAddTask:
const handleAddTask = async (columnStatus: string) => {
  if (newTaskTitle.trim()) {
    try {
      const task = await taskAPI.create({
        title: newTaskTitle,
        project_id: projectId!,
        status: columnStatus,
        assignee_id: user.id
      });
      
      setTasks([...tasks, task]);
      setNewTaskTitle('');
    } catch (error) {
      handleApiError(error, 'Failed to create task');
    }
  }
};
```

### 3. ChatInterface Component (`/src/app/components/ChatInterface.tsx`)

**Current Status**: Uses hardcoded messages  
**Required Changes**:

```typescript
import { messagesAPI, teamAPI, handleApiError } from '/src/utils/api';
import { useEffect, useRef } from 'react';

const [messages, setMessages] = useState([]);
const [team, setTeam] = useState(null);
const channelRef = useRef(null);

useEffect(() => {
  const loadMessages = async () => {
    if (!teamId) return;
    
    try {
      const [messagesData, teamData] = await Promise.all([
        messagesAPI.getByTeam(teamId),
        teamAPI.getById(teamId)
      ]);
      
      setMessages(messagesData);
      setTeam(teamData);
      
      // Subscribe to new messages
      channelRef.current = messagesAPI.subscribeToTeam(teamId, (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      });
    } catch (error) {
      handleApiError(error, 'Failed to load messages');
    }
  };

  loadMessages();

  return () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
  };
}, [teamId]);

// Update handleSend:
const handleSend = async () => {
  if (newMessage.trim()) {
    try {
      const message = await messagesAPI.send(
        teamId!,
        user.id,
        newMessage
      );
      
      // Message will appear via realtime subscription
      setNewMessage('');
    } catch (error) {
      handleApiError(error, 'Failed to send message');
    }
  }
};
```

### 4. ConnectionsPopup Component (`/src/app/components/ConnectionsPopup.tsx`)

**Current Status**: Uses hardcoded friends  
**Required Changes**:

```typescript
import { connectionsAPI, userAPI, handleApiError } from '/src/utils/api';

const [friends, setFriends] = useState([]);
const [allUsers, setAllUsers] = useState([]);

useEffect(() => {
  const loadFriends = async () => {
    try {
      const friendsData = await connectionsAPI.getFriends(user.id);
      setFriends(friendsData);
      
      // Load all users for search
      const usersData = await userAPI.getAllUsers();
      setAllUsers(usersData.filter(u => u.id !== user.id));
    } catch (error) {
      handleApiError(error, 'Failed to load connections');
    }
  };

  if (isOpen) {
    loadFriends();
  }
}, [isOpen, user.id]);

// Add friend functionality:
const handleAddFriend = async (friendId: string) => {
  try {
    await connectionsAPI.addFriend(user.id, friendId);
    const friendsData = await connectionsAPI.getFriends(user.id);
    setFriends(friendsData);
    toast.success('Friend added!');
  } catch (error) {
    handleApiError(error, 'Failed to add friend');
  }
};
```

### 5. NotificationsPage Component (`/src/app/components/NotificationsPage.tsx`)

**Current Status**: Uses hardcoded notifications  
**Required Changes**:

```typescript
import { notificationsAPI, handleApiError } from '/src/utils/api';

const [notifications, setNotifications] = useState([]);
const channelRef = useRef(null);

useEffect(() => {
  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getAll(user.id);
      setNotifications(data);
      
      // Subscribe to new notifications
      channelRef.current = notificationsAPI.subscribeToUser(user.id, (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
      });
    } catch (error) {
      handleApiError(error, 'Failed to load notifications');
    }
  };

  loadNotifications();

  return () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
  };
}, [user.id]);

// Mark all as read:
const handleMarkAllRead = async () => {
  try {
    await notificationsAPI.markAllAsRead(user.id);
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  } catch (error) {
    handleApiError(error, 'Failed to mark notifications as read');
  }
};
```

### 6. ProfilePage Component (`/src/app/components/ProfilePage.tsx`)

**Current Status**: Uses prop user data  
**Required Changes**:

```typescript
import { userAPI, handleApiError } from '/src/utils/api';

const [profileData, setProfileData] = useState(user);
const [isEditing, setIsEditing] = useState(false);

const handleSaveProfile = async () => {
  try {
    const updated = await userAPI.updateProfile(user.id, {
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      phone: profileData.phone,
      job_title: profileData.job_title,
      company: profileData.company,
      department: profileData.department,
      bio: profileData.bio,
      location: profileData.location,
      skills: profileData.skills,
    });
    
    setProfileData(updated);
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  } catch (error) {
    handleApiError(error, 'Failed to update profile');
  }
};
```

## Important Notes

1. **User Object Changes**: The user object now has `first_name` and `last_name` instead of `name`, and `avatar_initials` instead of `avatar`. Use the helper functions in `/src/utils/types.ts`:
   - `getUserFullName(user)` - returns "FirstName LastName"
   - `getUserAvatar(user)` - returns avatar initials

2. **Loading States**: Always show a loading spinner while fetching data:
   ```typescript
   if (isLoading) {
     return <div className="flex items-center justify-center h-screen">
       <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
     </div>;
   }
   ```

3. **Error Handling**: Use the `handleApiError` helper for consistent error toasts:
   ```typescript
   try {
     // API call
   } catch (error) {
     handleApiError(error, 'Failed to...');
   }
   ```

4. **Realtime Subscriptions**: Remember to unsubscribe in cleanup:
   ```typescript
   return () => {
     if (channelRef.current) {
       channelRef.current.unsubscribe();
     }
   };
   ```

5. **File Uploads**: Use the fileAPI for uploading files:
   ```typescript
   const handleFileUpload = async (file: File) => {
     try {
       const { fileUrl, fileName } = await fileAPI.upload(file, user.id);
       // Use fileUrl in your message or wherever needed
     } catch (error) {
       handleApiError(error, 'Failed to upload file');
     }
   };
   ```

## Testing Checklist

- [ ] Run SQL setup in Supabase
- [ ] Sign up a new user
- [ ] Log in with existing user
- [ ] Create a project
- [ ] Add tasks to project
- [ ] Create a team
- [ ] Send messages in team
- [ ] Add connections/friends
- [ ] View and mark notifications as read
- [ ] Update profile information
- [ ] Upload files in chat

## Next Steps

1. Execute the SQL in `/SUPABASE_SETUP.md`
2. Update each component following the patterns above
3. Test each feature thoroughly
4. Configure OAuth providers if needed (Google, Facebook)
5. Set up Supabase Storage bucket named `teamlink-files`
