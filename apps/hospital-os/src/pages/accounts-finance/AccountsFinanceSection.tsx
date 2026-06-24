import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { AfFeatureWorkspace } from '@/components/accounts-finance/AfFeatureWorkspace';
import { AfKpiGrid } from '@/components/accounts-finance/AfKpiGrid';
import { AF_SECTIONS, resolveAfSectionId } from '@/lib/accounts-finance/sections';

export default function AccountsFinanceSection() {
  const location = useLocation();
  const sectionId = resolveAfSectionId(location.pathname);
  const section = AF_SECTIONS[sectionId];

  if (sectionId === 'dashboard') {
    return null;
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3"
      >
        <div className="rounded-xl bg-emerald-600 text-white p-2.5 shrink-0">
          <section.icon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{section.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{section.subtitle}</p>
        </div>
      </motion.div>

      <AfKpiGrid kpis={section.kpis} />
      <AfFeatureWorkspace sectionId={sectionId} features={section.features} />
    </div>
  );
}
