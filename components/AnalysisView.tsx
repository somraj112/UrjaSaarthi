
import React, { useState } from 'react';
import { SolarAnalysis, SubsidyScheme } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface AnalysisViewProps {
  data: SolarAnalysis;
  onReset: () => void;
  onSave: (data: SolarAnalysis) => void;
  isSaved?: boolean;
}

const SubsidyAccordion: React.FC<{ scheme: SubsidyScheme }> = ({ scheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-solar-secondary/20 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none group"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-solar-light dark:bg-solar/20 text-solar dark:text-solar-secondary flex items-center justify-center text-xs font-bold group-hover:bg-solar dark:group-hover:bg-solar-secondary group-hover:text-white transition-colors">
            {isOpen ? '−' : '+'}
          </div>
          <span className="font-bold text-slate-950 dark:text-white text-sm md:text-base">{scheme?.name || 'Solar Scheme'}</span>
        </div>
        <svg 
          className={`w-5 h-5 text-solar-secondary dark:text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 pt-0 space-y-4 border-t border-solar-secondary/10 dark:border-white/5">
          <div>
            <h5 className="text-[10px] font-black text-solar-secondary dark:text-solar-secondary uppercase tracking-widest mb-1">Benefits</h5>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{scheme?.details || 'Details not available.'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-[10px] font-black text-solar-secondary dark:text-solar-secondary uppercase tracking-widest mb-1">Eligibility</h5>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{scheme?.eligibility || 'Standard MNRE criteria.'}</p>
            </div>
            <div>
              <h5 className="text-[10px] font-black text-solar-secondary dark:text-solar-secondary uppercase tracking-widest mb-1">Process</h5>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{scheme?.applicationProcess || 'Apply via national portal.'}</p>
            </div>
          </div>
          <div className="pt-2">
            <a 
              href={scheme?.link || 'https://pmsuryaghar.gov.in'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-bold text-solar-secondary dark:text-solar-secondary hover:text-solar-dark underline underline-offset-4"
            >
              Apply via Official Portal ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalysisView: React.FC<AnalysisViewProps> = ({ data, onReset, onSave, isSaved }) => {
  const formatINR = (value: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

  const treeEquivalent = Math.round((data?.co2Reduction || 0) / 20);
  const envData = [
    { name: 'CO2 Saved (kg)', value: data?.co2Reduction || 0, color: '#0f6f5c' },
    { name: 'Trees Offset', value: treeEquivalent || 0, color: '#2e9b89' },
  ];

  const splitParagraphs = (text: string) => {
    if (!text) return ['Analysis report pending...'];
    return text.split('\n\n').filter(p => p.trim().length > 0);
  };

  const exportReportToPDF = () => {
    const doc = new jsPDF();
    const primaryColor = [15, 111, 92]; // #0f6f5c
    const timestamp = new Date().toLocaleString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("UrjaSaarthi Energy Blueprint", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated for ${data.input.location} on ${timestamp}`, 14, 32);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(50);
    doc.text("Executive Summary", 14, 45);

    const summaryTable = [
      ["Parameter", "Estimated Value"],
      ["System Capacity", `${data.recommendedCapacityKw} kW`],
      ["Estimated Panels", `${data.estimatedPanels} Units`],
      ["Monthly Savings", formatINR(data.monthlySavings)],
      ["Investment Cost", formatINR(data.investmentCost)],
      ["Payback Period", `${data.paybackYears} Years`],
      ["CO2 Reduction", `${data.co2Reduction} kg / year`],
      ["Yield Score", `${data.potentialScore}%`]
    ];

    (doc as any).autoTable({
      startY: 50,
      head: [summaryTable[0]],
      body: summaryTable.slice(1),
      theme: 'striped',
      headStyles: { fillColor: primaryColor },
      styles: { cellPadding: 4 }
    });

    // Subsidies Section
    const nextY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Eligible Government Subsidies", 14, nextY);

    const subsidyTable = [
      ["Scheme Name", "Description"],
      ...data.subsidies.map(s => [s.name, s.details])
    ];

    (doc as any).autoTable({
      startY: nextY + 5,
      head: [subsidyTable[0]],
      body: subsidyTable.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [46, 155, 137] }, // secondary color
      styles: { cellPadding: 3, fontSize: 9 }
    });

    // Strategy Section
    const strategyY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Implementation Strategy", 14, strategyY);
    
    doc.setFontSize(10);
    doc.setTextColor(80);
    const splitText = doc.splitTextToSize(data.detailedAnalysis, 180);
    doc.text(splitText, 14, strategyY + 8);

    doc.save(`urjasaarthi-report-${data.input.location.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-solar dark:bg-solar/30 p-8 md:p-12 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-solar/20 dark:shadow-none relative overflow-hidden group border border-solar-secondary/10 dark:border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-solar-secondary/20 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 group-hover:scale-110 transition-transform"></div>
          <div className="z-10 text-center md:text-left space-y-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">Solar Ready</h2>
              <p className="text-solar-light dark:text-solar-secondary text-lg opacity-90 max-w-sm">Calculated efficiency for your specific roof in {data?.input?.location || 'your area'}.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button 
                onClick={() => onSave(data)}
                className={`px-8 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${
                  isSaved ? 'bg-white text-solar' : 'bg-solar-dark/30 text-white border border-white/20 hover:bg-white hover:text-solar'
                }`}
              >
                {isSaved ? '✓ SAVED' : 'SAVE TO COMPARE'}
              </button>
              <button 
                onClick={exportReportToPDF}
                className="px-8 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest bg-solar-secondary text-white hover:bg-solar-dark transition-all shadow-lg flex items-center gap-2"
              >
                <span>📥</span> DOWNLOAD PDF
              </button>
            </div>
          </div>
          <div className="relative flex items-center justify-center z-10 mt-8 md:mt-0">
             <div className="w-40 h-40 rounded-full border-8 border-white/10 dark:border-solar/10 flex items-center justify-center relative">
               <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                 <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                 <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="8" fill="transparent" 
                   strokeDasharray={452.3}
                   strokeDashoffset={452.3 - (452.3 * ((data?.potentialScore || 0) / 100))}
                   strokeLinecap="round"
                   className="text-white dark:text-solar-secondary transition-all duration-1000 ease-out" 
                 />
               </svg>
               <div className="flex flex-col items-center">
                 <span className="text-4xl font-black">{data?.potentialScore || 0}%</span>
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Potency</span>
               </div>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-solar-secondary/20 dark:border-white/5 p-8 rounded-[3rem] flex flex-col justify-center items-center text-center shadow-lg shadow-solar-light dark:shadow-none">
          <p className="text-xs font-bold text-solar-secondary dark:text-solar-secondary uppercase tracking-[0.3em] mb-4">Total Net Investment</p>
          <p className="text-5xl font-extrabold text-slate-950 dark:text-white tracking-tighter">{formatINR(data?.investmentCost || 0)}</p>
          <div className="mt-8 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-solar-secondary"></span> 
              Approximate cost after tax
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'System Size', value: `${data?.recommendedCapacityKw || 0} kW`, icon: '⚡', color: 'text-solar dark:text-solar-secondary', bg: 'bg-solar-light dark:bg-solar/20' },
          { label: 'Monthly Saving', value: formatINR(data?.monthlySavings || 0), icon: '💰', color: 'text-solar dark:text-solar-secondary', bg: 'bg-solar-light dark:bg-solar/20' },
          { label: 'Payback Time', value: `${data?.paybackYears || 0} Years`, icon: '⏳', color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'CO2 Offset', value: `${data?.co2Reduction || 0} kg`, icon: '🌿', color: 'text-solar dark:text-solar-secondary', bg: 'bg-solar-light dark:bg-solar/20' },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-solar-secondary/10 dark:border-white/5 p-6 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center text-2xl mb-4`}>{item.icon}</div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
            <h4 className={`text-xl font-bold text-slate-950 dark:text-white tracking-tight`}>{item.value}</h4>
          </div>
        ))}
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-solar-secondary/10 dark:border-white/5 p-8 md:p-12 rounded-[3.5rem] shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">Savings Projection</h3>
            <span className="text-xs font-bold text-solar-secondary dark:text-solar-secondary bg-solar-light dark:bg-solar/10 px-3 py-1 rounded-full uppercase">10-Year View</span>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.graphData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="finGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2e9b89" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2e9b89" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-white/5" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #2e9b89' }}
                  itemStyle={{ color: '#0f6f5c' }}
                  formatter={(v: any) => [formatINR(v), 'Cumulative Savings']}
                />
                <Area type="monotone" dataKey="cumulativeSavings" stroke="#2e9b89" strokeWidth={4} fill="url(#finGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-solar-secondary/10 dark:border-white/5 p-8 md:p-12 rounded-[3.5rem] shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">Environmental Impact</h3>
            <span className="text-xs font-bold text-solar-secondary dark:text-solar-secondary bg-solar-light dark:bg-solar/10 px-3 py-1 rounded-full uppercase">Green Metrics</span>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={envData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-white/5" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #2e9b89' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={50}>
                  {envData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-slate-400 dark:text-slate-500 text-sm font-medium">Equal to planting <span className="text-solar-secondary dark:text-solar-secondary font-bold">{treeEquivalent} trees</span> annually.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
        <div className="bg-solar-light/20 dark:bg-slate-900/50 border border-solar-secondary/10 dark:border-white/5 p-8 md:p-12 rounded-[3.5rem] space-y-8 shadow-sm">
          <div>
            <h3 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">Government Schemes</h3>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Click a scheme for eligibility and application details.</p>
          </div>
          <div className="space-y-4">
            {(data?.subsidies || []).map((scheme, i) => (
              <SubsidyAccordion key={i} scheme={scheme} />
            ))}
          </div>
          <div className="pt-4">
            <a 
              href="https://pmsuryaghar.gov.in" 
              target="_blank" 
              className="inline-flex items-center justify-center w-full p-5 bg-solar dark:bg-solar text-white font-bold rounded-2xl hover:bg-solar-dark transition-all group shadow-lg shadow-solar-light dark:shadow-none"
            >
              PM Surya Ghar National Portal <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight px-2">Verified Solar Partners</h3>
          <div className="grid gap-4">
            {(data?.localProviders || []).map((provider, i) => (
              <a 
                key={i} 
                href={provider?.url || '#'} 
                target="_blank" 
                className="flex items-center justify-between p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-solar-secondary/10 dark:border-white/5 hover:border-solar-secondary dark:hover:border-solar-secondary hover:shadow-lg hover:shadow-solar-light dark:hover:shadow-solar/20 transition-all group"
              >
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-950 dark:text-white group-hover:text-solar-secondary dark:group-hover:text-solar-secondary transition-colors">{provider?.name || 'Local Expert'}</h5>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{provider?.description || 'Installation services.'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-solar-light dark:bg-slate-800 text-solar-secondary dark:text-solar-secondary flex items-center justify-center group-hover:bg-solar group-hover:text-white transition-all">
                  <span className="text-lg">↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-stone-50 dark:bg-slate-900/30 p-10 rounded-[4rem] text-center border border-solar-secondary/10 dark:border-white/5">
        <h3 className="text-2xl font-bold text-slate-950 dark:text-white mb-6">Strategic Summary</h3>
        <div className="max-w-3xl mx-auto text-slate-600 dark:text-slate-400 leading-relaxed font-medium space-y-4">
          {splitParagraphs(data?.detailedAnalysis).map((p, i) => <p key={i}>{p.trim()}</p>)}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onReset}
            className="px-12 py-4 bg-white dark:bg-slate-800 text-solar-secondary dark:text-solar-secondary font-bold border border-solar-secondary/20 dark:border-white/5 rounded-2xl hover:bg-solar-light dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            Start New Audit
          </button>
          <button
            onClick={exportReportToPDF}
            className="px-12 py-4 bg-solar-secondary text-white font-bold rounded-2xl hover:bg-solar-dark transition-all shadow-lg"
          >
            Export as PDF Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
