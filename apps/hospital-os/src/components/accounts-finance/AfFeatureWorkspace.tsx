import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAfFeatureRows } from '@/lib/accounts-finance/demo-data';
import type { AfSectionId } from '@/lib/accounts-finance/sections';

type Props = {
  sectionId: AfSectionId;
  features: string[];
};

const statusClass: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-700',
  Pending: 'bg-amber-500/10 text-amber-700',
  Completed: 'bg-blue-500/10 text-blue-700',
};

export function AfFeatureWorkspace({ sectionId, features }: Props) {
  const [query, setQuery] = useState('');
  const defaultTab = features[0] ?? 'Overview';
  const [activeTab, setActiveTab] = useState(defaultTab);

  const rows = useMemo(
    () => getAfFeatureRows(sectionId, activeTab),
    [sectionId, activeTab],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [query, rows]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1">
          {features.map((feature) => (
            <TabsTrigger
              key={feature}
              value={feature}
              className="text-[11px] px-2.5 py-1.5 data-[state=active]:bg-background"
            >
              {feature}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search records…"
              className="h-8 pl-8 w-48 text-xs"
            />
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" className="h-8 gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> New
          </Button>
        </div>
      </div>

      {features.map((feature) => (
        <TabsContent key={feature} value={feature} className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{feature}</p>
                <p className="text-[11px] text-muted-foreground">
                  Operational workspace — demo data for Vercel showcase
                </p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {filtered.length} records
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-mono">{row.id}</TableCell>
                    <TableCell className="text-xs">{row.name}</TableCell>
                    <TableCell className="text-xs font-medium tabular-nums">{row.amount}</TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          statusClass[row.status] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.date}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
