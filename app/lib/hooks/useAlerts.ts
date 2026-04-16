'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '@/app/lib/auth/context';
import { toDisplayName } from '@/app/lib/auth/types';
import { getEngagements, getEngagementNotes } from '@/app/lib/api/client-interactions';
import type { Alert } from '@/app/lib/types/alerts';

interface AlertState {
  seenAssignments: string[];
  seenFollowUps: string[];
  seenNoteCounts: Record<string, number>;
  dismissedNoteIds: string[];
  bootstrapped: boolean;
}

function emptyState(): AlertState {
  return {
    seenAssignments: [],
    seenFollowUps: [],
    seenNoteCounts: {},
    dismissedNoteIds: [],
    bootstrapped: false,
  };
}

function storageKey(userId: string) {
  return `isg-alerts-state-${userId}`;
}

function loadState(userId: string): AlertState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

function saveState(userId: string, state: AlertState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function addUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

function parseEngagementDate(displayDate: string): Date | null {
  if (!displayDate || displayDate === '—') return null;
  const d = new Date(displayDate);
  return isNaN(d.getTime()) ? null : d;
}

function isThreeMonthsOrOlder(displayDate: string): boolean {
  const d = parseEngagementDate(displayDate);
  if (!d) return false;
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - 3);
  return d.getTime() <= threshold.getTime();
}

export function useAlerts() {
  const { user } = useCurrentUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const stateRef = useRef<AlertState | null>(null);

  const compute = useCallback(async () => {
    if (!user) return;
    const displayName = toDisplayName(user.firstName, user.lastName);
    setIsLoading(true);
    try {
      const state = stateRef.current ?? loadState(user.id);
      stateRef.current = state;
      const isBootstrap = !state.bootstrapped;

      const res = await getEngagements({
        teamMember: displayName,
        period: 'ALL',
        pageSize: 1000,
      });
      const engagements = res.engagements;
      const result: Alert[] = [];

      // Alert 1: Follow Up 3+ months old
      for (const eng of engagements) {
        if (eng.status !== 'Follow Up') continue;
        if (!isThreeMonthsOrOlder(eng.dateStarted)) continue;
        if (state.seenFollowUps.includes(String(eng.id))) continue;
        result.push({
          id: `followup-${eng.id}`,
          type: 'follow-up-stale',
          engagement: eng,
          timestamp: parseEngagementDate(eng.dateStarted)?.getTime() ?? 0,
        });
      }

      // Alert 2: Assigned to a project you didn't create
      for (const eng of engagements) {
        if (eng.createdById === user.id) continue;
        if (!eng.teamMembers.includes(displayName)) continue;
        const key = String(eng.id);
        if (isBootstrap) {
          addUnique(state.seenAssignments, key);
          continue;
        }
        if (state.seenAssignments.includes(key)) continue;
        result.push({
          id: `assigned-${eng.id}`,
          type: 'assigned',
          engagement: eng,
          timestamp: parseEngagementDate(eng.dateStarted)?.getTime() ?? Date.now(),
        });
      }

      // Alert 3: New notes on engagements the user is on
      const notePromises: Promise<void>[] = [];
      for (const eng of engagements) {
        if (!eng.teamMembers.includes(displayName)) continue;
        const currentCount = eng.noteCount ?? 0;
        const key = String(eng.id);
        const lastSeen = state.seenNoteCounts[key] ?? 0;

        if (isBootstrap) {
          state.seenNoteCounts[key] = currentCount;
          continue;
        }
        if (currentCount <= lastSeen) {
          state.seenNoteCounts[key] = currentCount;
          continue;
        }
        notePromises.push(
          (async () => {
            try {
              const notes = await getEngagementNotes(eng.id);
              const newCount = Math.min(currentCount - lastSeen, notes.length);
              for (let i = 0; i < newCount; i++) {
                const note = notes[i];
                if (note.authorId === user.id) continue;
                const alertId = `note-${eng.id}-${note.id}`;
                if (state.dismissedNoteIds.includes(alertId)) continue;
                result.push({
                  id: alertId,
                  type: 'note-added',
                  engagement: eng,
                  note,
                  timestamp: new Date(note.createdAt).getTime(),
                });
              }
            } catch (err) {
              console.error('[useAlerts] failed to fetch notes for', eng.id, err);
            }
          })(),
        );
      }
      await Promise.all(notePromises);

      if (isBootstrap) state.bootstrapped = true;
      saveState(user.id, state);

      result.sort((a, b) => b.timestamp - a.timestamp);
      setAlerts(result);
    } catch (err) {
      console.error('[useAlerts] failed to compute alerts', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) compute();
  }, [user, compute]);

  const dismiss = useCallback(
    (alert: Alert) => {
      if (!user) return;
      const state = stateRef.current ?? loadState(user.id);
      const key = String(alert.engagement.id);
      if (alert.type === 'follow-up-stale') {
        addUnique(state.seenFollowUps, key);
      } else if (alert.type === 'assigned') {
        addUnique(state.seenAssignments, key);
      } else if (alert.type === 'note-added') {
        addUnique(state.dismissedNoteIds, alert.id);
        state.seenNoteCounts[key] = Math.max(
          state.seenNoteCounts[key] ?? 0,
          alert.engagement.noteCount ?? 0,
        );
      }
      stateRef.current = state;
      saveState(user.id, state);
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    },
    [user],
  );

  const clearAll = useCallback(() => {
    if (!user) return;
    const state = stateRef.current ?? loadState(user.id);
    for (const alert of alerts) {
      const key = String(alert.engagement.id);
      if (alert.type === 'follow-up-stale') {
        addUnique(state.seenFollowUps, key);
      } else if (alert.type === 'assigned') {
        addUnique(state.seenAssignments, key);
      } else if (alert.type === 'note-added') {
        addUnique(state.dismissedNoteIds, alert.id);
        state.seenNoteCounts[key] = Math.max(
          state.seenNoteCounts[key] ?? 0,
          alert.engagement.noteCount ?? 0,
        );
      }
    }
    stateRef.current = state;
    saveState(user.id, state);
    setAlerts([]);
  }, [user, alerts]);

  return { alerts, isLoading, refetch: compute, dismiss, clearAll };
}
