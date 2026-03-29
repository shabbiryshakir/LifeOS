import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { FinanceEntry, UserProfile, Category, Budget } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Tag, 
  Trash2, 
  X, 
  Save,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Filter,
  ChevronRight,
  Settings
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface FinanceTrackerProps {
  profile: UserProfile | null;
}

export default function FinanceTracker({ profile }: FinanceTrackerProps) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isManagingBudgets, setIsManagingBudgets] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  const [newEntry, setNewEntry] = useState<Partial<FinanceEntry>>({
    title: '',
    amount: 0,
    type: 'expense',
    category: 'General',
    date: new Date().toISOString().split('T')[0]
  });

  const [newCategory, setNewCategory] = useState({ name: '', color: '#5A5A40' });
  const [newBudget, setNewBudget] = useState<Partial<Budget>>({
    category: 'General',
    limit: 0,
    period: 'monthly'
  });

  useEffect(() => {
    const entriesQuery = query(collection(db, 'finances'), orderBy('date', 'desc'));
    const unsubscribeEntries = onSnapshot(entriesQuery, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceEntry)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'finances');
    });

    const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      if (fetched.length === 0) {
        // Seed default categories
        ['Housing', 'Food', 'Transport', 'Leisure', 'Health', 'General'].forEach(name => {
          addDoc(collection(db, 'categories'), { name, color: '#5A5A40', type: 'finance' });
        });
      }
      setCategories(fetched.filter(c => c.type === 'finance' || !c.type));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    const budgetsQuery = collection(db, 'budgets');
    const unsubscribeBudgets = onSnapshot(budgetsQuery, (snapshot) => {
      setBudgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'budgets');
    });

    return () => {
      unsubscribeEntries();
      unsubscribeCategories();
      unsubscribeBudgets();
    };
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.title || !newEntry.amount) return;

    try {
      await addDoc(collection(db, 'finances'), {
        ...newEntry,
        amount: Number(newEntry.amount),
        createdAt: new Date().toISOString()
      });
      setNewEntry({ title: '', amount: 0, type: 'expense', category: 'General', date: new Date().toISOString().split('T')[0] });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'finances');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    try {
      await addDoc(collection(db, 'categories'), { ...newCategory, type: 'finance' });
      setNewCategory({ name: '', color: '#5A5A40' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudget.limit) return;
    try {
      await addDoc(collection(db, 'budgets'), newBudget);
      setNewBudget({ category: 'General', limit: 0, period: 'monthly' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'budgets');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'finances', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `finances/${id}`);
    }
  };

  const totalIncome = entries.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const filteredEntries = entries.filter(e => filter === 'all' || e.type === filter);

  const getBudgetProgress = (category: string) => {
    const budget = budgets.find(b => b.category === category);
    if (!budget) return null;
    
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    
    const spent = entries
      .filter(e => e.category === category && e.type === 'expense' && new Date(e.date) >= start && new Date(e.date) <= end)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      
    return {
      spent,
      limit: budget.limit,
      percent: budget.limit > 0 ? Math.min(100, (spent / budget.limit) * 100) : 0
    };
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">Financial Overview</p>
          <h1 className="font-serif text-4xl font-bold">Wealth Tracker</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsManagingCategories(true)}
            className="p-3 bg-white text-[#5A5A40] rounded-2xl shadow-sm border border-[#1a1a1a]/5 hover:bg-[#F5F5F0]"
          >
            <Tag size={20} />
          </button>
          <button 
            onClick={() => setIsManagingBudgets(true)}
            className="p-3 bg-white text-[#5A5A40] rounded-2xl shadow-sm border border-[#1a1a1a]/5 hover:bg-[#F5F5F0]"
          >
            <PieChart size={20} />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#5A5A40] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-[#5A5A40]/20"
          >
            <Plus size={20} /> Add Entry
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#1a1a1a]/5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#5A5A40]/5 rounded-2xl flex items-center justify-center text-[#5A5A40]">
              <Wallet size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Total Balance</span>
          </div>
          <p className="text-4xl font-bold">${balance.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#5A5A40]/60">
            <TrendingUp size={14} className="text-green-500" />
            <span>Healthy growth</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#1a1a1a]/5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
              <ArrowUpRight size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Income</span>
          </div>
          <p className="text-4xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
          <p className="mt-4 text-xs text-[#5A5A40]/60">Total earnings to date</p>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#1a1a1a]/5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
              <ArrowDownRight size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Expenses</span>
          </div>
          <p className="text-4xl font-bold text-red-600">${totalExpense.toLocaleString()}</p>
          <p className="mt-4 text-xs text-[#5A5A40]/60">Total spending to date</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transactions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-serif text-2xl">Recent Transactions</h3>
            <div className="flex bg-[#F5F5F0] p-1 rounded-xl">
              {(['all', 'income', 'expense'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === t ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-[#5A5A40]/40'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-[#1a1a1a]/5">
            <div className="divide-y divide-[#1a1a1a]/5">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="p-6 flex items-center justify-between hover:bg-[#F5F5F0]/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${entry.type === 'income' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                      {entry.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1a1a1a]">{entry.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">{entry.category}</span>
                        <span className="text-[10px] text-[#5A5A40]/20">•</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className={`text-lg font-bold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.type === 'income' ? '+' : '-'}${entry.amount.toLocaleString()}
                    </p>
                    <button 
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredEntries.length === 0 && (
                <div className="p-12 text-center text-[#5A5A40]/40 italic">
                  No transactions found for this filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Budgets & Analysis */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="font-serif text-2xl px-2">Budget Analysis</h3>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#1a1a1a]/5 space-y-6">
              {budgets.map(budget => {
                const progress = getBudgetProgress(budget.category);
                if (!progress) return null;
                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40">{budget.category}</p>
                        <p className="text-sm font-bold">${progress.spent.toLocaleString()} / ${progress.limit.toLocaleString()}</p>
                      </div>
                      <span className={`text-[10px] font-bold ${progress.percent > 90 ? 'text-red-500' : 'text-[#5A5A40]/60'}`}>
                        {Math.round(progress.percent)}%
                      </span>
                    </div>
                    <div className="h-2 bg-[#F5F5F0] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percent}%` }}
                        className={`h-full ${progress.percent > 90 ? 'bg-red-500' : 'bg-[#5A5A40]'}`}
                      />
                    </div>
                  </div>
                );
              })}
              {budgets.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-[#5A5A40]/40 italic mb-4">No budgets set yet.</p>
                  <button 
                    onClick={() => setIsManagingBudgets(true)}
                    className="text-[#5A5A40] text-xs font-bold uppercase tracking-widest underline underline-offset-4"
                  >
                    Set a budget
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-3xl font-bold">New Entry</h3>
                <button onClick={() => setIsAdding(false)} className="text-[#5A5A40]/40 hover:text-[#5A5A40]">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddEntry} className="space-y-6">
                <div className="flex bg-[#F5F5F0] p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setNewEntry({ ...newEntry, type: 'expense' })}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${newEntry.type === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-[#5A5A40]/40'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntry({ ...newEntry, type: 'income' })}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${newEntry.type === 'income' ? 'bg-white text-green-500 shadow-sm' : 'text-[#5A5A40]/40'}`}
                  >
                    Income
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Title</label>
                  <input 
                    type="text" 
                    required
                    value={newEntry.title}
                    onChange={e => setNewEntry({ ...newEntry, title: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                    placeholder="What was it for?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Amount ($)</label>
                    <input 
                      type="number" 
                      required
                      value={isNaN(newEntry.amount as number) || newEntry.amount === 0 ? '' : newEntry.amount}
                      onChange={e => setNewEntry({ ...newEntry, amount: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Date</label>
                    <input 
                      type="date" 
                      value={newEntry.date}
                      onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-2 ml-2">Category</label>
                  <select 
                    value={newEntry.category}
                    onChange={e => setNewEntry({ ...newEntry, category: e.target.value })}
                    className="w-full bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#5A5A40] text-white py-5 rounded-full font-bold uppercase tracking-widest shadow-lg shadow-[#5A5A40]/20 flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Save Entry
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Categories Modal */}
      <AnimatePresence>
        {isManagingCategories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-3xl font-bold">Categories</h3>
                <button onClick={() => setIsManagingCategories(false)} className="text-[#5A5A40]/40 hover:text-[#5A5A40]">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="flex gap-2 mb-8">
                <input 
                  type="text" 
                  value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="New category..."
                  className="flex-1 bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                />
                <button type="submit" className="bg-[#5A5A40] text-white p-4 rounded-2xl">
                  <Plus size={24} />
                </button>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="font-bold text-sm">{category.name}</span>
                    </div>
                    <button 
                      onClick={async () => {
                        await deleteDoc(doc(db, 'categories', category.id));
                      }}
                      className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Budgets Modal */}
      <AnimatePresence>
        {isManagingBudgets && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-3xl font-bold">Budgets</h3>
                <button onClick={() => setIsManagingBudgets(false)} className="text-[#5A5A40]/40 hover:text-[#5A5A40]">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddBudget} className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={newBudget.category}
                    onChange={e => setNewBudget({ ...newBudget, category: e.target.value })}
                    className="bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    value={newBudget.limit || ''}
                    onChange={e => setNewBudget({ ...newBudget, limit: Number(e.target.value) })}
                    placeholder="Limit ($)"
                    className="bg-[#F5F5F0] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#5A5A40]/20"
                  />
                </div>
                <button type="submit" className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold uppercase tracking-widest">
                  Set Budget
                </button>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {budgets.map(budget => (
                  <div key={budget.id} className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl">
                    <div>
                      <p className="font-bold text-sm">{budget.category}</p>
                      <p className="text-[10px] text-[#5A5A40]/60 uppercase tracking-widest">${budget.limit.toLocaleString()} / {budget.period}</p>
                    </div>
                    <button 
                      onClick={async () => {
                        await deleteDoc(doc(db, 'budgets', budget.id));
                      }}
                      className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
