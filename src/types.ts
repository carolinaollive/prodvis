export interface DayRecord {
  date: string; // YYYY-MM-DD format
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  createdAt: string; // ISO date string
  lastRenamedAt: string; // ISO date string - for 45-day rename restriction
  records: DayRecord[];
}

export interface HabitData {
  habits: Habit[];
}

// Refined, softer color palette
export const HABIT_COLORS = [
  '#E8A87C', // Warm peach
  '#85CDCA', // Soft teal
  '#E27D60', // Terracotta
  '#C38D9E', // Dusty rose
  '#41B3A3', // Sea green
  '#659DBD', // Steel blue
  '#DAAD86', // Sand
];

export const DAYS_TO_DISPLAY = 60; // Show 60 days - cleaner visual
export const RENAME_COOLDOWN_DAYS = 45;
