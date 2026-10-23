import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import { FisaRegistrationStatusBadge, FisaValidationStatusBadge } from '../components/StatusBadge';
import { useFisaRegistrations, useFisaValidations } from '../hooks';
import { NewRegistrationDialog } from './NewRegistrationDialog';
import { NewValidationDialog } from './NewValidationDialog';
import { RegistrationDetail } from './RegistrationDetail';
import { ValidationDetail } from './ValidationDetail';

// CR-026: FISA is a fully independent process for Skills Programmes — the SDP's own screen
// here never links back to EISA Instrument Validation or EISA Registration. QP is now
// nav/route-hidden from FISA entirely (09-visibility-matrix.md); the SDP sees only their own
// validations/registrations (sdpId).
export function ExternalDashboard() {
  const { person } = useV2Role();
  const { data: allValidations = [] } = useFisaValidations();
  const { data: allRegistrations = [] } = useFisaRegistrations();
  const validations = filterExternalRecords(allValidations, person, { sdpIdOf: (r) => r.sdpId });
  const registrations = filterExternalRecords(allRegistrations, person, { sdpIdOf: (r) => r.sdpId });
  const [isValidationFormOpen, setIsValidationFormOpen] = useState(false);
  const [selectedValidationId, setSelectedValidationId] = useState<string | null>(null);
  const [isRegistrationFormOpen, setIsRegistrationFormOpen] = useState(false);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">FISA — Skills Programme Track</h2>
        <p className="text-sm text-gray-500 mt-1">
          Independent of EISA/QSA Addendum. Develop and submit your instrument, then register learners for a FISA sitting.
        </p>
      </div>

      <Tabs defaultValue="validation">
        <TabsList>
          <TabsTrigger value="validation">FISA Instrument Validation</TabsTrigger>
          <TabsTrigger value="registration">FISA Registration</TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setIsValidationFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Start Instrument Development
            </Button>
          </div>
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            {validations.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-medium text-gray-500">No FISA instruments yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Start Instrument Development" once a FISA Standard is Approved.</p>
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
        </TabsContent>

        <TabsContent value="registration" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setIsRegistrationFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Start Registration
            </Button>
          </div>
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            {registrations.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-medium text-gray-500">No FISA registrations yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Start Registration" once a FISA instrument is Validated.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {['Skills Programme', 'SDP', 'Sitting Date', 'Learners', 'Status', ''].map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((record) => (
                      <TableRow key={record.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedRegistrationId(record.id)}>
                        <TableCell className="font-medium max-w-[200px] truncate">{record.skillsProgrammeTitle}</TableCell>
                        <TableCell>{record.sdpName}</TableCell>
                        <TableCell className="whitespace-nowrap">{record.sittingDate}</TableCell>
                        <TableCell>{record.learners.length}</TableCell>
                        <TableCell>
                          <FisaRegistrationStatusBadge record={record} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRegistrationId(record.id); }}>
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
        </TabsContent>
      </Tabs>

      <NewValidationDialog open={isValidationFormOpen} onOpenChange={setIsValidationFormOpen} />
      <ValidationDetail recordId={selectedValidationId} onClose={() => setSelectedValidationId(null)} />
      <NewRegistrationDialog open={isRegistrationFormOpen} onOpenChange={setIsRegistrationFormOpen} />
      <RegistrationDetail recordId={selectedRegistrationId} onClose={() => setSelectedRegistrationId(null)} />
    </div>
  );
}
