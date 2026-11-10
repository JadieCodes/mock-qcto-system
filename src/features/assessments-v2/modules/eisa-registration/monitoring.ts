// Batch R1 (29.18): the SDP's QA monitoring status shown on the registration. Pure, so the seed
// check can read it.
import { addCalendarMonths } from '../../shared/dates/workingDays';
import { MONITORING_VALID_YEARS } from './config';

export type SdpMonitoringKind = 'valid' | 'expired' | 'never';

export interface SdpMonitoringStatus {
  kind: SdpMonitoringKind;
  lastDate: string | null;
  validUntil: string | null;
  text: string;
  // Expired or never monitored: "Create registration number" is blocked (the SDP can still submit).
  blocksRegistrationNumber: boolean;
}

export function sdpMonitoringStatusOf(lastDate: string | null, todayIso: string): SdpMonitoringStatus {
  if (!lastDate) {
    return { kind: 'never', lastDate: null, validUntil: null, text: 'Never monitored', blocksRegistrationNumber: true };
  }
  const validUntil = addCalendarMonths(lastDate, MONITORING_VALID_YEARS * 12);
  if (todayIso > validUntil) {
    return { kind: 'expired', lastDate, validUntil, text: `Monitoring expired on ${validUntil}`, blocksRegistrationNumber: true };
  }
  return { kind: 'valid', lastDate, validUntil, text: `Monitored on ${lastDate}, valid until ${validUntil}`, blocksRegistrationNumber: false };
}

export function monitoringBlockReason(status: SdpMonitoringStatus): string {
  return status.kind === 'never'
    ? 'This SDP has never been monitored by Quality Assurance, so the registration number cannot be created yet.'
    : `This SDP's QA monitoring expired on ${status.validUntil}, so the registration number cannot be created until it is monitored again.`;
}
