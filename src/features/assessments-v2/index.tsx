import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { navForPortal } from './config/nav';
import { AssessmentsV2Layout } from './shared/ui/AssessmentsV2Layout';
import { ComingSoon } from './shared/ui/ComingSoon';
import { Dashboard } from './shared/ui/Dashboard';
import { PortalPicker } from './shared/ui/PortalPicker';
import { RoleProvider } from './shared/ui/RoleContext';
import type { Portal } from './types';

// Created once, at module scope — never recreated on re-render, and the App.tsx QueryClient
// is never touched. Workflow/domain state always lives in mock/api (memory + localStorage);
// this cache is only used for request/loading/error ergonomics around those calls.
const queryClient = new QueryClient();

function PortalRoutes({ portal }: { portal: Portal }) {
  const navItems = navForPortal(portal).filter((item) => item.path !== 'dashboard');

  return (
    <RoleProvider portal={portal}>
      <AssessmentsV2Layout portal={portal}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard portal={portal} />} />
          {navItems.map((item) => (
            <Route key={item.path} path={item.path} element={<ComingSoon item={item} />} />
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
