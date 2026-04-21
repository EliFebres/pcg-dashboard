import React from 'react';
import { Clock, FileText, UserPlus, UserRoundPlus, LucideIcon } from 'lucide-react';
import type { Alert } from '@/app/lib/types/alerts';

export interface AlertPresentation {
  Icon: LucideIcon;
  accent: string;
  accentBg: string;
  title: string;
  infoLine: React.ReactNode;
  body: React.ReactNode;
}

export function renderAlertContent(alert: Alert): AlertPresentation {
  const meta =
    alert.type === 'follow-up-stale'
      ? { Icon: Clock, accent: 'text-amber-300', accentBg: 'bg-amber-300', title: 'Stale Follow-Up' }
      : alert.type === 'assigned'
      ? { Icon: UserPlus, accent: 'text-emerald-400', accentBg: 'bg-emerald-400', title: 'Assigned to Project' }
      : alert.type === 'pending-signup'
      ? { Icon: UserRoundPlus, accent: 'text-violet-400', accentBg: 'bg-violet-400', title: 'New Signup' }
      : { Icon: FileText, accent: 'text-cyan-500', accentBg: 'bg-cyan-500', title: 'New Note' };

  let infoLine: React.ReactNode;
  let body: React.ReactNode;

  if (alert.type === 'pending-signup') {
    const pu = alert.pendingUser;
    infoLine = (
      <>
        <span className="font-semibold">{pu.firstName} {pu.lastName}</span>
        <span className="text-white/90"> · {pu.email}</span>
      </>
    );
    body = (
      <>
        <span className="text-white/90">{pu.team}</span>
        <span className="text-white/90"> · {pu.office}</span>
        <span className="text-violet-400 font-semibold"> — awaiting approval</span>
      </>
    );
  } else {
    const eng = alert.engagement;
    infoLine = (
      <>
        <span className="font-semibold">{eng.type}</span>
        {eng.externalClient && (
          <span className="text-white/90"> · {eng.externalClient}</span>
        )}
        <span className="text-white/90"> · {eng.internalClient.name}</span>
      </>
    );
    if (alert.type === 'follow-up-stale') {
      body = (
        <>
          This project has been in <span className="text-amber-300 font-semibold">Follow Up</span>{' '}
          since <span className="text-white font-semibold">{eng.dateStarted}</span>. Reach out to{' '}
          <span className="text-white font-semibold">{eng.internalClient.name}</span> to ask if
          there have been any NNA winnings from the client.
        </>
      );
    } else if (alert.type === 'assigned') {
      body = (
        <>
          <span className="text-white font-semibold">{eng.createdByName ?? 'Someone'}</span> added
          you to this project.
        </>
      );
    } else {
      body = (
        <>
          <span className="text-cyan-500 font-semibold">{alert.note.authorName} added a note:</span>{' '}
          <span className="text-white italic">&ldquo;{alert.note.noteText}&rdquo;</span>
        </>
      );
    }
  }

  return { ...meta, infoLine, body };
}
