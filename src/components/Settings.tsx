import { useState } from 'react';
import { auth, db, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Link2, 
  Shield, 
  Bell, 
  Smartphone,
  Github,
  Save,
  LogOut
} from 'lucide-react';

interface SettingsProps {
  profile: UserProfile | null;
}

export default function Settings({ profile }: SettingsProps) {
  const [partnerEmail, setPartnerEmail] = useState(profile?.partnerUid || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const userDoc = doc(db, 'users', profile.uid);
      await updateDoc(userDoc, {
        partnerUid: partnerEmail
      });
      alert("Settings saved!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">System Configuration</p>
        <h1 className="font-serif text-4xl font-bold">Settings</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <section className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-[#1a1a1a]/5 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-[#5A5A40]/5 rounded-2xl flex items-center justify-center text-[#5A5A40]">
              <User size={32} />
            </div>
            <div>
              <h3 className="font-bold text-xl">{profile?.displayName}</h3>
              <p className="text-sm text-[#5A5A40]/60">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 ml-2">Partner's UID / Email</label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40" size={20} />
                <input
                  type="text"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="Enter partner's UID"
                  className="w-full bg-[#F5F5F0]/50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-[#5A5A40]/20 font-medium"
                />
              </div>
              <p className="text-[10px] text-[#5A5A40]/40 ml-2 italic">Linking allows shared access to tasks and finances.</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#4A4A35] transition-all shadow-lg shadow-[#5A5A40]/20 flex items-center justify-center gap-2"
          >
            {saving ? "Saving..." : <><Save size={20} /> Save Changes</>}
          </button>
        </section>

        {/* App Info & GitHub */}
        <section className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-[#1a1a1a]/5 space-y-6">
            <h3 className="font-serif text-2xl font-bold">App Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F5F5F0]/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Smartphone size={20} className="text-[#5A5A40]/60" />
                  <span className="font-medium">Version</span>
                </div>
                <span className="text-xs font-bold text-[#5A5A40]/40">1.0.0 (PWA)</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F5F5F0]/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-[#5A5A40]/60" />
                  <span className="font-medium">Security</span>
                </div>
                <span className="text-xs font-bold text-green-500">Firestore Protected</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-8 rounded-[32px] text-white shadow-xl shadow-black/20 space-y-6">
            <div className="flex items-center gap-3">
              <Github size={24} />
              <h3 className="font-serif text-2xl font-bold">GitHub Repository</h3>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              To upload this project to your GitHub, use the <strong>"Export to GitHub"</strong> feature in the AI Studio settings menu. This will create a repository with all the source code, including the Firebase integration.
            </p>
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Instructions</p>
              <ol className="text-xs text-white/60 space-y-2 list-decimal ml-4">
                <li>Open the <strong>Settings</strong> menu in AI Studio (top right).</li>
                <li>Select <strong>"Export to GitHub"</strong>.</li>
                <li>Connect your GitHub account and choose a repository name.</li>
                <li>Your "Life OS" will be live on GitHub!</li>
              </ol>
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={() => auth.signOut()}
          className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-sm hover:bg-red-50 px-6 py-3 rounded-2xl transition-all"
        >
          <LogOut size={20} /> Sign Out of Life OS
        </button>
      </div>
    </div>
  );
}
