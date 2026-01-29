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

  const recentDays: { date: string; dayName: string; completed: boolean; isFuture: boolean }[] = [];
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  for (let i = 6; i >= -1; i--) {
    const date = new Date(todayDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const isFuture = date > todayDate;

    recentDays.push({
      date: dateStr,
      dayName: isFuture ? 'Tomorrow' : (i === 0 ? 'Today' : dayName),
      completed: recordMap.get(dateStr) || false,
      isFuture,
    });
  }

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
    }
  };

  return (
    <div className="dashboard-overlay" onClick={onClose}>
      <div className="dashboard-panel" onClick={e => e.stopPropagation()}>
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
              {habit.name || 'Unnamed Habit'}
            </h2>
          )}
          {!canRename && (
            <p className="rename-notice">Can rename in {daysUntilRename} days</p>
          )}
        </div>

        <div className="dashboard-days">
          {recentDays.map(day => (
            <button
              key={day.date}
              className={`day-button ${day.completed ? 'completed' : ''} ${day.isFuture ? 'future' : ''}`}
              onClick={() => !day.isFuture && onToggleDay(habit.id, day.date)}
              disabled={day.isFuture}
              style={{
                '--habit-color': habit.color,
              } as React.CSSProperties}
            >
              <span className="day-name">{day.dayName}</span>
              <span className="day-check">{day.completed ? '✓' : ''}</span>
            </button>
          ))}
        </div>

        <div className="dashboard-stats">
          <div className="stat">
            <span className="stat-value">
              {habit.records.filter(r => r.completed).length}
            </span>
            <span className="stat-label">days completed</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {calculateStreak(habit)}
            </span>
            <span className="stat-label">current streak</span>
          </div>
        </div>

        <button className="delete-button" onClick={() => {
          if (confirm('Delete this habit? This cannot be undone.')) {
            onDelete(habit.id);
          }
        }}>
          Delete Habit
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

  // Check if today is completed, if not start from yesterday
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
