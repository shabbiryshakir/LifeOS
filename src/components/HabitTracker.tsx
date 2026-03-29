import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, doc, setDoc, addDoc, deleteDoc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { Habit, HabitLog, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Flame, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings2
} from 'lucide-react';
import { format, startOfToday, eachDayOfInterval, subDays, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';

interface HabitTrackerProps {
  profile: UserProfile | null;
}

export default function HabitTracker({ profile }: HabitTrackerProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    title: '',
    frequency: 'daily',
    targetCount: 1,
    color: '#5A5A40'
  });

  useEffect(() => {
    if (!profile) return;

    const habitsQuery = query(collection(db, 'habits'), orderBy('createdAt', 'desc'));
    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'habits');
    });

    const logsQuery = collection(db, 'habitLogs');
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HabitLog)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'habitLogs');
    });

    return () => {
      unsubscribeHabits();
      unsubscribeLogs();
    };
  }, [profile]);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.title) return;

    await addDoc(collection(db, 'habits'), {
      ...newHabit,
      createdAt: new Date().toISOString()
    });

    setNewHabit({ title: '', frequency: 'daily', targetCount: 1, color: '#5A5A40' });
    setIsAdding(false);
  };

  const toggleHabit = async (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingLog = logs.find(l => l.habitId === habitId && l.date === dateStr);

    if (existingLog) {
      if (existingLog.count >= habits.find(h => h.id === habitId)!.targetCount) {
        await deleteDoc(doc(db, 'habitLogs', existingLog.id));
      } else {
        await updateDoc(doc(db, 'habitLogs', existingLog.id), {
          count: existingLog.count + 1
        });
      }
    } else {
      await addDoc(collection(db, 'habitLogs'), {
        habitId,
        date: dateStr,
        count: 1
      });
    }
  };

  const calculateStreak = (habitId: string) => {
    let streak = 0;
    let today = startOfToday();
    
    // Sort logs for this habit by date descending
    const habitLogs = logs
      .filter(l => l.habitId === habitId)
      .sort((a, b) => b.date.localeCompare(a.date));

    // Check if completed today or yesterday to continue streak
    let checkDate = today;
    const hasToday = habitLogs.some(l => l.date === format(today, 'yyyy-MM-dd'));
    const hasYesterday = habitLogs.some(l => l.date === format(subDays(today, 1), 'yyyy-MM-dd'));

    if (!hasToday && !hasYesterday) return 0;
    if (!hasToday) checkDate = subDays(today, 1);

    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const log = habitLogs.find(l => l.date === dateStr);
      const habit = habits.find(h => h.id === habitId);
      
      if (log && log.count >= (habit?.targetCount || 1)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const last7Days = eachDayOfInterval({
    start: subDays(startOfToday(), 6),
    end: startOfToday()
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl text-[#1a1a1a]">Habit Tracker</h2>
          <p className="text-[#5A5A40]/60">Build consistency, one day at a time.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#5A5A40] text-white p-3 rounded-2xl hover:bg-[#4A4A35] transition-all shadow-lg shadow-[#5A5A40]/20"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid gap-6">
        {habits.map(habit => {
          const streak = calculateStreak(habit.id);
          return (
            <motion.div 
              layout
              key={habit.id}
              className="bg-white rounded-[32px] p-6 shadow-sm border border-[#1a1a1a]/5"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                    style={{ backgroundColor: habit.color }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{habit.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-[#5A5A40]/60">
                      <Flame size={14} className={streak > 0 ? "text-orange-500" : ""} />
                      <span>{streak} day streak</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => deleteDoc(doc(db, 'habits', habit.id))}
                  className="text-red-500/40 hover:text-red-500 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex justify-between items-center gap-2">
                {last7Days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);
                  const isCompleted = log && log.count >= habit.targetCount;
                  const isToday = isSameDay(day, startOfToday());

                  return (
                    <button
                      key={dateStr}
                      onClick={() => toggleHabit(habit.id, day)}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                        isCompleted 
                          ? 'bg-[#5A5A40] text-white' 
                          : isToday 
                            ? 'bg-[#5A5A40]/5 border border-[#5A5A40]/20' 
                            : 'hover:bg-[#5A5A40]/5'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                        {format(day, 'EEE')}
                      </span>
                      <span className="text-sm font-bold">{format(day, 'd')}</span>
                      {isCompleted ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Circle size={16} className="opacity-20" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="font-serif text-2xl mb-6">New Habit</h3>
              <form onSubmit={handleAddHabit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-[#5A5A40]/60">Habit Name</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newHabit.title}
                    onChange={e => setNewHabit({...newHabit, title: e.target.value})}
                    className="w-full bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-[#5A5A40]/20"
                    placeholder="e.g. Morning Meditation"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-[#5A5A40]/60">Frequency</label>
                    <select 
                      value={newHabit.frequency}
                      onChange={e => setNewHabit({...newHabit, frequency: e.target.value as any})}
                      className="w-full bg-[#F5F5F0] rounded-2xl px-4 py-4 outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-[#5A5A40]/60">Goal</label>
                    <input 
                      type="number"
                      value={newHabit.targetCount}
                      onChange={e => setNewHabit({...newHabit, targetCount: parseInt(e.target.value)})}
                      className="w-full bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-[#5A5A40]/60">Color Theme</label>
                  <div className="flex gap-3">
                    {['#5A5A40', '#7C9082', '#A68A64', '#582F0E', '#333D29'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewHabit({...newHabit, color})}
                        className={`w-10 h-10 rounded-full transition-all ${newHabit.color === color ? 'ring-4 ring-[#5A5A40]/20 scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 rounded-full font-bold text-[#5A5A40]/60 hover:bg-[#F5F5F0]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#5A5A40] text-white py-4 rounded-full font-bold shadow-lg shadow-[#5A5A40]/20"
                  >
                    Create Habit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
