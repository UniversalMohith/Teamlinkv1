I want to fully connect this Teamlink app to my already-connected Supabase backend. 
All data is currently hardcoded. Replace all hardcoded data with real Supabase reads 
and writes. Here is the full spec:

---

## 1. DATABASE SCHEMA — create these tables in Supabase

### users (extend Supabase Auth)
- id (uuid, references auth.users)
- first_name (text)
- last_name (text)
- email (text)
- phone (text)
- job_title (text)
- company (text)
- department (text)
- bio (text)
- location (text)
- skills (text[])
- avatar_initials (text)
- created_at (timestamp, default now)

### teams
- id (uuid, primary key, default gen_random_uuid())
- name (text)
- description (text)
- created_by (uuid, references users.id)
- created_at (timestamp, default now)

### team_members
- id (uuid, primary key)
- team_id (uuid, references teams.id)
- user_id (uuid, references users.id)
- role (text) — e.g. 'Admin', 'Member', 'Owner', 'Viewer'
- joined_at (timestamp, default now)

### projects
- id (uuid, primary key)
- title (text)
- description (text)
- due_date (date, nullable)
- progress (integer, default 0)
- status (text) — 'Active' or 'Completed'
- team_id (uuid, references teams.id, nullable)
- created_by (uuid, references users.id)
- created_at (timestamp, default now)

### project_members
- id (uuid, primary key)
- project_id (uuid, references projects.id)
- user_id (uuid, references users.id)

### tasks
- id (uuid, primary key)
- title (text)
- description (text)
- status (text) — 'todo', 'in-progress', or 'done'
- assignee_id (uuid, references users.id, nullable)
- project_id (uuid, references projects.id)
- due_date (date, nullable)
- labels (text[], nullable)
- created_at (timestamp, default now)

### messages
- id (uuid, primary key)
- team_id (uuid, references teams.id)
- sender_id (uuid, references users.id)
- content (text)
- sent_at (timestamp, default now)

### notifications
- id (uuid, primary key)
- user_id (uuid, references users.id)
- type (text) — 'task', 'message', 'team'
- title (text)
- description (text)
- read (boolean, default false)
- created_at (timestamp, default now)

---

## 2. AUTHENTICATION (Landing / Login screens)

- On the Landing screen: clicking "Get Started Now" or "Sign Up" should open the 
  login/register flow.
- On the Login screen: wire the email + password form to Supabase Auth 
  (signInWithPassword). On success, load the logged-in user's profile from the 
  `users` table and navigate to the Dashboard. Show an error toast if login fails.
- Add a Sign Up path: collect first name, last name, email, password, confirm 
  password. On submit: call Supabase Auth signUp, then insert a row into the `users` 
  table with their details. Navigate to Dashboard on success.
- Add a Logout handler: call Supabase Auth signOut and navigate back to the Landing screen.

---

## 3. DASHBOARD screen

- Replace all hardcoded stats (Total Tasks, Active Projects, etc.) with live counts 
  queried from Supabase for the logged-in user:
  - Total Tasks: count rows in `tasks` where assignee_id = current user
  - Active Projects: count rows in `projects` joined via project_members where status = 'Active'
  - Completed tasks: count tasks where status = 'done'
- Replace hardcoded "My Projects" cards with a real-time query of the user's projects 
  from `projects` (via project_members), showing title, progress, due_date, member count.
- Replace hardcoded "Recent Activity" / "Team Activity" with the 5 most recent notifications 
  for the current user from the `notifications` table, ordered by created_at desc.

---

## 4. TEAMS screen

- Replace hardcoded team list with a real query: fetch all teams the current user 
  belongs to via `team_members`, showing team name, member count, and role.
- "Add People" button: open a modal, search users by name/email, insert a row into 
  `team_members` for the selected user and current team.
- Team detail (Chat): when a team is opened, load all messages from the `messages` 
  table where team_id matches, ordered by sent_at asc.
- "Type a message..." send button: insert a new row into `messages` with the current 
  user's id, team_id, and message content. Subscribe to real-time updates using 
  Supabase Realtime so new messages appear instantly without refresh.

---

## 5. PROJECTS / KANBAN BOARD screen

- Load project tasks from the `tasks` table where project_id matches the opened project, 
  grouped by status (todo / in-progress / done) into the Kanban columns.
- When a task card is dragged between columns: update the task's `status` field in Supabase.
- "New Project" form (title, due date): on submit, insert a row into `projects` and 
  also insert the current user into `project_members`. Navigate to the new project 
  Kanban board on success.
- "Add task" within a column: insert a new row into `tasks` with the given title, 
  status matching the column, and project_id.

---

## 6. MESSAGES screen

- The search/conversations list: query distinct teams the user is a member of, plus 
  the most recent message from each, from `messages`.
- Search bar: filter conversations by team name in real time.
- Opening a conversation: load the full message thread from `messages` for that team_id.
- Sending a message: insert into `messages` and use Supabase Realtime to stream updates.

---

## 7. NOTIFICATIONS screen

- Replace hardcoded notifications with a real query from `notifications` where 
  user_id = current user, ordered by created_at desc.
- "Mark all as read" button: update all rows in `notifications` for this user to 
  read = true.
- Individual notification click: update that notification's read = true in Supabase.

---

## 8. PROFILE screen

- Load the logged-in user's full row from the `users` table and display all fields 
  (name, job title, company, department, phone, bio, location, skills, avatar).
- "Edit Profile Information" / "Save Changes": on submit, update the user's row in 
  `users` with all changed fields.
- "Change Password" / "Update Password": use Supabase Auth updateUser to change password.
- "Recent Achievements" and "Skills & Expertise": load/save from the user's row in 
  `users`.
- Profile activity: query the 4 most recent actions from `notifications` for this user.

---

## 9. SETTINGS screen

- Security tab → "Enable 2FA": wire to Supabase Auth MFA enroll.
- Active Sessions: load from Supabase Auth admin sessions for the current user.
- "Revoke" session button: call Supabase Auth to revoke that session.
- Organization section (Company Name, Role, Department): read/write from the `users` 
  table.
- All other settings (theme, language, notifications, display) can remain local 
  state for now (stored in localStorage).

---

## 10. SEARCH screen

- Wire the search bar to query the `users` table (by name) and `teams` table (by name) 
  and `projects` table (by title) simultaneously.
- Display results grouped by type (People / Teams / Projects).

---

## 11. GENERAL RULES

- Store Supabase URL and anon key using Figma Make's secrets system — never hardcode them.
- All screens that load data should show a loading spinner while fetching and an error 
  state if the fetch fails.
- Apply Row Level Security (RLS) in Supabase so users can only read/write their own data.
- After replacing each hardcoded data set, remove the static mock array entirely.
- Use the currently logged-in user's session (from Supabase Auth) as the source of 
  truth for user identity across all screens.
