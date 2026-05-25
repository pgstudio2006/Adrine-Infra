import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { OtPlatformStrip } from '@/components/operations/OtPlatformStrip';
import { InventoryPlatformStrip } from '@/components/operations/InventoryPlatformStrip';
import { DialysisPlatformStrip } from '@/components/operations/DialysisPlatformStrip';

export type OperationsModule = 'ot' | 'inventory' | 'dialysis';
export type OperationsLayout = 'dashboard' | 'board' | 'list' | 'detail';

type Props = {
  module: OperationsModule;
  title: string;
  subtitle?: string;
  layout?: OperationsLayout;
  /** Show platform connectivity once at page top (default: dashboard + board only). */
  showConnectivity?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function ConnectivityStrip({ module }: { module: OperationsModule }) {
  switch (module) {
    case 'ot':
      return <OtPlatformStrip />;
    case 'inventory':
      return <InventoryPlatformStrip />;
    default:
      return <DialysisPlatformStrip />;
  }
}

export function OperationsModulePage({
  module,
  title,
  subtitle,
  layout = 'list',
  showConnectivity,
  actions,
  children,
}: Props) {
  const strip =
    showConnectivity ?? (layout === 'dashboard' || layout === 'board');

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {strip && (
        <motion.div variants={item}>
          <ConnectivityStrip module={module} />
        </motion.div>
      )}
      <motion.div variants={item} className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
      </motion.div>
      <motion.div variants={item}>{children}</motion.div>
    </motion.div>
  );
}
