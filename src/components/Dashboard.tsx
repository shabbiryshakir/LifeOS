import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, limit, doc, setDoc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Widget, Task, AppSettings, Habit, HabitLog, VisionGoal, FinanceEntry } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Quote, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Plus,
  ChevronRight,
  Sparkles,
  Settings,
  CheckSquare,
  Edit2,
  X,
  Save,
  List as ListIcon,
  Activity,
  Flame,
  Wallet,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, startOfToday, subDays, parseISO } from 'date-fns';

interface DashboardProps {
  profile: UserProfile | null;
}

const WidgetRenderer: React.FC<{ widget: Widget }> = ({ widget }) => {
  const [newItem, setNewItem] = useState('');

  const deleteWidget = async () => {
    try {
      await deleteDoc(doc(db, 'widgets', widget.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `widgets/${widget.id}`);
    }
  };

  const addListItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      const docRef = doc(db, 'widgets', widget.id);
      const currentItems = widget.config.items || [];
      await updateDoc(docRef, { 'config.items': [...currentItems, newItem.trim()] });
      setNewItem('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `widgets/${widget.id}`);
    }
  };

  const removeListItem = async (index: number) => {
    try {
      const docRef = doc(db, 'widgets', widget.id);
      const currentItems = [...(widget.config.items || [])];
      currentItems.splice(index, 1);
      await updateDoc(docRef, { 'config.items': currentItems });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `widgets/${widget.id}`);
    }
  };

  switch (widget.type) {
    case 'counter':
      return (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-[#1a1a1a]/5 flex items-center justify-between group relative">
          <button 
            onClick={deleteWidget}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
          >
            <X size={12} />
          </button>
          <div>
            <h4 className="font-bold text-lg">{widget.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-[#5A5A40]">{widget.config.value || 0}</span>
              <span className="text-xs text-[#5A5A40]/40 uppercase font-bold">{widget.config.unit || 'units'}</span>
            </div>
          </div>
          <button 
            onClick={async () => {
              const docRef = doc(db, 'widgets', widget.id);
              await updateDoc(docRef, { 'config.value': (widget.config.value || 0) + 1 });
            }}
            className="w-10 h-10 bg-[#5A5A40]/5 rounded-xl flex items-center justify-center text-[#5A5A40] hover:bg-[#5A5A40]/10"
          >
            <Plus size={20} />
          </button>
        </div>
      );
    case 'list':
      return (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-[#1a1a1a]/5 group relative">
          <button 
            onClick={deleteWidget}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
          >
            <X size={12} />
          </button>
          <h4 className="font-bold text-lg mb-4">{widget.title}</h4>
          <div className="space-y-2 mb-4">
            {(widget.config.items || []).map((item: string, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm text-[#5A5A40]/70 group/item">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#5A5A40]/30 rounded-full" />
                  {item}
                </div>
                <button 
                  onClick={() => removeListItem(i)}
                  className="text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={addListItem} className="flex gap-2">
            <input 
              type="text" 
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add item..."
              className="flex-1 bg-[#F5F5F0] border-none rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-[#5A5A40]/20"
            />
            <button type="submit" className="p-2 bg-[#5A5A40] text-white rounded-xl hover:bg-[#4A4A35]">
              <Plus size={16} />
            </button>
          </form>
        </div>
      );
    case 'countdown':
      return (
        <div className="bg-[#5A5A40] p-6 rounded-[32px] shadow-lg text-white group relative">
          <button 
            onClick={deleteWidget}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
          >
            <X size={12} />
          </button>
          <div className="flex items-center gap-2 mb-4 opacity-70">
            <Clock size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Countdown</span>
          </div>
          <h4 className="font-bold text-xl mb-2">{widget.title}</h4>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {(() => {
                  const target = new Date(widget.config.targetDate || Date.now()).getTime();
                  if (isNaN(target)) return 0;
                  return Math.max(0, Math.floor((target - Date.now()) / (1000 * 60 * 60 * 24)));
                })()}
              </p>
              <p className="text-[8px] uppercase opacity-60">Days Left</p>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-[#1a1a1a]/5 flex items-center justify-between group relative">
          <button 
            onClick={deleteWidget}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
          >
            <X size={12} />
          </button>
          <div>
            <h4 className="font-bold text-lg">{widget.title}</h4>
            <p className="text-sm text-[#5A5A40]/60 capitalize">{widget.type} Tracker</p>
          </div>
          <div className="w-12 h-12 bg-[#5A5A40]/5 rounded-xl flex items-center justify-center text-[#5A5A40]">
            <Activity size={24} />
          </div>
        </div>
      );
  }
};

export default function Dashboard({ profile }: DashboardProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [topTasks, setTopTasks] = useState<Task[]>([]);
  const [finances, setFinances] = useState<FinanceEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [visions, setVisions] = useState<VisionGoal[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [editTripData, setEditTripData] = useState<AppSettings>({ tripTitle: '', tripDate: '' });
  const [quote, setQuote] = useState({ text: "The secret of getting ahead is getting started.", author: "Mark Twain" });

  useEffect(() => {
    if (!profile) return;

    const widgetsQuery = query(collection(db, 'widgets'), orderBy('order', 'asc'));
    const unsubscribeWidgets = onSnapshot(widgetsQuery, (snapshot) => {
      setWidgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Widget)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'widgets');
    });

    const tasksQuery = query(collection(db, 'tasks'), orderBy('status', 'asc'), limit(5));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTopTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });

    const financesQuery = query(collection(db, 'finances'), orderBy('date', 'desc'), limit(5));
    const unsubscribeFinances = onSnapshot(financesQuery, (snapshot) => {
      setFinances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceEntry)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'finances');
    });

    const habitsQuery = collection(db, 'habits');
    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'habits');
    });

    const logsQuery = collection(db, 'habitLogs');
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      setHabitLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HabitLog)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'habitLogs');
    });

    const visionsQuery = query(collection(db, 'visionGoals'), limit(3));
    const unsubscribeVisions = onSnapshot(visionsQuery, (snapshot) => {
      setVisions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisionGoal)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'visionGoals');
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppSettings;
        setSettings(data);
        setEditTripData(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });

    return () => {
      unsubscribeWidgets();
      unsubscribeTasks();
      unsubscribeFinances();
      unsubscribeHabits();
      unsubscribeLogs();
      unsubscribeVisions();
      unsubscribeSettings();
    };
  }, [profile]);

  const calculateStreak = (habitId: string) => {
    let streak = 0;
    let today = startOfToday();
    const logs = habitLogs
      .filter(l => l.habitId === habitId)
      .sort((a, b) => b.date.localeCompare(a.date));

    let checkDate = today;
    const hasToday = logs.some(l => l.date === format(today, 'yyyy-MM-dd'));
    const hasYesterday = logs.some(l => l.date === format(subDays(today, 1), 'yyyy-MM-dd'));

    if (!hasToday && !hasYesterday) return 0;
    if (!hasToday) checkDate = subDays(today, 1);

    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const log = logs.find(l => l.date === dateStr);
      const habit = habits.find(h => h.id === habitId);
      if (log && log.count >= (habit?.targetCount || 1)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else break;
    }
    return streak;
  };

  const totalBalance = finances.reduce((acc, curr) => 
    curr.type === 'income' ? acc + (Number(curr.amount) || 0) : acc - (Number(curr.amount) || 0), 0
  );

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });

  useEffect(() => {
    if (!settings?.tripDate) return;
    const tripDate = new Date(settings.tripDate);
    const timer = setInterval(() => {
      const now = new Date();
      const diff = tripDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [settings?.tripDate]);

  const handleUpdateTrip = async () => {
    try {
      await updateDoc(doc(db, 'settings', 'global'), { ...editTripData });
      setIsEditingTrip(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/global');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">Life OS Dashboard</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold">Hello, {profile?.displayName?.split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-2 text-[#5A5A40] bg-white px-4 py-2 rounded-2xl shadow-sm border border-[#1a1a1a]/5">
          <Calendar size={18} />
          <span className="font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[32px] shadow-sm border border-[#1a1a1a]/5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
              <CheckSquare size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Tasks</span>
          </div>
          <p className="text-3xl font-bold mb-1">{topTasks.filter(t => t.status === 'pending').length}</p>
          <p className="text-xs text-[#5A5A40]/60">Pending responsibilities</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[32px] shadow-sm border border-[#1a1a1a]/5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Finance</span>
          </div>
          <p className="text-3xl font-bold mb-1">${totalBalance.toLocaleString()}</p>
          <p className="text-xs text-[#5A5A40]/60">Current balance</p>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[32px] shadow-sm border border-[#1a1a1a]/5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
              <Flame size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Habits</span>
          </div>
          <p className="text-3xl font-bold mb-1">
            {habits.reduce((acc, h) => Math.max(acc, calculateStreak(h.id)), 0)}
          </p>
          <p className="text-xs text-[#5A5A40]/60">Best current streak</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Priorities & Habits */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quote */}
          <motion.div className="bg-white rounded-[32px] p-8 shadow-xl shadow-black/5 border border-[#1a1a1a]/5 relative overflow-hidden">
            <Quote className="absolute -top-4 -right-4 w-32 h-32 text-[#5A5A40]/5 rotate-12" />
            <div className="relative z-10">
              <p className="font-serif text-2xl leading-snug mb-4 italic">"{quote.text}"</p>
              <p className="text-[#5A5A40] font-medium">— {quote.author}</p>
            </div>
          </motion.div>

          {/* Recent Tasks */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-serif text-2xl">Top Priorities</h3>
              <button className="text-[#5A5A40] text-sm font-bold flex items-center gap-1">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="bg-white rounded-[32px] p-2 shadow-sm border border-[#1a1a1a]/5">
              {topTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-[#F5F5F0]/50 rounded-2xl transition-all">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                  <span className={`flex-1 font-medium ${task.status === 'completed' ? 'line-through text-[#5A5A40]/40' : ''}`}>
                    {task.title}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* AI Custom Trackers */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-serif text-2xl">Custom Trackers</h3>
              <button className="text-[#5A5A40] text-sm font-bold flex items-center gap-1">
                Manage <Settings size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {widgets.map((widget) => (
                <WidgetRenderer key={widget.id} widget={widget} />
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Travel & Vision */}
        <div className="space-y-8">
          {/* Travel Countdown */}
          <motion.div className="bg-[#5A5A40] rounded-[32px] p-8 text-white shadow-xl shadow-[#5A5A40]/20 flex flex-col justify-between relative group">
            <button 
              onClick={() => setIsEditingTrip(true)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
            >
              <Edit2 size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 opacity-60" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Next Trip</span>
              </div>
              <h3 className="font-serif text-3xl font-bold mb-2">{settings?.tripTitle || 'Burhanpur'}</h3>
              <p className="text-sm opacity-70 mb-8">{settings?.tripDescription || 'Visiting the roots.'}</p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{timeLeft.days}</p>
                  <p className="text-[10px] uppercase opacity-60">Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{timeLeft.hours}</p>
                  <p className="text-[10px] uppercase opacity-60">Hrs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{timeLeft.mins}</p>
                  <p className="text-[10px] uppercase opacity-60">Min</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Habit Streaks */}
          <section className="space-y-4">
            <h3 className="font-serif text-2xl px-2">Habit Streaks</h3>
            <div className="grid gap-4">
              {habits.slice(0, 3).map(habit => {
                const streak = calculateStreak(habit.id);
                return (
                  <div key={habit.id} className="bg-white p-5 rounded-[24px] border border-[#1a1a1a]/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: habit.color }}>
                        <CheckSquare size={16} />
                      </div>
                      <span className="font-bold text-sm">{habit.title}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full">
                      <Flame size={14} className="text-orange-500" />
                      <span className="text-xs font-bold text-orange-700">{streak}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Vision Preview */}
          <section className="space-y-4">
            <h3 className="font-serif text-2xl px-2">Vision</h3>
            <div className="grid gap-4">
              {visions.map(vision => (
                <div key={vision.id} className="relative aspect-video rounded-[24px] overflow-hidden group">
                  <img 
                    src={vision.imageUrl || `https://picsum.photos/seed/${vision.id}/800/600`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={vision.title}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                    <h4 className="text-white font-bold text-sm">{vision.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Edit Trip Modal */}
      <AnimatePresence>
        {isEditingTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-3xl font-bold">Edit Trip</h3>
                <button onClick={() => setIsEditingTrip(false)} className="text-[#5A5A40]/40 hover:text-[#5A5A40]">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Destination</label>
                  <input 
                    type="text" 
                    value={editTripData.tripTitle}
                    onChange={e => setEditTripData({ ...editTripData, tripTitle: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Date</label>
                  <input 
                    type="datetime-local" 
                    value={editTripData.tripDate ? new Date(editTripData.tripDate).toISOString().slice(0, 16) : ''}
                    onChange={e => setEditTripData({ ...editTripData, tripDate: new Date(e.target.value).toISOString() })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Description</label>
                  <input 
                    type="text" 
                    value={editTripData.tripDescription || ''}
                    onChange={e => setEditTripData({ ...editTripData, tripDescription: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                  />
                </div>
                <button 
                  onClick={handleUpdateTrip}
                  className="w-full bg-[#5A5A40] text-white py-5 rounded-full font-bold uppercase tracking-widest shadow-lg shadow-[#5A5A40]/20 flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
