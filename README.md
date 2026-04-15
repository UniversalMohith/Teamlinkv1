<p align="center">
  <img src="https://img.shields.io/badge/TeamLink-Project%20Management-4F46E5?style=for-the-badge&logoColor=white" alt="TeamLink" />
</p>

<h1 align="center">TeamLink</h1>

<p align="center">
  A modern project management and team collaboration app — think Jira meets Slack, built with React and Supabase.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## Overview

TeamLink is a full-featured project management and team collaboration platform. It combines kanban boards, real-time team chat, friend connections, and notifications into a single unified workspace — designed to help teams plan, track, and communicate without switching between tools.

**Live demo:** [teamlinkv1.vercel.app](https://teamlinkv1.vercel.app)

---

## Features

### Kanban Board
- Create projects with customisable columns (To Do, In Progress, Done, or your own)
- Drag-and-drop tasks between columns with live status updates
- Task cards with titles, descriptions, due dates, and assignees
- Inline task creation per column

### Team Chat
- Unified chat system — accessible from the dashboard, kanban board, or floating bubble
- Project-based channels automatically created per board
- Real-time message polling
- Add members to project channels via user search
- Full-page chat view with conversation sidebar

### Dashboard
- Collapsible dark sidebar navigation
- Stats overview: active projects, total tasks, completed tasks
- Project list with progress bars and member avatars
- Recent activity feed
- Quick access to all sections via header icons with live badge counts

### Connections
- Search and add friends by name or email
- Send, accept, and decline friend requests
- Tabbed view: Friends / Requests / Find People
- Real-time connection counts in header badges

### Notifications
- Grouped by date: Today, Yesterday, Earlier
- Type-specific icons (task assigned, friend request, project update)
- Mark individual or all notifications as read
- Live unread count badge

### Profile & Settings
- Editable profile: name, role, bio, avatar
- Theme settings with dark mode toggle
- Notification preferences
- All changes persist to Supabase

### Dark Mode
- Respects system preference by default
- Manual toggle available in dashboard, kanban, and settings
- Smooth transitions between themes
- Full Tailwind `dark:` variant support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 6 |
| **Styling** | Tailwind CSS 4 + CSS variables |
| **UI Components** | Radix UI (shadcn/ui) |
| **Backend** | Supabase (Auth, Database, Edge Functions, Storage) |
| **Auth** | Supabase Auth (Email/Password + Google OAuth) |
| **Drag & Drop** | react-dnd |
| **Icons** | Lucide React |
| **Animations** | Motion (Framer Motion) |
| **Charts** | Recharts |
| **Routing** | React Router 7 |
| **Deployment** | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── App.tsx                    # Root app with routing and auth
│   └── components/
│       ├── Dashboard.tsx          # Main dashboard with sidebar and stats
│       ├── KanbanBoard.tsx        # Kanban board with drag-and-drop
│       ├── ChatInterface.tsx      # Full-page chat view
│       ├── ChatPopup.tsx          # Popup chat panel
│       ├── UniversalChat.tsx      # Floating chat bubble + expandable panel
│       ├── ConnectionsPopup.tsx   # Friends and connections management
│       ├── NotificationsPage.tsx  # Notification centre
│       ├── ProfilePage.tsx        # User profile editor
│       ├── SettingsPage.tsx       # App settings
│       ├── LoginPage.tsx          # Auth (login/signup)
│       ├── LandingPage.tsx        # Public landing page
│       ├── ThemeContext.tsx        # Dark mode context provider
│       └── ui/                    # shadcn/ui primitives
├── styles/
│   ├── theme.css                  # CSS custom properties (light/dark)
│   ├── index.css                  # Global styles
│   ├── tailwind.css               # Tailwind base
│   ├── accent.css                 # Accent colour overrides
│   └── fonts.css                  # Typography
├── utils/
│   ├── api.ts                     # All Supabase API calls
│   ├── supabase.ts                # Supabase client initialisation
│   ├── types.ts                   # TypeScript type definitions
│   └── info.ts                    # App configuration
└── main.tsx                       # Entry point

supabase/
├── functions/server/              # Edge functions
└── migrations/                    # Database schema
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm
- A **Supabase** project with the schema from `supabase/migrations/001_initial_schema.sql`

### Installation

```bash
# Clone the repository
git clone https://github.com/UniversalMohith/Teamlinkv1.git
cd Teamlinkv1

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:5173`.

### Environment

The Supabase connection is configured in `src/utils/supabase.ts` and `src/utils/info.ts`. Update these files with your own Supabase project URL and anon key if you're setting up a fresh instance.

---

## Deployment

The app is deployed on **Vercel** with automatic deployments from the `main` branch.

```bash
# Build for production
pnpm build
```

The build output is in the `dist/` directory, ready for any static hosting provider.

---

## Design

The original UI design is available on [Figma](https://www.figma.com/design/yXjWByEDrkPdLRowI8zF1D/Teamlink).

---

## License

This project is private and not licensed for redistribution.
