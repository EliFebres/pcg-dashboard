import type { Engagement, NoteEntry } from './engagements';

export type AlertType = 'follow-up-stale' | 'assigned' | 'note-added';

export interface Alert {
  id: string;
  type: AlertType;
  engagement: Engagement;
  timestamp: number;
  note?: NoteEntry;
}
