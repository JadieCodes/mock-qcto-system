import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FisaRegistrationStatusBadge, FisaStandardStatusBadge, FisaValidationStatusBadge } from '../components/StatusBadge';
import { useFisaRegistrations, useFisaStandards, useFisaValidations } from '../hooks';
import { NewStandardDialog } from './NewStandardDialog';
import { RegistrationWorkspace } from './RegistrationWorkspace';
import { StandardWorkspace } from './StandardWorkspace';
import { ValidationWorkspace } from './ValidationWorkspace';

// CR-026: FISA Team. Fully independent of the QSA Evaluation / Instrument Validation /
// Registration Teams — no shared records with the EISA flow, only shared components.
export function InternalDashboard() {
  const { data: standards = [] } = useFisaStandards();
  const { data: validations = [] } = useFisaValidations();
  const { data: registrations = [] } = useFisaRegistrations();

  const [isStandardFormOpen, setIsStandardFormOpen] = useState(false);
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [selectedValidationId, setSelectedValidationId] = useState<string | null>(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">FISA — Skills Programme Track</h2>
        <p className="text-sm text-gray-500 mt-1">
          A fully independent process. Never triggered by the SAQA gate check; shares nothing with EISA except shared components.
        </p>
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
