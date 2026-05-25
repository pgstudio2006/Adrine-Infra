import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Wifi, AlertCircle, X } from 'lucide-react';

interface QueueEntry {
  tokenNo: number;
  uhid: string;
  patientName: string;
  doctor: string;
  department: string;
  status: string;
}

interface OPDTVDisplayProps {
  queues: Record<string, QueueEntry[]>;
  avgWait: string;
  onClose: () => void;
}

export const OPDTVDisplay: React.FC<OPDTVDisplayProps> = ({ queues, avgWait, onClose }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalWaiting = Object.values(queues).flat().filter(q => q.status === 'waiting' || q.status === 'called').length;

  return (
    <div className="fixed inset-0 bg-black text-white z-50 overflow-hidden font-sans select-none">
      {/* Dynamic Background Noise */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* Header Bar */}
      <header className="h-24 bg-white/5 border-b border-white/10 flex items-center justify-between px-12 relative z-10">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Hospital Administration</span>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Adrine <span className="text-white/40">OPD Hub</span></h1>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Avg Wait Time</span>
               <span className="text-xl font-black text-white">{avgWait}</span>
             </div>
             <div className="flex flex-col ml-4">
               <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Total Waiting</span>
               <span className="text-xl font-black text-success">{totalWaiting}</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-12 text-right">
           <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tighter tabular-nums">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
           </div>
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
           >
             <X className="w-4 h-4" />
           </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="p-10 h-[calc(100vh-160px)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 h-full">
          {Object.entries(queues).map(([dept, entries], idx) => {
            const serving = entries.find(q => q.status === 'in-consultation');
            const next = entries.find(q => q.status === 'called');
            const waiting = entries.filter(q => q.status === 'waiting');

            return (
              <motion.div 
                key={dept}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              >
                {/* Dept Header */}
                <div className="p-6 border-b border-white/5 bg-white/5">
                   <h2 className="text-xl font-black uppercase tracking-tighter text-white/90 truncate">{dept}</h2>
                   <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Active Queue</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-black">{entries.length}</span>
                   </div>
                </div>

                {/* Now Serving - Massive Typography */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-transparent to-white/[0.01]">
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-success/60 mb-2">Now Serving</span>
                   <AnimatePresence mode="wait">
                     <motion.div 
                       key={serving?.tokenNo || '---'}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       className="text-9xl font-black tracking-tighter text-white leading-none tabular-nums"
                     >
                        {serving?.tokenNo || '---'}
                     </motion.div>
                   </AnimatePresence>
                   <p className="mt-4 text-sm font-bold text-white/50 uppercase tracking-widest">{serving?.patientName || 'Waiting...'}</p>
                </div>

                {/* Footer: Next Up */}
                <div className="p-6 bg-white/5 space-y-4">
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Next Up</span>
                        <div className="flex items-center gap-3">
                           <span className="text-2xl font-black text-success tabular-nums">{next?.tokenNo || '--'}</span>
                           <span className="text-xs font-bold text-white/70 uppercase truncate max-w-[120px]">{next?.patientName || 'No appointments'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Room</span>
                         <span className="text-lg font-black text-white/80">0{idx + 1}</span>
                      </div>
                   </div>

                   {/* Waiting Ticker */}
                   <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Waiting:</span>
                      <div className="flex gap-2 overflow-hidden">
                         {waiting.slice(0, 5).map(w => (
                           <span key={w.tokenNo} className="text-xs font-bold text-white/40 font-mono tracking-tighter">{w.tokenNo}</span>
                         ))}
                         {waiting.length > 5 && <span className="text-[10px] text-white/10 font-black">+ {waiting.length - 5}</span>}
                      </div>
                   </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Footer Ticker */}
      <footer className="h-16 bg-success/10 border-t border-success/20 flex items-center px-12 relative z-10 overflow-hidden">
         <div className="flex items-center gap-4 text-success mr-12 whitespace-nowrap">
            <Wifi className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live System Feed</span>
         </div>
         <div className="flex-1 overflow-hidden relative">
            <motion.div 
              animate={{ x: [-1000, 0] }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="whitespace-nowrap flex gap-16 text-[11px] font-bold text-success/80 uppercase tracking-widest"
            >
               <span>• PLEASE KEEP YOUR TOKEN SLIPS READY FOR CONSULTATION</span>
               <span>• DR. R. MEHTA (CARDIOLOGY) IS CURRENTLY ON EMERGENCY CASE</span>
               <span>• AVERAGE CONSULTATION TIME IS 12 MINUTES PER PATIENT</span>
               <span>• DOWNLOAD OUR APP FOR REAL-TIME PHONE NOTIFICATIONS</span>
            </motion.div>
         </div>
      </footer>
    </div>
  );
};
