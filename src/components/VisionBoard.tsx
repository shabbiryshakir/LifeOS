import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, addDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { VisionGoal } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Target, 
  Image as ImageIcon, 
  Calendar, 
  Sparkles,
  ChevronRight,
  Camera
} from 'lucide-react';

export default function VisionBoard() {
  const [goals, setGoals] = useState<VisionGoal[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'vision_goals'), (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisionGoal)));
    });
    return () => unsubscribe();
  }, []);

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    try {
      await addDoc(collection(db, 'vision_goals'), {
        title,
        description,
        imageUrl: imageUrl || `https://picsum.photos/seed/${title}/800/600`,
        targetDate,
        createdAt: new Date().toISOString()
      });
      setTitle('');
      setDescription('');
      setImageUrl('');
      setTargetDate('');
      setShowAdd(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'vision_goals');
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vision_goals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vision_goals/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">Vision & Goals</p>
          <h1 className="font-serif text-4xl font-bold">The Future We Build</h1>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-[#5A5A40] text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#4A4A35] transition-all shadow-lg shadow-[#5A5A40]/20 flex items-center gap-2"
        >
          <Plus size={20} /> New Vision
        </button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addGoal} 
            className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-[#1a1a1a]/5 space-y-6 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 ml-2">Goal Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What are we aiming for?"
                  className="w-full bg-[#F5F5F0]/50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 ml-2">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-[#F5F5F0]/50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-medium"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 ml-2">Image URL (Optional)</label>
                <div className="relative">
                  <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40" size={20} />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#F5F5F0]/50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-medium"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 ml-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the vision..."
                  className="w-full bg-[#F5F5F0]/50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-medium min-h-[100px]"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-[#5A5A40] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#4A4A35] transition-all shadow-lg shadow-[#5A5A40]/20"
              >
                Create Vision
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:bg-[#5A5A40]/5 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {goals.map((goal) => (
            <motion.div
              layout
              key={goal.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -10 }}
              className="group bg-white rounded-[32px] overflow-hidden shadow-xl shadow-black/5 border border-[#1a1a1a]/5 flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={goal.imageUrl} 
                  alt={goal.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                >
                  <Trash2 size={18} />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <h3 className="text-white font-serif text-2xl font-bold truncate">{goal.title}</h3>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <p className="text-[#5A5A40]/70 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                  {goal.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]/5">
                  <div className="flex items-center gap-2 text-[#5A5A40]/40">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  <div className="w-8 h-8 bg-[#5A5A40]/5 rounded-full flex items-center justify-center text-[#5A5A40]">
                    <Target size={16} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {goals.length === 0 && !showAdd && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-32 bg-white/50 rounded-[48px] border-2 border-dashed border-[#5A5A40]/10">
            <div className="w-20 h-20 bg-[#5A5A40]/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="text-[#5A5A40]/20 w-10 h-10" />
            </div>
            <h3 className="font-serif text-2xl text-[#5A5A40]/40 mb-2">Your vision board is empty</h3>
            <p className="text-[#5A5A40]/40 font-medium">Start dreaming together.</p>
          </div>
        )}
      </div>
    </div>
  );
}
