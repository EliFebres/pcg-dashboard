'use client';

import React from 'react';
import type { DayData } from '@/app/lib/types/engagements';

interface ContributionGraphProps {
  data: DayData[][];
}

export default function ContributionGraph({ data }: ContributionGraphProps) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

  const getLevelColor = (level: number): string => {
    switch (level) {
      case 0: return '#27272a';
      case 1: return '#164e63';
      case 2: return '#0e7490';
      case 3: return '#06b6d4';
      case 4: return '#22d3ee';
      default: return '#27272a';
    }
  };

  // Only show the most recent 52 weeks (1 year) in the heatmap
  const recentWeeks = data.slice(-52);
  const flatData = recentWeeks.flat();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', marginLeft: '32px', marginBottom: '8px' }}>
        {monthLabels.map((month, i) => (
          <span key={i} style={{ flex: 1, fontSize: '10px', color: '#71717a', fontWeight: 500 }}>{month}</span>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateRows: 'repeat(5, 1fr)',
          paddingRight: '8px',
          width: '28px',
          alignItems: 'center'
        }}>
          {dayLabels.map((day, i) => (
            <span key={i} style={{ fontSize: '10px', color: '#71717a', textAlign: 'right' }}>{day}</span>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(52, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr)',
          gap: '3px',
          flex: 1,
          gridAutoFlow: 'column'
        }}>
          {flatData.map((day, index) => (
            <div
              key={index}
              style={{
                backgroundColor: getLevelColor(day.level),
                borderRadius: '2px',
                cursor: 'pointer',
                minWidth: 0,
                minHeight: 0,
                transition: 'background-color 600ms ease-out, transform 200ms ease-out',
                transform: 'scale(1)',
              }}
              className="hover:scale-110"
              title={`${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n${day.projectCount} project${day.projectCount !== 1 ? 's' : ''}, ${day.adHocCount} ad-hoc${day.adHocCount !== 1 ? 's' : ''}`}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
        <span style={{ fontSize: '10px', color: '#71717a' }}>Less</span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: getLevelColor(level),
                borderRadius: '2px'
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '10px', color: '#71717a' }}>More</span>
      </div>
    </div>
  );
}
