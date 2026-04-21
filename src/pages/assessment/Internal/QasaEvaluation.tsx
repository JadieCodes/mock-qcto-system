import React from 'react';

export function QasaEvaluation() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">QASA Evaluation</h2>
        <p className="mt-1 text-sm text-gray-600">
          This section will contain the QASA evaluation screen.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoCard title="Evaluation Queue" />
        <InfoCard title="Evaluation Summary" />
        <InfoCard title="Outcome Tracking" />
      </div>

      <PlaceholderPanel
        title="Evaluation Workspace"
        text="This area can later contain evaluation checklists, supporting information, comments, findings, and evaluation actions."
      />
    </div>
  );
}

function InfoCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">
        Placeholder content for this section.
      </p>
    </div>
  );
}

function PlaceholderPanel({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{text}</p>
    </div>
  );
}