import { Building2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DemoBanner } from './DemoBanner';

const PORTAL_LINK_BASE =
  'group flex flex-col items-center gap-3 rounded-2xl border bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

// Cosmetic only — same blue/teal accent split as AssessmentsV2Layout.tsx and Dashboard.tsx,
// so the choice here visually previews the portal you're about to land in.
const INTERNAL_LINK_CLASSES = cn(PORTAL_LINK_BASE, 'hover:border-blue-200');
const EXTERNAL_LINK_CLASSES = cn(PORTAL_LINK_BASE, 'hover:border-teal-200');

export function PortalPicker() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">QCTO Assessments (v2)</h1>
            <p className="text-sm text-gray-500">Choose which portal to view.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Link to="internal/dashboard" className={INTERNAL_LINK_CLASSES}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Internal</p>
                <p className="text-xs text-gray-500 mt-1">For QCTO officials managing the assessment process</p>
              </div>
            </Link>
            <Link to="external/dashboard" className={EXTERNAL_LINK_CLASSES}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-100">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">External</p>
                <p className="text-xs text-gray-500 mt-1">For Quality Partners (QP) and SDPs</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
