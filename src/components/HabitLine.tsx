import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
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

function getDayStatuses(habit: Habit): { statuses: DayStatus[]; todayCompleted: boolean; streak: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

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

  // Calculate streak
  let streak = 0;
  let checkDate = new Date(today);
  if (!recordMap.get(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (recordMap.get(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { statuses, todayCompleted: recordMap.get(todayStr) || false, streak };
}

export function HabitLine({ habit, onClick }: HabitLineProps) {
  const { statuses: dayStatuses, todayCompleted, streak } = useMemo(() => getDayStatuses(habit), [habit]);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimer = useRef<number | null>(null);

  const handleMouseEnter = useCallback(() => {
    // Tell Electron to capture mouse events on this region
    window.electronAPI?.setIgnoreMouseEvents(false);
    tooltipTimer.current = window.setTimeout(() => {
      setShowTooltip(true);
    }, 600);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Release mouse events back to click-through
    window.electronAPI?.setIgnoreMouseEvents(true, { forward: true });
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = null;
    setShowTooltip(false);
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    };
  }, []);

  return (
    <div
      className={`habit-line-container ${!todayCompleted ? 'needs-attention' : ''}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ '--habit-color': habit.color } as React.CSSProperties}
    >
      <span className="habit-icon">{habit.icon || '○'}</span>

      <div className={`habit-tooltip ${showTooltip ? 'visible' : ''}`} style={{ color: habit.color }}>
        {habit.name}
      </div>

      <div className="habit-line-wrapper">
        <svg
          className="habit-line"
          viewBox={`0 0 ${DAYS_TO_DISPLAY * 10} 20`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`gradient-${habit.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              {dayStatuses.map((day, index) => {
                const percent = (index / (dayStatuses.length - 1)) * 100;
                let opacity: number;

                if (day.status === 'completed') {
                  opacity = 1;
                } else if (day.status === 'missed') {
                  opacity = 0;
                } else {
                  opacity = 0.25;
                }

                return (
                  <stop
                    key={day.date}
                    offset={`${percent}%`}
                    stopColor={habit.color}
                    stopOpacity={opacity}
                  />
                );
              })}
            </linearGradient>
          </defs>
          <rect
            x="0"
            y="5"
            width={DAYS_TO_DISPLAY * 10}
            height="10"
            rx="5"
            fill={`url(#gradient-${habit.id})`}
            className="habit-line-rect"
          />
        </svg>
      </div>

      {streak >= 3 && (
        <span className="streak-flame">🔥</span>
      )}
    </div>
  );
}
