import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'src', 'pages');

const jobs = [
  { file: 'ot/OTTeams.tsx', module: 'ot', title: 'Surgical teams', subtitle: 'Team assignments and roster for today\'s list' },
  { file: 'ot/OTPreOp.tsx', module: 'ot', title: 'Pre-operative preparation', subtitle: 'WHO checklist and patient preparation' },
  { file: 'ot/OTIntraOp.tsx', module: 'ot', title: 'Intraoperative documentation', subtitle: 'Live surgery notes and vitals' },
  { file: 'ot/OTPostOp.tsx', module: 'ot', title: 'Post-operative care', subtitle: 'Recovery handover and PACU tracking' },
  { file: 'ot/OTInventory.tsx', module: 'ot', title: 'OT inventory', subtitle: 'Theatre consumables and implant stock' },
  { file: 'ot/OTReports.tsx', module: 'ot', title: 'Surgical reports', subtitle: 'OT utilization and outcome reports' },
  { file: 'ot/OTAnalytics.tsx', module: 'ot', layout: 'dashboard', title: 'OT analytics', subtitle: 'Turnover, utilization, and delay metrics' },
  { file: 'inventory/InventoryCatalog.tsx', module: 'inventory', title: 'Item catalog', subtitle: 'SKU master and reorder levels' },
  { file: 'inventory/InventoryStockEntry.tsx', module: 'inventory', title: 'Stock entry', subtitle: 'Inbound receipts and supplier GRN' },
  { file: 'inventory/InventoryDistribution.tsx', module: 'inventory', title: 'Stock distribution', subtitle: 'Inter-department transfers' },
  { file: 'inventory/InventoryRequisitions.tsx', module: 'inventory', title: 'Requisitions', subtitle: 'Department requests and approvals' },
  { file: 'inventory/InventoryPurchaseOrders.tsx', module: 'inventory', title: 'Procurement', subtitle: 'Purchase orders and vendor pipeline' },
  { file: 'inventory/InventoryAdjustments.tsx', module: 'inventory', title: 'Stock adjustments', subtitle: 'Variance and correction moves' },
  { file: 'inventory/InventoryEquipment.tsx', module: 'inventory', title: 'Equipment registry', subtitle: 'Assets, calibration, and maintenance' },
  { file: 'inventory/InventoryReports.tsx', module: 'inventory', title: 'Inventory reports', subtitle: 'Consumption and valuation exports' },
];

for (const job of jobs) {
  const fp = path.join(root, job.file);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('OperationsModulePage')) continue;

  const stripImport =
    job.module === 'ot'
      ? "import { OtPlatformStrip } from '@/components/operations/OtPlatformStrip';"
      : "import { InventoryPlatformStrip } from '@/components/operations/InventoryPlatformStrip';";
  src = src.replace(stripImport, "import { OperationsModulePage } from '@/components/operations/OperationsModulePage';");

  const stripLine =
    job.module === 'ot'
      ? /<motion\.div variants=\{item\}><OtPlatformStrip[^/]*\/><\/motion\.div>\s*\n/
      : /<motion\.div variants=\{item\}><InventoryPlatformStrip[^/]*\/><\/motion\.div>\s*\n/;
  src = src.replace(stripLine, '');

  const headerBlock =
    /<motion\.div variants=\{item\} className="flex items-center justify-between">\s*<div>\s*<h1[^>]*>[^<]*<\/h1>\s*<p[^>]*>[^<]*<\/p>\s*<\/div>[\s\S]*?<\/motion\.div>\s*\n/;
  src = src.replace(headerBlock, '');

  const simpleHeader =
    /<motion\.div variants=\{item\}>\s*<h1[^>]*>[^<]*<\/h1>\s*<p[^>]*>[^<]*<\/p>\s*<\/motion\.div>\s*\n/;
  src = src.replace(simpleHeader, '');

  const layout = job.layout ?? 'list';
  const wrapOpen = `    <OperationsModulePage module="${job.module}" layout="${layout}" title="${job.title}" subtitle="${job.subtitle}">\n`;
  src = src.replace(
    /return \(\s*\n\s*<motion\.div className="space-y-6"/,
    `return (\n${wrapOpen}      <motion.div className="space-y-6"`,
  );
  src = src.replace(/\n    <\/motion\.div>\s*\n  \);\s*\n\}/, '\n      </motion.div>\n    </OperationsModulePage>\n  );\n}');

  fs.writeFileSync(fp, src);
  console.log('Updated', job.file);
}
