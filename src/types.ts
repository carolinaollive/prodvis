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

export const HABIT_COLORS = [
  '#FF6B6B', // Coral red
  '#4ECDC4', // Teal
  '#45B7D1', // Sky blue
  '#96CEB4', // Sage green
  '#FFEAA7', // Soft yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
];

export const DAYS_TO_DISPLAY = 90; // Show 90 days of history
export const RENAME_COOLDOWN_DAYS = 45;
