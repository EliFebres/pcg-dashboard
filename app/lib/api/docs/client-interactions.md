# Client Interactions API Specification

This document describes the API endpoints for the Client Interactions dashboard.

## Base URL

```
/api/client-interactions
```

## Overview

The Client Interactions API provides endpoints for managing client engagement data including:
- Dashboard metrics and visualizations
- Paginated engagement lists with filtering
- CRUD operations for engagements
- Data export functionality

### Design Principles

1. **Minimal Data Transfer**: The API is designed to return only the data needed for each use case
2. **Pre-computed Aggregations**: Metrics and breakdowns are computed server-side to reduce client processing
3. **Efficient Pagination**: Large datasets are paginated to ensure fast initial load
4. **Optimized Updates**: Dedicated endpoints for common updates (status, NNA, notes) to minimize payload size

---

## Endpoints

### GET /dashboard

Fetch all dashboard data in a single optimized call. This is the primary endpoint for initial page load.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `teamMember` | string | Filter by team member or office location |
| `departments` | string[] | Multi-select department filter |
| `intakeTypes` | string[] | Multi-select intake type filter |
| `projectTypes` | string[] | Multi-select project type filter |
| `period` | string | Time period: `1W`, `1M`, `3M`, `6M`, `YTD`, `1Y`, `ALL` |
| `page` | number | Page number for engagements (default: 1) |
| `pageSize` | number | Engagements per page (default: 50) |

**Response:**

```json
{
  "metrics": {
    "clientProjects": {
      "count": 245,
      "changePercent": 12,
      "periodLabel": "YoY",
      "intakeSourceBreakdown": {
        "irqCount": 156,
        "irqPercent": 64,
        "grffCount": 89,
        "grffPercent": 36,
        "portfoliosLogged": 198,
        "portfoliosTotal": 245,
        "portfoliosPercent": 81
      }
    },
    "gcgAdHoc": {
      "count": 87,
      "changePercent": 18,
      "periodLabel": "YoY",
      "intakeBreakdown": [
        { "intake": "In-Person", "count": 32, "percent": 37, "color": "#a5f3fc" },
        { "intake": "Email", "count": 41, "percent": 47, "color": "#22d3ee" },
        { "intake": "Teams", "count": 14, "percent": 16, "color": "#0e7490" }
      ]
    },
    "inProgress": {
      "count": 23,
      "change": 2,
      "sparklineData": [
        { "value": 18 }, { "value": 19 }, { "value": 21 },
        { "value": 20 }, { "value": 22 }, { "value": 21 },
        { "value": 21 }, { "value": 23 }
      ]
    },
    "nna": {
      "total": 2450000000,
      "projectCount": 45,
      "changePercent": 8,
      "tiers": [
        { "label": "<$50M", "count": 28, "color": "#0e7490" },
        { "label": "$50-200M", "count": 12, "color": "#22d3ee" },
        { "label": "$200M+", "count": 5, "color": "#39FF14" }
      ]
    }
  },
  "departments": {
    "departments": [
      { "name": "IAG", "value": 55, "count": 135, "color": "#a5f3fc" },
      { "name": "Broker-Dealer", "value": 33, "count": 81, "color": "#22d3ee" },
      { "name": "Institution", "value": 12, "count": 29, "color": "#0e7490" }
    ],
    "total": 245
  },
  "contributionData": {
    "weeks": [
      [
        { "date": "2024-02-01", "level": 2, "count": 3, "projectCount": 2, "adHocCount": 1 },
        ...
      ],
      ...
    ],
    "totalDays": 365,
    "maxCount": 8
  },
  "engagements": {
    "engagements": [...],
    "total": 332,
    "page": 1,
    "pageSize": 50,
    "hasMore": true
  },
  "filterOptions": {
    "teamMembers": ["All Team Members", "Austin Office", "Charlotte Office"],
    "teamMemberGroups": [
      { "label": "Office", "options": ["Austin Office", "Charlotte Office"] }
    ],
    "departments": ["Broker-Dealer", "IAG", "Institution"],
    "intakeTypes": ["GCG Ad-Hoc", "GRRF", "IRQ"],
    "projectTypes": ["Data Request", "Follow-Up", "Meeting", "Other", "PCR"],
    "statuses": ["Completed", "In Progress", "On Hold"]
  }
}
```

