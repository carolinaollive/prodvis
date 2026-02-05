import { useState } from 'react';
import type { Habit } from '../types';
import { HABIT_ICONS } from '../types';
import { canRenameHabit, getDaysUntilRename } from '../storage';
import './HabitDashboard.css';

interface HabitDashboardProps {
  habit: Habit | null;
  onClose: () => void;
  onToggleDay: (habitId: string, date: string) => void;
  onRename: (habitId: string, newName: string) => void;
  onDelete: (habitId: string) => void;
  onChangeIcon: (habitId: string, icon: string) => void;
}

export function HabitDashboard({ habit, onClose, onToggleDay, onRename, onDelete, onChangeIcon }: HabitDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);

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
  const bestStreak = calculateBestStreak(habit);
  const completionRate = calculateCompletionRate(habit);
  const level = Math.floor(totalCompleted / 10) + 1;
  const xpToNext = 10 - (totalCompleted % 10);

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
          <div className="header-row">
            <button
              className="habit-icon-button"
              onClick={() => setShowIconPicker(!showIconPicker)}
              style={{ background: `${habit.color}22` }}
            >
              {habit.icon || '○'}
            </button>
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
          </div>
          {showIconPicker && (
            <div className="icon-picker-grid">
              {HABIT_ICONS.map(icon => (
                <button
                  key={icon}
                  className={`icon-option ${habit.icon === icon ? 'selected' : ''}`}
                  onClick={() => {
                    onChangeIcon(habit.id, icon);
                    setShowIconPicker(false);
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
          {canRename ? (
            <p className="rename-notice clickable">click to rename</p>
          ) : (
            <p className="rename-notice">{daysUntilRename}d until rename</p>
          )}
        </div>

        <div className="level-bar">
          <div className="level-info">
            <span className="level-badge" style={{ background: habit.color }}>Lv.{level}</span>
            <span className="xp-text">{xpToNext} days to level up</span>
          </div>
          <div className="xp-bar">
            <div
              className="xp-fill"
              style={{
                width: `${((10 - xpToNext) / 10) * 100}%`,
                background: habit.color
              }}
            />
          </div>
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
              {currentStreak}{currentStreak >= 7 && '🔥'}
            </span>
            <span className="stat-label">streak</span>
          </div>
          <div className="stat">
            <span className="stat-value">{bestStreak}</span>
            <span className="stat-label">best</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: completionRate >= 70 ? '#41B3A3' : completionRate >= 40 ? '#E8A87C' : '#E27D60' }}>
              {completionRate}%
            </span>
            <span className="stat-label">rate</span>
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

function calculateBestStreak(habit: Habit): number {
  const completedDates = habit.records
    .filter(r => r.completed)
    .map(r => r.date)
    .sort();

  if (completedDates.length === 0) return 0;

  let bestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1]);
    const curr = new Date(completedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return bestStreak;
}

function calculateCompletionRate(habit: Habit): number {
  const createdDate = new Date(habit.createdAt);
  createdDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const completedDays = habit.records.filter(r => r.completed).length;

  return Math.round((completedDays / totalDays) * 100);
}
