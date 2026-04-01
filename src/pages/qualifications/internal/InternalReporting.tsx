// pages/internal/InternalReporting.tsx
import React from 'react';
import { Eye, XCircle, BarChart3,FileText, CheckCircle, Clock, DollarSign, Download, Calendar, MapPin, User,GitBranch ,ClipboardList} from 'lucide-react';
export default function InternalReporting() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Reporting</h3>
        <p className="text-gray-500 mb-4">Generate and view reports and analytics</p>
        <div className="flex justify-center gap-4">
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            Generate Report
          </button>
          <button className="border px-4 py-2 rounded-lg hover:bg-gray-50">
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}