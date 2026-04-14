import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// Create a singleton Supabase client
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionUrl: true
    }
  }
);

// Database types
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  company?: string;
  department?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  avatar_initials: string;
  role?: string;
  status?: string;
  last_active?: string;
  created_at?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  progress: number;
  status: string;
  color?: string;
  team_id?: string;
  created_by: string;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee_id?: string;
  project_id: string;
  due_date?: string;
  labels?: string[];
  created_at?: string;
}

export interface Message {
  id: string;
  team_id: string;
  sender_id: string;
  content: string;
  image_url?: string;
  file_name?: string;
  sent_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description?: string;
  read: boolean;
  created_at?: string;
}

export interface Connection {
  id: string;
  user_id: string;
  friend_id: string;
  created_at?: string;
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper function to get current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};
