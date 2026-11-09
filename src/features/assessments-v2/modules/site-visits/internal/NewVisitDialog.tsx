import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { listQualificationDirectory } from '../../../mock/api/accreditation';
import { QP_DIRECTORY } from '../../../mock/data/qpDirectory';
import { SDP_DIRECTORY } from '../../../mock/data/sdpDirectory';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { DEFAULT_NOTICE_LEAD_TIME_DAYS } from '../config';
import { useCreateVisit, useSchedulableSittings, useSdpsForSitting } from '../hooks';
import { DEFAULT_VISIT_DOMAIN, VISIT_DOMAIN_LABELS, VISIT_DOMAIN_OPTIONS } from '../visitDomains';
import {
  isPerQualificationVisit,
  VISIT_TYPE_OPTIONS,
  visitHasPurpose,
  visitHasQp,
  visitHasSdp,
  visitHasSiteSelection,
  visitHasSittingLink,
  visitIsMeeting,
} from '../visitTypeLabels';
import { isMultiQualificationVisit, qualificationEntriesHaveSitting, qualificationListIssues, saqaIdForQualification } from '../visitQualifications';
import type { NotificationFlag, VisitDomain, VisitQualification, VisitType } from '../types';

const NO_SITTING = '__none__';

// QCTO feedback 2.7: there is no assessment-centre directory in the mock data, so an RPL/ARPL
// visit is held either at an SDP from the SDP directory or at an assessment centre typed in.
type SiteKind = 'sdp' | 'assessment-centre';

// Batch V1 (05.13): one row of the qualification list. Marking & Moderation picks a published
// EISA sitting (which fixes the qualification and its EISA date); RPL/ARPL picks a qualification.
// `value` is a sitting id or a qualification title; '' until chosen.
interface QualificationRow {
  key: string;
  value: string;
}

