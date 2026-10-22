// CR-011: every checklist line needs a mandatory comment in Assessments — the opposite of
// Accreditation's preference. Keep it a flag here, not a global setting, so it can diverge per domain.
export const CHECKLIST_REQUIRE_COMMENT_PER_LINE = true;

// PM-09: the RPL Toolkit Evaluation module is not in the change request register yet — built
// ahead of time behind this flag so it can be switched off instantly if QCTO says otherwise,
// without deleting the module. Flip to false to hide it from both portals' nav/dashboards and
// block its route. Flagged in progress.md as "pending a QCTO change request".
export const RPL_TOOLKIT_ENABLED = true;
