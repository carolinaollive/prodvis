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

function getDayStatuses(habit: Habit): { statuses: DayStatus[]; todayCompleted: boolean } {
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

  return { statuses, todayCompleted: recordMap.get(todayStr) || false };
}

function getInitials(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export function HabitLine({ habit, onClick }: HabitLineProps) {
  const { statuses: dayStatuses, todayCompleted } = useMemo(() => getDayStatuses(habit), [habit]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isClickable, setIsClickable] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(0);
  const tooltipTimer = useRef<number | null>(null);
  const clickableTimer = useRef<number | null>(null);
  const progressInterval = useRef<number | null>(null);

  const handleMouseEnter = useCallback(() => {
    // Show tooltip after 1.5s
    tooltipTimer.current = window.setTimeout(() => {
      setShowTooltip(true);
    }, 1500);

    // Make clickable after 2s
    clickableTimer.current = window.setTimeout(() => {
      setIsClickable(true);
    }, 2000);

    // Progress indicator
    const startTime = Date.now();
    progressInterval.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 2000, 1);
      setHoverProgress(progress);
      if (progress >= 1) {
        clearInterval(progressInterval.current!);
      }
    }, 50);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }
    if (clickableTimer.current) {
      clearTimeout(clickableTimer.current);
      clickableTimer.current = null;
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setShowTooltip(false);
    setIsClickable(false);
    setHoverProgress(0);
  }, []);

  const handleClick = useCallback(() => {
    if (isClickable) {
      onClick();
    }
  }, [isClickable, onClick]);

  useEffect(() => {
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
      if (clickableTimer.current) clearTimeout(clickableTimer.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const initials = getInitials(habit.name);

  return (
    <div
      className={`habit-line-container ${isClickable ? 'clickable' : ''} ${!todayCompleted ? 'needs-attention' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ '--habit-color': habit.color } as React.CSSProperties}
    >
      <span className="habit-initials" style={{ color: habit.color }}>
        {initials}
      </span>

      {showTooltip && (
        <div className="habit-tooltip" style={{ color: habit.color }}>
          {habit.name}
        </div>
      )}

      {hoverProgress > 0 && hoverProgress < 1 && (
        <div className="hover-progress" style={{ width: `${hoverProgress * 100}%` }} />
      )}

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
          <filter id={`glow-${habit.id}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect
          x="0"
          y="5"
          width={DAYS_TO_DISPLAY * 10}
          height="10"
          rx="5"
          fill={`url(#gradient-${habit.id})`}
          className="habit-line-rect"
          filter={isClickable ? `url(#glow-${habit.id})` : undefined}
        />
      </svg>
    </div>
  );
}
