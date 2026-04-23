'use client';

import React from 'react';
import type { ActivityHeatmap as ActivityHeatmapData } from '@/app/lib/api/kpi';

const LEVEL_COLOR = ['#18181b', '#0e4f58', '#0e7490', '#22d3ee', '#67e8f9'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function monthLabelsFromWeeks(weeks: ActivityHeatmapData['weeks']): (string | null)[] {
  return weeks.map((week, i) => {
    const firstDay = week[0];
    if (!firstDay) return null;
    const d = new Date(firstDay.date + 'T00:00:00');
    if (d.getDate() > 7) return null;
    const prevWeekFirstDate = i > 0 ? new Date(weeks[i - 1][0].date + 'T00:00:00') : null;
    if (prevWeekFirstDate && d.getMonth() === prevWeekFirstDate.getMonth()) return null;
    return d.toLocaleDateString('en-US', { month: 'short' });
  });
}

export default function ActivityHeatmap({ data }: { data: ActivityHeatmapData }) {
  const monthLabels = monthLabelsFromWeeks(data.weeks);

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 p-5 rounded-xl h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-white text-base font-semibold">Activity Rhythm</h3>
        <p className="text-xs text-muted">52 weeks · started engagements per day · at a glance, when are we busy</p>
      </div>

      {data.maxCount === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted">No activity yet.</div>
      ) : (
        <>
          <div className="overflow-x-auto flex-1">
            <div className="inline-flex flex-col gap-[2px] min-w-full">
              {/* Month label row */}
              <div className="flex gap-[2px] pl-8">
                {monthLabels.map((label, i) => (
                  <div key={i} className="w-[10px] h-[10px] text-[9px] text-muted leading-none relative">
                    {label && <span className="absolute left-0 top-0 whitespace-nowrap">{label}</span>}
                  </div>
                ))}
              </div>
              {/* Day rows */}
              {[0, 1, 2, 3, 4].map((day) => (
                <div key={day} className="flex items-center gap-[2px]">
                  <span className="w-8 text-[9px] text-muted pr-1 text-right">{DAYS[day]}</span>
                  {data.weeks.map((week, w) => {
                    const cell = week[day];
                    return (
                      <div
                        key={w}
                        title={cell ? `${cell.date} · ${cell.count} started` : ''}
                        className="w-[10px] h-[10px] rounded-sm"
                        style={{ backgroundColor: cell ? LEVEL_COLOR[cell.level] : '#18181b' }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-muted">
            Less
            {LEVEL_COLOR.map((color, i) => (
              <div key={i} className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: color }} />
            ))}
            More
          </div>
        </>
      )}
    </div>
  );
}
