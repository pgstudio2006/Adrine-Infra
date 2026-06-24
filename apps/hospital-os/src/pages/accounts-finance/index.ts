import { AF_SECTION_LIST } from '@/lib/accounts-finance/sections';
import AccountsFinanceDashboard from './AccountsFinanceDashboard';
import AccountsFinanceSection from './AccountsFinanceSection';

/** Flat path → page component map for App.tsx route registration. */
export const ACCOUNTS_FINANCE_PAGES: Record<string, React.ComponentType> = {
  '/accounts-finance': AccountsFinanceDashboard,
};

for (const section of AF_SECTION_LIST) {
  if (section.id !== 'dashboard') {
    ACCOUNTS_FINANCE_PAGES[section.path] = AccountsFinanceSection;
  }
}

export { AccountsFinanceDashboard, AccountsFinanceSection };
export { AccountsFinanceLayout } from './AccountsFinanceLayout';
