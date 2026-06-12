import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

interface RolePlaceholderProps {
  title: string;
  subtitle?: string;
}

export default function RolePlaceholder({ title, subtitle }: RolePlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mb-6 shadow-sm">
        <Construction className="w-8 h-8 text-background" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2 text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        {subtitle ?? 'This module is currently under construction.'}
      </p>
      <div className="mt-8 px-5 py-2 rounded-full border border-border bg-background text-xs text-foreground font-medium uppercase tracking-widest">
        Coming soon
      </div>
    </motion.div>
  );
}
