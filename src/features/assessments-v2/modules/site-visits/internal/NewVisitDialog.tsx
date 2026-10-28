import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QP_DIRECTORY } from '../../../mock/data/qpDirectory';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { DEFAULT_NOTICE_LEAD_TIME_DAYS } from '../config';
import { useCreateVisit, useSchedulableSittings, useSdpsForSitting } from '../hooks';
import { isPerQualificationVisit, VISIT_TYPE_OPTIONS, visitHasSdp } from '../visitTypeLabels';
import type { NotificationFlag, VisitType } from '../types';

const NO_SITTING = '__none__';

// CR-044/CR-048/CR-049/CR-050/CR-051: everything except the automatic RPL/ARPL item is created
// here by an official — visit type, QP/qualification, optional sitting link, venue, and the
// notified/unannounced flag with its lead time are all captured up front.
// G-06: there is no SDP picker here — an SDP has no access to Site Visits at all
// (09-visibility-matrix.md), so a planner should never be choosing one by hand. When the visit
// is linked to a sitting, the SDP(s) already registered against it are shown as plain
// read-only text (sourced from EISA Registration), never an editable field.
export function NewVisitDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { person } = useV2Role();
  const { data: sittings = [] } = useSchedulableSittings();
  const createVisit = useCreateVisit();

  const [visitType, setVisitType] = useState<VisitType>('eisa-readiness');
  const [sittingId, setSittingId] = useState<string>(NO_SITTING);
  const [qpId, setQpId] = useState('');
  const [qualificationTitle, setQualificationTitle] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [venue, setVenue] = useState('');
  const [notificationFlag, setNotificationFlag] = useState<NotificationFlag>('notified');
  const [leadTimeDays, setLeadTimeDays] = useState(DEFAULT_NOTICE_LEAD_TIME_DAYS);

  const { data: linkedSdps = [] } = useSdpsForSitting(sittingId === NO_SITTING ? null : sittingId);

  const reset = () => {
    setVisitType('eisa-readiness');
    setSittingId(NO_SITTING);
    setQpId('');
    setQualificationTitle('');
    setVisitDate('');
    setVenue('');
    setNotificationFlag('notified');
    setLeadTimeDays(DEFAULT_NOTICE_LEAD_TIME_DAYS);
  };

  const onSittingChange = (value: string) => {
    setSittingId(value);
    if (value === NO_SITTING) return;
    const sitting = sittings.find((s) => s.id === value);
    if (sitting) {
      setQpId(sitting.qpId);
      setQualificationTitle(sitting.qualificationTitle);
      setVisitDate(sitting.date);
    }
  };

  const perQualification = isPerQualificationVisit(visitType);
  const hasSdp = visitHasSdp(visitType);

  // QCTO feedback 2.6: switching to EISA Readiness drops any sitting link and qualification
  // picked for another type, since Readiness has neither.
  const onVisitTypeChange = (value: VisitType) => {
    setVisitType(value);
    if (!isPerQualificationVisit(value)) {
      setSittingId(NO_SITTING);
      setQualificationTitle('');
    }
  };

  const selectedQp = QP_DIRECTORY.find((q) => q.qpId === qpId);
  const canSubmit = qpId && (!perQualification || qualificationTitle.trim()) && visitDate && venue.trim();

  const onSubmit = () => {
    if (!canSubmit || !selectedQp) return;
    const linkedSdp = hasSdp ? (linkedSdps[0] ?? null) : null;
    createVisit.mutate(
      {
        visitType,
        qpId: selectedQp.qpId,
        qpName: selectedQp.name,
        qualificationTitle: perQualification ? qualificationTitle.trim() : '',
        sdpId: linkedSdp?.sdpId ?? null,
        sdpName: linkedSdp?.sdpName ?? null,
        sittingId: perQualification && sittingId !== NO_SITTING ? sittingId : null,
        visitDate,
        venue: venue.trim(),
        notificationFlag,
        noticeLeadTimeDays: notificationFlag === 'notified' ? leadTimeDays : null,
        createdBy: person.name,
        createdById: person.id,
      },
      { onSuccess: () => { onOpenChange(false); reset(); } },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}
      size="md"
      title="Plan a New Site Visit"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || createVisit.isPending} onClick={onSubmit}>
            Create Visit Plan
          </Button>
        </>
      }
    >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Visit Type *</Label>
            <Select value={visitType} onValueChange={(v) => onVisitTypeChange(v as VisitType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {perQualification && (
            <div className="space-y-2">
              <Label>Link to a Published EISA Sitting (optional)</Label>
              <Select value={sittingId} onValueChange={onSittingChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Not linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SITTING}>Not linked</SelectItem>
                  {sittings.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.qualificationTitle} — {s.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sittingId !== NO_SITTING && <p className="text-xs text-gray-400">QP, qualification and date were auto-populated from the sitting.</p>}
            </div>
          )}

          <div className={perQualification ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
            <div className="space-y-2">
              <Label>QP *</Label>
              <Select value={qpId} onValueChange={setQpId} disabled={sittingId !== NO_SITTING}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a QP" />
                </SelectTrigger>
                <SelectContent>
                  {QP_DIRECTORY.map((q) => (
                    <SelectItem key={q.qpId} value={q.qpId}>
                      {q.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {perQualification && (
              <div className="space-y-2">
                <Label>Qualification *</Label>
                <Input value={qualificationTitle} onChange={(e) => setQualificationTitle(e.target.value)} disabled={sittingId !== NO_SITTING} />
              </div>
            )}
          </div>

          {hasSdp && (
            <div className="space-y-2">
              <Label>SDP</Label>
              {/* G-06: information only — an SDP cannot be picked here, since the SDP role has
                  no access to Site Visits at all. */}
              {sittingId === NO_SITTING ? (
                <p className="text-sm text-gray-400">Not applicable — link a sitting to see the registered SDP.</p>
              ) : linkedSdps.length === 0 ? (
                <p className="text-sm text-gray-400">No SDP has registered learners for this sitting yet.</p>
              ) : (
                <p className="text-sm text-gray-700">{linkedSdps.map((s) => s.sdpName).join(', ')}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Visit Date *</Label>
              <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} disabled={sittingId !== NO_SITTING} />
            </div>
            <div className="space-y-2">
              <Label>Venue *</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notification Type *</Label>
            <RadioGroup value={notificationFlag} onValueChange={(v) => setNotificationFlag(v as NotificationFlag)} className="flex gap-6">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem id="nf-notified" value="notified" />
                <Label htmlFor="nf-notified" className="text-sm font-normal">
                  Notified
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem id="nf-unannounced" value="unannounced" />
                <Label htmlFor="nf-unannounced" className="text-sm font-normal">
                  Unannounced
                </Label>
              </div>
            </RadioGroup>
            {notificationFlag === 'notified' && (
              <div className="flex items-center gap-2 pt-1">
                <Label htmlFor="lead-time" className="text-xs text-gray-500 whitespace-nowrap">
                  Lead time (days)
                </Label>
                <Input
                  id="lead-time"
                  type="number"
                  min={0}
                  className="w-24"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                />
              </div>
            )}
          </div>
        </div>
    </Modal>
  );
}
