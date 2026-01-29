# PCG Insights Dashboard

A Next.js dashboard application for tracking client interactions, portfolio trends, and ticker analytics for Dimensional's Portfolio Construction Group.

## Features

### Client Interactions Dashboard
- Track and manage client interactions across departments
- GitHub-style contribution heatmap showing activity over time
- Filterable data table with sorting and pagination
- Fullscreen table view with expandable rows
- Filters: Team Member, Department, Intake Type, Project Type, Time Period
- Search by external client or internal client name

### Portfolio Trends Dashboard
- Portfolio construction insights and client analytics
- Style Map and Profitability Map visualizations
- Benchmark comparison vs MSCI ACWI IMI
- Equity and Fixed Income metrics
- Logged Portfolios table with expandable position details
- Fullscreen table view

### Ticker Trends Dashboard
- Hot Tickers & DFA Competitors comparison table
- Most Popular DFA Tickers ranking
- Ticker Adoption Trend chart over time

## Tech Stack

- **Next.js 16.1.6** with App Router
- **React 19.2.3** with TypeScript
- **Tailwind CSS 4** for styling
- **Recharts 3.7.0** for data visualization
- **Lucide React** for icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
app/
├── components/          # Shared components
│   ├── Sidebar.tsx     # Navigation sidebar with dropdown support
│   ├── DashboardHeader.tsx  # Reusable header with filters
│   └── ClientOnlyChart.tsx  # SSR-safe chart wrapper
├── dashboard/
│   ├── client-interactions/  # Client interactions tracking
│   ├── portfolio-trends/     # Portfolio analytics
│   └── ticker-trends/        # Ticker analytics
└── lib/
    ├── api/            # API functions (mock data)
    ├── data/           # Data generation utilities
    └── types/          # TypeScript interfaces
```

## Design

- Dark theme with zinc/black palette
- Blue/cyan accent gradients
- Glassmorphism UI with backdrop blur effects
- Responsive layout with collapsible sidebar navigation
