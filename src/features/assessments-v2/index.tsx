import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RPL_TOOLKIT_ENABLED } from './config/featureFlags';
import { navForPortal, type NavItem } from './config/nav';
import { ApprovalOfResultsExternal, ApprovalOfResultsInternal } from './modules/approval-of-results';
import { EisaCalendarExternal, EisaCalendarInternal } from './modules/eisa-calendar';
import { EisaConfirmationExternal, EisaConfirmationInternal } from './modules/eisa-confirmation';
import { EisaRegistrationExternal, EisaRegistrationInternal } from './modules/eisa-registration';
import { FisaExternal, FisaInternal } from './modules/fisa';
import { InstrumentValidationExternal, InstrumentValidationInternal } from './modules/instrument-validation';
import { QsaAddendumExternal, QsaAddendumInternal } from './modules/qsa-addendum';
import { RplToolkitExternal, RplToolkitInternal } from './modules/rpl-toolkit';
import { SiteVisitsExternal, SiteVisitsInternal } from './modules/site-visits';
import { AssessmentsV2Layout } from './shared/ui/AssessmentsV2Layout';
import { ComingSoon } from './shared/ui/ComingSoon';
import { Dashboard } from './shared/ui/Dashboard';
import { PortalPicker } from './shared/ui/PortalPicker';
import { RoleBlocked } from './shared/ui/RoleBlocked';
import { RoleProvider } from './shared/ui/RoleContext';
import { useV2Role } from './shared/ui/useV2Role';
import type { Portal } from './types';

// Created once, at module scope — never recreated on re-render, and the App.tsx QueryClient
// is never touched. Workflow/domain state always lives in mock/api (memory + localStorage);
// this cache is only used for request/loading/error ergonomics around those calls.
const queryClient = new QueryClient();

// CR-018: SDPs must not see EISA Instrument Validation at all. This guards a direct URL
// visit too, not just the hidden nav link — the real module component never even mounts
// (so none of its hooks/mock-api calls run) for a role it's hidden for.
function ModuleRoute({ item, portal }: { item: NavItem; portal: Portal }) {
  const { role } = useV2Role();
  if (item.hiddenForRoles?.includes(role)) return <RoleBlocked />;

  if (item.path === 'qsa-addendum') return portal === 'internal' ? <QsaAddendumInternal /> : <QsaAddendumExternal />;
  if (item.path === 'instrument-validation') {
    return portal === 'internal' ? <InstrumentValidationInternal /> : <InstrumentValidationExternal />;
  }
  if (item.path === 'eisa-calendar') return portal === 'internal' ? <EisaCalendarInternal /> : <EisaCalendarExternal />;
  if (item.path === 'eisa-registration') return portal === 'internal' ? <EisaRegistrationInternal /> : <EisaRegistrationExternal />;
  if (item.path === 'eisa-confirmation') return portal === 'internal' ? <EisaConfirmationInternal /> : <EisaConfirmationExternal />;
  if (item.path === 'site-visits') return portal === 'internal' ? <SiteVisitsInternal /> : <SiteVisitsExternal />;
  if (item.path === 'approval-of-results') return portal === 'internal' ? <ApprovalOfResultsInternal /> : <ApprovalOfResultsExternal />;
  // CR-026: fully independent of the EISA/QSA Addendum flow — never gated by the SAQA check.
  if (item.path === 'fisa') return portal === 'internal' ? <FisaInternal /> : <FisaExternal />;
  // PM-09: not in the change request register yet — the route itself is blocked (not just the
  // nav link) the moment the feature flag is off, same defence-in-depth as CR-018's RoleBlocked.
  if (item.path === 'rpl-toolkit') {
    if (!RPL_TOOLKIT_ENABLED) return <RoleBlocked />;
    return portal === 'internal' ? <RplToolkitInternal /> : <RplToolkitExternal />;
  }
  return <ComingSoon item={item} />;
}

function PortalRoutes({ portal }: { portal: Portal }) {
  const navItems = navForPortal(portal).filter((item) => item.path !== 'dashboard');

  return (
    <RoleProvider portal={portal}>
      <AssessmentsV2Layout portal={portal}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard portal={portal} />} />
          {navItems.map((item) => (
            <Route key={item.path} path={item.path} element={<ModuleRoute item={item} portal={portal} />} />
          ))}
        </Routes>
      </AssessmentsV2Layout>
    </RoleProvider>
  );
}

function AssessmentsV2Routes() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route index element={<PortalPicker />} />
        <Route path="internal/*" element={<PortalRoutes portal="internal" />} />
        <Route path="external/*" element={<PortalRoutes portal="external" />} />
      </Routes>
    </QueryClientProvider>
  );
}

export default AssessmentsV2Routes;
