import { useState } from 'react';
import type { Habit } from '../types';
import { canRenameHabit, getDaysUntilRename } from '../storage';
import './HabitDashboard.css';

interface HabitDashboardProps {
  habit: Habit | null;
  onClose: () => void;
  onToggleDay: (habitId: string, date: string) => void;
  onRename: (habitId: string, newName: string) => void;
  onDelete: (habitId: string) => void;
}

export function HabitDashboard({ habit, onClose, onToggleDay, onRename, onDelete }: HabitDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  if (!habit) return null;

  const canRename = canRenameHabit(habit);
  const daysUntilRename = getDaysUntilRename(habit);

  const recordMap = new Map(habit.records.map(r => [r.date, r.completed]));

  const recentDays: { date: string; dayName: string; dayNum: number; completed: boolean; isToday: boolean }[] = [];
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // Show last 7 days (6 past days + today)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'narrow' });

    recentDays.push({
      date: dateStr,
      dayName,
      dayNum: date.getDate(),
      completed: recordMap.get(dateStr) || false,
      isToday: i === 0,
    });
  }

  const totalCompleted = habit.records.filter(r => r.completed).length;
  const currentStreak = calculateStreak(habit);

  const handleStartEdit = () => {
    if (canRename) {
      setEditName(habit.name);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== habit.name) {
      onRename(habit.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      onClose();
    }
  };

  return (
    <div className="dashboard-overlay" onClick={onClose}>
      <div className="dashboard-panel" onClick={e => e.stopPropagation()}>
        <div className="dashboard-accent" style={{ background: habit.color }} />

        <button className="dashboard-close" onClick={onClose}>×</button>

        <div className="dashboard-header">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="dashboard-name-input"
              autoFocus
            />
          ) : (
            <h2
              className={`dashboard-name ${canRename ? 'editable' : ''}`}
              onClick={handleStartEdit}
              style={{ color: habit.color }}
            >
              {habit.name || 'Unnamed'}
            </h2>
          )}
          {canRename ? (
            <p className="rename-notice clickable">click to rename</p>
          ) : (
            <p className="rename-notice">{daysUntilRename}d until rename</p>
          )}
        </div>

        <div className="dashboard-days">
          {recentDays.map(day => (
            <button
              key={day.date}
              className={`day-button ${day.completed ? 'completed' : ''} ${day.isToday ? 'today' : ''}`}
              onClick={() => onToggleDay(habit.id, day.date)}
              style={{ '--habit-color': habit.color } as React.CSSProperties}
            >
              <span className="day-name">{day.dayName}</span>
              <span className="day-num">{day.dayNum}</span>
              {day.completed && <span className="day-check">✓</span>}
            </button>
          ))}
        </div>

        <div className="dashboard-stats">
          <div className="stat">
            <span className="stat-value">{totalCompleted}</span>
            <span className="stat-label">total</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: currentStreak > 0 ? habit.color : undefined }}>
              {currentStreak}
            </span>
            <span className="stat-label">streak</span>
          </div>
        </div>

        <button className="delete-button" onClick={() => {
          if (confirm('Delete this habit?')) {
            onDelete(habit.id);
          }
        }}>
          delete
        </button>
      </div>
    </div>
  );
}

function calculateStreak(habit: Habit): number {
  const recordMap = new Map(habit.records.map(r => [r.date, r.completed]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  const todayStr = today.toISOString().split('T')[0];
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

  return streak;
}
