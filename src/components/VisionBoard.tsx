import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { VisionGoal, Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Target, 
  Calendar, 
  Image as ImageIcon, 
  Trash2, 
  Edit2, 
  X, 
  Save,
  CheckCircle2,
  Clock,
  ChevronRight,
  ListTodo
} from 'lucide-react';
import { format } from 'date-fns';

export default function VisionBoard() {
  const [goals, setGoals] = useState<VisionGoal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState<VisionGoal | null>(null);
  const [newGoal, setNewGoal] = useState<Partial<VisionGoal>>({
    title: '',
    description: '',
    targetDate: '',
    imageUrl: '',
    status: 'active'
  });

  useEffect(() => {
    const goalsQuery = query(collection(db, 'visionGoals'), orderBy('createdAt', 'desc'));
    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisionGoal)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'visionGoals');
    });

    const tasksQuery = query(collection(db, 'tasks'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });

    return () => {
      unsubscribeGoals();
      unsubscribeTasks();
    };
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return;

    try {
      await addDoc(collection(db, 'visionGoals'), {
        ...newGoal,
        createdAt: new Date().toISOString()
      });
      setNewGoal({ title: '', description: '', targetDate: '', imageUrl: '', status: 'active' });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'visionGoals');
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    try {
      const { id, ...data } = editingGoal;
      await updateDoc(doc(db, 'visionGoals', id), data);
      setEditingGoal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `visionGoals/${editingGoal.id}`);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vision goal?')) return;
    try {
      await deleteDoc(doc(db, 'visionGoals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `visionGoals/${id}`);
    }
  };

  const getConnectedTasks = (goalId: string) => {
    return tasks.filter(t => t.visionGoalId === goalId);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">Manifest Your Future</p>
          <h1 className="font-serif text-4xl font-bold">Vision Board</h1>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#5A5A40] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A35] transition-all"
        >
          <Plus size={20} /> New Vision
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {goals.map((goal) => {
          const connectedTasks = getConnectedTasks(goal.id);
          const completedTasks = connectedTasks.filter(t => t.status === 'completed').length;
          const progress = connectedTasks.length > 0 ? (completedTasks / connectedTasks.length) * 100 : 0;

          return (
            <motion.div 
              layout
              key={goal.id}
              className="bg-white rounded-[40px] overflow-hidden shadow-xl shadow-black/5 border border-[#1a1a1a]/5 group"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={goal.imageUrl || `https://picsum.photos/seed/${goal.id}/800/600`} 
                  alt={goal.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => setEditingGoal(goal)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[#5A5A40] shadow-lg hover:bg-white"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 bg-red-500/90 backdrop-blur-sm rounded-xl text-white shadow-lg hover:bg-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {goal.status === 'completed' && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={12} /> Achieved
                  </div>
                )}
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold mb-2">{goal.title}</h3>
                  <p className="text-[#5A5A40]/60 text-sm line-clamp-2">{goal.description}</p>
                </div>

                {goal.targetDate && (
                  <div className="flex items-center gap-2 text-[#5A5A40]/40 text-xs font-bold uppercase tracking-widest">
                    <Calendar size={14} />
                    Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                  </div>
                )}

                {/* Project Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">
                    <span>Project Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#F5F5F0] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-[#5A5A40]"
                    />
                  </div>
                </div>

                {/* Connected Tasks */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">
                    <ListTodo size={14} />
                    Connected Tasks ({connectedTasks.length})
                  </div>
                  <div className="space-y-2">
                    {connectedTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center gap-2 text-xs text-[#5A5A40]/70">
                        <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                        <span className={task.status === 'completed' ? 'line-through opacity-50' : ''}>{task.title}</span>
                      </div>
                    ))}
                    {connectedTasks.length > 3 && (
                      <p className="text-[10px] text-[#5A5A40]/40 italic">+{connectedTasks.length - 3} more tasks</p>
                    )}
                    {connectedTasks.length === 0 && (
                      <p className="text-[10px] text-[#5A5A40]/40 italic">No tasks linked yet</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAdding || editingGoal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-3xl font-bold">{editingGoal ? 'Edit Vision' : 'New Vision'}</h3>
                <button onClick={() => { setIsAdding(false); setEditingGoal(null); }} className="text-[#5A5A40]/40 hover:text-[#5A5A40]">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={editingGoal ? handleUpdateGoal : handleAddGoal} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Vision Title</label>
                  <input 
                    type="text" 
                    required
                    value={editingGoal ? editingGoal.title : newGoal.title}
                    onChange={e => editingGoal ? setEditingGoal({ ...editingGoal, title: e.target.value }) : setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                    placeholder="What's the dream?"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Description</label>
                  <textarea 
                    value={editingGoal ? editingGoal.description : newGoal.description}
                    onChange={e => editingGoal ? setEditingGoal({ ...editingGoal, description: e.target.value }) : setNewGoal({ ...newGoal, description: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20 min-h-[100px]"
                    placeholder="Describe your future self..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Target Date</label>
                    <input 
                      type="date" 
                      value={editingGoal ? editingGoal.targetDate : newGoal.targetDate}
                      onChange={e => editingGoal ? setEditingGoal({ ...editingGoal, targetDate: e.target.value }) : setNewGoal({ ...newGoal, targetDate: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Status</label>
                    <select 
                      value={editingGoal ? editingGoal.status : newGoal.status}
                      onChange={e => editingGoal ? setEditingGoal({ ...editingGoal, status: e.target.value as any }) : setNewGoal({ ...newGoal, status: e.target.value as any })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Image URL</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#F5F5F0] rounded-2xl flex items-center px-4">
                      <ImageIcon size={20} className="text-[#5A5A40]/40" />
                      <input 
                        type="url" 
                        value={editingGoal ? editingGoal.imageUrl : newGoal.imageUrl}
                        onChange={e => editingGoal ? setEditingGoal({ ...editingGoal, imageUrl: e.target.value }) : setNewGoal({ ...newGoal, imageUrl: e.target.value })}
                        className="w-full bg-transparent border-none py-4 px-2 focus:ring-0"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#5A5A40] text-white py-5 rounded-full font-bold uppercase tracking-widest shadow-lg shadow-[#5A5A40]/20 flex items-center justify-center gap-2"
                >
                  <Save size={20} /> {editingGoal ? 'Save Changes' : 'Manifest Vision'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
