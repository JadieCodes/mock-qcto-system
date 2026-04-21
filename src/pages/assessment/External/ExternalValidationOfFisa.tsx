import React from 'react';
import { FileCheck, FileText, Clock } from 'lucide-react';

export default function ExternalValidationOfFisa() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Validation of FISA</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage your FISA validation submissions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Submitted Validations" value="0" icon={<FileCheck className="h-5 w-5" />} />
        <InfoCard title="Pending Review" value="0" icon={<Clock className="h-5 w-5" />} />
        <InfoCard title="Documents Uploaded" value="0" icon={<FileText className="h-5 w-5" />} />
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Validation Workspace</h2>
        <p className="mt-2 text-sm text-gray-600">
          This page will later contain the FISA validation submission form, uploaded documents, and status tracking.
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-full bg-gray-100 p-3 text-gray-600">{icon}</div>
      </div>
    </div>
  );
}