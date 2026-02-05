import type { HabitData, Habit } from './types';
import { HABIT_COLORS } from './types';

const STORAGE_KEY = 'habit-tracker-data';

export function loadHabits(): HabitData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { habits: [] };
    }
  }
  return { habits: [] };
}

export function saveHabits(data: HabitData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createHabit(name: string, existingHabits: Habit[], icon?: string): Habit {
  const usedColors = existingHabits.map(h => h.color);
  const availableColor = HABIT_COLORS.find(c => !usedColors.includes(c)) || HABIT_COLORS[0];
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name,
    color: availableColor,
    icon: icon || '○',
    createdAt: now,
    lastRenamedAt: now,
    records: [],
  };
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function canRenameHabit(habit: Habit): boolean {
  const lastRenamed = new Date(habit.lastRenamedAt);
  const now = new Date();
  const daysSinceRename = Math.floor((now.getTime() - lastRenamed.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceRename >= 45;
}

export function getDaysUntilRename(habit: Habit): number {
  const lastRenamed = new Date(habit.lastRenamedAt);
  const now = new Date();
  const daysSinceRename = Math.floor((now.getTime() - lastRenamed.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, 45 - daysSinceRename);
}