---

### GET /engagements

Fetch paginated engagements with filtering and sorting.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search across external client, internal client, intake type, project type |
| `teamMember` | string | Filter by team member or office |
| `departments` | string[] | Multi-select department filter |
| `intakeTypes` | string[] | Multi-select intake type filter |
| `projectTypes` | string[] | Multi-select project type filter |
| `period` | string | Time period filter |
| `status` | string | Filter by status |
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Results per page (default: 50) |
| `sortColumn` | string | Column to sort by |
| `sortDirection` | string | `asc` or `desc` |

**Response:**

```json
{
  "engagements": [
    {
      "id": 1234,
      "externalClient": "Vanguard Advisors",
      "internalClient": {
        "name": "Jennifer Martinez",
        "gcgDepartment": "IAG"
      },
      "intakeType": "IRQ",
      "adHocChannel": null,
      "type": "Meeting",
      "teamMembers": ["Eli F.", "Sarah K."],
      "department": "IAG",
      "dateStarted": "Jan 15, 2025",
      "dateFinished": "Jan 20, 2025",
      "status": "Completed",
      "portfolioLogged": true,
      "nna": 25000000,
      "notes": "Client requested additional sector breakdowns."
    }
  ],
  "total": 332,
  "page": 1,
  "pageSize": 50,
  "hasMore": true
}
```

---

### GET /metrics

Fetch dashboard metrics only. Use for refreshing metrics without full reload.

**Query Parameters:** Same filters as `/dashboard`

**Response:**

```json
{
  "clientProjects": { ... },
  "gcgAdHoc": { ... },
  "inProgress": { ... },
  "nna": { ... }
}
```

---

### GET /departments

Fetch department breakdown for the chart.

**Query Parameters:** Same filters as `/dashboard`

**Response:**

```json
{
  "departments": [
    { "name": "IAG", "value": 55, "count": 135, "color": "#a5f3fc" },
    { "name": "Broker-Dealer", "value": 33, "count": 81, "color": "#22d3ee" },
    { "name": "Institution", "value": 12, "count": 29, "color": "#0e7490" }
  ],
  "total": 245
}
```

---

### GET /contribution-data

Fetch contribution heatmap data.

**Query Parameters:** Same filters as `/dashboard`

**Response:**

```json
{
  "weeks": [
    [
      {
        "date": "2024-02-01T00:00:00.000Z",
        "level": 2,
        "count": 3,
        "projectCount": 2,
        "adHocCount": 1
      }
    ]
  ],
  "totalDays": 365,
  "maxCount": 8
}
```

---

### POST /engagements

Create a new engagement.

**Request Body:**

```json
{
  "externalClient": "Vanguard Advisors",
  "internalClient": {
    "name": "Jennifer Martinez",
    "gcgDepartment": "IAG"
  },
  "intakeType": "IRQ",
  "adHocChannel": null,
  "type": "Meeting",
  "teamMembers": ["Eli F.", "Sarah K."],
  "department": "IAG",
  "dateStarted": "Jan 28, 2025",
  "dateFinished": "—",
  "status": "In Progress",
  "portfolioLogged": false,
  "nna": null,
  "notes": null
}
```

**Response:** The created engagement with assigned `id`

---

### PATCH /engagements/:id

Update an existing engagement.

**URL Parameters:**
- `id`: Engagement ID

**Request Body:** Partial engagement object with fields to update

```json
{
  "status": "Completed",
  "dateFinished": "Jan 31, 2025",
  "portfolioLogged": true
}
```

