import type { ComponentType } from 'react';
import TwentyCrmEmbed from '@/components/crm/TwentyCrmEmbed';
import { useTwentyCrmConfig } from '@/hooks/useTwentyCrmConfig';

/**
 * When Twenty CRM is configured, render the full Twenty UI in an iframe.
 * Otherwise fall back to the legacy Hospital OS CRM page.
 */
export function wrapCrmPage(hospitalPath: string, LegacyPage: ComponentType) {
  function CrmPageWithTwenty() {
    const twenty = useTwentyCrmConfig();
    if (twenty?.enabled && twenty.embedMode && twenty.baseUrl) {
      return <TwentyCrmEmbed />;
    }
    return <LegacyPage />;
  }
  CrmPageWithTwenty.displayName = `CrmPage(${hospitalPath})`;
  return CrmPageWithTwenty;
}
