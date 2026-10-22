import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Role } from '../../../types';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { canActInStage } from '../../../shared/workflow/engine';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { FisaRegistrationStatusBadge, FisaStandardStatusBadge, FisaValidationStatusBadge } from '../components/StatusBadge';
import { useFisaRegistrations, useFisaStandards, useFisaValidations } from '../hooks';
import { FISA_REGISTRATION_WORKFLOW, FISA_STANDARD_WORKFLOW, FISA_VALIDATION_WORKFLOW } from '../workflow';
import { NewStandardDialog } from './NewStandardDialog';
import { RegistrationWorkspace } from './RegistrationWorkspace';
import { StandardWorkspace } from './StandardWorkspace';
import { ValidationWorkspace } from './ValidationWorkspace';
import type { FisaRegistrationRecord, FisaStandardRecord, FisaValidationRecord } from '../types';

// Brand-new records nobody has personally touched yet still belong under "My items" for
// whichever role can act on their current stage (09-visibility-matrix.md "Approved corrections").
// Once a validation is allocated to a specific ASD (PM-11), it belongs to that person only.
function isStandardActionable(s: FisaStandardRecord, role: Role): boolean {
  return canActInStage(FISA_STANDARD_WORKFLOW, s.workflow.stageId, role);
}

function isValidationActionable(v: FisaValidationRecord, role: Role, personId: string): boolean {
  if (!canActInStage(FISA_VALIDATION_WORKFLOW, v.workflow.stageId, role)) return false;
  if (v.allocatedAsdId && v.allocatedAsdId !== personId) return false;
  return true;
}

function isRegistrationActionable(r: FisaRegistrationRecord, role: Role): boolean {
  return canActInStage(FISA_REGISTRATION_WORKFLOW, r.workflow.stageId, role);
}

// CR-026: FISA Team. Fully independent of the QSA Evaluation / Instrument Validation /
// Registration Teams — no shared records with the EISA flow, only shared components.
export function InternalDashboard() {
  const { role, person } = useV2Role();
  const { data: allStandards = [] } = useFisaStandards();
  const { data: allValidations = [] } = useFisaValidations();
  const { data: allRegistrations = [] } = useFisaRegistrations();
  const [scope, setScope] = useState<ListScope>('mine');

  const standards = filterByScope(allStandards, scope, person.id, (s) => [s.workflow.submittedById], (s) => isStandardActionable(s, role));
  const validations = filterByScope(
    allValidations,
    scope,
    person.id,
    (v) => [v.workflow.submittedById, v.allocatedAsdId],
    (v) => isValidationActionable(v, role, person.id),
  );
  const registrations = filterByScope(
    allRegistrations,
    scope,
    person.id,
    (r) => [r.workflow.submittedById],
    (r) => isRegistrationActionable(r, role),
  );

  const [isStandardFormOpen, setIsStandardFormOpen] = useState(false);
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [selectedValidationId, setSelectedValidationId] = useState<string | null>(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">FISA — Skills Programme Track</h2>
          <p className="text-sm text-gray-500 mt-1">
            A fully independent process. Never triggered by the SAQA gate check; shares nothing with EISA except shared components.
          </p>
        </div>
        <ScopeToggle scope={scope} onChange={setScope} />
      </div>

      <Tabs defaultValue="standards">
        <TabsList>
          <TabsTrigger value="standards">FISA Standards</TabsTrigger>
          <TabsTrigger value="validation">FISA Instrument Validation</TabsTrigger>
          <TabsTrigger value="registration">FISA Registration</TabsTrigger>
        </TabsList>

        <TabsContent value="standards" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setIsStandardFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New FISA Standard
            </Button>
          </div>
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            {standards.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-medium text-gray-500">No FISA Standards yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "New FISA Standard" to supply source documents for a Skills Programme.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {['Skills Programme', 'Status', ''].map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standards.map((record) => (
                      <TableRow key={record.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedStandardId(record.id)}>
                        <TableCell className="font-medium max-w-[260px] truncate">{record.skillsProgrammeTitle}</TableCell>
                        <TableCell>
                          <FisaStandardStatusBadge record={record} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedStandardId(record.id); }}>
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            {validations.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-medium text-gray-500">No FISA instruments yet</p>
                <p className="text-sm text-gray-400 mt-1">Instrument development started by an SDP in the external portal will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {['Skills Programme', 'SDP', 'Status', ''].map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validations.map((record) => (
                      <TableRow key={record.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedValidationId(record.id)}>
                        <TableCell className="font-medium max-w-[220px] truncate">{record.skillsProgrammeTitle}</TableCell>
                        <TableCell>{record.sdpName}</TableCell>
                        <TableCell>
                          <FisaValidationStatusBadge record={record} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedValidationId(record.id); }}>
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="registration" className="space-y-4">
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            {registrations.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-medium text-gray-500">No FISA registrations yet</p>
                <p className="text-sm text-gray-400 mt-1">Registrations submitted by an SDP will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {['SDP', 'Skills Programme', 'Sitting Date', 'Learners', 'Status', ''].map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((record) => (
                      <TableRow key={record.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedRegistrationId(record.id)}>
                        <TableCell className="font-semibold whitespace-nowrap">{record.sdpName}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.skillsProgrammeTitle}</TableCell>
                        <TableCell className="whitespace-nowrap">{record.sittingDate}</TableCell>
                        <TableCell>{record.learners.length}</TableCell>
                        <TableCell>
                          <FisaRegistrationStatusBadge record={record} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRegistrationId(record.id); }}>
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <NewStandardDialog open={isStandardFormOpen} onOpenChange={setIsStandardFormOpen} />
      <StandardWorkspace recordId={selectedStandardId} onClose={() => setSelectedStandardId(null)} />
      <ValidationWorkspace recordId={selectedValidationId} onClose={() => setSelectedValidationId(null)} />
      <RegistrationWorkspace recordId={selectedRegistrationId} onClose={() => setSelectedRegistrationId(null)} />
    </div>
  );
}
