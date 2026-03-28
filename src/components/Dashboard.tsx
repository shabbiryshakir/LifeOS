import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, limit } from '../firebase';
import { UserProfile, Widget, Task } from '../types';
import { motion } from 'motion/react';
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
  CheckSquare
} from 'lucide-react';

interface DashboardProps {
  profile: UserProfile | null;
}

export default function Dashboard({ profile }: DashboardProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [topTasks, setTopTasks] = useState<Task[]>([]);
  const [quote, setQuote] = useState({ text: "The secret of getting ahead is getting started.", author: "Mark Twain" });

  useEffect(() => {
    // Fetch dynamic widgets
    const widgetsQuery = query(collection(db, 'widgets'), orderBy('order', 'asc'));
    const unsubscribeWidgets = onSnapshot(widgetsQuery, (snapshot) => {
      setWidgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Widget)));
    });

    // Fetch top 3 urgent tasks
    const tasksQuery = query(
      collection(db, 'tasks'), 
      orderBy('status', 'asc'),
      limit(3)
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTopTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });

    return () => {
      unsubscribeWidgets();
      unsubscribeTasks();
    };
  }, []);

  // Countdown to Burhanpur (Example date: Dec 25, 2026)
  const burhanpurDate = new Date('2026-12-25T00:00:00');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = burhanpurDate.getTime() - now.getTime();
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">Bulletin Board</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold">Hello, {profile?.displayName?.split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-2 text-[#5A5A40] bg-white px-4 py-2 rounded-2xl shadow-sm border border-[#1a1a1a]/5">
          <Calendar size={18} />
          <span className="font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quote of the Day */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="md:col-span-2 bg-white rounded-[32px] p-8 shadow-xl shadow-black/5 border border-[#1a1a1a]/5 relative overflow-hidden"
        >
          <Quote className="absolute -top-4 -right-4 w-32 h-32 text-[#5A5A40]/5 rotate-12" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="text-[#5A5A40] w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/60">Mindset</span>
            </div>
            <p className="font-serif text-2xl md:text-3xl leading-snug mb-6 italic">"{quote.text}"</p>
            <p className="text-[#5A5A40] font-medium">— {quote.author}</p>
          </div>
        </motion.div>

        {/* Travel Countdown */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#5A5A40] rounded-[32px] p-8 text-white shadow-xl shadow-[#5A5A40]/20 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 opacity-60" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Next Trip</span>
            </div>
            <h3 className="font-serif text-3xl font-bold mb-2">Burhanpur</h3>
            <p className="text-sm opacity-70">Visiting the roots.</p>
          </div>
          <div className="flex justify-between items-end mt-8">
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
            <Clock className="w-8 h-8 opacity-20" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Goals/Tasks */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold">Top Priorities</h2>
            <button className="text-[#5A5A40] text-sm font-bold flex items-center gap-1">
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {topTasks.map((task) => (
              <div key={task.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-[#1a1a1a]/5">
                <div className={`w-2 h-2 rounded-full ${
                  task.category === 'Urgent' ? 'bg-red-500' : 
                  task.category === 'Chores' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <span className="flex-1 font-medium">{task.title}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 px-2 py-1 bg-[#5A5A40]/5 rounded-lg">
                  {task.category}
                </span>
              </div>
            ))}
            {topTasks.length === 0 && (
              <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-[#5A5A40]/20">
                <p className="text-[#5A5A40]/40 text-sm">No urgent tasks. Relax!</p>
              </div>
            )}
          </div>
        </section>

        {/* Dynamic AI Widgets */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold">Custom Trackers</h2>
            <button className="text-[#5A5A40] text-sm font-bold flex items-center gap-1">
              Manage <Settings size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {widgets.map((widget) => (
              <div key={widget.id} className="bg-white p-6 rounded-2xl shadow-sm border border-[#1a1a1a]/5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg">{widget.title}</h4>
                  <p className="text-sm text-[#5A5A40]/60 capitalize">{widget.type} Tracker</p>
                </div>
                <div className="w-12 h-12 bg-[#5A5A40]/5 rounded-xl flex items-center justify-center text-[#5A5A40]">
                  {widget.type === 'counter' && <TrendingUp size={24} />}
                  {widget.type === 'list' && <CheckSquare size={24} />}
                  {/* Add more icons as needed */}
                </div>
              </div>
            ))}
            {widgets.length === 0 && (
              <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-[#5A5A40]/20">
                <p className="text-[#5A5A40]/40 text-sm">Use AI Builder to add custom trackers.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
