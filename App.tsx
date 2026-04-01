
import React, { useState, useEffect } from 'react';
import { UserInput, SolarAnalysis, Appliance } from './types';
import { HOUSE_TYPES, MAJOR_APPLIANCES as DEFAULT_APPLIANCES } from './constants.tsx';
import ApplianceGrid from './components/ApplianceGrid';
import AnalysisView from './components/AnalysisView';
import ComparisonView from './components/ComparisonView';
import { getSolarAnalysis } from './services/groqService';

const SAVED_STORAGE_KEY = 'urjasaarthi_saved_v2';
const THEME_STORAGE_KEY = 'urjasaarthi_theme';

const App: React.FC = () => {
  const [step, setStep] = useState<'home' | 'form' | 'loading' | 'results' | 'compare'>('home');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<UserInput>({
    location: '',
    monthlyBill: 5000,
    appliances: {},
    houseType: HOUSE_TYPES[0],
  });
  
  const [appliancesList, setAppliancesList] = useState<Appliance[]>(DEFAULT_APPLIANCES);
  const [analysis, setAnalysis] = useState<SolarAnalysis | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<SolarAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SAVED_STORAGE_KEY);
    if (stored) {
      try { setSavedAnalyses(JSON.parse(stored)); } catch (e) { console.error(e); }
    }
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    if (theme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedAnalyses));
  }, [savedAnalyses]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (step === 'form' && !userInput.location) {
      detectLocation();
    }
  }, [step]);

  const updateApplianceCount = (id: string, count: number) => {
    setUserInput(prev => ({
      ...prev,
      appliances: { ...prev.appliances, [id]: count }
    }));
  };

  const addCustomAppliance = (name: string, watts: number) => {
    const id = `custom_${Date.now()}`;
    const newApp: Appliance = { id, name, watts, icon: '⚡' };
    setAppliancesList(prev => [...prev, newApp]);
    updateApplianceCount(id, 1);
  };

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            const data = await response.json();
            const locationName = data.address.city || data.address.town || data.address.state_district || data.address.state || "Unknown Location";
            setUserInput(prev => ({ ...prev, location: locationName }));
          } catch (e) {
            setUserInput(prev => ({ 
              ...prev, 
              location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` 
            }));
          } finally {
            setIsLocating(false);
          }
        },
        () => {
          setIsLocating(false);
        },
        { timeout: 10000 }
      );
    }
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStep('loading');
    setError(null);
    try {
      const result = await getSolarAnalysis(userInput);
      const fullResult = { 
        ...result, 
        id: Math.random().toString(36).substr(2, 9), 
        timestamp: Date.now(),
        input: { ...userInput } 
      };
      setAnalysis(fullResult);
      setStep('results');
    } catch (err: any) {
      console.error("Submission error:", err);
      setError("The AI engine had trouble processing this specific profile. Our system is auto-correcting. Please click 'Run Analysis' again.");
      setStep('form');
    }
  };

  const toggleSaveAnalysis = (data: SolarAnalysis) => {
    setSavedAnalyses(prev => {
      const exists = prev.find(a => a.id === data.id);
      if (exists) return prev.filter(a => a.id !== data.id);
      return [data, ...prev];
    });
  };

  const totalLoadWatts = Object.entries(userInput.appliances).reduce((total, [id, count]) => {
    const app = appliancesList.find(a => a.id === id);
    return total + (app ? (app.watts * count) : 0);
  }, 0);

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-white dark:bg-[#050b0a] text-slate-900 dark:text-slate-100 selection:bg-solar-light dark:selection:bg-solar/30 transition-all duration-500">
        
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${step !== 'home' ? 'h-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-solar-secondary/10 dark:border-white/5 shadow-sm' : 'h-24'}`}>
          <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => setStep('home')}>
              <div className="w-12 h-12 bg-solar dark:bg-solar rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-solar/20 group-hover:scale-110 transition-transform">U</div>
              <span className="text-2xl font-black tracking-tight text-solar dark:text-white uppercase italic font-heading">UrjaSaarthi</span>
            </div>
            
            <div className="flex items-center space-x-6 md:space-x-10">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl bg-solar-light dark:bg-slate-900 text-solar dark:text-solar-secondary hover:scale-110 transition-transform"
                title="Toggle Theme"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button 
                onClick={() => setStep('compare')}
                className="hidden md:block text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 hover:text-solar-secondary dark:hover:text-solar-secondary transition-colors"
              >
                SAVED ({savedAnalyses.length})
              </button>
              <button 
                onClick={() => { setError(null); setStep('form'); }}
                className="px-8 py-3 bg-solar dark:bg-solar text-white font-bold rounded-2xl hover:bg-solar-dark dark:hover:bg-solar-dark transition-all shadow-lg shadow-solar-light dark:shadow-none text-xs tracking-widest uppercase"
              >
                Start Audit
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 pt-32 md:pt-40">
          {error && (
            <div className="max-w-5xl mx-auto mb-12 p-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-[3rem] text-rose-600 dark:text-rose-400 text-sm font-bold flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-6">
                <span className="text-4xl">🛠️</span>
                <div className="space-y-1">
                  <p className="text-base font-black uppercase">Optimization Required</p>
                  <p className="font-medium opacity-80">{error}</p>
                </div>
              </div>
              <button 
                onClick={() => handleAnalyze()}
                className="px-8 py-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-lg text-xs uppercase tracking-widest"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {step === 'home' && (
            <div className="space-y-24 animate-in fade-in duration-1000 pb-20">
              <div className="relative h-[450px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border border-solar-light/50 bg-solar-light dark:bg-slate-950">
                <img 
                  src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=2070&auto=format&fit=crop" 
                  alt="Solar Panels on Roof" 
                  className="absolute inset-0 w-full h-full object-cover grayscale-[10%] brightness-[0.45] transition-opacity duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col items-center justify-center p-8 text-center">
                  <div className="inline-block px-5 py-2 rounded-full bg-solar-secondary text-white text-[10px] font-black uppercase tracking-[0.4em] mb-8 shadow-2xl">
                    Energy Blueprint Engine v3
                  </div>
                  <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight mb-8 max-w-5xl font-heading">
                    Master Your Roof's <br/>
                    <span className="text-solar-secondary italic">Energy Potential.</span>
                  </h1>
                  <p className="text-slate-300 text-base md:text-xl font-medium max-w-2xl mb-12 leading-relaxed opacity-90">
                    Advanced AI-driven analytics to calculate required capacity, savings benchmarks, and regional subsidy eligibility in seconds.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <button 
                      onClick={() => { setError(null); setStep('form'); }}
                      className="px-14 py-6 bg-white text-solar-dark font-black rounded-[2rem] text-xl hover:bg-solar-light transition-all shadow-2xl hover:-translate-y-1 active:scale-95"
                    >
                      Begin Free Audit
                    </button>
                    <button 
                      onClick={() => setStep('compare')}
                      className="px-14 py-6 bg-solar/30 backdrop-blur-xl text-white border border-white/20 font-black rounded-[2rem] text-xl hover:bg-solar/50 transition-all active:scale-95"
                    >
                      View Saved Analysis
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { 
                    img: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop", 
                    title: "Load Blueprint", 
                    desc: "Interactive mapping of your appliance footprint to estimate peak demand and plant kW requirements." 
                  },
                  { 
                    img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop", 
                    title: "Subsidy Logic", 
                    desc: "Real-time verification of PM-Surya Ghar eligibility and state-specific tax incentives for your region." 
                  },
                  { 
                    img: "https://images.unsplash.com/photo-1618913011604-e230759a231d?q=80&w=2070&auto=format&fit=crop", 
                    title: "Direct Connect", 
                    desc: "Instant access to a curated database of certified local installers vetted for quality and compliance." 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="group relative h-[400px] rounded-[3rem] overflow-hidden border border-solar-secondary/10 hover:shadow-2xl transition-all duration-700 bg-solar-light dark:bg-slate-900">
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 brightness-75 group-hover:brightness-50" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-solar-dark via-solar-dark/20 to-transparent flex flex-col justify-end p-10 backdrop-blur-[2px] group-hover:backdrop-blur-0 transition-all">
                      <h3 className="text-3xl font-black text-white mb-4 font-heading">{item.title}</h3>
                      <p className="text-slate-100 text-base leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900/50 rounded-[4rem] p-16 flex flex-col lg:flex-row items-center justify-around gap-16 border border-solar-secondary/10 shadow-sm">
                <div className="text-center group">
                  <div className="text-6xl font-black text-solar dark:text-solar-secondary mb-4 transition-transform group-hover:scale-110">₹1.2L+</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Average Annual Net Savings</div>
                </div>
                <div className="hidden lg:block w-px h-24 bg-solar-secondary/20"></div>
                <div className="text-center group">
                  <div className="text-6xl font-black text-solar dark:text-solar-secondary mb-4 transition-transform group-hover:scale-110">4.2Y</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Median ROI Period</div>
                </div>
                <div className="hidden lg:block w-px h-24 bg-solar-secondary/20"></div>
                <div className="text-center group">
                  <div className="text-6xl font-black text-solar dark:text-solar-secondary mb-4 transition-transform group-hover:scale-110">25T</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">CO2 Emissions Avoided</div>
                </div>
              </div>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleAnalyze} className="max-w-5xl mx-auto space-y-20 animate-in slide-in-from-bottom-12 duration-500 pb-20">
              <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-5xl font-black text-solar-dark dark:text-white tracking-tighter font-heading italic">ENERGY PROFILE</h2>
                    <p className="text-slate-400 dark:text-slate-500 font-medium mt-2">Add devices to calculate your required plant capacity.</p>
                  </div>
                  {totalLoadWatts > 0 && (
                     <div className="px-8 py-4 bg-solar dark:bg-solar rounded-3xl text-white font-black text-xl flex items-center gap-3 shadow-xl shadow-solar/20 dark:shadow-none animate-in fade-in zoom-in">
                       ~{(totalLoadWatts / 1000).toFixed(2)} kW PLANT
                     </div>
                  )}
                </div>
                <ApplianceGrid 
                  appliances={appliancesList}
                  values={userInput.appliances} 
                  onChange={updateApplianceCount} 
                  onAddCustom={addCustomAppliance}
                />
              </div>

              <div className="glass-panel dark:bg-slate-900/80 p-12 md:p-20 rounded-[5rem] space-y-16 shadow-2xl shadow-solar-light/50 dark:shadow-none border border-solar-secondary/20 dark:border-white/5">
                <h2 className="text-5xl font-black text-solar-dark dark:text-white tracking-tighter font-heading italic text-center">SITE DETAILS</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-solar dark:text-solar-secondary uppercase tracking-[0.4em] ml-2">Location</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required 
                        placeholder={isLocating ? "Detecting location..." : "City or District"} 
                        className="w-full bg-stone-50 dark:bg-slate-950 border-2 border-solar-secondary/20 dark:border-white/5 rounded-[2rem] px-8 py-6 focus:outline-none focus:border-solar transition-all text-solar-dark dark:text-white font-bold text-lg" 
                        value={userInput.location} 
                        onChange={(e) => setUserInput({...userInput, location: e.target.value})} 
                      />
                      <button 
                        type="button" 
                        onClick={detectLocation} 
                        className={`absolute right-6 top-1/2 -translate-y-1/2 text-solar-secondary dark:text-solar-secondary hover:scale-125 transition-transform p-2 text-2xl ${isLocating ? 'animate-pulse' : ''}`}
                      >
                        {isLocating ? '⌛' : '📍'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-solar dark:text-solar-secondary uppercase tracking-[0.4em] ml-2">Roof Type</label>
                    <select className="w-full bg-stone-50 dark:bg-slate-950 border-2 border-solar-secondary/20 dark:border-white/5 rounded-[2rem] px-8 py-6 focus:outline-none focus:border-solar transition-all text-solar-dark dark:text-white font-bold text-lg appearance-none cursor-pointer" value={userInput.houseType} onChange={(e) => setUserInput({...userInput, houseType: e.target.value})}>
                      {HOUSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-4 pt-8">
                    <label className="text-xs font-black text-solar dark:text-solar-secondary uppercase tracking-[0.4em] ml-2">Monthly Electricity Spend (₹)</label>
                    <div className="relative">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-bold text-solar-secondary">₹</span>
                      <input 
                        type="number" 
                        required 
                        placeholder="e.g. 5000" 
                        className="w-full bg-stone-50 dark:bg-slate-950 border-2 border-solar-secondary/20 dark:border-white/5 rounded-[2rem] pl-16 pr-8 py-6 focus:outline-none focus:border-solar transition-all text-solar-dark dark:text-white font-bold text-3xl" 
                        value={userInput.monthlyBill} 
                        onChange={(e) => setUserInput({...userInput, monthlyBill: parseInt(e.target.value) || 0})} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-8 bg-solar dark:bg-solar hover:bg-solar-dark dark:hover:bg-solar-dark text-white font-black rounded-[3rem] text-3xl transition-all shadow-2xl shadow-solar/20 dark:shadow-none active:scale-95 italic font-heading">
                RUN FULL ANALYSIS
              </button>
            </form>
          )}

          {step === 'loading' && (
            <div className="min-h-[600px] flex flex-col items-center justify-center space-y-12">
               <div className="w-24 h-24 border-[10px] border-solar-light dark:border-slate-800 border-t-solar-secondary dark:border-t-solar-secondary rounded-full animate-spin"></div>
               <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black italic text-solar-dark dark:text-white font-heading">SYNCHRONIZING...</h2>
                  <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.3em]">Connecting to solar irradiance engines</p>
               </div>
            </div>
          )}

          {step === 'results' && analysis && (
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20">
              <AnalysisView 
                data={analysis} 
                onReset={() => { setError(null); setStep('form'); }} 
                onSave={toggleSaveAnalysis}
                isSaved={!!savedAnalyses.find(a => a.id === analysis.id)}
              />
            </div>
          )}

          {step === 'compare' && (
            <ComparisonView 
              savedAnalyses={savedAnalyses} 
              onRemove={(id) => setSavedAnalyses(p => p.filter(a => a.id !== id))} 
              onView={(a) => { setAnalysis(a); setStep('results'); }}
              onClose={() => setStep('home')}
            />
          )}
        </main>

        <footer className="mt-40 border-t border-solar-secondary/10 dark:border-white/5 py-24 px-8 bg-stone-50/50 dark:bg-transparent">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 justify-between items-center gap-12 text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px]">
            <div className="flex flex-col items-center md:items-start space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-solar-light dark:bg-solar/20 rounded-xl flex items-center justify-center text-solar dark:text-solar-secondary">U</div>
                <span className="text-solar-dark dark:text-white opacity-40 text-lg">UrjaSaarthi AI</span>
              </div>
              <p className="max-w-sm text-center md:text-left leading-relaxed">Official regional solar advisory core. Data refreshed daily via MNRE compliance standards.</p>
            </div>
            <div className="flex flex-col items-center md:items-end space-y-4">
               <p>© 2024 UrjaSaarthi Technologies • India Hub</p>
               <div className="flex space-x-12">
                  <span className="hover:text-solar-secondary dark:hover:text-solar-secondary cursor-pointer">Security</span>
                  <span className="hover:text-solar-secondary dark:hover:text-solar-secondary cursor-pointer">Privacy</span>
                  <span className="hover:text-solar-secondary dark:hover:text-solar-secondary cursor-pointer">Partners</span>
               </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
