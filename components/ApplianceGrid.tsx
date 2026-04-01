
import React, { useState } from 'react';
import { Appliance } from '../types';

interface ApplianceGridProps {
  appliances: Appliance[];
  values: Record<string, number>;
  onChange: (id: string, count: number) => void;
  onAddCustom: (name: string, watts: number) => void;
}

const ApplianceGrid: React.FC<ApplianceGridProps> = ({ appliances, values, onChange, onAddCustom }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWatts, setCustomWatts] = useState('');

  const handleAdd = () => {
    if (customName && customWatts) {
      onAddCustom(customName, parseInt(customWatts));
      setCustomName('');
      setCustomWatts('');
      setShowCustom(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {appliances.map((app) => (
        <div key={app.id} className="group bg-white dark:bg-slate-900 border border-solar-secondary/10 dark:border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between hover:shadow-xl hover:shadow-solar-light/30 dark:hover:shadow-solar/10 transition-all duration-300">
          <div className="flex items-center space-x-4">
            <span className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-110">{app.icon}</span>
            <div>
              <h4 className="text-base font-bold text-slate-950 dark:text-white group-hover:text-solar-secondary dark:group-hover:text-solar-secondary transition-colors">{app.name}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{app.watts}W</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => onChange(app.id, Math.max(0, (values[app.id] || 0) - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-500 shadow-sm transition-all"
            >
              -
            </button>
            <span className="w-6 text-center text-sm font-bold text-slate-950 dark:text-white">
              {values[app.id] || 0}
            </span>
            <button
              type="button"
              onClick={() => onChange(app.id, (values[app.id] || 0) + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-solar-secondary dark:bg-solar-secondary text-white shadow-md active:scale-90 transition-all"
            >
              +
            </button>
          </div>
        </div>
      ))}

      {/* Add Custom Appliance Area */}
      {!showCustom ? (
        <button 
          onClick={() => setShowCustom(true)}
          className="group border-2 border-dashed border-solar-secondary/20 dark:border-white/10 rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-2 text-solar-secondary dark:text-solar-secondary font-bold text-sm hover:bg-solar-light dark:hover:bg-slate-900/50 hover:border-solar-secondary transition-all"
        >
          <span className="text-3xl group-hover:rotate-90 transition-transform">+</span>
          <span>Add Custom Load</span>
        </button>
      ) : (
        <div className="bg-solar-light/20 dark:bg-slate-900 border border-solar-secondary/30 dark:border-white/10 p-8 rounded-[2.5rem] space-y-4 animate-in zoom-in-95 duration-300 shadow-xl shadow-solar-light/50 dark:shadow-none">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-solar-secondary dark:text-solar-secondary uppercase tracking-widest ml-1">Device Name</label>
            <input 
              type="text" 
              placeholder="e.g. Server Rack" 
              className="w-full text-sm p-3 rounded-xl border border-solar-secondary/20 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-solar-secondary bg-white dark:bg-slate-950 dark:text-white"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-solar-secondary dark:text-solar-secondary uppercase tracking-widest ml-1">Power Usage (Watts)</label>
            <input 
              type="number" 
              placeholder="e.g. 500" 
              className="w-full text-sm p-3 rounded-xl border border-solar-secondary/20 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-solar-secondary bg-white dark:bg-slate-950 dark:text-white"
              value={customWatts}
              onChange={(e) => setCustomWatts(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => setShowCustom(false)}
              className="flex-1 py-3 text-xs font-bold text-solar-secondary dark:text-solar-secondary bg-solar-light/50 dark:bg-slate-800 rounded-xl hover:bg-solar-light transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleAdd}
              className="flex-2 px-6 py-3 bg-solar-secondary text-white font-bold rounded-xl text-xs hover:bg-solar-dark transition-all"
            >
              Add Device
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplianceGrid;
