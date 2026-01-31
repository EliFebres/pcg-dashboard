# Client Interactions API Specification

This document defines the recommended API structure for the Client Interactions dashboard backend.

---

## Overview

The API is designed around **aggregated responses** for visualizations and **paginated responses** for table data. This ensures consistent performance regardless of data volume.

### Design Principles

- **Server-side filtering, sorting, and pagination** - Avoid transferring unused records
- **Pre-computed aggregations** - Metrics and charts don't need raw engagement data
- **Bounded response sizes** - Response sizes stay constant as data grows
- **Graceful degradation** - Handle sparse/missing fields from historical imports

---

## Endpoints

### 1. GET `/api/engagements/metrics`

Returns pre-computed metrics for the filtered period.

#### Response

```typescript
interface MetricsResponse {
  clientProjects: {
    count: number;
    change: number;  // Percentage change from previous period
  };
  gcgAdHoc: {
    count: number;
    change: number;
  };
  inProgress: {
    count: number;
    change: number;
  };
  portfoliosLogged: {
    count: number;
    percentage: number;  // Percentage of projects with logged portfolios
    change: number;
  };
}
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Time period filter (e.g., `7d`, `30d`, `90d`, `1y`, `all`) |
| `teamMember` | string | No | Filter by team member ID |
| `department` | string | No | Filter by department (e.g., `IAG`, `Broker-Dealer`, `Institution`) |
| `intakeType` | string | No | Filter by intake type (e.g., `IRQ`, `GRRF`, `GCG Ad-Hoc`) |
| `projectType` | string | No | Filter by project type (e.g., `Meeting`, `Follow-Up`, `Data Request`, `PCR`) |

#### Example Request

```
GET /api/engagements/metrics?period=30d&department=IAG
```

#### Response Size: ~1 KB

---

### 2. GET `/api/engagements/contribution-data`

Returns aggregated daily counts for the contribution graph. Returns ~260 objects per year regardless of engagement volume.

#### Response

```typescript
interface ContributionDataResponse {
  year: number;
  availableYears: number[];  // e.g., [2020, 2021, 2022, 2023, 2024, 2025]
  days: Array<{
    date: string;            // ISO date string "2025-01-28"
    projectCount: number;
    adHocCount: number;
    level: 0 | 1 | 2 | 3 | 4; // Activity level for color coding
  }>;
}
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | number | No | Year to fetch (defaults to current year) |
| `teamMember` | string | No | Filter by team member ID |
| `department` | string | No | Filter by department |
| `intakeType` | string | No | Filter by intake type |
| `projectType` | string | No | Filter by project type |

#### Notes

- The `availableYears` array enables the UI to show a year selector for historical views
- Activity `level` is computed server-side based on configurable thresholds
- Always returns a full year of data (Jan 1 - Dec 31 or current date for current year)

#### Example Request

```
GET /api/engagements/contribution-data?year=2024
```

#### Response Size: ~15 KB

---

### 3. GET `/api/engagements/department-breakdown`

Returns pre-aggregated department distribution for the pie chart.

#### Response

```typescript
interface DepartmentBreakdownResponse {
  departments: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}
```

#### Query Parameters

Same as `/metrics` endpoint.

#### Example Request

```
GET /api/engagements/department-breakdown?period=30d
```

#### Response Size: ~1 KB

---

### 4. GET `/api/engagements`

Returns paginated, server-filtered, server-sorted engagements for the data table.

#### Response

