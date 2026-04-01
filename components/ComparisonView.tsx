
import React from 'react';
import { SolarAnalysis } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ComparisonViewProps {
  savedAnalyses: SolarAnalysis[];
  onRemove: (id: string) => void;
  onView: (analysis: SolarAnalysis) => void;
  onClose: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ savedAnalyses, onRemove, onView, onClose }) => {
  const formatINR = (value: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const title = "UrjaSaarthi - Strategic Comparison Report";
    const date = new Date().toLocaleDateString();

    doc.setFontSize(20);
    doc.setTextColor(15, 111, 92); // #0f6f5c
    doc.text(title, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, 14, 28);

    const metrics = [
      { label: 'System Capacity', key: 'recommendedCapacityKw', suffix: ' kW' },
      { label: 'Avg Monthly Saving', key: 'monthlySavings', prefix: '₹' },
      { label: 'Est Investment', key: 'investmentCost', prefix: '₹' },
      { label: 'ROI Benchmark', key: 'paybackYears', suffix: ' Years' },
      { label: 'Yield Potential', key: 'potentialScore', suffix: '%' },
      { label: 'CO2 Reduction', key: 'co2Reduction', suffix: ' kg' }
    ];

    const head = [['Operational KPIs', ...savedAnalyses.map(a => `${a.input.location} (${a.input.houseType})`)]];
    const body = metrics.map(m => [
      m.label,
      ...savedAnalyses.map(a => {
        const val = (a as any)[m.key];
        return m.prefix ? formatINR(val) : `${val}${m.suffix || ''}`;
      })
    ]);

    (doc as any).autoTable({
      startY: 35,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [15, 111, 92], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [231, 241, 239] },
      margin: { top: 35 },
      styles: { font: 'helvetica', fontSize: 9 }
    });

    doc.save(`urjasaarthi-comparison-${Date.now()}.pdf`);
  };

  if (savedAnalyses.length === 0) {
    return (
      <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border border-solar-light dark:border-white/5 shadow-sm">
        <div className="text-4xl mb-6">📉</div>
        <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-8">No comparative data found</p>
        <button onClick={onClose} className="px-10 py-4 bg-solar text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-solar-light/50 dark:shadow-none transition-all hover:bg-solar-dark">
          Analyze a Scenario
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between px-2 gap-4">
        <div>
          <h2 className="text-3xl font-syne font-extrabold text-slate-900 dark:text-white italic">Project Comparison <span className="text-solar dark:text-solar-accent italic">Matrix</span></h2>
          <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Evaluate across multiple energy profiles</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-6 py-3 bg-solar text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md hover:bg-solar-dark transition-all"
          >
            <span>📥</span> Export as PDF
          </button>
          <button onClick={onClose} className="text-[10px] font-black text-slate-400 dark:text-slate-600 hover:text-solar dark:hover:text-solar-accent transition-colors uppercase tracking-[0.3em]">
            Exit Board
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[3rem] border border-solar-light dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-solar-light/50 dark:bg-slate-950/50">
              <th className="p-8 text-solar-dark dark:text-solar-accent font-extrabold uppercase tracking-widest text-[11px] border-b border-solar-light dark:border-white/5">Operational KPIs</th>
              {savedAnalyses.map(a => (
                <th key={a.id} className="p-8 min-w-[280px] border-b border-solar-light dark:border-white/5 border-l border-solar-light dark:border-white/5">
                  <div className="space-y-2">
                    <h4 className="text-lg font-syne font-bold text-slate-950 dark:text-white leading-tight">{a.input.location}</h4>
                    <p className="text-[10px] text-solar dark:text-solar-accent font-black uppercase tracking-widest">{a.input.houseType}</p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xs text-slate-500">
            {[
              { label: 'System Capacity', key: 'recommendedCapacityKw', suffix: ' kW' },
              { label: 'Avg Monthly Saving', key: 'monthlySavings', prefix: '₹' },
              { label: 'Est Investment', key: 'investmentCost', prefix: '₹' },
              { label: 'ROI Benchmark', key: 'paybackYears', suffix: ' Years' },
              { label: 'Yield Potential', key: 'potentialScore', suffix: '%' },
              { label: 'Annual CO2 Reduction', key: 'co2Reduction', suffix: ' kg' }
            ].map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-solar-light/20 dark:bg-slate-950/30'}>
                <td className="p-6 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">{row.label}</td>
                {savedAnalyses.map(a => {
                  const val = (a as any)[row.key];
                  const display = row.prefix ? formatINR(val) : `${val}${row.suffix || ''}`;
                  return (
                    <td key={a.id} className="p-6 font-extrabold text-slate-950 dark:text-white border-l border-solar-light/50 dark:border-white/5 text-sm">
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-stone-50/50 dark:bg-slate-950/50">
              <td className="p-8"></td>
              {savedAnalyses.map(a => (
                <td key={a.id} className="p-8 border-l border-solar-light dark:border-white/5">
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => onView(a)}
                      className="w-full py-4 bg-solar dark:bg-solar text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 text-[10px] uppercase tracking-widest hover:bg-solar-dark"
                    >
                      View Full Report
                    </button>
                    <button 
                      onClick={() => onRemove(a.id)}
                      className="w-full py-3 bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 font-bold rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-rose-100 dark:border-rose-900/30"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonView;
