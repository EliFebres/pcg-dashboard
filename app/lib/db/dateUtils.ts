/**
 * Converts a display date string ("Jan 15, 2025") or "—" to ISO date ("2025-01-15" or null).
 * Used when writing to DuckDB.
 */
export function toISODate(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr === '—') return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

/**
 * Converts an ISO date string ("2025-01-15") from DuckDB to display format ("Jan 15, 2025").
 * Returns "—" for null/undefined (used for in-progress engagements with no finish date).
 */
export function toDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  // Force local midnight parse to avoid UTC offset shifting the date
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Returns the ISO date string marking the start of the given period filter.
 * Returns null for "ALL" (no date constraint).
 */
export function getPeriodStartISO(period: string): string | null {
  const now = new Date();
  switch (period) {
    case '1W':
      return new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    case '1M':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
    case '3M':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0];
    case '6M':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0];
    case 'YTD':
      return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    case '1Y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    case 'ALL':
      return null;
    default:
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
  }
}

/**
 * Returns ISO start/end dates for the previous equivalent period (used for change% calculations).
 */
export function getPreviousPeriodDates(period: string): { start: string; end: string; label: string } {
  const now = new Date();
  switch (period) {
    case '1W': {
      const currStart = new Date(now.getTime() - 7 * 86400000);
      const prevEnd = new Date(currStart.getTime() - 86400000);
      const prevStart = new Date(prevEnd.getTime() - 7 * 86400000);
      return {
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0],
        label: 'vs prev week',
      };
    }
    case '1M': {
      const currStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const prevEnd = new Date(currStart.getTime() - 86400000);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
      return {
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0],
        label: 'vs prev month',
      };
    }
    case '3M': {
      const currStart = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      const prevEnd = new Date(currStart.getTime() - 86400000);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return {
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0],
        label: 'vs prev 3M',
      };
    }
    case '6M': {
      const currStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      const prevEnd = new Date(currStart.getTime() - 86400000);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
      return {
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0],
        label: 'vs prev 6M',
      };
    }
    case 'YTD': {
      const currStart = new Date(now.getFullYear(), 0, 1);
      const prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const prevStart = new Date(now.getFullYear() - 1, 0, 1);
      return {
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0],
        label: 'vs prev YTD',
      };
    }
    case 'ALL':
      return { start: '2000-01-01', end: '2099-12-31', label: 'All Time' };
    case '1Y':
    default: {
      const currStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const prevEnd = new Date(currStart.getTime() - 86400000);
      const prevStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      return {
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0],
        label: 'YoY',
      };
    }
  }
}
