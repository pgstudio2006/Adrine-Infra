interface PlatformEmptyStateProps {
  title?: string;
  message: string;
}

export function PlatformEmptyState({
  title = 'No data yet',
  message,
}: PlatformEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
