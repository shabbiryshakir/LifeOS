import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Task } from '../types';
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
  CheckSquare
} from 'lucide-react';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [category, setCategory] = useState<'Urgent' | 'Leisure' | 'Chores'>('Chores');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('status', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    });
    return () => unsubscribe();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTaskTitle,
        category,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setNewTaskTitle('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const taskDoc = doc(db, 'tasks', task.id);
      await updateDoc(taskDoc, {
        status: task.status === 'pending' ? 'completed' : 'pending'
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

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">Task Engine</p>
          <h1 className="font-serif text-4xl font-bold">Shared To-Do List</h1>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm border border-[#1a1a1a]/5">
          {['all', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                filter === f ? 'bg-[#5A5A40] text-white' : 'text-[#5A5A40]/40 hover:text-[#5A5A40]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="bg-white p-6 rounded-[32px] shadow-xl shadow-black/5 border border-[#1a1a1a]/5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40" size={20} />
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-[#F5F5F0]/50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-medium"
            />
          </div>
          <div className="flex gap-2">
            {(['Urgent', 'Chores', 'Leisure'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex-1 md:flex-none px-4 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border ${
                  category === cat 
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40]' 
                    : 'bg-white text-[#5A5A40]/40 border-[#1a1a1a]/5 hover:border-[#5A5A40]/20'
                }`}
              >
                {cat === 'Urgent' && <AlertCircle size={14} className="inline mr-1" />}
                {cat === 'Chores' && <Clock size={14} className="inline mr-1" />}
                {cat === 'Leisure' && <Coffee size={14} className="inline mr-1" />}
                {cat}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="bg-[#5A5A40] text-white p-4 rounded-2xl hover:bg-[#4A4A35] transition-all shadow-lg shadow-[#5A5A40]/20"
          >
            <Plus size={24} />
          </button>
        </div>
      </form>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <motion.div
              layout
              key={task.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`group bg-white p-5 rounded-2xl flex items-center gap-4 shadow-sm border border-[#1a1a1a]/5 transition-all hover:shadow-md ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <button 
                onClick={() => toggleTask(task)}
                className={`transition-all ${task.status === 'completed' ? 'text-green-500' : 'text-[#5A5A40]/20 hover:text-[#5A5A40]'}`}
              >
                {task.status === 'completed' ? <CheckCircle2 size={28} /> : <Circle size={28} />}
              </button>
              
              <div className="flex-1">
                <h4 className={`font-bold text-lg ${task.status === 'completed' ? 'line-through text-[#5A5A40]/40' : ''}`}>
                  {task.title}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    task.category === 'Urgent' ? 'bg-red-50 text-red-500' : 
                    task.category === 'Chores' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'
                  }`}>
                    {task.category}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
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
    </div>
  );
}
