'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import ClientOnlyChart from '@/app/components/dashboard/shared/ClientOnlyChart';
import type { DepartmentData } from '@/app/lib/types/engagements';
import type { ChangeFlash } from '@/app/lib/hooks/useDashboardChanges';
import { FLASH_TEXT_CLASS } from '@/app/lib/hooks/useDashboardChanges';

interface DepartmentChartProps {
  data: DepartmentData[];
  departmentChanges?: Record<string, ChangeFlash>;
}

const DepartmentChart = React.memo<DepartmentChartProps>(({ data, departmentChanges }) => {
  return (
    <>
      <div className="flex-1 mb-3 min-h-[80px]">
        <ClientOnlyChart>
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={80}>
            <BarChart data={data} layout="vertical" barSize={16}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} width={85} />
              <Bar dataKey="value" radius={0} isAnimationActive={true} animationDuration={700}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList dataKey="value" position="right" formatter={(value) => `${value}%`} style={{ fill: '#a1a1aa', fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ClientOnlyChart>
      </div>
      <div className="space-y-2 pt-2 border-t border-zinc-800/50 flex-shrink-0">
        {data.map((dept) => {
          const flash = departmentChanges?.[dept.name];
          const flashClass = flash ? FLASH_TEXT_CLASS[flash.kind] : '';
          return (
            <div key={dept.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5" style={{ backgroundColor: dept.color }} />
                <span className="text-zinc-400">{dept.name}</span>
              </div>
              <span className={`text-zinc-200 font-medium font-mono ${flashClass}`.trim()}>{dept.count}</span>
            </div>
          );
        })}
      </div>
    </>
  );
});

DepartmentChart.displayName = 'DepartmentChart';

export default DepartmentChart;
