import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, onAuthStateChanged, db, collection, onSnapshot, query, orderBy, doc, setDoc, User } from './firebase';
import { UserProfile, Widget, Task, FinanceEntry, VisionGoal } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wallet, 
  Target, 
  Sparkles, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  Calendar,
  ChevronRight,
  User as UserIcon,
  Flame
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import FinanceTracker from './components/FinanceTracker';
import VisionBoard from './components/VisionBoard';
import HabitTracker from './components/HabitTracker';
import AIBuilder from './components/AIBuilder';
import Settings from './components/Settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const userDoc = doc(db, 'users', user.uid);
        onSnapshot(userDoc, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
            };
            setDoc(userDoc, newProfile);
            setProfile(newProfile);
          }
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => auth.signOut();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#5A5A40] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-xl shadow-black/5"
        >
          <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-8">
            <Sparkles className="text-white w-10 h-10" />
          </div>
          <h1 className="font-serif text-4xl text-[#1a1a1a] mb-4">Life OS</h1>
          <p className="text-[#5A5A40]/70 mb-10 font-sans">
            The central brain for your shared life. Sync tasks, finances, and goals with Zahra.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full bg-[#5A5A40] text-white rounded-full py-4 font-sans font-medium hover:bg-[#4A4A35] transition-colors flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'finance', label: 'Finance', icon: Wallet },
    { id: 'vision', label: 'Vision', icon: Target },
    { id: 'ai', label: 'AI Builder', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans text-[#1a1a1a] pb-24 md:pb-0 md:pl-64">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[#1a1a1a]/5 p-6">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <span className="font-serif text-2xl font-bold">Life OS</span>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20' 
                  : 'text-[#5A5A40]/60 hover:bg-[#5A5A40]/5'
              }`}
            >
              <tab.icon size={20} />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-[#1a1a1a]/5">
          <div className="flex items-center gap-3 mb-6 px-2">
            <img src={profile?.photoURL || undefined} className="w-10 h-10 rounded-full bg-[#5A5A40]/10" alt="Profile" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{profile?.displayName}</p>
              <p className="text-xs text-[#5A5A40]/60 truncate">{profile?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-6 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-bottom border-[#1a1a1a]/5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#5A5A40] w-6 h-6" />
          <span className="font-serif text-xl font-bold">Life OS</span>
        </div>
        <img src={profile?.photoURL || undefined} className="w-10 h-10 rounded-full" alt="Profile" />
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard profile={profile} />}
            {activeTab === 'tasks' && <TaskList profile={profile} />}
            {activeTab === 'habits' && <HabitTracker profile={profile} />}
            {activeTab === 'finance' && <FinanceTracker profile={profile} />}
            {activeTab === 'vision' && <VisionBoard />}
            {activeTab === 'ai' && <AIBuilder />}
            {activeTab === 'settings' && <Settings profile={profile} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-[#1a1a1a]/5 px-6 py-4 flex justify-between items-center z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id ? 'text-[#5A5A40]' : 'text-[#5A5A40]/40'
            }`}
          >
            <tab.icon size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="w-1 h-1 bg-[#5A5A40] rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
