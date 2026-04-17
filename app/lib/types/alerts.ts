import type { Engagement, NoteEntry } from './engagements';

export type AlertType = 'follow-up-stale' | 'assigned' | 'note-added' | 'pending-signup';

export interface PendingUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  team: string;
  office: string;
  createdAt: string;
}

interface BaseAlert {
  id: string;
  timestamp: number;
}

export interface FollowUpStaleAlert extends BaseAlert {
  type: 'follow-up-stale';
  engagement: Engagement;
}

export interface AssignedAlert extends BaseAlert {
  type: 'assigned';
  engagement: Engagement;
}

export interface NoteAddedAlert extends BaseAlert {
  type: 'note-added';
  engagement: Engagement;
  note: NoteEntry;
}

export interface PendingSignupAlert extends BaseAlert {
  type: 'pending-signup';
  pendingUser: PendingUserInfo;
}

export type Alert = FollowUpStaleAlert | AssignedAlert | NoteAddedAlert | PendingSignupAlert;
