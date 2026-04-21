import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  FileText,
  Download,
  Upload,
  Image,
  Trash2,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  User,
  Shield,
  AlertTriangle,
  Eye,
  Building2,
  Phone,
  Mail,
  ClipboardList,
} from 'lucide-react';
import type {
  ApplicationStatus,
  SiteVisitReport,
  SiteVisitEvidence,
  SiteVisitChecklistItem,
} from '@/types';

export interface SiteVisitEvaluationToolProps {
  application: ApplicationStatus;
  userRole: 'qp' | 'verifier';
  userName: string;
  initialReport?: SiteVisitReport;
  onSave: (report: SiteVisitReport) => void;
  onComplete: (report: SiteVisitReport) => void;
  onCancel: () => void;
}

type DeliveryMode = 'face_to_face' | 'hybrid_blended' | 'mobile_unit';
type CriterionResponse = 'yes' | 'no' | 'na';
type RecommendationStatus = 'recommended' | 'not_recommended' | '';

interface CriterionItemState {
  id: string;
  criteria: string;
  response: CriterionResponse | '';
  comments: string;
  evidenceIds: string[];
  guidance?: string[];
}

interface EvaluationSectionState {
  id: string;
  title: string;
  description?: string;
  items: CriterionItemState[];
}

interface FormHeaderState {
  legalName: string;
  physicalAddress: string;
  emisNo: string;
  contactPerson: string;
  contactNumber: string;
  contactEmail: string;
  siteVisitDate: string;
  qualificationTitle: string;
  nqfLevel: string;
  credits: string;
  saqaId: string;
  curriculumCode: string;
}

