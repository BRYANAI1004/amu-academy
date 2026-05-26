import type { Course, Lesson } from './types'

function parseDurationSeconds(duration: string): number {
  const match = duration.match(/(\d+)/)
  return match ? Number(match[1]) * 60 : 0
}

function makeLesson(
  courseId: string,
  id: string,
  sortOrder: number,
  title: string,
  duration: string,
  description: string,
  objectives: string[] = [],
  notes = '',
): Lesson {
  return {
    id,
    courseId,
    title,
    description,
    duration,
    durationSeconds: parseDurationSeconds(duration),
    sortOrder,
    isPreview: sortOrder === 1,
    videoProvider: null,
    videoUid: null,
    videoStatus: 'none',
    objectives,
    notes,
  }
}

const now = '2026-01-01T00:00:00.000Z'

export const seedCourses: Course[] = [
  {
    id: 'clinical-documentation-foundations',
    slug: 'clinical-documentation-foundations',
    title: 'Advanced Clinical Documentation & Admission Criteria',
    category: 'Clinical Documentation',
    shortDescription:
      'Master documentation standards and admission workflows for acute care settings.',
    description:
      'Master the standards and best practices for clinical documentation and patient admission workflows across acute care environments.',
    overview:
      'This course provides a structured foundation in admission criteria, medical necessity documentation, and compliance-ready clinical records.',
    whatYouLearn: [
      'Apply admission criteria across common acute care scenarios',
      'Document medical necessity with clarity and compliance in mind',
      'Use structured assessment frameworks in daily workflows',
      'Reduce audit risk through consistent documentation habits',
    ],
    price: 49,
    priceCents: 4900,
    status: 'available',
    lessons: [
      makeLesson(
        'clinical-documentation-foundations',
        'cdf-l1',
        1,
        'Understanding Admission Criteria',
        '18 min',
        'Build a clear foundation in admission criteria used across acute care settings.',
        [
          'Apply the three-tier admission assessment model',
          'Identify required documentation for each admission type',
        ],
        'Explore foundational admission criteria and medical necessity documentation.',
      ),
      makeLesson(
        'clinical-documentation-foundations',
        'cdf-l2',
        2,
        'Documentation Standards & Compliance',
        '24 min',
        'Learn how documentation standards support continuity of care and regulatory compliance.',
        ['Map documentation to payer and CMS requirements'],
        'CMS requirements and Joint Commission standards.',
      ),
      makeLesson(
        'clinical-documentation-foundations',
        'cdf-l3',
        3,
        'Clinical Assessment Frameworks',
        '21 min',
        'Discover evidence-based clinical assessment frameworks.',
        ['Select appropriate assessment instruments for each case'],
        'Integrate evidence-based assessment tools.',
      ),
      makeLesson(
        'clinical-documentation-foundations',
        'cdf-l4',
        4,
        'Risk Stratification & Triage Protocols',
        '16 min',
        'Understand how risk stratification and triage protocols prioritize patients.',
        ['Apply validated risk scoring tools in practice'],
        'Triage protocols in emergency and inpatient settings.',
      ),
      makeLesson(
        'clinical-documentation-foundations',
        'cdf-l5',
        5,
        'Case Studies & Practical Application',
        '28 min',
        'Synthesize course concepts through case studies.',
        ['Analyze multi-factor admission decisions'],
        'Applied admission scenarios.',
      ),
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'medical-necessity-review-foundations',
    slug: 'medical-necessity-review-foundations',
    title: 'Medical Necessity Review Foundations',
    category: 'Clinical Documentation',
    shortDescription:
      'Learn core principles for evaluating and documenting medical necessity in clinical reviews.',
    description:
      'Build practical skills for medical necessity review, payer alignment, and defensible clinical documentation.',
    overview:
      'Introduces the language, standards, and documentation patterns that support sound medical necessity determinations.',
    whatYouLearn: [
      'Define medical necessity in payer and clinical contexts',
      'Identify common documentation gaps in reviews',
      'Apply review criteria consistently across cases',
    ],
    price: 39,
    priceCents: 3900,
    status: 'available',
    lessons: [
      makeLesson(
        'medical-necessity-review-foundations',
        'mnr-l1',
        1,
        'Medical Necessity Fundamentals',
        '16 min',
        'Understand what medical necessity means across clinical and payer perspectives.',
      ),
      makeLesson(
        'medical-necessity-review-foundations',
        'mnr-l2',
        2,
        'Review Criteria & Frameworks',
        '20 min',
        'Learn structured frameworks used in medical necessity reviews.',
      ),
      makeLesson(
        'medical-necessity-review-foundations',
        'mnr-l3',
        3,
        'Documentation for Utilization Review',
        '18 min',
        'Focus on documentation patterns that support successful reviews.',
      ),
      makeLesson(
        'medical-necessity-review-foundations',
        'mnr-l4',
        4,
        'Case Review Practice',
        '22 min',
        'Practice reviewing cases and summarizing findings.',
      ),
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'healthcare-operations-essentials',
    slug: 'healthcare-operations-essentials',
    title: 'Healthcare Operations Essentials',
    category: 'Healthcare Operations',
    shortDescription:
      'Core operational concepts for medical teams managing day-to-day healthcare delivery.',
    description:
      'An introduction to healthcare operations, workflow coordination, and team-based service delivery.',
    overview: 'Operational foundations for healthcare teams — scheduling, handoffs, and coordination.',
    whatYouLearn: [
      'Understand core healthcare operations workflows',
      'Coordinate teams across clinical and administrative functions',
    ],
    price: 59,
    priceCents: 5900,
    status: 'coming_soon',
    lessons: [
      makeLesson('healthcare-operations-essentials', 'hoe-l1', 1, 'Operations Overview', '15 min', ''),
      makeLesson('healthcare-operations-essentials', 'hoe-l2', 2, 'Workflow Coordination', '18 min', ''),
      makeLesson('healthcare-operations-essentials', 'hoe-l3', 3, 'Capacity & Scheduling', '20 min', ''),
      makeLesson('healthcare-operations-essentials', 'hoe-l4', 4, 'Team Handoffs', '17 min', ''),
      makeLesson('healthcare-operations-essentials', 'hoe-l5', 5, 'Quality Metrics Basics', '19 min', ''),
      makeLesson('healthcare-operations-essentials', 'hoe-l6', 6, 'Operational Case Studies', '24 min', ''),
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'revenue-cycle-basics',
    slug: 'revenue-cycle-basics',
    title: 'Revenue Cycle Basics for Medical Teams',
    category: 'Healthcare Operations',
    shortDescription: 'Foundational revenue cycle concepts for clinical and operational staff.',
    description:
      'Learn how clinical documentation, coding, and billing workflows connect in the healthcare revenue cycle.',
    overview: 'Cross-functional awareness of revenue cycle stages and documentation impact.',
    whatYouLearn: [
      'Map the stages of the healthcare revenue cycle',
      'Understand how documentation affects reimbursement',
    ],
    price: 59,
    priceCents: 5900,
    status: 'coming_soon',
    lessons: [
      makeLesson('revenue-cycle-basics', 'rcb-l1', 1, 'Revenue Cycle Overview', '16 min', ''),
      makeLesson('revenue-cycle-basics', 'rcb-l2', 2, 'Documentation & Coding Link', '18 min', ''),
      makeLesson('revenue-cycle-basics', 'rcb-l3', 3, 'Claims & Adjudication', '20 min', ''),
      makeLesson('revenue-cycle-basics', 'rcb-l4', 4, 'Denials & Appeals Intro', '17 min', ''),
      makeLesson('revenue-cycle-basics', 'rcb-l5', 5, 'Team Collaboration in RCM', '19 min', ''),
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'leadership-communication-clinical',
    slug: 'leadership-communication-clinical',
    title: 'Leadership Communication in Clinical Settings',
    category: 'Medical Leadership',
    shortDescription: 'Communication strategies for clinical leaders and interdisciplinary teams.',
    description:
      'Develop leadership communication skills for high-stakes clinical environments and team alignment.',
    overview: 'Communication frameworks for clinical leaders under pressure.',
    whatYouLearn: [
      'Lead difficult conversations with clinical clarity',
      'Build trust across interdisciplinary teams',
    ],
    price: 49,
    priceCents: 4900,
    status: 'coming_soon',
    lessons: [
      makeLesson('leadership-communication-clinical', 'lcc-l1', 1, 'Clinical Leadership Communication', '17 min', ''),
      makeLesson('leadership-communication-clinical', 'lcc-l2', 2, 'Feedback & Accountability', '19 min', ''),
      makeLesson('leadership-communication-clinical', 'lcc-l3', 3, 'Escalation & Conflict', '18 min', ''),
      makeLesson('leadership-communication-clinical', 'lcc-l4', 4, 'Team Alignment Workshops', '21 min', ''),
    ],
    createdAt: now,
    updatedAt: now,
  },
]
