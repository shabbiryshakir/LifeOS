import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { FinanceEntry } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Home, 
  Coffee, 
  Car, 
  Activity,
  DollarSign
} from 'lucide-react';

export default function FinanceTracker() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    const q = query(collection(db, 'finances'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceEntry)));
    });
    return () => unsubscribe();
  }, []);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    try {
      await addDoc(collection(db, 'finances'), {
        amount: parseFloat(amount),
        category,
        description,
        type,
        date: new Date().toISOString()
      });
      setAmount('');
      setDescription('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'finances');
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'finances', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `finances/${id}`);
    }
  };

  const totalBalance = entries.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  const categories = [
    { name: 'Groceries', icon: ShoppingBag },
    { name: 'Home', icon: Home },
    { name: 'Leisure', icon: Coffee },
    { name: 'Transport', icon: Car },
    { name: 'Health', icon: Activity },
    { name: 'Other', icon: Wallet },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">Finance & Expenses</p>
          <h1 className="font-serif text-4xl font-bold">Shared Ledger</h1>
        </div>
        <div className="bg-white px-6 py-4 rounded-[24px] shadow-sm border border-[#1a1a1a]/5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${totalBalance >= 0 ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Current Balance</p>
            <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </header>

      {/* Quick Input Form */}
      <form onSubmit={addEntry} className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-[#1a1a1a]/5 space-y-6">
        <div className="flex gap-2 p-1 bg-[#F5F5F0] rounded-2xl w-fit">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t as any)}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                type === t 
                  ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20' 
                  : 'text-[#5A5A40]/40 hover:text-[#5A5A40]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 ml-2">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40" size={20} />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#F5F5F0]/50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-bold text-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 ml-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#F5F5F0]/50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-medium appearance-none"
            >
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 ml-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="w-full bg-[#F5F5F0]/50 border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#4A4A35] transition-all shadow-lg shadow-[#5A5A40]/20 flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Add Transaction
        </button>
      </form>

      {/* Transaction History */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold px-2">Recent Transactions</h2>
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => {
              const CatIcon = categories.find(c => c.name === entry.category)?.icon || Wallet;
              return (
                <motion.div
                  layout
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="group bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-[#1a1a1a]/5 hover:shadow-md transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    entry.type === 'income' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
                  }`}>
                    <CatIcon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{entry.description}</h4>
                    <p className="text-xs text-[#5A5A40]/40 font-medium">
                      {entry.category} • {new Date(entry.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.type === 'income' ? '+' : '-'}${entry.amount.toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => deleteEntry(entry.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {entries.length === 0 && (
            <div className="text-center py-20 bg-white/50 rounded-[32px] border-2 border-dashed border-[#5A5A40]/10">
              <p className="text-[#5A5A40]/40 font-medium">No transactions yet. Start tracking!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