const createQpSections = (deliveryMode: DeliveryMode): EvaluationSectionState[] => {
  const baseSections: EvaluationSectionState[] = [
    {
      id: 'self_assessment',
      title: '1. Self-Assessment',
      items: [
        {
          id: '1.1',
          criteria: 'Did the Skills Development Provider complete the self-assessment provided?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
      ],
    },
    {
      id: 'registration',
      title: '2. Registration',
      items: [
        {
          id: '2.1',
          criteria: 'Is the Skills Development Provider registered as required by South African law?',
          response: '',
          comments: '',
          evidenceIds: [],
          guidance: [
            'CIPC / EMIS / HEMIS / Act of establishment / NGO registration',
            'Valid tax compliance pin or exemption proof',
            'Professional body registration with SAQA where applicable',
          ],
        },
      ],
    },
    {
      id: 'human_resources',
      title: '3. Human Resources & Governance',
      items: [
        {
          id: '3.1',
          criteria: 'Is there a valid organogram with clear reporting lines, functions, and roles?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
        {
          id: '3.2',
          criteria: 'Are there adequate and appropriately qualified facilitators for the qualification applied for?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
        {
          id: '3.3',
          criteria: 'Are contracts / SLAs for facilitators current and aligned to their responsibilities?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
      ],
    },
    {
      id: 'workplace_module',
      title: '4. Workplace Module Implementation',
      items: [
        {
          id: '4.1',
          criteria: 'Is there a valid agreement in place for workplace-based learning and learner placement?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
        {
          id: '4.2',
          criteria: 'Are workplace monitoring, logbooks, and learner support arrangements clearly evidenced?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
      ],
    },
    {
      id: 'lmis',
      title: '5. Learner Information Management System',
      items: [
        {
          id: '5.1',
          criteria: 'Is there a functional learner management information system with POPI safeguards and backup processes?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
      ],
    },
    {
      id: 'policies',
      title: '6. Policies and Procedures',
      items: [
        {
          id: '6.1',
          criteria: 'Are the required policies and procedures available and implemented?',
          response: '',
          comments: '',
          evidenceIds: [],
          guidance: [
            'Finance',
            'Human Resources',
            'Teaching and Learning',
            'Assessment and Appeals',
            'Occupational Health and Safety',
            'Refund Policy',
          ],
        },
        {
          id: '6.2',
          criteria: 'Is learner support clearly defined before, during, and after training?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
        {
          id: '6.3',
          criteria: 'Is the career pathway mapped and clearly communicated to learners?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
      ],
    },
    {
      id: 'ohs',
      title: '7. Occupational Health and Safety',
      items: [
        {
          id: '7.1',
          criteria: 'Are OHS requirements met, including fire safety, emergency signage, first aid, accessibility, and valid OHS inspection evidence?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
      ],
    },
    {
      id: 'learning_material',
      title: '8. Learning Material',
      items: [
        {
          id: '8.1',
          criteria: 'Does learning material exist and adequately cover the knowledge and practical / application components?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
        {
          id: '8.2',
          criteria: 'Is the learning material aligned to the qualification, NQF level, curriculum, and sampled content requirements?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
      ],
    },
  ];

  const modeSpecificSections: EvaluationSectionState[] = [];

  if (deliveryMode === 'face_to_face') {
    modeSpecificSections.push({
      id: 'face_to_face',
      title: '3A. Face-to-Face Delivery',
      items: [
        {
          id: '3A.1',
          criteria: 'Is there valid ownership or lease evidence for the physical training site?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
        {
          id: '3A.2',
          criteria: 'Are physical classrooms, resources, inventory lists, and training room arrangements adequate?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
        {
          id: '3A.3',
          criteria: 'Are practical facilities, equipment, tools, and consumables adequate for delivery?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
      ],
    });
  }

  if (deliveryMode === 'hybrid_blended') {
    modeSpecificSections.push({
      id: 'hybrid',
      title: '3B. Hybrid / Blended Delivery',
      items: [
        {
          id: '3B.1',
          criteria: 'Is there a documented process for implementation, administration, and learner support through LMS / online systems?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
        {
          id: '3B.2',
          criteria: 'Are knowledge module delivery, formative assessments, moderation, and learner support adequately implemented online?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
        {
          id: '3B.3',
          criteria: 'Are practical and workplace components appropriately implemented and evidenced through the LMS or blended system?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
      ],
    });
  }

  if (deliveryMode === 'mobile_unit') {
    modeSpecificSections.push({
      id: 'mobile_unit',
      title: '3C. Mobile Unit Delivery',
      items: [
        {
          id: '3C.1',
          criteria: 'Is the mobile unit registered, compliant to enrolment capacity, and adequately resourced for delivery?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
        {
          id: '3C.2',
          criteria: 'Are inventory lists, practical resources, and delivery arrangements for the mobile unit sufficiently evidenced?',
          response: '',
          comments: '',
          evidenceIds: [],
        },
      ],
    });
  }

  return [...baseSections.slice(0, 2), ...modeSpecificSections, ...baseSections.slice(2)];
};

const createVerifierSections = (): EvaluationSectionState[] => [
  {
    id: 'verifier_readiness',
    title: 'A. Programme Delivery Readiness Verification',
    items: [
      {
        id: 'V1',
        criteria: 'Has the evidence provided by the SDP been verified against the evaluation instrument?',
        response: '',
        comments: '',
        evidenceIds: [],
      },
      {
        id: 'V2',
        criteria: 'Are sampled documents and observations sufficient to support the recommendation?',
        response: '',
        comments: '',
        evidenceIds: [],
      },
      {
        id: 'V3',
        criteria: 'Are identified gaps, non-compliances, or conditions clearly recorded?',
        response: '',
        comments: '',
        evidenceIds: [],
      },
    ],
  },
  {
    id: 'verifier_recommendation_inputs',
    title: 'B. Recommendation Support',
    items: [
      {
        id: 'V4',
        criteria: 'Does the provider demonstrate programme delivery readiness based on the site visit findings?',
        response: '',
        comments: '',
        evidenceIds: [],
      },
      {
        id: 'V5',
        criteria: 'Are remarks and evidence sufficient to support a recommendation or non-recommendation decision?',
        response: '',
        comments: '',
        evidenceIds: [],
      },
    ],
  },
];

const flattenSectionsToChecklist = (sections: EvaluationSectionState[]): SiteVisitChecklistItem[] => {
  return sections.flatMap((section) =>
    section.items.map((item) => ({
      id: item.id,
      criteria: `${section.title} — ${item.criteria}`,
      isMet: item.response === 'yes',
      comments: item.comments,
      evidenceIds: item.evidenceIds,
    }))
  );
};

const countSectionItems = (sections: EvaluationSectionState[]) =>
  sections.reduce((acc, section) => acc + section.items.length, 0);

const findEvidenceById = (evidence: SiteVisitEvidence[], id: string) =>
  evidence.find((item) => item.id === id);

export default function SiteVisitEvaluationTool({
  application,
  userRole,
  userName,
  initialReport,
  onSave,
  onComplete,
  onCancel,
}: SiteVisitEvaluationToolProps) {
  const initialDeliveryMode: DeliveryMode = 'face_to_face';

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(initialDeliveryMode);
  const [sections, setSections] = useState<EvaluationSectionState[]>(
    userRole === 'qp' ? createQpSections(initialDeliveryMode) : createVerifierSections()
  );
  const [evidence, setEvidence] = useState<SiteVisitEvidence[]>([]);
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [riskProfile, setRiskProfile] = useState<'low' | 'medium' | 'high'>('medium');
  const [outcome, setOutcome] = useState<'compliant' | 'partially_compliant' | 'non_compliant'>('compliant');
  const [recommendation, setRecommendation] = useState<RecommendationStatus>('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');
  
  const [headerFields, setHeaderFields] = useState<FormHeaderState>({
    legalName: application.applicationData?.applicantInfo.organisationName || '',
    physicalAddress: application.applicationData?.applicantInfo.trainingLocation || '',
    emisNo: '',
    contactPerson: application.applicationData?.applicantInfo.fullName || '',
    contactNumber: application.applicationData?.applicantInfo.phone || '',
    contactEmail: application.applicationData?.applicantInfo.email || '',
    siteVisitDate: new Date().toISOString().slice(0, 10),
    qualificationTitle: application.applicationData?.qualification || '',
    nqfLevel: '',
    credits: '',
    saqaId: '',
    curriculumCode: '',
  });

  useEffect(() => {
    if (!initialReport) return;

    setEvidence(initialReport.evidence || []);
    setSummary(initialReport.summary || '');
    setRecommendations(initialReport.recommendations || '');
    setOutcome(initialReport.outcome || 'compliant');

    if (initialReport.riskProfile) {
      setRiskProfile(initialReport.riskProfile);
    }

    const reportAny = initialReport as any;

    if (reportAny.deliveryMode) {
      setDeliveryMode(reportAny.deliveryMode);
    }

    if (reportAny.recommendation) {
      setRecommendation(reportAny.recommendation);
    }

    if (reportAny.additionalComments) {
      setAdditionalComments(reportAny.additionalComments);
    }

    if (reportAny.headerFields) {
      setHeaderFields((prev) => ({
        ...prev,
        ...reportAny.headerFields,
      }));
    }

    const initialSections =
      userRole === 'qp'
        ? createQpSections((reportAny.deliveryMode as DeliveryMode) || initialDeliveryMode)
        : createVerifierSections();

    if (initialReport.checklist?.length) {
    const hydratedSections: EvaluationSectionState[] = initialSections.map((section) => ({
  ...section,
  items: section.items.map((item): CriterionItemState => {
    const existing = initialReport.checklist.find((c) => c.id === item.id);

    let response: CriterionResponse | '' = item.response;

    if (existing) {
      if (existing.comments?.includes('[N/A]')) {
        response = 'na';
      } else if (existing.isMet) {
        response = 'yes';
      } else {
        response = 'no';
      }
    }

    return existing
      ? {
          ...item,
          response,
          comments: existing.comments?.replace('[N/A] ', '') || '',
          evidenceIds: existing.evidenceIds || [],
        }
      : item;
  }),
}));

      setSections(hydratedSections);
    } else {
      setSections(initialSections);
    }
  }, [initialReport, userRole]);

  useEffect(() => {
    if (userRole === 'verifier') {
      setSections(createVerifierSections());
      return;
    }

    setSections((prev) => {
      const next = createQpSections(deliveryMode);

      return next.map((section) => {
        const existingSection = prev.find((s) => s.id === section.id);
        if (!existingSection) return section;

        return {
          ...section,
          items: section.items.map((item) => {
            const existingItem = existingSection.items.find((i) => i.id === item.id);
            return existingItem ? existingItem : item;
          }),
        };
      });
    });
  }, [deliveryMode, userRole]);

  const allItems = useMemo(() => sections.flatMap((section) => section.items), [sections]);

  const completion = useMemo(() => {
    const totalItems = countSectionItems(sections);
    if (totalItems === 0) return 0;

    const completedItems = allItems.filter(
      (item) => item.response !== '' && item.comments.trim().length > 0
    ).length;

    return Math.round((completedItems / totalItems) * 100);
  }, [allItems, sections]);

  const canComplete = useMemo(() => {
    const checklistComplete = allItems.every(
      (item) => item.response !== '' && item.comments.trim().length > 0
    );

    const summaryComplete = summary.trim().length > 0;
    const recommendationsComplete = recommendations.trim().length > 0;
    const verifierComplete = userRole === 'verifier' ? recommendation !== '' : true;

    return checklistComplete && summaryComplete && recommendationsComplete && verifierComplete;
  }, [allItems, summary, recommendations, recommendation, userRole]);

  const updateHeaderField = (field: keyof FormHeaderState, value: string) => {
    setHeaderFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateCriterionResponse = (
    sectionId: string,
    itemId: string,
    response: CriterionResponse
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, response } : item
              ),
            }
      )
    );
  };

  const updateCriterionComment = (sectionId: string, itemId: string, comments: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, comments } : item
              ),
            }
      )
    );
  };



 

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    handleFiles(Array.from(e.target.files));
  };

const handleFiles = (files: File[]) => {
  const newEvidenceItems: SiteVisitEvidence[] = files.map((file) => ({
    id: `evidence-${Date.now()}-${Math.random()}`,
    type: file.type.startsWith('image/') ? 'photo' : 'document',
    fileName: file.name,
    fileUrl: URL.createObjectURL(file),
    uploadedAt: new Date().toISOString(),
    description: uploadDescription || undefined,
  }));

  setEvidence((prev) => [...prev, ...newEvidenceItems]);
  setUploadDescription('');
};

  const removeEvidence = (id: string) => {
    setEvidence((prev) => prev.filter((item) => item.id !== id));
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          evidenceIds: item.evidenceIds.filter((evidenceId) => evidenceId !== id),
        })),
      }))
    );
  };

  const generateReport = (): SiteVisitReport => {
    const flattenedChecklist = flattenSectionsToChecklist(sections).map((item) => {
      const original = allItems.find((i) => i.id === item.id);
      return {
        ...item,
        comments:
          original?.response === 'na'
            ? `[N/A] ${item.comments}`
            : item.comments,
      };
    });

  const report: SiteVisitReport = {
  id: initialReport?.id || `report-${Date.now()}`,
  applicationId: application.id,
  conductedBy: userName,
  conductedByRole: userRole,
  conductedAt:
    application.siteVisitSchedule?.visitStartedAt ||
    initialReport?.conductedAt ||
    new Date().toISOString(),
  checklist: flattenedChecklist,
  evidence,
  summary,
  recommendations,
  outcome,
  ...(userRole === 'qp' && {
    riskProfile,
    qualification: headerFields.qualificationTitle || application.applicationData?.qualification,
    region: application.applicationData?.applicantInfo.region,
  }),
};
(report as any).visitExecution = {
  conductorName: userName,
  conductorRole: userRole,
  location: application.siteVisitSchedule?.currentLocation || '',
  onSiteVerified: application.siteVisitSchedule?.isOnSiteVerified || false,
  onSiteVerifiedAt: application.siteVisitSchedule?.onSiteVerifiedAt || '',
  visitStartedAt: application.siteVisitSchedule?.visitStartedAt || '',
  visitCompletedAt: application.siteVisitSchedule?.visitCompletedAt || '',
  durationMinutes: application.siteVisitSchedule?.durationMinutes || 0,
};

    (report as any).sections = sections;
    (report as any).deliveryMode = deliveryMode;
    (report as any).recommendation = recommendation;
    (report as any).additionalComments = additionalComments;
    (report as any).headerFields = headerFields;

    return report;
  };

  const handleSave = () => {
    const report = generateReport();
    onSave(report);
  };

  const handleComplete = () => {
    if (!canComplete) return;

    const report = generateReport();
    report.completedAt = new Date().toISOString();
    onComplete(report);
  };

  const downloadJson = () => {
    const report = generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-visit-evaluation-${application.applicationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-white border border-blue-200 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  QCTO Evaluation Instrument
                </h3>
                <p className="text-sm text-gray-600">
                  {userRole === 'qp'
                    ? 'Phase 2: Programme Delivery Readiness'
                    : 'Section B: Programme Delivery Readiness Recommendation'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Completion</div>
            <div className="w-36 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700">{completion}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Legal Name of SDP
            </label>
            <input
              value={headerFields.legalName}
              onChange={(e) => updateHeaderField('legalName', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Physical Address (Training Site)
            </label>
            <input
              value={headerFields.physicalAddress}
              onChange={(e) => updateHeaderField('physicalAddress', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Contact Person
            </label>
            <input
              value={headerFields.contactPerson}
              onChange={(e) => updateHeaderField('contactPerson', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Site Visit Date
            </label>
            <input
              type="date"
              value={headerFields.siteVisitDate}
              onChange={(e) => updateHeaderField('siteVisitDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Contact Number
            </label>
            <input
              value={headerFields.contactNumber}
              onChange={(e) => updateHeaderField('contactNumber', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Contact Email
            </label>
            <input
              value={headerFields.contactEmail}
              onChange={(e) => updateHeaderField('contactEmail', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Qualification / Curriculum Title
            </label>
            <input
              value={headerFields.qualificationTitle}
              onChange={(e) => updateHeaderField('qualificationTitle', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              EMIS No
            </label>
            <input
              value={headerFields.emisNo}
              onChange={(e) => updateHeaderField('emisNo', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              NQF Level
            </label>
            <input
              value={headerFields.nqfLevel}
              onChange={(e) => updateHeaderField('nqfLevel', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Credits
            </label>
            <input
              value={headerFields.credits}
              onChange={(e) => updateHeaderField('credits', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              SAQA ID
            </label>
            <input
              value={headerFields.saqaId}
              onChange={(e) => updateHeaderField('saqaId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Curriculum Code
            </label>
            <input
              value={headerFields.curriculumCode}
              onChange={(e) => updateHeaderField('curriculumCode', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            />
          </div>

          {userRole === 'qp' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Delivery Mode
                </label>
                <select
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="face_to_face">Face-to-Face</option>
                  <option value="hybrid_blended">Hybrid / Blended</option>
                  <option value="mobile_unit">Mobile Unit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Risk Profile
                </label>
                <select
                  value={riskProfile}
                  onChange={(e) =>
                    setRiskProfile(e.target.value as 'low' | 'medium' | 'high')
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800">{section.title}</h4>
            {section.description && (
              <p className="text-xs text-gray-500 mt-1">{section.description}</p>
            )}
          </div>

          <div className="p-5 space-y-4">
            {section.items.map((item) => {
              const linkedEvidence = item.evidenceIds
                .map((id) => findEvidenceById(evidence, id))
                .filter(Boolean) as SiteVisitEvidence[];

              return (
                <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full mt-0.5">
                            {item.id}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.criteria}</p>
                            {item.guidance && item.guidance.length > 0 && (
                              <ul className="mt-2 text-xs text-gray-500 list-disc list-inside space-y-1">
                                {item.guidance.map((guide, index) => (
                                  <li key={index}>{guide}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateCriterionResponse(section.id, item.id, 'yes')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                            item.response === 'yes'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-white text-gray-600 border-gray-300'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCriterionResponse(section.id, item.id, 'no')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                            item.response === 'no'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-white text-gray-600 border-gray-300'
                          }`}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCriterionResponse(section.id, item.id, 'na')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                            item.response === 'na'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : 'bg-white text-gray-600 border-gray-300'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Remarks in line with evidence <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={item.comments}
                        onChange={(e) =>
                          updateCriterionComment(section.id, item.id, e.target.value)
                        }
                        placeholder="Provide narrative evidence / findings for this criterion..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      

                      
                      </div>

                      {linkedEvidence.length > 0 && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Linked Evidence
                          </p>
                          <div className="space-y-2">
                            {linkedEvidence.map((evidenceItem) => (
                              <div
                                key={evidenceItem.id}
                                className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-3 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  {evidenceItem.type === 'photo' ? (
                                    <Image className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-purple-500" />
                                  )}
                                  <div>
                                    <p className="text-xs font-medium text-gray-700">
                                      {evidenceItem.fileName}
                                    </p>
                                    {evidenceItem.description && (
                                      <p className="text-xs text-gray-500">
                                        {evidenceItem.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                            
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Evidence */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800">Evidence Collection</h4>
        </div>

        <div className="p-5">
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center mb-5 ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop photos or documents, or{' '}
              <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                browse
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </p>
            <p className="text-xs text-gray-500">
              Photos, PDF, DOC up to 10MB each
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
              <input
                type="text"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Add description for uploads..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
              />

          
            </div>
          </div>

          {evidence.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">Uploaded Evidence</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evidence.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      {item.type === 'photo' ? (
                        <Image className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-purple-500" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-700">{item.fileName}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeEvidence(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Findings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800">Findings & Recommendation</h4>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Executive Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Provide a structured summary of the site visit findings..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommendations <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Provide recommendations based on the evidence and findings..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments / Any Other Information
            </label>
            <textarea
              rows={3}
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              placeholder="Capture any additional information not covered by the criteria..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) =>
                  setOutcome(
                    e.target.value as 'compliant' | 'partially_compliant' | 'non_compliant'
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="compliant">Compliant</option>
                <option value="partially_compliant">Partially Compliant</option>
                <option value="non_compliant">Non-Compliant</option>
              </select>
            </div>

            {userRole === 'verifier' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programme Delivery Readiness Recommendation <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setRecommendation('recommended')}
                    className={`px-4 py-2 rounded-md border text-sm font-medium ${
                      recommendation === 'recommended'
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Recommended
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommendation('not_recommended')}
                    className={`px-4 py-2 rounded-md border text-sm font-medium ${
                      recommendation === 'not_recommended'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Not Recommended
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="text-xs text-gray-500">
          Completion requires all visible criteria to have a response and remarks, plus a completed summary and recommendation.
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={downloadJson}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={handleComplete}
            disabled={!canComplete}
            className={`px-4 py-2 text-sm rounded-md ${
              canComplete
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Complete & Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}