# Supabase Database Setup for TeamLink

## Important: You Must Execute These SQL Statements in Supabase

Please go to your Supabase Dashboard → SQL Editor and run the following SQL to create the required tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  company TEXT,
  department TEXT,
  bio TEXT,
  location TEXT,
  skills TEXT[],
  avatar_initials TEXT,
  status TEXT DEFAULT 'offline',
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'Member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  color TEXT DEFAULT 'bg-blue-500',
  team_id UUID REFERENCES teams(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  assignee_id UUID REFERENCES users(id),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  due_date DATE,
  labels TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  image_url TEXT,
  file_name TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends/Connections table
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for teams
CREATE POLICY "Team members can view their teams" ON teams FOR SELECT 
  USING (EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid()));
CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Team creators can update teams" ON teams FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for team_members
CREATE POLICY "Team members can view members" ON team_members FOR SELECT 
  USING (EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()));
CREATE POLICY "Team admins can add members" ON team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM team_members WHERE team_id = team_members.team_id AND user_id = auth.uid() AND role IN ('Admin', 'Owner'))
);

-- RLS Policies for projects
CREATE POLICY "Project members can view projects" ON projects FOR SELECT 
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()));
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Project creators can update projects" ON projects FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for project_members
CREATE POLICY "Project members can view members" ON project_members FOR SELECT 
  USING (EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()));
CREATE POLICY "Project creators can add members" ON project_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_members.project_id AND created_by = auth.uid())
);

-- RLS Policies for tasks
CREATE POLICY "Project members can view tasks" ON tasks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_members.project_id = tasks.project_id AND project_members.user_id = auth.uid()));
CREATE POLICY "Project members can create tasks" ON tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM project_members WHERE project_members.project_id = tasks.project_id AND project_members.user_id = auth.uid())
);
CREATE POLICY "Project members can update tasks" ON tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM project_members WHERE project_members.project_id = tasks.project_id AND project_members.user_id = auth.uid())
);
CREATE POLICY "Project members can delete tasks" ON tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM project_members WHERE project_members.project_id = tasks.project_id AND project_members.user_id = auth.uid())
);

-- RLS Policies for messages
CREATE POLICY "Team members can view messages" ON messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = messages.team_id AND team_members.user_id = auth.uid()));
CREATE POLICY "Team members can send messages" ON messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = messages.team_id AND team_members.user_id = auth.uid())
);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- RLS Policies for connections
CREATE POLICY "Users can view own connections" ON connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create connections" ON connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON connections FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_messages_team_id ON messages(team_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_friend_id ON connections(friend_id);

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
```

## After Running the SQL

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider
3. (Optional) Configure Google OAuth: https://supabase.com/docs/guides/auth/social-login/auth-google
4. (Optional) Configure Facebook OAuth: https://supabase.com/docs/guides/auth/social-login/auth-facebook

## Storage Bucket Setup

Go to Supabase Dashboard → Storage and create a bucket named `teamlink-files` with these settings:
- Public: No (private bucket)
- File size limit: 50MB
- Allowed MIME types: All

The application will automatically handle file uploads to this bucket.
