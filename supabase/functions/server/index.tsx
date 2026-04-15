import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-aece0672/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

// Sign up route
app.post("/make-server-aece0672/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Authorization error while signing up user: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    const userProfile = {
      id: data.user.id,
      email,
      name,
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      role: 'Team Member',
      joinDate: new Date().toISOString(),
      status: 'online',
      lastActive: new Date().toISOString(),
    };

    await kv.set(`user:${data.user.id}`, userProfile);

    // Sign in the user to get a session token
    const clientSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: signInData, error: signInError } = await clientSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log(`Error signing in after signup: ${signInError.message}`);
      // Still return success, user can login manually
      return c.json({ user: userProfile, session: null });
    }

    return c.json({
      user: userProfile,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token
      }
    });
  } catch (error) {
    console.log(`Error during signup: ${error}`);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Sign in route
app.post("/make-server-aece0672/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Create client with anon key for sign in
    const clientSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data, error } = await clientSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Authorization error while signing in user during main login flow: ${error.message}`);
      return c.json({ error: error.message }, 401);
    }

    // Get user profile from KV store
    const userProfile = await kv.get(`user:${data.user.id}`);
    
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    // Update user status to online
    const updatedProfile = { ...userProfile, status: 'online', lastActive: new Date().toISOString() };
    await kv.set(`user:${data.user.id}`, updatedProfile);

    return c.json({ 
      user: updatedProfile, 
      session: { 
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token 
      } 
    });
  } catch (error) {
    console.log(`Error during signin: ${error}`);
    return c.json({ error: 'Internal server error during signin' }, 500);
  }
});

// Sign out route
app.post("/make-server-aece0672/auth/signout", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Update user status to offline
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile) {
      const updatedProfile = { ...userProfile, status: 'offline', lastActive: new Date().toISOString() };
      await kv.set(`user:${user.id}`, updatedProfile);
    }

    return c.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.log(`Error during signout: ${error}`);
    return c.json({ error: 'Internal server error during signout' }, 500);
  }
});

// Get session (check if user is already logged in)
app.get("/make-server-aece0672/auth/session", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ user: null, session: null });
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ user: null, session: null });
    }

    const userProfile = await kv.get(`user:${user.id}`);

    return c.json({
      user: userProfile,
      session: { access_token: accessToken }
    });
  } catch (error) {
    console.log(`Error getting session: ${error}`);
    return c.json({ user: null, session: null });
  }
});

// OAuth login (Google, Facebook, etc.)
app.post("/make-server-aece0672/auth/oauth", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    console.log('OAuth login request received');
    console.log('Access token present:', !!accessToken);

    if (!accessToken) {
      console.log('No access token in Authorization header');
      return c.json({ error: 'No access token provided' }, 401);
    }

    // Verify the access token and get user info
    console.log('Verifying access token with Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.log(`Error verifying OAuth token: ${error?.message}`);
      return c.json({ error: `Invalid access token: ${error?.message || 'Unknown error'}` }, 401);
    }

    console.log('Token verified successfully for user:', user.email);

    // Get request body
    let email = user.email || '';
    let name = user.user_metadata?.full_name || user.user_metadata?.name || 'User';

    try {
      const body = await c.req.json();
      email = body.email || email;
      name = body.name || name;
    } catch (e) {
      console.log('No request body, using user metadata');
    }

    // Ensure email and name have valid values
    if (!email || email.trim() === '') {
      email = `user-${user.id}@oauth.local`;
      console.log(`No email found, using fallback: ${email}`);
    }

    if (!name || name.trim() === '') {
      name = 'User';
    }

    console.log('Creating/updating user profile...');

    // Check if user profile already exists
    let userProfile = await kv.get(`user:${user.id}`);

    if (!userProfile) {
      // Create new user profile for OAuth user
      const nameParts = name.split(' ').filter(n => n.trim().length > 0);
      const avatar = nameParts.length > 0
        ? nameParts.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

      userProfile = {
        id: user.id,
        email: email,
        name: name,
        avatar: avatar,
        role: 'Team Member',
        joinDate: new Date().toISOString(),
        status: 'online',
        lastActive: new Date().toISOString(),
      };

      await kv.set(`user:${user.id}`, userProfile);
      console.log(`Created new OAuth user profile for ${user.id}: ${email}`);
    } else {
      // Update existing user status to online
      userProfile = { ...userProfile, status: 'online', lastActive: new Date().toISOString() };
      await kv.set(`user:${user.id}`, userProfile);
      console.log(`Updated existing user ${user.id} to online`);
    }

    console.log('OAuth login successful');
    return c.json({
      user: userProfile,
      session: { access_token: accessToken }
    });
  } catch (error) {
    console.log(`Error during OAuth login: ${error}`);
    console.error(error);
    return c.json({ error: `Internal server error during OAuth login: ${error.message || error}` }, 500);
  }
});

// ==================== USER ROUTES ====================

// Get user profile
app.get("/make-server-aece0672/user/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const userProfile = await kv.get(`user:${userId}`);
    
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: userProfile });
  } catch (error) {
    console.log(`Error getting user profile: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user profile
app.put("/make-server-aece0672/user/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');
    
    if (user.id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const updates = await c.req.json();
    const currentProfile = await kv.get(`user:${userId}`);
    
    if (!currentProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updatedProfile = { ...currentProfile, ...updates };
    await kv.set(`user:${userId}`, updatedProfile);

    return c.json({ user: updatedProfile });
  } catch (error) {
    console.log(`Error updating user profile: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user status (online/offline)
// FIX BUG-06: Added ownership check — only the authenticated user can update their own status
app.post("/make-server-aece0672/user/:userId/status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');

    // Ensure the authenticated user can only update their own status
    if (user.id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const { status } = await c.req.json();

    const userProfile = await kv.get(`user:${userId}`);
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updatedProfile = { ...userProfile, status, lastActive: new Date().toISOString() };
    await kv.set(`user:${userId}`, updatedProfile);

    return c.json({ user: updatedProfile });
  } catch (error) {
    console.log(`Error updating user status: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== FRIENDS/CONNECTIONS ROUTES ====================

// Get user's friends
app.get("/make-server-aece0672/user/:userId/friends", async (c) => {
  try {
    const userId = c.req.param('userId');
    const friendsData = await kv.get(`friends:${userId}`);
    const friendIds = friendsData?.friendIds || [];

    // Get all friend profiles
    const friends = [];
    for (const friendId of friendIds) {
      const friendProfile = await kv.get(`user:${friendId}`);
      if (friendProfile) {
        friends.push(friendProfile);
      }
    }

    return c.json({ friends });
  } catch (error) {
    console.log(`Error getting friends: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add friend
app.post("/make-server-aece0672/user/:userId/friends", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');
    const { friendId } = await c.req.json();

    // Get current friends list
    const friendsData = await kv.get(`friends:${userId}`);
    const friendIds = friendsData?.friendIds || [];

    // Add friend if not already in list
    if (!friendIds.includes(friendId)) {
      friendIds.push(friendId);
      await kv.set(`friends:${userId}`, { friendIds });

      // Add reciprocal friendship
      const friendFriendsData = await kv.get(`friends:${friendId}`);
      const friendFriendIds = friendFriendsData?.friendIds || [];
      if (!friendFriendIds.includes(userId)) {
        friendFriendIds.push(userId);
        await kv.set(`friends:${friendId}`, { friendIds: friendFriendIds });
      }
    }

    return c.json({ message: 'Friend added successfully' });
  } catch (error) {
    console.log(`Error adding friend: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Remove friend
app.delete("/make-server-aece0672/user/:userId/friends/:friendId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');
    const friendId = c.req.param('friendId');

    // Remove from user's friends
    const friendsData = await kv.get(`friends:${userId}`);
    const friendIds = friendsData?.friendIds || [];
    const updatedFriendIds = friendIds.filter((id: string) => id !== friendId);
    await kv.set(`friends:${userId}`, { friendIds: updatedFriendIds });

    // Remove reciprocal friendship
    const friendFriendsData = await kv.get(`friends:${friendId}`);
    const friendFriendIds = friendFriendsData?.friendIds || [];
    const updatedFriendFriendIds = friendFriendIds.filter((id: string) => id !== userId);
    await kv.set(`friends:${friendId}`, { friendIds: updatedFriendFriendIds });

    return c.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.log(`Error removing friend: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== PROJECT ROUTES ====================

// Get all projects for a user
app.get("/make-server-aece0672/projects", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProjectsData = await kv.get(`user:${user.id}:projects`);
    const projectIds = userProjectsData?.projectIds || [];

    const projects = [];
    for (const projectId of projectIds) {
      const project = await kv.get(`project:${projectId}`);
      if (project) {
        projects.push(project);
      }
    }

    return c.json({ projects });
  } catch (error) {
    console.log(`Error getting projects: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create new project
// FIX BUG-05: Use crypto.randomUUID() instead of timestamp-based IDs to prevent collision
app.post("/make-server-aece0672/projects", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, dueDate, color } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const projectId = crypto.randomUUID();
    const project = {
      id: projectId,
      title,
      dueDate: dueDate || 'No due date',
      progress: 0,
      status: 'Active',
      color: color || 'bg-blue-500',
      members: 1,
      ownerId: user.id,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`project:${projectId}`, project);

    // Add to user's projects
    const userProjectsData = await kv.get(`user:${user.id}:projects`);
    const projectIds = userProjectsData?.projectIds || [];
    projectIds.push(projectId);
    await kv.set(`user:${user.id}:projects`, { projectIds });

    return c.json({ project });
  } catch (error) {
    console.log(`Error creating project: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single project
app.get("/make-server-aece0672/projects/:projectId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ project });
  } catch (error) {
    console.log(`Error getting project: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update project
app.put("/make-server-aece0672/projects/:projectId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const updates = await c.req.json();
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const updatedProject = { ...project, ...updates };
    await kv.set(`project:${projectId}`, updatedProject);

    return c.json({ project: updatedProject });
  } catch (error) {
    console.log(`Error updating project: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete project
app.delete("/make-server-aece0672/projects/:projectId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    await kv.del(`project:${projectId}`);

    // Remove from user's projects
    const userProjectsData = await kv.get(`user:${user.id}:projects`);
    const projectIds = userProjectsData?.projectIds || [];
    const updatedProjectIds = projectIds.filter((id: string) => id !== projectId);
    await kv.set(`user:${user.id}:projects`, { projectIds: updatedProjectIds });

    return c.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.log(`Error deleting project: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== TASK ROUTES ====================

// Get all tasks for a project
app.get("/make-server-aece0672/projects/:projectId/tasks", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const tasksData = await kv.get(`project:${projectId}:tasks`);
    const taskIds = tasksData?.taskIds || [];

    const tasks = [];
    for (const taskId of taskIds) {
      const task = await kv.get(`task:${taskId}`);
      if (task) {
        tasks.push(task);
      }
    }

    return c.json({ tasks });
  } catch (error) {
    console.log(`Error getting tasks: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create new task
// FIX BUG-05: Use crypto.randomUUID() instead of timestamp-based IDs
app.post("/make-server-aece0672/projects/:projectId/tasks", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const { title, description, dueDate, status, assignee, labels } = await c.req.json();

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const taskId = crypto.randomUUID();
    const task = {
      id: taskId,
      title,
      description,
      dueDate,
      status: status || 'todo',
      assignee,
      labels: labels || [],
      projectId,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`task:${taskId}`, task);

    // Add to project's tasks
    const tasksData = await kv.get(`project:${projectId}:tasks`);
    const taskIds = tasksData?.taskIds || [];
    taskIds.push(taskId);
    await kv.set(`project:${projectId}:tasks`, { taskIds });

    return c.json({ task });
  } catch (error) {
    console.log(`Error creating task: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update task
app.put("/make-server-aece0672/tasks/:taskId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('taskId');
    const updates = await c.req.json();
    const task = await kv.get(`task:${taskId}`);

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    const updatedTask = { ...task, ...updates };
    await kv.set(`task:${taskId}`, updatedTask);

    return c.json({ task: updatedTask });
  } catch (error) {
    console.log(`Error updating task: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete task
app.delete("/make-server-aece0672/tasks/:taskId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('taskId');
    const task = await kv.get(`task:${taskId}`);

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    await kv.del(`task:${taskId}`);

    // Remove from project's tasks
    const tasksData = await kv.get(`project:${task.projectId}:tasks`);
    const taskIds = tasksData?.taskIds || [];
    const updatedTaskIds = taskIds.filter((id: string) => id !== taskId);
    await kv.set(`project:${task.projectId}:tasks`, { taskIds: updatedTaskIds });

    return c.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.log(`Error deleting task: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== CHAT/MESSAGES ROUTES ====================

// Get messages for a chat/team
app.get("/make-server-aece0672/chat/:chatId/messages", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');
    const messagesData = await kv.get(`chat:${chatId}:messages`);
    const messageIds = messagesData?.messageIds || [];

    const messages = [];
    for (const messageId of messageIds) {
      const message = await kv.get(`message:${messageId}`);
      if (message) {
        messages.push(message);
      }
    }

    return c.json({ messages });
  } catch (error) {
    console.log(`Error getting messages: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Send message
// FIX BUG-05: Use crypto.randomUUID() for message IDs
app.post("/make-server-aece0672/chat/:chatId/messages", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');
    const { content, imageUrl, fileName } = await c.req.json();

    if (!content && !imageUrl && !fileName) {
      return c.json({ error: 'Message content or file is required' }, 400);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    const messageId = crypto.randomUUID();
    const message = {
      id: messageId,
      sender: userProfile?.name || 'Unknown',
      senderId: user.id,
      content,
      imageUrl,
      fileName,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      avatar: userProfile?.avatar || 'U',
      chatId,
    };

    await kv.set(`message:${messageId}`, message);

    // Add to chat's messages
    const messagesData = await kv.get(`chat:${chatId}:messages`);
    const messageIds = messagesData?.messageIds || [];
    messageIds.push(messageId);
    await kv.set(`chat:${chatId}:messages`, { messageIds });

    return c.json({ message });
  } catch (error) {
    console.log(`Error sending message: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update typing indicator
app.post("/make-server-aece0672/chat/:chatId/typing", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');
    const { isTyping } = await c.req.json();
    const userProfile = await kv.get(`user:${user.id}`);

    const typingKey = `chat:${chatId}:typing`;
    const typingData = await kv.get(typingKey);
    const typingUsers = typingData?.users || [];

    if (isTyping && !typingUsers.some((u: any) => u.id === user.id)) {
      typingUsers.push({ id: user.id, name: userProfile?.name });
    } else if (!isTyping) {
      const index = typingUsers.findIndex((u: any) => u.id === user.id);
      if (index > -1) typingUsers.splice(index, 1);
    }

    await kv.set(typingKey, { users: typingUsers, updatedAt: new Date().toISOString() });

    return c.json({ typingUsers });
  } catch (error) {
    console.log(`Error updating typing indicator: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get typing users
app.get("/make-server-aece0672/chat/:chatId/typing", async (c) => {
  try {
    const chatId = c.req.param('chatId');
    const typingData = await kv.get(`chat:${chatId}:typing`);
    const typingUsers = typingData?.users || [];

    return c.json({ typingUsers });
  } catch (error) {
    console.log(`Error getting typing users: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== FILE UPLOAD ROUTES ====================

// Initialize storage bucket
const initStorageBucket = async () => {
  const bucketName = 'make-aece0672-files';
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
      console.log(`Storage bucket '${bucketName}' created successfully`);
    }
  } catch (error) {
    console.log(`Error initializing storage bucket: ${error}`);
  }
};

// Initialize bucket on startup
initStorageBucket();

// Upload file
app.post("/make-server-aece0672/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    const bucketName = 'make-aece0672-files';

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        contentType: file.type,
      });

    if (uploadError) {
      console.log(`Error uploading file to storage: ${uploadError.message}`);
      return c.json({ error: uploadError.message }, 500);
    }

    // Create signed URL valid for 1 year
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000); // 1 year in seconds

    return c.json({ 
      fileName: file.name,
      fileUrl: signedUrlData?.signedUrl,
      filePath: uploadData.path 
    });
  } catch (error) {
    console.log(`Error during file upload: ${error}`);
    return c.json({ error: 'Internal server error during file upload' }, 500);
  }
});

// ==================== TEAM ROUTES ====================

// Get team members
app.get("/make-server-aece0672/teams/:teamId/members", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const teamId = c.req.param('teamId');
    const teamData = await kv.get(`team:${teamId}:members`);
    const memberIds = teamData?.memberIds || [];

    const members = [];
    for (const memberId of memberIds) {
      const member = await kv.get(`user:${memberId}`);
      if (member) {
        members.push(member);
      }
    }

    return c.json({ members });
  } catch (error) {
    console.log(`Error getting team members: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add team member
app.post("/make-server-aece0672/teams/:teamId/members", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const teamId = c.req.param('teamId');
    const { memberId } = await c.req.json();

    const teamData = await kv.get(`team:${teamId}:members`);
    const memberIds = teamData?.memberIds || [];

    if (!memberIds.includes(memberId)) {
      memberIds.push(memberId);
      await kv.set(`team:${teamId}:members`, { memberIds });
    }

    return c.json({ message: 'Member added successfully' });
  } catch (error) {
    console.log(`Error adding team member: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== NOTIFICATIONS ROUTES ====================

// Get all notifications for a user
app.get("/make-server-aece0672/notifications/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');
    
    if (user.id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const notificationsData = await kv.get(`user:${userId}:notifications`);
    const notificationIds = notificationsData?.notificationIds || [];

    const notifications = [];
    for (const notifId of notificationIds) {
      const notification = await kv.get(`notification:${notifId}`);
      if (notification) {
        notifications.push(notification);
      }
    }

    // Sort by timestamp descending
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ notifications });
  } catch (error) {
    console.log(`Error getting notifications: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create notification
// FIX BUG-05: Use crypto.randomUUID() for notification IDs
app.post("/make-server-aece0672/notifications", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { userId, type, title, description } = await c.req.json();

    const notificationId = crypto.randomUUID();
    const notification = {
      id: notificationId,
      userId,
      type,
      title,
      description,
      read: false,
      timestamp: new Date().toISOString(),
    };

    await kv.set(`notification:${notificationId}`, notification);

    // Add to user's notifications
    const notificationsData = await kv.get(`user:${userId}:notifications`);
    const notificationIds = notificationsData?.notificationIds || [];
    notificationIds.unshift(notificationId); // Add to beginning
    await kv.set(`user:${userId}:notifications`, { notificationIds });

    return c.json({ notification });
  } catch (error) {
    console.log(`Error creating notification: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mark notification as read
app.put("/make-server-aece0672/notifications/:notificationId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('notificationId');
    const notification = await kv.get(`notification:${notificationId}`);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    const updatedNotification = { ...notification, read: true };
    await kv.set(`notification:${notificationId}`, updatedNotification);

    return c.json({ notification: updatedNotification });
  } catch (error) {
    console.log(`Error updating notification: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mark all notifications as read
app.put("/make-server-aece0672/notifications/:userId/mark-all-read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');
    
    if (user.id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const notificationsData = await kv.get(`user:${userId}:notifications`);
    const notificationIds = notificationsData?.notificationIds || [];

    // Update all notifications to read
    for (const notifId of notificationIds) {
      const notification = await kv.get(`notification:${notifId}`);
      if (notification && !notification.read) {
        await kv.set(`notification:${notifId}`, { ...notification, read: true });
      }
    }

    return c.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.log(`Error marking all notifications as read: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== DASHBOARD STATS ROUTES ====================

// Get dashboard statistics
app.get("/make-server-aece0672/dashboard/stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's projects
    const userProjectsData = await kv.get(`user:${user.id}:projects`);
    const projectIds = userProjectsData?.projectIds || [];

    // Count active projects
    let activeProjects = 0;
    for (const projectId of projectIds) {
      const project = await kv.get(`project:${projectId}`);
      if (project && project.status === 'Active') {
        activeProjects++;
      }
    }

    // Count tasks assigned to user
    let totalTasks = 0;
    let completedTasks = 0;

    for (const projectId of projectIds) {
      const tasksData = await kv.get(`project:${projectId}:tasks`);
      const taskIds = tasksData?.taskIds || [];
      
      for (const taskId of taskIds) {
        const task = await kv.get(`task:${taskId}`);
        if (task && task.assignee === user.id) {
          totalTasks++;
          if (task.status === 'done') {
            completedTasks++;
          }
        }
      }
    }

    return c.json({
      activeProjects,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    });
  } catch (error) {
    console.log(`Error getting dashboard stats: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== SEARCH ROUTES ====================

// Global search
// FIX BUG-02: getByPrefix now returns {key, value}[] — filter and map accordingly
app.get("/make-server-aece0672/search", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const query = c.req.query('q')?.toLowerCase() || '';

    if (!query) {
      return c.json({ users: [], teams: [], projects: [] });
    }

    // Search users — each item is { key, value } from the fixed getByPrefix
    const allUsers = await kv.getByPrefix('user:');
    const users = allUsers
      .filter((item: { key: string; value: any }) => {
        // Skip index keys like user:uuid:projects, user:uuid:notifications, etc.
        const keyParts = item.key.split(':');
        if (keyParts.length !== 2) return false;
        const userData = item.value;
        return userData?.name?.toLowerCase().includes(query) ||
               userData?.email?.toLowerCase().includes(query);
      })
      .map((item: { key: string; value: any }) => item.value)
      .slice(0, 5);

    // Search projects
    const userProjectsData = await kv.get(`user:${user.id}:projects`);
    const projectIds = userProjectsData?.projectIds || [];
    const projects = [];

    for (const projectId of projectIds) {
      const project = await kv.get(`project:${projectId}`);
      if (project && project.title?.toLowerCase().includes(query)) {
        projects.push(project);
      }
    }

    return c.json({
      users: users.slice(0, 5),
      teams: [],
      projects: projects.slice(0, 5),
    });
  } catch (error) {
    console.log(`Error during search: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);
