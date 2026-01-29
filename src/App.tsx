import { useState, useEffect, useCallback } from 'react';
import type { Habit } from './types';
import { loadHabits, saveHabits, createHabit } from './storage';
import { HabitLine } from './components/HabitLine';
import { HabitDashboard } from './components/HabitDashboard';
import './App.css';

function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  useEffect(() => {
    const data = loadHabits();
    setHabits(data.habits);
  }, []);

  useEffect(() => {
    saveHabits({ habits });
  }, [habits]);

  const handleAddHabit = useCallback(() => {
    if (habits.length >= 7) return;
    const name = prompt('Name your new habit/practice:');
    if (name?.trim()) {
      const newHabit = createHabit(name.trim(), habits);
      setHabits(prev => [...prev, newHabit]);
    }
  }, [habits]);

  const handleToggleDay = useCallback((habitId: string, date: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id !== habitId) return habit;

      const existingIndex = habit.records.findIndex(r => r.date === date);
      let newRecords;

      if (existingIndex >= 0) {
        const existing = habit.records[existingIndex];
        newRecords = [
          ...habit.records.slice(0, existingIndex),
          { ...existing, completed: !existing.completed },
          ...habit.records.slice(existingIndex + 1),
        ];
      } else {
        newRecords = [...habit.records, { date, completed: true }];
      }

      return { ...habit, records: newRecords };
    }));
  }, []);

  const handleRename = useCallback((habitId: string, newName: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id !== habitId) return habit;
      return {
        ...habit,
        name: newName,
        lastRenamedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const handleDelete = useCallback((habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setSelectedHabitId(null);
  }, []);

  const selectedHabit = habits.find(h => h.id === selectedHabitId) || null;

  // Create placeholder slots for empty habits
  const habitSlots = [...habits];
  while (habitSlots.length < 7) {
    habitSlots.push(null as unknown as Habit);
  }

  return (
    <div className="app">
      <div className="habit-lines">
        {habitSlots.map((habit, index) => (
          habit ? (
            <HabitLine
              key={habit.id}
              habit={habit}
              onClick={() => setSelectedHabitId(habit.id)}
            />
          ) : (
            <div
              key={`empty-${index}`}
              className="empty-slot"
              onClick={handleAddHabit}
            >
              <span className="empty-slot-text">+ add habit</span>
            </div>
          )
        ))}
      </div>

      <HabitDashboard
        habit={selectedHabit}
        onClose={() => setSelectedHabitId(null)}
        onToggleDay={handleToggleDay}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default App;
