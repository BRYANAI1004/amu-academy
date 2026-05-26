export interface Lesson {
  id: string
  number: number
  title: string
  duration: string
  completed: boolean
}

export interface Course {
  id: string
  title: string
  description: string
  lessons: Lesson[]
}

export interface LessonContent {
  description: string
  objectives: string[]
  notes: string
}

export const mockCourse: Course = {
  id: 'clinical-doc-101',
  title: 'Advanced Clinical Documentation & Admission Criteria',
  description:
    'Master the standards and best practices for clinical documentation and patient admission workflows.',
  lessons: [
    {
      id: 'lesson-1',
      number: 1,
      title: 'Understanding Admission Criteria',
      duration: '18 min',
      completed: false,
    },
    {
      id: 'lesson-2',
      number: 2,
      title: 'Documentation Standards & Compliance',
      duration: '24 min',
      completed: false,
    },
    {
      id: 'lesson-3',
      number: 3,
      title: 'Clinical Assessment Frameworks',
      duration: '21 min',
      completed: false,
    },
    {
      id: 'lesson-4',
      number: 4,
      title: 'Risk Stratification & Triage Protocols',
      duration: '16 min',
      completed: false,
    },
    {
      id: 'lesson-5',
      number: 5,
      title: 'Case Studies & Practical Application',
      duration: '28 min',
      completed: false,
    },
  ],
}

export const lessonContent: Record<string, LessonContent> = {
  'lesson-1': {
    description:
      'Build a clear foundation in admission criteria used across acute care settings — from eligibility and medical necessity to level-of-care decisions.',
    objectives: [
      'Apply the three-tier admission assessment model',
      'Identify required documentation for each admission type',
      'Evaluate real-world scenarios against standardized criteria',
    ],
    notes: `In this lesson, you'll explore the foundational admission criteria used across acute care settings. We cover eligibility requirements, medical necessity documentation, and the key decision points that determine appropriate level of care.`,
  },
  'lesson-2': {
    description:
      'Learn how documentation standards support continuity of care, regulatory compliance, and successful audits in modern clinical environments.',
    objectives: [
      'Map documentation to payer and CMS requirements',
      'Use structured note templates to reduce audit findings',
      'Implement quality checkpoints in daily workflows',
    ],
    notes: `Documentation standards ensure continuity of care and regulatory compliance. This lesson walks through CMS requirements, Joint Commission standards, and internal audit best practices.`,
  },
  'lesson-3': {
    description:
      'Discover evidence-based clinical assessment frameworks that help you evaluate patient acuity and care needs with confidence.',
    objectives: [
      'Select appropriate assessment instruments for each case',
      'Score and interpret clinical findings accurately',
      'Document assessment results with clinical clarity',
    ],
    notes: `Clinical assessment frameworks provide a systematic approach to evaluating patient acuity and care needs. Learn how to integrate evidence-based tools into your admission process.`,
  },
  'lesson-4': {
    description:
      'Understand how risk stratification and triage protocols prioritize patients and allocate resources in emergency and inpatient settings.',
    objectives: [
      'Apply validated risk scoring tools in practice',
      'Follow escalation pathways with clear rationale',
      'Document triage decisions for care team alignment',
    ],
    notes: `Risk stratification helps prioritize patients and allocate resources efficiently. Explore triage protocols used in emergency and inpatient settings.`,
  },
  'lesson-5': {
    description:
      'Synthesize course concepts through detailed case studies and practice making evidence-based admission decisions under realistic constraints.',
    objectives: [
      'Analyze multi-factor admission decisions',
      'Identify documentation gaps in complex cases',
      'Strengthen your clinical judgment framework',
    ],
    notes: `Apply everything you've learned through detailed case studies. Walk through complex admission scenarios and practice making evidence-based decisions.`,
  },
}

/** @deprecated Use lessonContent — kept for any legacy imports */
export const lessonNotes: Record<string, string> = Object.fromEntries(
  Object.entries(lessonContent).map(([id, c]) => [id, c.notes]),
)