const newRow = (): QualificationRow => ({ key: crypto.randomUUID(), value: '' });

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
  const [domain, setDomain] = useState<VisitDomain>(DEFAULT_VISIT_DOMAIN);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [rows, setRows] = useState<QualificationRow[]>([newRow()]);

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
    setDomain(DEFAULT_VISIT_DOMAIN);
    setMeetingTitle('');
    setPurpose('');
    setRows([newRow()]);
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

  // Batch V1 (05.13): Marking & Moderation and RPL/ARPL choose a list; Post-EISA keeps its one
  // qualification and optional sitting link.
  const multiQualification = isMultiQualificationVisit(visitType);
  const rowHasSitting = qualificationEntriesHaveSitting(visitType);
  const perQualification = isPerQualificationVisit(visitType) && !multiQualification;
  const hasQp = visitHasQp(visitType);
  const hasSittingLink = visitHasSittingLink(visitType) && !multiQualification;
  const hasSiteSelection = visitHasSiteSelection(visitType);
  const isMeeting = visitIsMeeting(visitType);
  const hasPurpose = visitHasPurpose(visitType);
  // Post-EISA Monitoring: the SDP is read from the linked sitting, never picked (G-06).
  const showsSittingSdp = visitHasSdp(visitType) && !hasSiteSelection;

  // QCTO feedback 2.6: switching to EISA Readiness drops any sitting link and qualification
  // picked for another type, since Readiness has neither.
  // QCTO feedback 2.7: RPL/ARPL has no QP and no sitting, so switching to it drops the QP and
  // any sitting link, and the date that came from that sitting.
  const onVisitTypeChange = (value: VisitType) => {
    setVisitType(value);
    setRows([newRow()]);
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
  const partyChosen = isMeeting ? !!meetingTitle.trim() : hasQp ? !!selectedQp : siteChosen;
  const qualificationEntries = rows.flatMap((row): VisitQualification[] => {
    if (!row.value) return [];
    if (rowHasSitting) {
      const sitting = sittings.find((s) => s.id === row.value);
      return sitting
        ? [{ id: row.key, qualificationTitle: sitting.qualificationTitle, saqaId: saqaIdForQualification(sitting.qualificationTitle), sittingId: sitting.id, eisaDate: sitting.date }]
        : [];
    }
    return [{ id: row.key, qualificationTitle: row.value, saqaId: saqaIdForQualification(row.value), sittingId: null, eisaDate: '' }];
  });
  const qualificationIssues = multiQualification ? qualificationListIssues(visitType, qualificationEntries) : [];
  const rowsComplete = !multiQualification || (rows.every((r) => !!r.value) && qualificationIssues.length === 0);
  const canSubmit =
    partyChosen && rowsComplete && (!perQualification || qualificationTitle.trim()) && (!hasPurpose || purpose.trim()) && visitDate && venue.trim();

  const onSubmit = () => {
    if (!canSubmit) return;
    const linkedSdp = showsSittingSdp ? (linkedSdps[0] ?? null) : null;
    const siteSdp = hasSiteSelection && siteKind === 'sdp' ? selectedSiteSdp : undefined;
    createVisit.mutate(
      {
        visitType,
        domain,
        meetingTitle: isMeeting ? meetingTitle.trim() : undefined,
        purpose: hasPurpose ? purpose.trim() : undefined,
        qpId: hasQp ? (selectedQp?.qpId ?? '') : '',
        qpName: hasQp ? (selectedQp?.name ?? '') : '',
        qualificationTitle: perQualification ? qualificationTitle.trim() : '',
        qualifications: multiQualification ? qualificationEntries : undefined,
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

          <div className="space-y-2">
            <Label>Domain</Label>
            <Select value={domain} onValueChange={(v) => setDomain(v as VisitDomain)}>
              <SelectTrigger aria-label="Domain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIT_DOMAIN_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {VISIT_DOMAIN_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isMeeting && (
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Meeting title *</Label>
              <Input id="meeting-title" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} />
            </div>
          )}

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

          {multiQualification && (
            <div className="space-y-2">
              <Label>{rowHasSitting ? 'Qualifications and EISA sittings *' : 'Qualifications *'}</Label>
              <div className="space-y-2">
                {rows.map((row, i) => {
                  const usedElsewhere = new Set(
                    rows
                      .filter((r) => r.key !== row.key && r.value)
                      .map((r) => (rowHasSitting ? sittings.find((s) => s.id === r.value)?.qualificationTitle : r.value)),
                  );
                  const entry = qualificationEntries.find((q) => q.id === row.key);
                  return (
                    <div key={row.key} className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <Select value={row.value} onValueChange={(v) => setRows(rows.map((r) => (r.key === row.key ? { ...r, value: v } : r)))}>
                          <SelectTrigger aria-label={`Qualification ${i + 1}`}>
                            <SelectValue placeholder={rowHasSitting ? 'Select a qualification and its EISA sitting' : 'Select a qualification'} />
                          </SelectTrigger>
                          <SelectContent>
                            {rowHasSitting
                              ? sittings.map((s) => (
                                  <SelectItem key={s.id} value={s.id} disabled={usedElsewhere.has(s.qualificationTitle)}>
                                    {s.qualificationTitle} (SAQA ID {saqaIdForQualification(s.qualificationTitle)}) — EISA date {s.date}
                                  </SelectItem>
                                ))
                              : listQualificationDirectory().map((q) => (
                                  <SelectItem key={q.qualificationId} value={q.qualificationName} disabled={usedElsewhere.has(q.qualificationName)}>
                                    {q.qualificationName} (SAQA ID {q.qualificationId})
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                        {entry && (
                          <p className="text-xs text-gray-500">
                            SAQA ID {entry.saqaId}
                            {entry.eisaDate && ` — EISA date ${entry.eisaDate}`}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove qualification ${i + 1}`}
                        disabled={rows.length === 1}
                        onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setRows([...rows, newRow()])}>
                <Plus className="h-4 w-4" />
                Add a qualification
              </Button>
              {(qualificationEntries.length > 0 ? qualificationIssues : []).map((issue) => (
                <p key={issue} role="alert" className="text-xs text-red-600">
                  {issue}
                </p>
              ))}
              <p className="text-xs text-gray-400">
                {rowHasSitting
                  ? 'Add every qualification this visit will check. Each has its own published EISA sitting, and a qualification can be added once.'
                  : 'Add every qualification this visit will check at the SDP or assessment centre. A qualification can be added once.'}
              </p>
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

          {hasPurpose && (
            <div className="space-y-2">
              <Label htmlFor="visit-purpose">Purpose *</Label>
              <Textarea id="visit-purpose" rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
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
