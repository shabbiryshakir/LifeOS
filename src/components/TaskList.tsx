import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Task, UserProfile, Category, VisionGoal } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Coffee,
  Filter,
  Search,
  CheckSquare,
  User as UserIcon,
  Calendar as CalendarIcon,
  Tag,
  Target,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';

interface TaskListProps {
  profile: UserProfile | null;
}

export default function TaskList({ profile }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [visions, setVisions] = useState<VisionGoal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    category: 'General',
    status: 'pending',
    assigneeId: profile?.uid,
    assigneeName: profile?.displayName || 'Unassigned'
  });

  useEffect(() => {
    const tasksQuery = query(collection(db, 'tasks'), orderBy('status', 'asc'), orderBy('createdAt', 'desc'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });

    const categoriesQuery = collection(db, 'categories');
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      if (cats.length === 0) {
        const defaults: Partial<Category>[] = [
          { name: 'Urgent', color: '#ef4444', type: 'task' },
          { name: 'Chores', color: '#3b82f6', type: 'task' },
          { name: 'Leisure', color: '#10b981', type: 'task' },
          { name: 'General', color: '#5A5A40', type: 'task' }
        ];
        defaults.forEach(d => addDoc(collection(db, 'categories'), d));
      }
      setCategories(cats);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    const usersQuery = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as UserProfile)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const visionsQuery = collection(db, 'visionGoals');
    const unsubscribeVisions = onSnapshot(visionsQuery, (snapshot) => {
      setVisions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisionGoal)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'visionGoals');
    });

    return () => {
      unsubscribeTasks();
      unsubscribeCategories();
      unsubscribeUsers();
      unsubscribeVisions();
    };
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title?.trim()) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        createdAt: new Date().toISOString(),
        userId: profile?.uid || 'anonymous'
      });

      setNewTask({
        title: '',
        category: 'General',
        status: 'pending',
        assigneeId: profile?.uid,
        assigneeName: profile?.displayName || 'Unassigned'
      });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: task.status === 'completed' ? 'pending' : 'completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const getCategoryColor = (catName: string) => {
    return categories.find(c => c.name === catName)?.color || '#5A5A40';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">Task Engine</p>
          <h1 className="font-serif text-4xl font-bold">Shared To-Do List</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-white p-1 rounded-2xl shadow-sm border border-[#1a1a1a]/5">
            {(['pending', 'completed', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-[#5A5A40] text-white shadow-md' : 'text-[#5A5A40]/40 hover:text-[#5A5A40]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#5A5A40] text-white p-3 rounded-2xl hover:bg-[#4A4A35] transition-all shadow-lg shadow-[#5A5A40]/20"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`group bg-white p-6 rounded-[24px] flex items-center gap-6 shadow-sm border border-[#1a1a1a]/5 transition-all hover:shadow-md ${
                task.status === 'completed' ? 'opacity-60 grayscale' : ''
              }`}
            >
              <button 
                onClick={() => toggleTask(task)}
                className={`transition-all ${task.status === 'completed' ? 'text-green-500' : 'text-[#5A5A40]/20 hover:text-[#5A5A40]'}`}
              >
                {task.status === 'completed' ? <CheckCircle2 size={32} /> : <Circle size={32} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className={`font-bold text-xl truncate ${task.status === 'completed' ? 'line-through text-[#5A5A40]/40' : ''}`}>
                    {task.title}
                  </h4>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                    style={{ backgroundColor: getCategoryColor(task.category) }}
                  >
                    {task.category}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">
                  {task.dueDate && (
                    <span className={`flex items-center gap-1.5 ${isToday(parseISO(task.dueDate)) ? 'text-red-500' : ''}`}>
                      <Clock size={12} /> {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <UserIcon size={12} /> {task.assigneeName || 'Unassigned'}
                  </span>
                  {task.visionGoalId && (
                    <span className="flex items-center gap-1.5 text-[#5A5A40]">
                      <Target size={12} /> {visions.find(v => v.id === task.visionGoalId)?.title}
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="text-center py-20 bg-white/50 rounded-[32px] border-2 border-dashed border-[#5A5A40]/10">
            <div className="w-16 h-16 bg-[#5A5A40]/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="text-[#5A5A40]/20 w-8 h-8" />
            </div>
            <p className="text-[#5A5A40]/40 font-medium">No tasks found in this category.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="font-serif text-3xl mb-8">New Task</h3>
              <form onSubmit={handleAddTask} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-3 ml-2">Task Title</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    className="w-full bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-[#5A5A40]/20 text-lg font-medium"
                    placeholder="What needs to be done?"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-3 ml-2">Category</label>
                    <select 
                      value={newTask.category}
                      onChange={e => setNewTask({...newTask, category: e.target.value})}
                      className="w-full bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none appearance-none cursor-pointer"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-3 ml-2">Due Date</label>
                    <input 
                      type="date"
                      value={newTask.dueDate || ''}
                      onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-3 ml-2">Assign To</label>
                    <select 
                      value={newTask.assigneeId || ''}
                      onChange={e => {
                        const user = users.find(u => u.uid === e.target.value);
                        setNewTask({
                          ...newTask, 
                          assigneeId: user?.uid,
                          assigneeName: user?.displayName || user?.email || 'Unassigned'
                        });
                      }}
                      className="w-full bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-3 ml-2">Link to Vision</label>
                    <select 
                      value={newTask.visionGoalId || ''}
                      onChange={e => setNewTask({...newTask, visionGoalId: e.target.value || undefined})}
                      className="w-full bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none appearance-none cursor-pointer"
                    >
                      <option value="">No Vision Goal</option>
                      {visions.map(v => (
                        <option key={v.id} value={v.id}>{v.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 rounded-full font-bold text-[#5A5A40]/60 hover:bg-[#F5F5F0] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#5A5A40] text-white py-4 rounded-full font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A35] transition-all"
                  >
                    Create Task
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
