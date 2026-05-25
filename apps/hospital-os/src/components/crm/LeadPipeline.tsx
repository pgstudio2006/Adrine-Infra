import React from 'react';
import { motion } from 'framer-motion';

interface LeadStage {
  id: string;
  label: string;
  count: number;
  color: string;
}

interface LeadPipelineProps {
  stages: LeadStage[];
}

export const LeadPipeline: React.FC<LeadPipelineProps> = ({ stages }) => {
  const totalLeads = stages.reduce((acc, stage) => acc + stage.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-1 h-32 pt-4">
        {stages.map((stage, i) => {
          const heightPercent = (stage.count / totalLeads) * 100;
          return (
            <div key={stage.id} className="flex-1 flex flex-col items-center group relative">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: "circOut" }}
                className={`w-full max-w-[40px] rounded-t-sm relative transition-all duration-300 group-hover:brightness-125`}
                style={{ backgroundColor: stage.color }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest text-foreground">
                  {stage.count}
                </div>
                {/* Gloss effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-30" />
              </motion.div>
              <div className="mt-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-foreground">
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-8">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center justify-between p-3 border border-border/40 rounded-sm bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stage.label}</span>
            </div>
            <span className="text-xs font-black">{stage.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