```typescript
interface EngagementsResponse {
  data: Engagement[];  // Max 10-50 per page
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface Engagement {
  id: string;
  clientName: string;
  department: 'IAG' | 'Broker-Dealer' | 'Institution';
  intakeType: 'IRQ' | 'GRRF' | 'GCG Ad-Hoc';
  projectType: 'Meeting' | 'Follow-Up' | 'Data Request' | 'PCR' | 'Other';
  status: 'In Progress' | 'Completed' | 'On Hold';
  teamMember: string;
  createdAt: string;  // ISO timestamp
  updatedAt: string;  // ISO timestamp
  portfolioLogged: boolean;
  notes?: string;
}
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-indexed) |
| `pageSize` | number | No | 10 | Items per page (max 50) |
| `sortBy` | string | No | `createdAt` | Column to sort by |
| `sortOrder` | string | No | `desc` | Sort direction (`asc` or `desc`) |
| `search` | string | No | - | Server-side text search across client name, notes |
| `period` | string | No | - | Time period filter |
| `teamMember` | string | No | - | Filter by team member ID |
| `department` | string | No | - | Filter by department |
| `intakeType` | string | No | - | Filter by intake type |
| `projectType` | string | No | - | Filter by project type |
| `status` | string | No | - | Filter by status |

#### Example Request

```
GET /api/engagements?page=1&pageSize=25&sortBy=createdAt&sortOrder=desc&department=IAG
```

#### Response Size: 5-25 KB (depending on page size)

---

### 5. GET `/api/engagements/export`

For rare leadership export requests. Returns more data with reasonable limits.

#### Response

```typescript
interface ExportResponse {
  data: Engagement[];
  exportedAt: string;     // ISO timestamp
  filters: {              // Echo back applied filters
    period?: string;
    teamMember?: string;
    department?: string;
    intakeType?: string;
    projectType?: string;
  };
  totalCount: number;
  truncated: boolean;     // True if results were limited
  truncatedAt?: number;   // Max records if truncated
}
```

#### Query Parameters

Same filters as `/engagements` plus:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `json` | Export format (`csv` or `json`) |

#### Headers

- `Accept: text/csv` - Returns CSV format
- `Accept: application/json` - Returns JSON format

#### Limits

- Maximum 10,000 records per export
- Response includes `truncated: true` if limit was reached

#### Example Request

```
GET /api/engagements/export?period=1y&department=IAG&format=csv
```

---

## Response Size Summary

| Endpoint | Records | Approximate Size |
|----------|---------|------------------|
| `/metrics` | 1 object | <1 KB |
| `/contribution-data` | ~260 days | ~15 KB |
| `/department-breakdown` | 3 items | <1 KB |
| `/engagements?page=1` | 10-50 rows | 5-25 KB |

**Total initial load**: ~25-45 KB

---

## Refresh Strategy

### Recommended Implementation

**Hybrid approach**: Auto-refresh + manual refresh button

| Strategy | Interval | Endpoints | Notes |
|----------|----------|-----------|-------|
| Auto-refresh | 5 minutes | `/metrics`, `/contribution-data` | Configurable interval |
| Manual refresh | On demand | All endpoints | Button in header |
| Smart refresh | - | `/engagements` | Only re-fetch when tab is visible |
| Stale indicator | - | - | Show "Last updated X min ago" |

### Implementation Notes

```typescript
// Example refresh configuration
const REFRESH_CONFIG = {
  autoRefreshInterval: 5 * 60 * 1000,  // 5 minutes
  staleThreshold: 10 * 60 * 1000,      // 10 minutes - show warning
  endpoints: {
    metrics: { autoRefresh: true },
    contributionData: { autoRefresh: true },
    engagements: { autoRefresh: false },  // Only on manual or filter change
  }
};
```

---

## Data Migration Considerations

### Historical Kanban Import (~5 years)

The backend should handle these scenarios from historical data:

1. **Missing GCG Ad-Hoc** - Touch points are new; historical records won't have them
2. **Field mapping** - Old Kanban fields may need mapping to new schema
3. **Sparse data** - Some fields may be null/undefined
4. **Validation** - One-time import script should validate and log issues

### Recommended Approach

```typescript
// Backend should handle missing fields gracefully
interface EngagementInput {
  clientName: string;           // Required
  department: string;           // Required
  intakeType?: string;          // Optional for historical
  projectType?: string;         // Optional for historical
  status?: string;              // Default to 'Completed' for historical
  teamMember?: string;          // May be missing
  createdAt: string;            // Required - from Kanban
  portfolioLogged?: boolean;    // Default false
}
```

---

## Error Responses

### Standard Error Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PARAMETER` | 400 | Invalid query parameter value |
| `INVALID_PAGE` | 400 | Page number out of range |
| `EXPORT_LIMIT_EXCEEDED` | 400 | Export would exceed max records |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | User cannot access this resource |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication & Authorization

### Privacy Requirements

- Users can only see their own team member's activity by default
- Team member filter shows "All Team Members" and current user only
- Leadership/admin roles may have broader access (implement role-based filtering)

### Recommended Headers

```
Authorization: Bearer <token>
X-Request-ID: <uuid>  // For request tracing
```

---

## Caching Recommendations

| Endpoint | Cache Strategy | TTL |
|----------|----------------|-----|
| `/metrics` | Cache with invalidation | 1 minute |
| `/contribution-data` | Cache per year | 5 minutes |
| `/department-breakdown` | Cache with invalidation | 1 minute |
| `/engagements` | No cache (paginated, filtered) | - |
| `/export` | No cache | - |

### Cache Invalidation

Invalidate caches when:
- New engagement is created
- Engagement is updated
- Engagement is deleted

Consider using ETags for conditional requests.

---

## Future Considerations

### Potential Enhancements

1. **WebSocket updates** - Real-time updates instead of polling
2. **Batch operations** - Bulk update/delete for admin operations
3. **Saved filters** - Allow users to save filter presets
4. **Activity log** - Track who viewed/exported data

### Versioning

Consider API versioning from the start:
```
/api/v1/engagements/metrics
```

This allows for breaking changes in future versions without disrupting existing clients.
