import React from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

interface SentimentIndicatorProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
}

export const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({ score, size = 'md' }) => {
  const getIcon = () => {
    if (score >= 70) return Smile;
    if (score >= 40) return Meh;
    return Frown;
  };

  const getColor = () => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const Icon = getIcon();
  const colorClass = getColor();

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <div className={`flex items-center gap-1.5 ${colorClass}`}>
      <Icon className={sizeClasses[size]} strokeWidth={2.5} />
      <span className="text-[10px] font-black uppercase tracking-widest">{score}%</span>
    </div>
  );
};