**Response:** The updated engagement

---

### PATCH /engagements/:id/status

Optimized endpoint for status updates only.

**URL Parameters:**
- `id`: Engagement ID

**Request Body:**

```json
{
  "status": "Completed"
}
```

**Response:**

```json
{
  "id": 1234,
  "status": "Completed",
  "dateFinished": "Jan 31, 2025"
}
```

---

### PATCH /engagements/:id/nna

Optimized endpoint for NNA updates only.

**URL Parameters:**
- `id`: Engagement ID

**Request Body:**

```json
{
  "nna": 50000000
}
```

**Response:**

```json
{
  "id": 1234,
  "nna": 50000000
}
```

---

### PATCH /engagements/:id/notes

Optimized endpoint for notes updates only.

**URL Parameters:**
- `id`: Engagement ID

**Request Body:**

```json
{
  "notes": "Updated client notes here."
}
```

**Response:**

```json
{
  "id": 1234,
  "notes": "Updated client notes here."
}
```

---

### DELETE /engagements/:id

Delete an engagement.

**URL Parameters:**
- `id`: Engagement ID

**Response:** `204 No Content`

---

### GET /engagements/export

Export filtered engagements as CSV.

**Query Parameters:** Same filters as `/engagements`

**Response:** CSV file download

**Headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="client-interactions-export.csv"
```

---

## Data Types

### Engagement

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique identifier |
| `externalClient` | string \| null | External client company name (optional) |
| `internalClient` | InternalClient | GCG contact/relationship owner |
| `intakeType` | string | `IRQ`, `GRRF`, or `GCG Ad-Hoc` |
| `adHocChannel` | string \| null | `In-Person`, `Email`, or `Teams` (only for GCG Ad-Hoc) |
| `type` | string | Project type: `Meeting`, `Follow-Up`, `Data Request`, `PCR`, `Other` |
| `teamMembers` | string[] | Array of team member names |
| `department` | string | Department derived from internal client |
| `dateStarted` | string | Formatted date string (e.g., "Jan 15, 2025") |
| `dateFinished` | string | Formatted date string or "—" if not finished |
| `status` | string | `In Progress`, `Completed`, or `On Hold` |
| `portfolioLogged` | boolean | Whether a portfolio was logged |
| `nna` | number \| undefined | Net New Assets in dollars |
| `notes` | string \| undefined | Optional notes |

### InternalClient

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Contact name |
| `gcgDepartment` | string | `IAG`, `Broker-Dealer`, or `Institution` |

### DayData (Contribution Heatmap)

| Field | Type | Description |
|-------|------|-------------|
| `date` | Date | The date |
| `level` | number | Activity level 0-4 for heatmap coloring |
| `count` | number | Total engagements on this day |
| `projectCount` | number | Project engagements (IRQ/GRRF) |
| `adHocCount` | number | GCG Ad-Hoc engagements |

---

## Performance Recommendations

### Initial Load

Use the `/dashboard` endpoint for initial page load. This single request returns:
- Pre-computed metrics for all 4 metric cards
- Department breakdown for the chart
- Contribution heatmap data
- First page of engagements
- Available filter options

This eliminates multiple round-trips and allows parallel rendering of all dashboard components.

### Subsequent Updates

| Action | Recommended Endpoint |
|--------|---------------------|
| Filter change | `/dashboard` with new filters |
| Table pagination | `/engagements` with page parameter |
| Status update | `/engagements/:id/status` |
| NNA update | `/engagements/:id/nna` |
| Notes update | `/engagements/:id/notes` |
| Full engagement edit | `/engagements/:id` (PATCH) |

### Caching Recommendations

- Filter options: Cache for session duration
- Department colors: Static, can be hardcoded
- Contribution data: Cache for 5 minutes, invalidate on engagement create/update
- Metrics: Cache for 1 minute, invalidate on engagement changes
