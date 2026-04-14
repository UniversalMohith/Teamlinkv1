# TeamLink Supabase Backend Setup Guide

This guide will help you set up the complete Supabase backend for the TeamLink application.

## Prerequisites

- A Supabase project (already connected via Figma Make)
- Access to the Supabase Dashboard
- The Supabase URL and keys are already configured

## Setup Steps

### 1. Create Database Tables

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your TeamLink project
3. Navigate to **SQL Editor** in the left sidebar
4. Create a new query
5. Copy the entire contents of `/supabase/migrations/001_initial_schema.sql`
6. Paste into the SQL Editor
7. Click **Run** to execute the migration

This will create all necessary tables:
- `users` - User profiles and information
- `teams` - Team data
- `team_members` - Team membership relationships
- `projects` - Project information
- `project_members` - Project membership relationships
- `tasks` - Kanban board tasks
- `messages` - Team chat messages
- `notifications` - User notifications
- `connections` - Friend/connection relationships

### 2. Verify Row Level Security (RLS)

The migration script automatically enables RLS and creates policies for each table. Verify this by:

1. Go to **Authentication** → **Policies** in your Supabase Dashboard
2. Check that all tables have appropriate policies
3. Policies ensure users can only access their own data and shared team data

### 3. Enable Realtime (Optional but Recommended)

For real-time chat and notifications:

1. Go to **Database** → **Replication** in your Supabase Dashboard
2. Enable replication for these tables:
   - `messages` (for instant chat updates)
   - `notifications` (for instant notification updates)
   - `tasks` (for Kanban board live updates)

### 4. Configure Storage (Optional)

For file uploads in chat:

1. The Edge Function automatically creates the storage bucket on startup
2. No manual configuration needed
3. Bucket name: `make-aece0672-files`
4. Files are private and require authentication

## Architecture Overview

The TeamLink backend uses a hybrid architecture:

### Frontend Direct Access (Recommended)
- The `/src/utils/api.ts` file contains functions that directly query Supabase tables
- Uses the Supabase JS client for optimal performance
- Leverages Row Level Security for data protection
- Real-time subscriptions work automatically

### Server Endpoints (Alternative)
- The Edge Function at `/supabase/functions/server/index.tsx` provides REST API endpoints
- Useful for complex operations or additional server-side logic
- All endpoints require authentication via Bearer token

## API Usage Examples

### Using Direct Supabase Client (Recommended)

```typescript
import { authAPI, projectAPI, taskAPI } from '/src/utils/api';

// Sign up
const { user, session } = await authAPI.signup(
  'user@example.com',
  'password',
  'John',
  'Doe'
);

// Create project
const project = await projectAPI.create(
  userId,
  'New Project',
  '2024-12-31',
  'Project description'
);

// Get tasks
const tasks = await taskAPI.getByProject(projectId);

// Create task
const task = await taskAPI.create(
  projectId,
  'Task title',
  'Description',
  'todo'
);
```

### Using Server Endpoints (Alternative)

```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-aece0672/projects`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);
const { projects } = await response.json();
```

## Available Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/signin` - Sign in existing user
- `POST /auth/signout` - Sign out user
- `GET /auth/session` - Get current session

### Users
- `GET /user/:userId` - Get user profile
- `PUT /user/:userId` - Update user profile
- `POST /user/:userId/status` - Update online/offline status

### Projects
- `GET /projects` - Get all user's projects
- `POST /projects` - Create new project
- `GET /projects/:projectId` - Get single project
- `PUT /projects/:projectId` - Update project
- `DELETE /projects/:projectId` - Delete project

### Tasks
- `GET /projects/:projectId/tasks` - Get all tasks for project
- `POST /projects/:projectId/tasks` - Create new task
- `PUT /tasks/:taskId` - Update task (including drag-drop status changes)
- `DELETE /tasks/:taskId` - Delete task

### Chat/Messages
- `GET /chat/:chatId/messages` - Get chat messages
- `POST /chat/:chatId/messages` - Send message
- `POST /chat/:chatId/typing` - Update typing indicator
- `GET /chat/:chatId/typing` - Get typing users

### Notifications
- `GET /notifications/:userId` - Get all notifications
- `POST /notifications` - Create notification
- `PUT /notifications/:notificationId` - Mark as read
- `PUT /notifications/:userId/mark-all-read` - Mark all as read

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics (active projects, tasks, etc.)

### Search
- `GET /search?q=query` - Search users, teams, and projects

### Teams
- `GET /teams/:teamId/members` - Get team members
- `POST /teams/:teamId/members` - Add team member

### Friends/Connections
- `GET /user/:userId/friends` - Get user's friends
- `POST /user/:userId/friends` - Add friend
- `DELETE /user/:userId/friends/:friendId` - Remove friend

### File Upload
- `POST /upload` - Upload file to Supabase Storage

## Frontend Integration

### 1. Authentication Flow

The app checks for existing session on load:

```typescript
import { authAPI } from '/src/utils/api';

// Check session
const { user, session } = await authAPI.getSession();
if (user) {
  // User is logged in
}
```

### 2. Real-time Subscriptions

Subscribe to real-time updates:

```typescript
import { supabase } from '/src/utils/supabase';

// Subscribe to new messages
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages', filter: `team_id=eq.${teamId}` },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();

// Unsubscribe when done
subscription.unsubscribe();
```

### 3. Error Handling

All API functions throw errors that should be caught:

```typescript
try {
  await projectAPI.create(userId, title, dueDate);
  toast.success('Project created!');
} catch (error) {
  toast.error(error.message || 'Failed to create project');
}
```

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Team/project members can access shared data
- Prevents unauthorized data access

### Authentication
- Supabase Auth handles user authentication
- JWT tokens for secure API access
- Automatic session management
- Password hashing and security

### Data Validation
- Server-side validation on all endpoints
- Type checking and sanitization
- Protection against SQL injection
- XSS prevention

## Troubleshooting

### "Unauthorized" errors
- Ensure the access token is being sent in the Authorization header
- Check that the token hasn't expired
- Verify the user is authenticated

### RLS policy errors
- Check that RLS policies are properly created
- Verify the user has access to the requested resource
- Review policy conditions in the migration SQL

### Realtime not working
- Verify replication is enabled for the table
- Check that the subscription filter matches the data
- Ensure the channel is properly subscribed

### File upload fails
- Check that the storage bucket was created
- Verify the file size is under 50MB
- Ensure user is authenticated

## Next Steps

1. Run the migration SQL to create all tables
2. Test authentication by signing up a new user
3. Create sample projects and tasks to verify functionality
4. Enable realtime for chat and notifications
5. Test the entire flow from landing page to dashboard

## Support

For issues or questions:
- Check the Supabase documentation: https://supabase.com/docs
- Review the API utilities in `/src/utils/api.ts`
- Inspect the server code in `/supabase/functions/server/index.tsx`
