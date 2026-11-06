import { generateLetter } from '../../shared/letters/templates';
import type { GeneratedLetter } from '../../shared/letters/types';
import { qasaValidityText } from './assessmentDetails';
import { FEEDBACK_LETTER_TITLE } from './config';
import type { QsaAddendumApplication } from './types';

// The two QASA letters, built the same way on both portals.

// QCTO feedback 05.5: issued at the moment of submission, dated that day.
export function acknowledgementLetterOf(app: QsaAddendumApplication): GeneratedLetter {
  return generateLetter('acknowledgement', app.id, {
    qpName: app.qpName,
    qualificationTitle: app.qualificationTitle,
    saqaId: app.saqaId,
    nqfLevel: app.nqfLevel,
    date: (app.acknowledgementIssuedAt || app.submissionDate).slice(0, 10),
  });
}

// QCTO feedback 05.6: the CEO-signed feedback letter is the approval — there is no separate
// approval letter. 05.2: it states the validity as the lifespan of the qualification.
export function feedbackLetterOf(app: QsaAddendumApplication): GeneratedLetter {
  const signed = app.outcomeState.stageId === 'signed';
  return generateLetter(
    'outcome',
    app.id,
    {
      qpName: app.qpName,
      qualificationTitle: app.qualificationTitle,
      saqaId: app.saqaId,
      nqfLevel: app.nqfLevel,
      date: (signed && app.certificationHandoff ? app.certificationHandoff.notifiedAt : new Date().toISOString()).slice(0, 10),
      notes: `Outcome: Approved. This signed feedback letter is the approval of the QASA. ${qasaValidityText(app)}; it may be reviewed at any time if there is a need.`,
      signatoryName: signed ? app.outcomeState.submittedBy : undefined,
      signatoryTitle: 'CEO',
    },
    FEEDBACK_LETTER_TITLE,
  );
}
