// Mock data for Client Engagements Dashboard
// This file will be replaced with real API calls when connecting to FastAPI

import type { EngagementMetric, DepartmentData, Engagement, DayData } from '../types/engagements';

export const engagementMetrics: EngagementMetric[] = [
  { label: 'Projects', sublabel: '1YR', value: '847', change: '+12%', isPositive: true, icon: 'FileText' },
  { label: 'In Progress', sublabel: 'Current', value: '24', change: '+3', isPositive: true, icon: 'PlayCircle' },
  { label: 'Portfolios Logged', sublabel: '1YR', value: '712', change: '84%', isPositive: true, icon: 'CheckCircle2' },
  { label: 'Touch Points', sublabel: '1YR', value: '156', change: '+18%', isPositive: true, icon: 'MessageSquare' },
];

export const departmentBreakdown: DepartmentData[] = [
  { name: 'RIA', value: 412, color: '#22d3ee' },
  { name: 'Broker-Dealer', value: 289, color: '#a78bfa' },
  { name: 'Institution', value: 146, color: '#fb923c' },
];

export const engagements: Engagement[] = [
  { id: 1, client: 'Vanguard Advisors', intakeType: 'IRQ', type: 'Data Request', teamMembers: ['Eli S.', 'Sarah K.'], department: 'RIA', dateStarted: 'Jan 20, 2025', dateFinished: 'Jan 24, 2025', status: 'Completed', portfolioLogged: true },
  { id: 2, client: 'Fidelity Wealth Management', intakeType: 'GRRF', type: 'Meeting', teamMembers: ['Sarah K.'], department: 'Broker-Dealer', dateStarted: 'Jan 21, 2025', dateFinished: '—', status: 'In Progress', portfolioLogged: false },
  { id: 3, client: 'Schwab Private Client', intakeType: 'IRQ', type: 'Data Request', teamMembers: ['Mike R.', 'Eli S.', 'Lisa M.'], department: 'RIA', dateStarted: 'Jan 19, 2025', dateFinished: 'Jan 23, 2025', status: 'Completed', portfolioLogged: true },
  { id: 4, client: 'Northern Trust Wealth', intakeType: 'Touch Points', type: 'Follow-Up', teamMembers: ['Eli S.'], department: 'Institution', dateStarted: 'Jan 18, 2025', dateFinished: 'Jan 22, 2025', status: 'Completed', portfolioLogged: true },
  { id: 5, client: 'Raymond James Financial', intakeType: 'GRRF', type: 'Meeting', teamMembers: ['Lisa M.', 'James T.'], department: 'Broker-Dealer', dateStarted: 'Jan 22, 2025', dateFinished: '—', status: 'Pending', portfolioLogged: false },
  { id: 6, client: 'Edward Jones', intakeType: 'Touch Points', type: 'Follow-Up', teamMembers: ['James T.', 'David L.'], department: 'RIA', dateStarted: 'Jan 17, 2025', dateFinished: 'Jan 21, 2025', status: 'Completed', portfolioLogged: true },
  { id: 7, client: 'Morgan Stanley Private', intakeType: 'IRQ', type: 'Data Request', teamMembers: ['Eli S.', 'Mike R.'], department: 'Institution', dateStarted: 'Jan 16, 2025', dateFinished: 'Jan 20, 2025', status: 'Completed', portfolioLogged: true },
  { id: 8, client: 'Merrill Lynch Advisors', intakeType: 'GRRF', type: 'Meeting', teamMembers: ['Sarah K.', 'Lisa M.'], department: 'Broker-Dealer', dateStarted: 'Jan 15, 2025', dateFinished: 'Jan 19, 2025', status: 'Completed', portfolioLogged: true },
  { id: 9, client: 'Goldman Sachs PWM', intakeType: 'IRQ', type: 'Data Request', teamMembers: ['David L.'], department: 'Institution', dateStarted: 'Jan 23, 2025', dateFinished: '—', status: 'In Progress', portfolioLogged: false },
  { id: 10, client: 'UBS Financial Services', intakeType: 'Touch Points', type: 'Follow-Up', teamMembers: ['James T.', 'Eli S.'], department: 'Broker-Dealer', dateStarted: 'Jan 14, 2025', dateFinished: 'Jan 18, 2025', status: 'Completed', portfolioLogged: true },
  { id: 11, client: 'Wells Fargo Advisors', intakeType: 'IRQ', type: 'Data Request', teamMembers: ['Mike R.', 'Sarah K.'], department: 'RIA', dateStarted: 'Jan 13, 2025', dateFinished: 'Jan 17, 2025', status: 'Completed', portfolioLogged: true },
  { id: 12, client: 'Ameriprise Financial', intakeType: 'GRRF', type: 'Meeting', teamMembers: ['Lisa M.'], department: 'RIA', dateStarted: 'Jan 24, 2025', dateFinished: '—', status: 'Pending', portfolioLogged: false },
  { id: 13, client: 'LPL Financial', intakeType: 'Touch Points', type: 'Follow-Up', teamMembers: ['Eli S.', 'David L.'], department: 'Broker-Dealer', dateStarted: 'Jan 12, 2025', dateFinished: 'Jan 16, 2025', status: 'Completed', portfolioLogged: true },
  { id: 14, client: 'Northwestern Mutual', intakeType: 'IRQ', type: 'Data Request', teamMembers: ['James T.'], department: 'RIA', dateStarted: 'Jan 11, 2025', dateFinished: 'Jan 15, 2025', status: 'Completed', portfolioLogged: true },
  { id: 15, client: 'Stifel Financial', intakeType: 'GRRF', type: 'Meeting', teamMembers: ['Sarah K.', 'Mike R.'], department: 'Broker-Dealer', dateStarted: 'Jan 10, 2025', dateFinished: 'Jan 14, 2025', status: 'Completed', portfolioLogged: true },
  { id: 16, client: 'RBC Wealth Management', intakeType: 'IRQ', type: 'Data Request', teamMembers: ['Eli S.'], department: 'Institution', dateStarted: 'Jan 25, 2025', dateFinished: '—', status: 'In Progress', portfolioLogged: false },
  { id: 17, client: 'Janney Montgomery Scott', intakeType: 'Touch Points', type: 'Follow-Up', teamMembers: ['Lisa M.', 'James T.'], department: 'RIA', dateStarted: 'Jan 09, 2025', dateFinished: 'Jan 13, 2025', status: 'Completed', portfolioLogged: true },
  { id: 18, client: 'Baird Private Wealth', intakeType: 'GRRF', type: 'Meeting', teamMembers: ['David L.'], department: 'RIA', dateStarted: 'Jan 08, 2025', dateFinished: 'Jan 12, 2025', status: 'Completed', portfolioLogged: true },
  { id: 19, client: 'Oppenheimer Holdings', intakeType: 'IRQ', type: 'Data Request', teamMembers: ['Mike R.', 'Eli S.'], department: 'Broker-Dealer', dateStarted: 'Jan 07, 2025', dateFinished: 'Jan 11, 2025', status: 'Completed', portfolioLogged: true },
  { id: 20, client: 'Piper Sandler', intakeType: 'Touch Points', type: 'Follow-Up', teamMembers: ['Sarah K.'], department: 'Institution', dateStarted: 'Jan 06, 2025', dateFinished: 'Jan 10, 2025', status: 'Completed', portfolioLogged: true },
  { id: 21, client: 'Cetera Financial Group', intakeType: 'GRRF', type: 'Meeting', teamMembers: ['James T.', 'Lisa M.'], department: 'RIA', dateStarted: 'Jan 26, 2025', dateFinished: '—', status: 'Pending', portfolioLogged: false },
  { id: 22, client: 'Cambridge Investment', intakeType: 'IRQ', type: 'Data Request', teamMembers: ['Eli S.', 'David L.'], department: 'Broker-Dealer', dateStarted: 'Jan 05, 2025', dateFinished: 'Jan 09, 2025', status: 'Completed', portfolioLogged: true },
  { id: 23, client: 'Kestra Financial', intakeType: 'Touch Points', type: 'Follow-Up', teamMembers: ['Mike R.'], department: 'RIA', dateStarted: 'Jan 04, 2025', dateFinished: 'Jan 08, 2025', status: 'Completed', portfolioLogged: true },
  { id: 24, client: 'Osaic Wealth', intakeType: 'GRRF', type: 'Meeting', teamMembers: ['Sarah K.', 'James T.'], department: 'Broker-Dealer', dateStarted: 'Jan 03, 2025', dateFinished: 'Jan 07, 2025', status: 'Completed', portfolioLogged: true },
  { id: 25, client: 'Truist Advisory Services', intakeType: 'IRQ', type: 'Data Request', teamMembers: ['Lisa M.', 'Eli S.'], department: 'Institution', dateStarted: 'Jan 27, 2025', dateFinished: '—', status: 'In Progress', portfolioLogged: false },
];

// Generate contribution graph data (GitHub-style heatmap)
export function generateContributionData(): DayData[][] {
  const weeks: DayData[][] = [];
  const startDate = new Date('2024-01-01');

  // Seeded random function for deterministic but natural-looking randomness
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  };

  for (let week = 0; week < 52; week++) {
    const days: DayData[] = [];
    for (let day = 0; day < 5; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day + 1);

      const seed1 = week * 127 + day * 311;
      const seed2 = week * 53 + day * 97 + 42;
      const rand = (seededRandom(seed1) + seededRandom(seed2)) / 2;

      let level: number;
      if (rand < 0.35) level = 0;
      else if (rand < 0.60) level = 1;
      else if (rand < 0.82) level = 2;
      else if (rand < 0.95) level = 3;
      else level = 4;

      days.push({
        date: currentDate,
        level,
        count: level === 0 ? 0 : Math.floor(seededRandom(seed1 + seed2) * level + 1)
      });
    }
    weeks.push(days);
  }
  return weeks;
}
