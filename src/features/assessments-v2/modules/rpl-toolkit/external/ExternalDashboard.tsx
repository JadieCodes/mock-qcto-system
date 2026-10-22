import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RplToolkitStatusBadge } from '../components/StatusBadge';
import { useRplToolkitApplications } from '../hooks';
import { ApplicationDetail } from './ApplicationDetail';
import { NewApplicationForm } from './NewApplicationForm';

// PM-09: self-contained — no inbound or outbound links to the other maps. The QP submits a
// toolkit here; SDPs later use an approved toolkit to run RPL/ARPL assessments elsewhere.
export function ExternalDashboard() {
  const { data: applications = [] } = useRplToolkitApplications();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My RPL Toolkit Submissions</h2>
          <p className="text-sm text-gray-500 mt-1">Submit a new or updated RPL Toolkit and track its evaluation.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Submission
        </Button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">Submissions</h3>
        </div>
        {applications.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-medium text-gray-500">No submissions yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "New Submission" above to submit an RPL Toolkit.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Toolkit Title', 'Type', 'Submitted', 'Status', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(app.id)}>
                    <TableCell className="font-medium max-w-[220px] truncate">{app.toolkitTitle}</TableCell>
                    <TableCell className="capitalize">{app.toolkitType}</TableCell>
                    <TableCell className="whitespace-nowrap">{app.submissionDate}</TableCell>
                    <TableCell>
                      <RplToolkitStatusBadge application={app} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedId(app.id); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <NewApplicationForm open={isFormOpen} onOpenChange={setIsFormOpen} />
      <ApplicationDetail applicationId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
