import React from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';

export default function ExternalQasaAddendumSubmission() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            QASA Addendum Submission
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Submit your QASA addendum documents and track the submission status.
          </p>
        </div>

        {/* Submission Form */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Submission Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Qualification Name" placeholder="Enter qualification" />
            <Input label="Organization Name" placeholder="Enter organization" />
            <Input label="Contact Person" placeholder="Enter name" />
            <Input label="Email Address" placeholder="Enter email" />
          </div>

          <textarea
            className="w-full rounded-lg border p-3 text-sm"
            placeholder="Additional notes..."
            rows={4}
          />

          <button className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-white text-sm font-medium hover:bg-red-700">
            <Upload className="h-4 w-4" />
            Submit Addendum
          </button>
        </div>

        {/* Uploaded Documents */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Uploaded Documents
          </h2>

          <div className="space-y-2">
            <DocumentItem name="QASA_Addendum.pdf" />
            <DocumentItem name="Supporting_Documents.pdf" />
          </div>
        </div>

        {/* Status */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Submission Status
          </h2>

          <div className="mt-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Submitted - Pending Review
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

function Input({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border p-2 text-sm"
      />
    </div>
  );
}

function DocumentItem({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-700">{name}</span>
      </div>
      <button className="text-sm text-red-600 hover:underline">
        View
      </button>
    </div>
  );
}