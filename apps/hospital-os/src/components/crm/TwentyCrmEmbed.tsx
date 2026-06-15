/**
 * Full Twenty CRM workspace embed — entire product, all features.
 * Twenty's own sidebar covers people, companies, opportunities, tasks,
 * notes, workflows, email, calendar, settings, API, etc.
 */
import { useMemo, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTwentyCrmConfig } from '@/hooks/useTwentyCrmConfig';
import { getTwentyFullAppUrl } from '@/lib/twenty/twenty-config';
import { Button } from '@/components/ui/button';

export default function TwentyCrmEmbed() {
  const config = useTwentyCrmConfig();
  const [loaded, setLoaded] = useState(false);

  const src = useMemo(() => {
    if (!config?.baseUrl) return '';
    return getTwentyFullAppUrl(config);
  }, [config]);

  if (!config?.enabled || !src) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm font-medium">Twenty CRM is not configured</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
          Set <code className="text-[11px]">VITE_TWENTY_CRM_URL</code> or enable{' '}
          <code className="text-[11px]">integrations.twentyCrm</code> in tenant settings.
          See <code className="text-[11px]">deploy/twenty/README.md</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col -mx-6 -mb-6" style={{ minHeight: 'calc(100vh - 7.5rem)' }}>
      <div className="flex items-center justify-end gap-2 px-2 py-1.5 shrink-0 border-b border-border/60 bg-muted/20">
        <span className="text-[10px] text-muted-foreground mr-auto pl-2 hidden sm:inline">
          Full Twenty CRM — all objects, workflows &amp; settings
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-[11px]"
          onClick={() => window.open(src, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="h-3 w-3" />
          Open in new tab
        </Button>
      </div>
      <div className="relative flex-1 bg-background" style={{ minHeight: 'calc(100vh - 9rem)' }}>
        <iframe
          title="Twenty CRM — full workspace"
          src={src}
          className="absolute inset-0 w-full h-full border-0"
          allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading Twenty CRM…</p>
          </div>
        )}
      </div>
    </div>
  );
}
