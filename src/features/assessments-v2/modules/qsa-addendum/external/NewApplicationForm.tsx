import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { checkSaqaRegistration, type SaqaRegistryDocument } from '../../../mock/api/saqaRegistry';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { useCreateQsaAddendumApplication } from '../hooks';
import type { NewApplicationInput, RequiredDocument } from '../types';

interface FormValues {
  qualificationTitle: string;
  saqaId: string;
  dateRegisteredWithSaqa: string;
  nqfLevel: string;
  credits: string;
  submissionDate: string;
  notes: string;
}

const UPLOAD_SLOTS: { key: RequiredDocument['key']; label: string }[] = [
  { key: 'saqaQualificationDocument', label: '1. SAQA Qualification Document' },
  { key: 'curriculumDocument', label: '2. Curriculum Document' },
  { key: 'qsaAddendumDocument', label: '3. QSA Addendum' },
];

export function NewApplicationForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { person } = useV2Role();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      qualificationTitle: '',
      saqaId: '',
      dateRegisteredWithSaqa: '',
      nqfLevel: '',
      credits: '',
      submissionDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });
  const [nqfLevel, setNqfLevel] = useState('');
  const [gateOutcome, setGateOutcome] = useState<'registered' | 'not-registered' | null>(null);
  const [gateChecking, setGateChecking] = useState(false);
  const [autoDocuments, setAutoDocuments] = useState<SaqaRegistryDocument[]>([]);
  const [uploads, setUploads] = useState<Record<RequiredDocument['key'], File | null>>({
    saqaQualificationDocument: null,
    curriculumDocument: null,
    qsaAddendumDocument: null,
  });

  const createApplication = useCreateQsaAddendumApplication();

  const resetGateCheck = () => {
    setGateOutcome(null);
    setAutoDocuments([]);
    setUploads({ saqaQualificationDocument: null, curriculumDocument: null, qsaAddendumDocument: null });
  };

  const resetAll = () => {
    reset();
    setNqfLevel('');
    resetGateCheck();
  };

  const runGateCheck = async (simulateAs: 'registered' | 'not-registered') => {
    setGateChecking(true);
    const result = await checkSaqaRegistration(simulateAs);
    setGateChecking(false);
    setGateOutcome(simulateAs);
    setAutoDocuments(result.documents);
  };

  const gateReady =
    gateOutcome === 'registered' ||
    (gateOutcome === 'not-registered' && UPLOAD_SLOTS.every((slot) => uploads[slot.key] !== null));

  // Row 11 (test finding B-05): Submit used to just go disabled with no explanation for the
  // SAQA gate check / NQF Level, which aren't part of react-hook-form's own field errors.
  const submitIssues: ValidationIssue[] = [];
  if (!nqfLevel) submitIssues.push({ field: 'nqfLevel', message: 'Select an NQF Level.' });
  if (gateOutcome === null) {
    submitIssues.push({ field: 'gateCheck', message: 'Run the SAQA Gate Check (Registered or Not Registered).' });
  } else if (!gateReady) {
    submitIssues.push({ field: 'gateCheck', message: 'Upload all 3 required documents before submitting.' });
  }

  const onSubmit = (values: FormValues) => {
    if (!nqfLevel || !gateOutcome || !gateReady) return;

    const documents: RequiredDocument[] =
      gateOutcome === 'registered'
        ? [
            { key: 'saqaQualificationDocument', label: 'SAQA Qualification Document', fileName: autoDocuments[0]?.fileName ?? '', source: 'saqa-auto' },
            { key: 'curriculumDocument', label: 'Curriculum Document', fileName: autoDocuments[1]?.fileName ?? '', source: 'saqa-auto' },
            { key: 'qsaAddendumDocument', label: 'QSA Addendum', fileName: autoDocuments[2]?.fileName ?? '', source: 'saqa-auto' },
          ]
        : UPLOAD_SLOTS.map((slot) => ({
            key: slot.key,
            label: slot.label.replace(/^\d+\.\s*/, ''),
            fileName: uploads[slot.key]?.name ?? '',
            source: 'qp-upload' as const,
          }));

    const input: NewApplicationInput = {
      ...values,
      qpId: person.qpId ?? person.id,
      qpName: person.name,
      nqfLevel,
      saqaGateOutcome: gateOutcome,
      documents,
    };

    createApplication.mutate(input, {
      onSuccess: () => {
        onOpenChange(false);
        resetAll();
      },
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => { onOpenChange(next); if (!next) resetAll(); }}
      size="md"
      title="New QSA Addendum Application"
      description="Fill in the details below, run the SAQA gate check, then submit."
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={!nqfLevel || !gateReady || createApplication.isPending} className="gap-2">
            <Upload className="h-4 w-4" />Submit Application
          </Button>
        </>
      }
    >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name of QP</Label>
              <p className="text-sm font-medium py-2">{person.name}</p>
              <p className="text-xs text-gray-400">Submitting as the acting QP — switch person in the header to submit as someone else.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualificationTitle">Qualification Title *</Label>
              <Input id="qualificationTitle" {...register('qualificationTitle', { required: true })} placeholder="Enter qualification title" />
              {errors.qualificationTitle && <p className="text-xs text-red-600">Required.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="saqaId">SAQA ID *</Label>
              <Input id="saqaId" {...register('saqaId', { required: true })} placeholder="Enter SAQA ID" />
              {errors.saqaId && <p className="text-xs text-red-600">Required.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateRegisteredWithSaqa">Date Registered with SAQA *</Label>
              <Input id="dateRegisteredWithSaqa" type="date" {...register('dateRegisteredWithSaqa', { required: true })} />
              {errors.dateRegisteredWithSaqa && <p className="text-xs text-red-600">Required.</p>}
            </div>
            <div className="space-y-2">
              <Label>NQF Level *</Label>
              <Select value={nqfLevel} onValueChange={setNqfLevel}>
                <SelectTrigger><SelectValue placeholder="Select NQF Level" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                    <SelectItem key={level} value={`Level ${level}`}>Level {level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!nqfLevel && <p className="text-xs text-red-600">Required.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits *</Label>
              <Input id="credits" type="number" min="0" {...register('credits', { required: true })} placeholder="Enter credits" />
              {errors.credits && <p className="text-xs text-red-600">Required.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="submissionDate">Submission Date *</Label>
              <Input id="submissionDate" type="date" {...register('submissionDate', { required: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Comments</Label>
            <Textarea id="notes" rows={3} {...register('notes')} placeholder="Enter any additional notes..." />
          </div>

          {/* CR-004: the gate check only decides where the documents come from — it never
              decides EISA vs FISA. Both outcomes continue into the same evaluation. */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-base font-semibold">SAQA Gate Check</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Simulate whether the qualification is registered with SAQA. Registered — documents are auto-attached.
                  Not registered — upload the 3 required documents.
                </p>
              </div>
              {gateOutcome === null && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button type="button" variant="destructive" size="sm" disabled={gateChecking} onClick={() => runGateCheck('not-registered')}>
                    Not Registered
                  </Button>
                  <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700" disabled={gateChecking} onClick={() => runGateCheck('registered')}>
                    Registered
                  </Button>
                </div>
              )}
            </div>

            {gateOutcome === 'registered' && (
              <>
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">Qualification is registered with SAQA — documents auto-attached.</AlertDescription>
                </Alert>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {autoDocuments.map((doc) => (
                    <div key={doc.label} className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">{doc.label}</span>
                      <span className="text-gray-500">— {doc.fileName}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {gateOutcome === 'not-registered' && (
              <>
                <Alert className="border-amber-500 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">Not registered with SAQA — upload all 3 required documents.</AlertDescription>
                </Alert>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {UPLOAD_SLOTS.map((slot) => (
                    <div key={slot.key} className="space-y-2">
                      <Label>{slot.label} *</Label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setUploads((prev) => ({ ...prev, [slot.key]: e.target.files?.[0] ?? null }))}
                      />
                      {uploads[slot.key] && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />{uploads[slot.key]!.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {gateOutcome !== null && (
              <Button type="button" variant="ghost" size="sm" className="text-xs text-gray-500" onClick={resetGateCheck}>
                <X className="h-3 w-3 mr-1" />Reset gate check
              </Button>
            )}
          </div>

          <ValidationSummary issues={submitIssues} title="Before you can submit:" />
        </div>
    </Modal>
  );
}
