# PCG Insights Dashboard

A Next.js dashboard application for tracking client interactions, portfolio trends, and ticker analytics for Dimensional's Portfolio Construction Group.

## Features

### Authentication
- Login/signup with email and password (bcrypt-hashed)
- JWT session cookies (24-hour expiration)
- First registered user is automatically granted admin status
- Subsequent users start as **pending** and must be approved by an admin before they can log in

### Admin Dashboard (`/admin/users`)
- View all registered users with their team, office, and status
- Approve pending users, deactivate active users
- Promote users to admin or demote admins to standard users

### Client Interactions Dashboard
- Track and manage client engagements (IRQ, GRRF, GCG Ad-Hoc) with full CRUD support
- Create, edit, and delete engagements via modal forms
- Inline edits for status, NNA (Net New Assets), and notes
- GitHub-style contribution heatmap showing daily activity over time
- Department breakdown bar chart
- Metric cards: Client Projects, GCG Ad-Hoc, In Progress, and NNA — all with period-over-period change
- Filterable, sortable, paginated table with expandable rows
- Fullscreen table view
- Filters: Team Member, Department, Intake Type, Project Type, Time Period, Status
- Text search across clients, intake type, and project type
- CSV export

### Portfolio Trends Dashboard
- Portfolio construction insights and client analytics
- Style Map and Profitability Map visualizations
- Benchmark comparison vs MSCI ACWI IMI
- Equity and Fixed Income metrics
- Logged Portfolios table with expandable position details and fullscreen view

### Ticker Trends Dashboard
- Hot Tickers & DFA Competitors comparison table with inline editing (type, notes, talking points, PCR links)
- Most Popular DFA Tickers ranking
- Ticker Adoption Trend chart over time

## Tech Stack

- **Next.js 16.2.1** with App Router
- **React 19.2.3** with TypeScript
- **Tailwind CSS 4** for styling
- **DuckDB 1.5.1** (Node API) for data persistence
- **Jose 6.2.2** for JWT authentication
- **bcryptjs** for password hashing
- **Recharts 3.7.0** for data visualization
- **Lucide React** for icons

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# Absolute path to the folder where DuckDB database files will be stored
DUCKDB_DIR=./data

# 32+ character hex string used to sign JWT session tokens
JWT_SECRET=your_jwt_secret_here
```

When `DUCKDB_DIR` is set, the app reads from and writes to real DuckDB databases. If it is unset, the app falls back to in-memory mock data (read-only).

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables (see above)
cp .env.local.example .env.local  # or create manually

# Initialize the database and populate with mock data
npm run seed:mock

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up — the first account created is automatically an admin.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server at localhost:3000 |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Create DuckDB schema only (no data) |
| `npm run seed:mock` | Create schema and populate with ~500 mock engagements |

## Project Structure

```
app/
├── api/                    # Next.js route handlers (server-side)
│   ├── auth/               # Login, signup, logout, /me
│   ├── client-interactions/ # Engagement CRUD + dashboard aggregations
│   └── admin/              # User management endpoints
├── admin/users/            # Admin user management page
├── login/                  # Login page
├── signup/                 # Registration/access request page
├── dashboard/
│   ├── client-interactions/ # Client interaction tracking
│   └── trends/
│       ├── portfolio-trends/ # Portfolio analytics
│       └── ticker-trends/    # Ticker analytics
├── components/             # Shared UI components
│   ├── Sidebar.tsx         # Navigation sidebar with dropdown support
│   ├── DashboardHeader.tsx # Reusable header with filters
│   └── ClientOnlyChart.tsx # SSR-safe chart wrapper
└── lib/
    ├── api/                # Client-side API fetch functions
    ├── auth/               # JWT helpers and AuthContext
    ├── data/               # Mock data generation utilities
    ├── db/                 # DuckDB connection and query functions
    └── types/              # TypeScript interfaces
middleware.ts               # Route protection and auth enforcement
scripts/
└── seed-db.ts              # Database seeding script
```

## Design

- Dark theme with zinc/black palette
- Blue/cyan accent gradients
- Glassmorphism UI with backdrop blur effects
- Responsive layout with collapsible sidebar navigation
