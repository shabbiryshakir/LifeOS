import { useState, useEffect, useMemo } from 'react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType } from '../firebase';
import { Task, FinanceEntry, Habit, HabitLog, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckSquare,
  Wallet,
  Flame,
  X,
  Clock,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  startOfDay,
} from 'date-fns';

interface CalendarProps {
  profile: UserProfile | null;
}

type ViewMode = 'month' | 'week' | 'agenda';

interface DayEvents {
  tasks: Task[];
  finances: FinanceEntry[];
  habitLogs: { habit: Habit; log: HabitLog }[];
}

export default function CalendarView({ profile }: CalendarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [finances, setFinances] = useState<FinanceEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [view, setView] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    const tasksQuery = query(collection(db, 'tasks'), orderBy('status', 'asc'));
    const unsubTasks = onSnapshot(
      tasksQuery,
      (snap) => setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))),
      (e) => handleFirestoreError(e, OperationType.GET, 'tasks')
    );

    const unsubFinances = onSnapshot(
      collection(db, 'finances'),
      (snap) => setFinances(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FinanceEntry))),
      (e) => handleFirestoreError(e, OperationType.GET, 'finances')
    );

    const unsubHabits = onSnapshot(
      collection(db, 'habits'),
      (snap) => setHabits(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Habit))),
      (e) => handleFirestoreError(e, OperationType.GET, 'habits')
    );

    const unsubLogs = onSnapshot(
      collection(db, 'habitLogs'),
      (snap) => setHabitLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HabitLog))),
      (e) => handleFirestoreError(e, OperationType.GET, 'habitLogs')
    );

    return () => {
      unsubTasks();
      unsubFinances();
      unsubHabits();
      unsubLogs();
    };
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvents>();
    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, { tasks: [], finances: [], habitLogs: [] });
      return map.get(key)!;
    };

    tasks.forEach((t) => {
      if (!t.dueDate) return;
      try {
        const key = format(parseISO(t.dueDate), 'yyyy-MM-dd');
        ensure(key).tasks.push(t);
      } catch {
        /* ignore bad date */
      }
    });

    finances.forEach((f) => {
      if (!f.date) return;
      try {
        const key = format(parseISO(f.date), 'yyyy-MM-dd');
        ensure(key).finances.push(f);
      } catch {
        /* ignore */
      }
    });

    habitLogs.forEach((log) => {
      const habit = habits.find((h) => h.id === log.habitId);
      if (!habit) return;
      ensure(log.date).habitLogs.push({ habit, log });
    });

    return map;
  }, [tasks, finances, habits, habitLogs]);

  const getDay = (d: Date): DayEvents =>
    eventsByDay.get(format(d, 'yyyy-MM-dd')) ?? { tasks: [], finances: [], habitLogs: [] };

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    const end = endOfWeek(cursor);
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const agendaDays = useMemo(() => {
    const today = startOfDay(new Date());
    return eachDayOfInterval({ start: today, end: addMonths(today, 1) }).filter((d) => {
      const ev = getDay(d);
      return ev.tasks.length || ev.finances.length || ev.habitLogs.length;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsByDay]);

  const navigate = (dir: -1 | 1) => {
    if (view === 'month') setCursor(dir === 1 ? addMonths(cursor, 1) : subMonths(cursor, 1));
    else if (view === 'week') setCursor(dir === 1 ? addWeeks(cursor, 1) : subWeeks(cursor, 1));
    else setCursor(dir === 1 ? addMonths(cursor, 1) : subMonths(cursor, 1));
  };

  const headerLabel = useMemo(() => {
    if (view === 'month') return format(cursor, 'MMMM yyyy');
    if (view === 'week') {
      const s = startOfWeek(cursor);
      const e = endOfWeek(cursor);
      return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
    }
    return 'Upcoming';
  }, [cursor, view]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">
            Time Engine
          </p>
          <h1 className="font-serif text-4xl font-bold">Calendar</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm border border-[#1a1a1a]/5">
            {(['month', 'week', 'agenda'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  view === v
                    ? 'bg-[#5A5A40] text-white shadow-md'
                    : 'text-[#5A5A40]/40 hover:text-[#5A5A40]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {view !== 'agenda' && (
            <div className="flex items-center gap-2 bg-white rounded-2xl p-1 shadow-sm border border-[#1a1a1a]/5">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-[#F5F5F0] transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCursor(new Date())}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/70 hover:text-[#5A5A40] transition-all"
              >
                Today
              </button>
              <button
                onClick={() => navigate(1)}
                className="p-2 rounded-xl hover:bg-[#F5F5F0] transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex items-center gap-3">
        <CalendarIcon size={20} className="text-[#5A5A40]/60" />
        <h2 className="font-serif text-2xl font-bold">{headerLabel}</h2>
      </div>

      {/* Views */}
      {view === 'month' && (
        <MonthGrid
          days={monthDays}
          cursor={cursor}
          getDay={getDay}
          onSelect={setSelectedDay}
        />
      )}
      {view === 'week' && (
        <WeekGrid days={weekDays} getDay={getDay} onSelect={setSelectedDay} />
      )}
      {view === 'agenda' && (
        <AgendaList days={agendaDays} getDay={getDay} onSelect={setSelectedDay} />
      )}

      {/* Day detail modal */}
      <AnimatePresence>
        {selectedDay && (
          <DayDetailModal
            day={selectedDay}
            events={getDay(selectedDay)}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------- Subviews ----------------- */

function EventDots({ events }: { events: DayEvents }) {
  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {events.tasks.length > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[9px] font-bold text-[#5A5A40] bg-[#5A5A40]/10 rounded-full px-1.5 py-0.5"
          title={`${events.tasks.length} tasks`}
        >
          <CheckSquare size={9} /> {events.tasks.length}
        </span>
      )}
      {events.finances.length > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-1.5 py-0.5"
          title={`${events.finances.length} finance entries`}
        >
          <Wallet size={9} /> {events.finances.length}
        </span>
      )}
      {events.habitLogs.length > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[9px] font-bold text-orange-700 bg-orange-100 rounded-full px-1.5 py-0.5"
          title={`${events.habitLogs.length} habits`}
        >
          <Flame size={9} /> {events.habitLogs.length}
        </span>
      )}
    </div>
  );
}

function MonthGrid({
  days,
  cursor,
  getDay,
  onSelect,
}: {
  days: Date[];
  cursor: Date;
  getDay: (d: Date) => DayEvents;
  onSelect: (d: Date) => void;
}) {
  const weekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="bg-white rounded-[32px] p-4 md:p-6 shadow-sm border border-[#1a1a1a]/5">
      <div className="grid grid-cols-7 gap-2 mb-3">
        {weekHeaders.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 py-2"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const inMonth = isSameMonth(d, cursor);
          const today = isToday(d);
          const ev = getDay(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelect(d)}
              className={`min-h-[80px] md:min-h-[100px] text-left rounded-2xl p-2 transition-all border ${
                today
                  ? 'bg-[#5A5A40] text-white border-transparent shadow-lg shadow-[#5A5A40]/20'
                  : inMonth
                  ? 'bg-[#F5F5F0]/40 hover:bg-[#F5F5F0] border-transparent'
                  : 'bg-transparent text-[#5A5A40]/30 border-transparent hover:bg-[#F5F5F0]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-bold ${
                    today ? 'text-white' : inMonth ? 'text-[#1a1a1a]' : ''
                  }`}
                >
                  {format(d, 'd')}
                </span>
              </div>
              <EventDots events={ev} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  days,
  getDay,
  onSelect,
}: {
  days: Date[];
  getDay: (d: Date) => DayEvents;
  onSelect: (d: Date) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {days.map((d) => {
        const ev = getDay(d);
        const today = isToday(d);
        return (
          <button
            key={d.toISOString()}
            onClick={() => onSelect(d)}
            className={`min-h-[180px] text-left rounded-[24px] p-4 transition-all border shadow-sm ${
              today
                ? 'bg-[#5A5A40] text-white border-transparent'
                : 'bg-white hover:bg-[#F5F5F0] border-[#1a1a1a]/5'
            }`}
          >
            <div
              className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                today ? 'text-white/70' : 'text-[#5A5A40]/40'
              }`}
            >
              {format(d, 'EEE')}
            </div>
            <div className={`text-2xl font-serif font-bold mb-3`}>{format(d, 'd')}</div>

            <div className="space-y-1.5">
              {ev.tasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className={`text-xs font-medium truncate rounded-lg px-2 py-1 ${
                    today ? 'bg-white/15 text-white' : 'bg-[#5A5A40]/10 text-[#5A5A40]'
                  } ${t.status === 'completed' ? 'line-through opacity-60' : ''}`}
                >
                  {t.title}
                </div>
              ))}
              {ev.finances.slice(0, 2).map((f) => (
                <div
                  key={f.id}
                  className={`text-xs font-medium truncate rounded-lg px-2 py-1 ${
                    f.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {f.type === 'income' ? '+' : '−'}${f.amount} {f.category}
                </div>
              ))}
              {ev.habitLogs.length > 0 && (
                <div
                  className={`text-xs font-medium rounded-lg px-2 py-1 ${
                    today ? 'bg-white/15 text-white' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  <Flame size={10} className="inline mr-1" />
                  {ev.habitLogs.length} habit{ev.habitLogs.length === 1 ? '' : 's'}
                </div>
              )}
              {ev.tasks.length + ev.finances.length === 0 && ev.habitLogs.length === 0 && (
                <div className={`text-[10px] ${today ? 'text-white/50' : 'text-[#5A5A40]/30'}`}>
                  Nothing scheduled
                </div>
              )}
              {ev.tasks.length > 3 && (
                <div className={`text-[10px] ${today ? 'text-white/60' : 'text-[#5A5A40]/50'}`}>
                  +{ev.tasks.length - 3} more
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AgendaList({
  days,
  getDay,
  onSelect,
}: {
  days: Date[];
  getDay: (d: Date) => DayEvents;
  onSelect: (d: Date) => void;
}) {
  if (days.length === 0) {
    return (
      <div className="text-center py-20 bg-white/50 rounded-[32px] border-2 border-dashed border-[#5A5A40]/10">
        <div className="w-16 h-16 bg-[#5A5A40]/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarIcon className="text-[#5A5A40]/20 w-8 h-8" />
        </div>
        <p className="text-[#5A5A40]/40 font-medium">Nothing scheduled in the next 30 days.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {days.map((d) => {
        const ev = getDay(d);
        const total = ev.tasks.length + ev.finances.length + ev.habitLogs.length;
        return (
          <button
            key={d.toISOString()}
            onClick={() => onSelect(d)}
            className="w-full bg-white p-5 rounded-[24px] flex items-center gap-5 shadow-sm border border-[#1a1a1a]/5 hover:shadow-md transition-all text-left"
          >
            <div
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                isToday(d) ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F5F0] text-[#5A5A40]'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                {format(d, 'EEE')}
              </span>
              <span className="text-2xl font-serif font-bold leading-none">{format(d, 'd')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold mb-1">{format(d, 'EEEE, MMMM d')}</div>
              <div className="text-xs text-[#5A5A40]/60 truncate">
                {ev.tasks.length > 0 && <span>{ev.tasks.length} tasks · </span>}
                {ev.finances.length > 0 && <span>{ev.finances.length} entries · </span>}
                {ev.habitLogs.length > 0 && <span>{ev.habitLogs.length} habits</span>}
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">
              {total} item{total === 1 ? '' : 's'}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DayDetailModal({
  day,
  events,
  onClose,
}: {
  day: Date;
  events: DayEvents;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-1">
              {isToday(day) ? 'Today' : format(day, 'EEEE')}
            </p>
            <h3 className="font-serif text-3xl font-bold">{format(day, 'MMMM d, yyyy')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#F5F5F0] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {events.tasks.length === 0 &&
          events.finances.length === 0 &&
          events.habitLogs.length === 0 && (
            <div className="text-center py-10 text-[#5A5A40]/40 font-medium">
              Nothing on this day.
            </div>
          )}

        {events.tasks.length > 0 && (
          <section className="mb-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-3 flex items-center gap-2">
              <CheckSquare size={12} /> Tasks · {events.tasks.length}
            </h4>
            <div className="space-y-2">
              {events.tasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#F5F5F0] rounded-2xl px-4 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div
                      className={`font-bold truncate ${
                        t.status === 'completed' ? 'line-through text-[#5A5A40]/40' : ''
                      }`}
                    >
                      {t.title}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-[#5A5A40]/50 mt-0.5">
                      {t.category}
                      {t.assigneeName && t.assigneeName !== 'Unassigned'
                        ? ` · ${t.assigneeName}`
                        : ''}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                      t.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-[#5A5A40] text-white'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {events.finances.length > 0 && (
          <section className="mb-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-3 flex items-center gap-2">
              <Wallet size={12} /> Finance · {events.finances.length}
            </h4>
            <div className="space-y-2">
              {events.finances.map((f) => (
                <div
                  key={f.id}
                  className="bg-[#F5F5F0] rounded-2xl px-4 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-bold truncate">{f.description || f.category}</div>
                    <div className="text-[10px] uppercase tracking-widest text-[#5A5A40]/50 mt-0.5">
                      {f.category}
                    </div>
                  </div>
                  <span
                    className={`font-bold ${
                      f.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {f.type === 'income' ? '+' : '−'}${f.amount}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {events.habitLogs.length > 0 && (
          <section className="mb-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-3 flex items-center gap-2">
              <Flame size={12} /> Habits · {events.habitLogs.length}
            </h4>
            <div className="space-y-2">
              {events.habitLogs.map(({ habit, log }) => (
                <div
                  key={log.id}
                  className="bg-[#F5F5F0] rounded-2xl px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: habit.color }}
                    />
                    <div className="font-bold truncate">{habit.title}</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">
                    {log.count} / {habit.targetCount}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
}
