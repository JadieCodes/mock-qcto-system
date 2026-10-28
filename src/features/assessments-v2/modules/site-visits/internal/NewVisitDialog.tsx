import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QP_DIRECTORY } from '../../../mock/data/qpDirectory';
import { SDP_DIRECTORY } from '../../../mock/data/sdpDirectory';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { DEFAULT_NOTICE_LEAD_TIME_DAYS } from '../config';
import { useCreateVisit, useSchedulableSittings, useSdpsForSitting } from '../hooks';
import { isPerQualificationVisit, VISIT_TYPE_OPTIONS, visitHasQp, visitHasSdp, visitHasSiteSelection, visitHasSittingLink } from '../visitTypeLabels';
import type { NotificationFlag, VisitType } from '../types';

const NO_SITTING = '__none__';

// QCTO feedback 2.7: there is no assessment-centre directory in the mock data, so an RPL/ARPL
// visit is held either at an SDP from the SDP directory or at an assessment centre typed in.
type SiteKind = 'sdp' | 'assessment-centre';

// CR-044/CR-048/CR-049/CR-050/CR-051: everything except the automatic RPL/ARPL item is created
// here by an official — visit type, QP/qualification, optional sitting link, venue, and the
// notified/unannounced flag with its lead time are all captured up front.
// G-06: there is no SDP picker here — an SDP has no access to Site Visits at all
// (09-visibility-matrix.md), so a planner should never be choosing one by hand. When the visit
// is linked to a sitting, the SDP(s) already registered against it are shown as plain
// read-only text (sourced from EISA Registration), never an editable field.
// QCTO feedback 2.7 (exception to G-06): RPL/ARPL monitoring is held at an SDP or assessment
// centre, so for that type the planner chooses the place instead of a QP and a sitting.
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
  const [siteKind, setSiteKind] = useState<SiteKind>('sdp');
  const [siteSdpId, setSiteSdpId] = useState('');
  const [assessmentCentreName, setAssessmentCentreName] = useState('');

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
    setSiteKind('sdp');
    setSiteSdpId('');
    setAssessmentCentreName('');
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
  const hasQp = visitHasQp(visitType);
  const hasSittingLink = visitHasSittingLink(visitType);
  const hasSiteSelection = visitHasSiteSelection(visitType);
  // Post-EISA Monitoring: the SDP is read from the linked sitting, never picked (G-06).
  const showsSittingSdp = visitHasSdp(visitType) && !hasSiteSelection;

  // QCTO feedback 2.6: switching to EISA Readiness drops any sitting link and qualification
  // picked for another type, since Readiness has neither.
  // QCTO feedback 2.7: RPL/ARPL has no QP and no sitting, so switching to it drops the QP and
  // any sitting link, and the date that came from that sitting.
  const onVisitTypeChange = (value: VisitType) => {
    setVisitType(value);
    if (!isPerQualificationVisit(value)) {
      setSittingId(NO_SITTING);
      setQualificationTitle('');
    }
    if (!visitHasQp(value)) {
      if (sittingId !== NO_SITTING) setVisitDate('');
      setSittingId(NO_SITTING);
      setQpId('');
    }
  };

  const selectedQp = QP_DIRECTORY.find((q) => q.qpId === qpId);
  const selectedSiteSdp = SDP_DIRECTORY.find((s) => s.sdpId === siteSdpId);
  const siteChosen = siteKind === 'sdp' ? !!selectedSiteSdp : !!assessmentCentreName.trim();
  const canSubmit =
    (hasQp ? !!selectedQp : siteChosen) && (!perQualification || qualificationTitle.trim()) && visitDate && venue.trim();

  const onSubmit = () => {
    if (!canSubmit) return;
    const linkedSdp = showsSittingSdp ? (linkedSdps[0] ?? null) : null;
    const siteSdp = hasSiteSelection && siteKind === 'sdp' ? selectedSiteSdp : undefined;
    createVisit.mutate(
      {
        visitType,
        qpId: hasQp ? (selectedQp?.qpId ?? '') : '',
        qpName: hasQp ? (selectedQp?.name ?? '') : '',
        qualificationTitle: perQualification ? qualificationTitle.trim() : '',
        sdpId: siteSdp?.sdpId ?? linkedSdp?.sdpId ?? null,
        sdpName: siteSdp?.name ?? linkedSdp?.sdpName ?? null,
        assessmentCentreName: hasSiteSelection && siteKind === 'assessment-centre' ? assessmentCentreName.trim() : null,
        sittingId: hasSittingLink && sittingId !== NO_SITTING ? sittingId : null,
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

          {hasSittingLink && (
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

          <div className={perQualification && hasQp ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
            {hasQp && (
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
            )}
            {perQualification && (
              <div className="space-y-2">
                <Label>Qualification *</Label>
                <Input value={qualificationTitle} onChange={(e) => setQualificationTitle(e.target.value)} disabled={sittingId !== NO_SITTING} />
              </div>
            )}
          </div>

          {hasSiteSelection && (
            <div className="space-y-2">
              <Label>SDP or Assessment Centre *</Label>
              <RadioGroup value={siteKind} onValueChange={(v) => setSiteKind(v as SiteKind)} className="flex gap-6">
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem id="site-sdp" value="sdp" />
                  <Label htmlFor="site-sdp" className="text-sm font-normal">
                    SDP
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem id="site-ac" value="assessment-centre" />
                  <Label htmlFor="site-ac" className="text-sm font-normal">
                    Assessment centre
                  </Label>
                </div>
              </RadioGroup>
              {siteKind === 'sdp' ? (
                <Select value={siteSdpId} onValueChange={setSiteSdpId}>
                  <SelectTrigger aria-label="SDP">
                    <SelectValue placeholder="Select an SDP" />
                  </SelectTrigger>
                  <SelectContent>
                    {SDP_DIRECTORY.map((s) => (
                      <SelectItem key={s.sdpId} value={s.sdpId}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  aria-label="Assessment centre name"
                  placeholder="Assessment centre name"
                  value={assessmentCentreName}
                  onChange={(e) => setAssessmentCentreName(e.target.value)}
                />
              )}
              <p className="text-xs text-gray-400">RPL/ARPL monitoring takes place at an SDP or assessment centre. It has no QP and is not linked to an EISA date.</p>
            </div>
          )}

          {showsSittingSdp && (
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
