/**
 * DenseTable — modern data-dense table for hospital lists.
 * Sticky header, column visibility, inline row actions, keyboard-scannable.
 */
import { ReactNode, useMemo, useState } from 'react';
import { Columns3, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from './primitives';
import { Inbox } from 'lucide-react';

export type DenseColumn<T> = {
  key: string;
  header: string;
  /** Render cell; defaults to String(row[key]) */
  cell?: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
  /** Hidden by default; user can enable via column menu */
  defaultHidden?: boolean;
  /** Searchable text extractor for the quick filter */
  searchText?: (row: T) => string;
};

export function DenseTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowActions,
  searchable = false,
  searchPlaceholder = 'Filter…',
  maxHeight = 'max-h-[420px]',
  emptyTitle = 'No records',
  emptyDescription,
  className,
}: {
  columns: DenseColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  maxHeight?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)),
  );
  const [query, setQuery] = useState('');

  const visibleColumns = columns.filter((c) => !hidden.has(c.key));

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((c) => {
        const text = c.searchText
          ? c.searchText(row)
          : String((row as Record<string, unknown>)[c.key] ?? '');
        return text.toLowerCase().includes(q);
      }),
    );
  }, [rows, query, columns]);

  const toggleColumn = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {(searchable || columns.some((c) => c.defaultHidden !== undefined)) && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-7 pl-7 text-[12px] bg-transparent"
              />
            </div>
          )}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px] text-muted-foreground">
                  <Columns3 className="h-3.5 w-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-[11px]">Visible columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.key}
                    checked={!hidden.has(c.key)}
                    onCheckedChange={() => toggleColumn(c.key)}
                    className="text-[12px]"
                  >
                    {c.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      <div className={cn('overflow-auto', maxHeight)}>
        {filteredRows.length === 0 ? (
          <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} className="py-8" />
        ) : (
          <table className="w-full text-[12.5px] border-collapse">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border">
                {visibleColumns.map((c) => (
                  <th
                    key={c.key}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn(
                      'px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      (!c.align || c.align === 'left') && 'text-left',
                    )}
                  >
                    {c.header}
                  </th>
                ))}
                {rowActions && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-border/50 last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-accent/40',
                  )}
                >
                  {visibleColumns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'px-3 py-2 align-middle',
                        c.align === 'right' && 'text-right tabular-nums',
                        c.align === 'center' && 'text-center',
                      )}
                    >
                      {c.cell ? c.cell(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-2 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
