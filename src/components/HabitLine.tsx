import { useMemo } from 'react';
import type { Habit } from '../types';
import { DAYS_TO_DISPLAY } from '../types';
import './HabitLine.css';

interface HabitLineProps {
  habit: Habit;
  onClick: () => void;
}

interface DayStatus {
  date: string;
  status: 'completed' | 'missed' | 'future';
}

function getDayStatuses(habit: Habit): DayStatus[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statuses: DayStatus[] = [];
  const recordMap = new Map(habit.records.map(r => [r.date, r.completed]));
  const createdDate = new Date(habit.createdAt);
  createdDate.setHours(0, 0, 0, 0);

  for (let i = DAYS_TO_DISPLAY - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i + Math.floor(DAYS_TO_DISPLAY / 2));
    const dateStr = date.toISOString().split('T')[0];

    if (date > today) {
      statuses.push({ date: dateStr, status: 'future' });
    } else if (date < createdDate) {
      statuses.push({ date: dateStr, status: 'future' });
    } else {
      const completed = recordMap.get(dateStr);
      statuses.push({
        date: dateStr,
        status: completed ? 'completed' : 'missed'
      });
    }
  }

  return statuses;
}

export function HabitLine({ habit, onClick }: HabitLineProps) {
  const dayStatuses = useMemo(() => getDayStatuses(habit), [habit]);

  return (
    <div className="habit-line-container" onClick={onClick}>
      <svg
        className="habit-line"
        viewBox={`0 0 ${DAYS_TO_DISPLAY * 10} 20`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`gradient-${habit.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            {dayStatuses.map((day, index) => {
              const percent = (index / (dayStatuses.length - 1)) * 100;
              let color: string;
              let opacity: number;

              if (day.status === 'completed') {
                color = habit.color;
                opacity = 1;
              } else if (day.status === 'missed') {
                color = habit.color;
                opacity = 0;
              } else {
                color = habit.color;
                opacity = 0.3;
              }

              return (
                <stop
                  key={day.date}
                  offset={`${percent}%`}
                  stopColor={color}
                  stopOpacity={opacity}
                />
              );
            })}
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="6"
          width={DAYS_TO_DISPLAY * 10}
          height="8"
          rx="4"
          fill={`url(#gradient-${habit.id})`}
          className="habit-line-rect"
        />
        <rect
          x="0"
          y="6"
          width={DAYS_TO_DISPLAY * 10}
          height="8"
          rx="4"
          fill="none"
          stroke={habit.color}
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
      </svg>
    </div>
  );
}
