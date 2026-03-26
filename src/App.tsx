import { useState, useEffect, useCallback } from 'react';
import type { Habit } from './types';
import { HABIT_ICONS } from './types';
import { loadHabits, saveHabits, createHabit } from './storage';
import { HabitLine } from './components/HabitLine';
import { HabitDashboard } from './components/HabitDashboard';
import './App.css';

function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState(HABIT_ICONS[0]);

  useEffect(() => {
    const data = loadHabits();
    setHabits(data.habits);
  }, []);

  useEffect(() => {
    saveHabits({ habits });
  }, [habits]);

  const handleAddHabit = useCallback(() => {
    if (habits.length >= 7) return;
    setNewHabitName('');
    setNewHabitIcon(HABIT_ICONS[0]);
    setShowAddModal(true);
    window.electronAPI?.setIgnoreMouseEvents(false);
  }, [habits]);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setNewHabitName('');
    window.electronAPI?.setIgnoreMouseEvents(true, { forward: true });
  }, []);

  const handleConfirmAdd = useCallback(() => {
    if (newHabitName.trim()) {
      const newHabit = createHabit(newHabitName.trim(), habits, newHabitIcon);
      setHabits(prev => [...prev, newHabit]);
    }
    closeModal();
  }, [newHabitName, habits, newHabitIcon, closeModal]);

  const handleChangeIcon = useCallback((habitId: string, icon: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id !== habitId) return habit;
      return { ...habit, icon };
    }));
  }, []);

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

  const handleContainerEnter = useCallback(() => {
    window.electronAPI?.setIgnoreMouseEvents(false);
  }, []);

  const handleContainerLeave = useCallback(() => {
    if (!showAddModal && !selectedHabitId) {
      window.electronAPI?.setIgnoreMouseEvents(true, { forward: true });
    }
  }, [showAddModal, selectedHabitId]);

  return (
    <div className="app">
      <div
        className="habit-lines"
        onMouseEnter={handleContainerEnter}
        onMouseLeave={handleContainerLeave}
      >
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

      {showAddModal && (
        <div className="add-modal-overlay" onClick={closeModal}>
          <div className="add-modal" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              value={newHabitName}
              onChange={e => setNewHabitName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmAdd();
                if (e.key === 'Escape') closeModal();
              }}
              placeholder="Name your habit..."
              autoFocus
            />
            <div className="icon-picker">
              {HABIT_ICONS.slice(0, 10).map(icon => (
                <button
                  key={icon}
                  className={`icon-option ${newHabitIcon === icon ? 'selected' : ''}`}
                  onClick={() => setNewHabitIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div className="add-modal-buttons">
              <button onClick={closeModal}>Cancel</button>
              <button onClick={handleConfirmAdd} className="confirm">Add</button>
            </div>
          </div>
        </div>
      )}

      <HabitDashboard
        habit={selectedHabit}
        onClose={() => setSelectedHabitId(null)}
        onToggleDay={handleToggleDay}
        onRename={handleRename}
        onDelete={handleDelete}
        onChangeIcon={handleChangeIcon}
      />
    </div>
  );
}

export default App;
