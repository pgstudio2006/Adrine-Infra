/**
 * Full-viewport Twenty CRM embed.
 * Requires Twenty self-hosted with frame-ancestors allowing Hospital OS origin
 * (see deploy/twenty/README.md).
 */
import { useMemo, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTwentyCrmConfig } from '@/hooks/useTwentyCrmConfig';
import { mapHospitalPathToTwenty } from '@/lib/twenty/twenty-config';
import { Button } from '@/components/ui/button';

export default function TwentyCrmEmbed({ hospitalPath }: { hospitalPath: string }) {
  const config = useTwentyCrmConfig();
  const [loaded, setLoaded] = useState(false);

  const src = useMemo(() => {
    if (!config?.baseUrl) return '';
    const twentyPath = mapHospitalPathToTwenty(hospitalPath);
    return `${config.baseUrl}${twentyPath}`;
  }, [config?.baseUrl, hospitalPath]);

  if (!config?.enabled || !src) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm font-medium">Twenty CRM is not configured</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
          Set <code className="text-[11px]">VITE_TWENTY_CRM_URL</code> or enable{' '}
          <code className="text-[11px]">integrations.twentyCrm</code> in tenant settings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 -mx-2 sm:-mx-0">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-[11px] text-muted-foreground">
          Powered by{' '}
          <a
            href="https://github.com/twentyhq/twenty"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Twenty CRM
          </a>
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-[11px]"
          onClick={() => window.open(src, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="h-3 w-3" />
          Open full screen
        </Button>
      </div>
      <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30" style={{ minHeight: 'calc(100vh - 11rem)' }}>
        <iframe
          title="Twenty CRM"
          src={src}
          className="w-full h-full absolute inset-0 border-0"
          style={{ minHeight: 'calc(100vh - 11rem)' }}
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
