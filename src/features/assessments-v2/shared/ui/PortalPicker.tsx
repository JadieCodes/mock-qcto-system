import { Link } from 'react-router-dom';
import { DemoBanner } from './DemoBanner';

export function PortalPicker() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">QCTO Assessments (v2)</h1>
          <p className="text-sm text-gray-500 text-center">Choose which portal to view.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to="internal/dashboard"
              className="rounded-2xl border bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="font-semibold text-gray-900">Internal</p>
              <p className="text-xs text-gray-500 mt-1">QCTO officials</p>
            </Link>
            <Link
              to="external/dashboard"
              className="rounded-2xl border bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="font-semibold text-gray-900">External</p>
              <p className="text-xs text-gray-500 mt-1">QP / SDP</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
