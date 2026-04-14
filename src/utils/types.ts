// Shared types for the application
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
  status?: string;
  last_active?: string;
  created_at?: string;
}

// Helper function to get user's full name
export const getUserFullName = (user: User) => {
  return `${user.first_name} ${user.last_name}`;
};

// Helper function to get display avatar (for backwards compatibility)
export const getUserAvatar = (user: User) => {
  return user.avatar_initials;
};
