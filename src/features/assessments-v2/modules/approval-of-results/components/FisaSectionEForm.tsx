import { Input } from '@/components/ui/input';
import { relabel } from '../../../shared/administration/roleLabels';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { FISA_RESULTS_RECORD_TYPE } from '../config';
import { fisaSectionEModel, type SectionEPair } from '../fisaSectionE';
import { sdpVerificationReportFiles } from '../fisaVerificationReport';
import { useSaveFisaSectionE } from '../hooks';
import type { FisaCompliance, FisaRecommendation, FisaResultsBatch, FisaSectionE } from '../types';

function PairGrid({ pairs }: { pairs: SectionEPair[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
      {pairs.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 border-b border-gray-100 py-1">
          <dt className="text-gray-500">{label}</dt>
          <dd className="font-medium text-gray-800 text-right">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function countOf(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

// Batch N2 (29.29): Section E1 "First Evaluation (ASD)" of QCTO's FISA verification report. What the
// system knows is shown as read-only lines; the ASD enters the rest. Sections A-D are the SDP's
// uploaded verification report, named here.
export function FisaSectionE1({ batch, editable }: { batch: FisaResultsBatch; editable: boolean }) {
  const { role } = useV2Role();
  const save = useSaveFisaSectionE();
  const e = batch.sectionE;
  const model = fisaSectionEModel(batch, getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id));
  const update = (patch: Partial<FisaSectionE>) => save.mutate({ id: batch.id, patch, actorRole: role });
  const sdpFiles = sdpVerificationReportFiles(batch);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section E1 — First evaluation (ASD)</p>
      <p className="text-xs text-gray-500">
        Sections A–D are the SDP’s uploaded verification report:{' '}
        {sdpFiles.length > 0 ? sdpFiles.map((f) => f.fileName).join(', ') : 'none uploaded yet (the SDP tags it “Verification report”).'}
      </p>
      <PairGrid pairs={model.e1} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="e1-monitoring-date">Date of QCTO Monitoring</Label>
          <Input id="e1-monitoring-date" type="date" value={e.qctoMonitoringDate} disabled={!editable} onChange={(ev) => update({ qctoMonitoringDate: ev.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e1-period">Period of Skills Programme</Label>
          <Input id="e1-period" value={e.periodOfSkillsProgramme} disabled={!editable} placeholder="For example 3 months" onChange={(ev) => update({ periodOfSkillsProgramme: ev.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e1-training">No. learners via training</Label>
          <Input id="e1-training" type="number" min={0} value={e.learnersViaTraining ?? ''} disabled={!editable} onChange={(ev) => update({ learnersViaTraining: countOf(ev.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e1-rpl">No. learners via RPL</Label>
          <Input id="e1-rpl" type="number" min={0} value={e.learnersViaRpl ?? ''} disabled={!editable} onChange={(ev) => update({ learnersViaRpl: countOf(ev.target.value) })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>These results are recommended for</Label>
        <RadioGroup value={e.recommendation ?? undefined} onValueChange={(v) => update({ recommendation: v as FisaRecommendation })} disabled={!editable} className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem id="e1-approval" value="approval" />
            <Label htmlFor="e1-approval" className="font-normal">
              Approval
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="e1-non-approval" value="non-approval" />
            <Label htmlFor="e1-non-approval" className="font-normal">
              Non-approval
            </Label>
          </div>
        </RadioGroup>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="e1-non-compliance">If not approved, list any areas of non-compliance</Label>
        <Textarea id="e1-non-compliance" rows={3} value={e.nonCompliance} disabled={!editable} onChange={(ev) => update({ nonCompliance: ev.target.value })} />
      </div>
    </div>
  );
}

// Section E2 "Recommendation & Approval": the Deputy Director's compliance statement, the letter
// date, the turnaround, the approval code and the two signature lines.
export function FisaSectionE2({ batch, editable }: { batch: FisaResultsBatch; editable: boolean }) {
  const { role } = useV2Role();
  const save = useSaveFisaSectionE();
  const e = batch.sectionE;
  const model = fisaSectionEModel(batch, getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id));
  const update = (patch: Partial<FisaSectionE>) => save.mutate({ id: batch.id, patch, actorRole: role });

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section E2 — Recommendation &amp; approval</p>
      <PairGrid pairs={model.e2} />
      <div className="space-y-1.5">
        <Label>Complied / not complied</Label>
        <RadioGroup value={e.ddCompliance ?? undefined} onValueChange={(v) => update({ ddCompliance: v as FisaCompliance })} disabled={!editable} className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem id="e2-complied" value="complied" />
            <Label htmlFor="e2-complied" className="font-normal">
              Complied
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="e2-not-complied" value="not-complied" />
            <Label htmlFor="e2-not-complied" className="font-normal">
              Not complied
            </Label>
          </div>
        </RadioGroup>
        <Textarea aria-label="Comment on compliance" rows={2} value={e.ddComment} disabled={!editable} onChange={(ev) => update({ ddComment: ev.target.value })} />
      </div>
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {[model.recommendedBy, model.approvedBy].map((s) => (
          <div key={s.role} className="rounded-xl border p-3">
            <dt className="text-xs text-gray-500">{relabel(s.role)}</dt>
            <dd className="font-medium text-gray-800">{s.name || '—'}</dd>
            <dd className="text-xs text-gray-500">{s.date || 'Date: —'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
