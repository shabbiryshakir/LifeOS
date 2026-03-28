import { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { db, collection, addDoc, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Layout, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Code,
  Zap
} from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function AIBuilder() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateWidget = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `I want to add a new widget to my Life OS. My request is: "${prompt}".
        
        Generate a JSON configuration for this widget. The output MUST be a valid JSON object with the following structure:
        {
          "type": "counter" | "list" | "finance" | "countdown" | "custom",
          "title": "A descriptive title",
          "config": { ... dynamic properties based on the type ... },
          "order": 10
        }
        
        Example for a water intake tracker:
        {
          "type": "counter",
          "title": "Water Intake",
          "config": { "unit": "glasses", "goal": 8, "color": "blue" },
          "order": 5
        }
        
        Example for a grocery list:
        {
          "type": "list",
          "title": "Groceries",
          "config": { "items": ["Milk", "Bread"], "shared": true },
          "order": 6
        }
        
        ONLY return the JSON object, no markdown formatting or extra text.`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert UI/UX architect for a Life OS application. You generate Server-Driven UI (SDUI) configurations in JSON format."
        }
      });

      const jsonStr = response.text.trim();
      const widgetConfig = JSON.parse(jsonStr);
      setResult(widgetConfig);
    } catch (err) {
      console.error("AI Generation failed", err);
      setError("Failed to generate widget. Please try a different prompt.");
    } finally {
      setLoading(false);
    }
  };

  const saveWidget = async () => {
    if (!result) return;
    try {
      await addDoc(collection(db, 'widgets'), {
        ...result,
        active: true,
        createdAt: new Date().toISOString()
      });
      setResult(null);
      setPrompt('');
      alert("Widget added to your dashboard!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'widgets');
      setError("Failed to save widget to dashboard.");
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#5A5A40]/60 font-medium uppercase tracking-widest text-xs mb-2">AI Customization Engine</p>
          <h1 className="font-serif text-4xl font-bold">AI Builder</h1>
        </div>
        <div className="flex items-center gap-2 text-[#5A5A40] bg-white px-4 py-2 rounded-2xl shadow-sm border border-[#1a1a1a]/5">
          <Zap size={18} className="text-yellow-500 fill-yellow-500" />
          <span className="font-bold text-xs uppercase tracking-widest">Powered by Gemini 3.1 Pro</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <section className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-[#1a1a1a]/5 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#5A5A40]/5 rounded-xl flex items-center justify-center text-[#5A5A40]">
                <Sparkles size={20} />
              </div>
              <h2 className="font-serif text-2xl font-bold">What should we build?</h2>
            </div>
            <p className="text-[#5A5A40]/60 text-sm font-medium leading-relaxed">
              Describe a new feature, tracker, or widget you want to add to your shared Life OS. The AI will design the underlying data structure and UI config instantly.
            </p>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Add a tracker for our daily water intake' or 'Create a section for home renovation budget'"
                className="w-full bg-[#F5F5F0]/50 border-none rounded-2xl py-6 px-6 focus:ring-2 focus:ring-[#5A5A40]/20 font-medium min-h-[150px] resize-none"
              />
              <button
                onClick={generateWidget}
                disabled={loading || !prompt.trim()}
                className="absolute bottom-4 right-4 bg-[#5A5A40] text-white p-4 rounded-2xl hover:bg-[#4A4A35] transition-all shadow-lg shadow-[#5A5A40]/20 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4">
              {['Water Tracker', 'Workout Log', 'Reading List', 'Travel Budget'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(`Add a ${suggestion.toLowerCase()}`)}
                  className="px-4 py-2 bg-[#5A5A40]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 hover:bg-[#5A5A40]/10 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="space-y-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/50 p-12 rounded-[48px] border-2 border-dashed border-[#5A5A40]/10 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-[#5A5A40] border-t-transparent rounded-full mb-6"
                />
                <h3 className="font-serif text-2xl text-[#5A5A40]/40 mb-2">Architecting Widget...</h3>
                <p className="text-[#5A5A40]/40 font-medium">Gemini is designing your new feature.</p>
              </motion.div>
            ) : result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-[#1a1a1a]/5 space-y-8 h-full flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                      <CheckCircle2 size={20} />
                    </div>
                    <h2 className="font-serif text-2xl font-bold">Widget Designed</h2>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-[#5A5A40]/5 rounded-full text-[#5A5A40]/60">
                    Preview Mode
                  </span>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="p-6 bg-[#F5F5F0]/50 rounded-[24px] border border-[#1a1a1a]/5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-xl">{result.title}</h4>
                      <div className="w-10 h-10 bg-[#5A5A40]/10 rounded-xl flex items-center justify-center text-[#5A5A40]">
                        <Layout size={20} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40">Type: {result.type}</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.config).map(([key, val]: [string, any]) => (
                          <span key={key} className="px-3 py-1 bg-white rounded-lg text-xs font-medium border border-[#1a1a1a]/5">
                            {key}: {JSON.stringify(val)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-900 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                      <Code size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Generated Schema</span>
                    </div>
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={saveWidget}
                    className="flex-1 bg-[#5A5A40] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#4A4A35] transition-all shadow-lg shadow-[#5A5A40]/20"
                  >
                    Add to Dashboard
                  </button>
                  <button
                    onClick={() => setResult(null)}
                    className="px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:bg-[#5A5A40]/5 transition-all"
                  >
                    Discard
                  </button>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 p-12 rounded-[48px] border-2 border-dashed border-red-200 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="text-red-500 w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl text-red-900 mb-2">Something went wrong</h3>
                <p className="text-red-600 font-medium max-w-xs">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-8 text-red-900 font-bold uppercase tracking-widest text-sm underline underline-offset-8"
                >
                  Try Again
                </button>
              </motion.div>
            ) : (
              <div className="bg-white/50 p-12 rounded-[48px] border-2 border-dashed border-[#5A5A40]/10 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <div className="w-20 h-20 bg-[#5A5A40]/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Layout className="text-[#5A5A40]/20 w-10 h-10" />
                </div>
                <h3 className="font-serif text-2xl text-[#5A5A40]/40 mb-2">Design Preview</h3>
                <p className="text-[#5A5A40]/40 font-medium">Your AI-generated widget will appear here.</p>
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
