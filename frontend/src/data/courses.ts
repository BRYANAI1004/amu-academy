export type CourseCategory =
  | 'Clinical Documentation'
  | 'Healthcare Operations'
  | 'Medical Leadership'

export type CourseStatus = 'available' | 'coming_soon'

export interface CourseLesson {
  id: string
  number: number
  title: string
  duration: string
}

export interface LessonContent {
  description: string
  objectives: string[]
  notes: string
}

export interface Course {
  id: string
  title: string
  shortDescription: string
  description: string
  overview: string
  category: CourseCategory
  status: CourseStatus
  price: number
  lessons: CourseLesson[]
  whatYouLearn: string[]
  lessonContent: Record<string, LessonContent>
}

export const CATEGORIES: CourseCategory[] = [
  'Clinical Documentation',
  'Healthcare Operations',
  'Medical Leadership',
]

export const DEFAULT_LEARN_COURSE_ID = 'clinical-documentation-foundations'

export const courses: Course[] = [
  {
    id: 'clinical-documentation-foundations',
    title: 'Advanced Clinical Documentation & Admission Criteria',
    shortDescription:
      'Master documentation standards and admission workflows for acute care settings.',
    description:
      'Master the standards and best practices for clinical documentation and patient admission workflows across acute care environments.',
    overview:
      'This course provides a structured foundation in admission criteria, medical necessity documentation, and compliance-ready clinical records. Designed for healthcare learners who need practical, audit-aware documentation skills.',
    category: 'Clinical Documentation',
    status: 'available',
    price: 49,
    whatYouLearn: [
      'Apply admission criteria across common acute care scenarios',
      'Document medical necessity with clarity and compliance in mind',
      'Use structured assessment frameworks in daily workflows',
      'Reduce audit risk through consistent documentation habits',
    ],
    lessons: [
      { id: 'cdf-l1', number: 1, title: 'Understanding Admission Criteria', duration: '18 min' },
      { id: 'cdf-l2', number: 2, title: 'Documentation Standards & Compliance', duration: '24 min' },
      { id: 'cdf-l3', number: 3, title: 'Clinical Assessment Frameworks', duration: '21 min' },
      { id: 'cdf-l4', number: 4, title: 'Risk Stratification & Triage Protocols', duration: '16 min' },
      { id: 'cdf-l5', number: 5, title: 'Case Studies & Practical Application', duration: '28 min' },
    ],
    lessonContent: {
      'cdf-l1': {
        description:
          'Build a clear foundation in admission criteria used across acute care settings — from eligibility and medical necessity to level-of-care decisions.',
        objectives: [
          'Apply the three-tier admission assessment model',
          'Identify required documentation for each admission type',
          'Evaluate real-world scenarios against standardized criteria',
        ],
        notes:
          'Explore foundational admission criteria, eligibility requirements, and medical necessity documentation.',
      },
      'cdf-l2': {
        description:
          'Learn how documentation standards support continuity of care, regulatory compliance, and successful audits.',
        objectives: [
          'Map documentation to payer and CMS requirements',
          'Use structured note templates to reduce audit findings',
          'Implement quality checkpoints in daily workflows',
        ],
        notes: 'Walk through CMS requirements, Joint Commission standards, and internal audit best practices.',
      },
      'cdf-l3': {
        description:
          'Discover evidence-based clinical assessment frameworks for evaluating patient acuity and care needs.',
        objectives: [
          'Select appropriate assessment instruments for each case',
          'Score and interpret clinical findings accurately',
          'Document assessment results with clinical clarity',
        ],
        notes: 'Integrate evidence-based assessment tools into your admission process.',
      },
      'cdf-l4': {
        description:
          'Understand how risk stratification and triage protocols prioritize patients and allocate resources.',
        objectives: [
          'Apply validated risk scoring tools in practice',
          'Follow escalation pathways with clear rationale',
          'Document triage decisions for care team alignment',
        ],
        notes: 'Explore triage protocols used in emergency and inpatient settings.',
      },
      'cdf-l5': {
        description:
          'Synthesize course concepts through case studies and evidence-based admission decisions.',
        objectives: [
          'Analyze multi-factor admission decisions',
          'Identify documentation gaps in complex cases',
          'Strengthen your clinical judgment framework',
        ],
        notes: 'Apply course concepts through detailed admission scenarios.',
      },
    },
  },
  {
    id: 'medical-necessity-review-foundations',
    title: 'Medical Necessity Review Foundations',
    shortDescription:
      'Learn core principles for evaluating and documenting medical necessity in clinical reviews.',
    description:
      'Build practical skills for medical necessity review, payer alignment, and defensible clinical documentation in utilization management contexts.',
    overview:
      'Focused on review workflows, this course introduces the language, standards, and documentation patterns that support sound medical necessity determinations.',
    category: 'Clinical Documentation',
    status: 'available',
    price: 39,
    whatYouLearn: [
      'Define medical necessity in payer and clinical contexts',
      'Identify common documentation gaps in reviews',
      'Apply review criteria consistently across cases',
      'Communicate findings with clinical clarity',
    ],
    lessons: [
      { id: 'mnr-l1', number: 1, title: 'Medical Necessity Fundamentals', duration: '16 min' },
      { id: 'mnr-l2', number: 2, title: 'Review Criteria & Frameworks', duration: '20 min' },
      { id: 'mnr-l3', number: 3, title: 'Documentation for Utilization Review', duration: '18 min' },
      { id: 'mnr-l4', number: 4, title: 'Case Review Practice', duration: '22 min' },
    ],
    lessonContent: {
      'mnr-l1': {
        description: 'Understand what medical necessity means across clinical and payer perspectives.',
        objectives: [
          'Differentiate clinical need from payer criteria',
          'Recognize common review triggers',
        ],
        notes: 'Introduction to medical necessity language and review context.',
      },
      'mnr-l2': {
        description: 'Learn structured frameworks used in medical necessity reviews.',
        objectives: [
          'Apply standard review criteria to sample cases',
          'Document rationale using consistent terminology',
        ],
        notes: 'Frameworks for consistent, defensible review decisions.',
      },
      'mnr-l3': {
        description: 'Focus on documentation patterns that support successful reviews.',
        objectives: [
          'Identify high-risk documentation gaps',
          'Align notes with review requirements',
        ],
        notes: 'Practical documentation guidance for utilization review teams.',
      },
      'mnr-l4': {
        description: 'Practice reviewing cases and summarizing findings.',
        objectives: [
          'Complete a structured case review',
          'Draft clear, actionable review summaries',
        ],
        notes: 'Applied case review with guided feedback placeholders.',
      },
    },
  },
  {
    id: 'healthcare-operations-essentials',
    title: 'Healthcare Operations Essentials',
    shortDescription:
      'Core operational concepts for medical teams managing day-to-day healthcare delivery.',
    description:
      'An introduction to healthcare operations, workflow coordination, and team-based service delivery in modern care settings.',
    overview:
      'This course outlines operational foundations for healthcare teams — scheduling, handoffs, capacity planning, and cross-functional coordination.',
    category: 'Healthcare Operations',
    status: 'coming_soon',
    price: 59,
    whatYouLearn: [
      'Understand core healthcare operations workflows',
      'Coordinate teams across clinical and administrative functions',
      'Identify operational bottlenecks in care delivery',
    ],
    lessons: [
      { id: 'hoe-l1', number: 1, title: 'Operations Overview', duration: '15 min' },
      { id: 'hoe-l2', number: 2, title: 'Workflow Coordination', duration: '18 min' },
      { id: 'hoe-l3', number: 3, title: 'Capacity & Scheduling', duration: '20 min' },
      { id: 'hoe-l4', number: 4, title: 'Team Handoffs', duration: '17 min' },
      { id: 'hoe-l5', number: 5, title: 'Quality Metrics Basics', duration: '19 min' },
      { id: 'hoe-l6', number: 6, title: 'Operational Case Studies', duration: '24 min' },
    ],
    lessonContent: {},
  },
  {
    id: 'revenue-cycle-basics',
    title: 'Revenue Cycle Basics for Medical Teams',
    shortDescription:
      'Foundational revenue cycle concepts for clinical and operational staff.',
    description:
      'Learn how clinical documentation, coding, and billing workflows connect in the healthcare revenue cycle.',
    overview:
      'Designed for medical teams who need cross-functional awareness of revenue cycle stages, documentation impact, and common denial patterns.',
    category: 'Healthcare Operations',
    status: 'coming_soon',
    price: 59,
    whatYouLearn: [
      'Map the stages of the healthcare revenue cycle',
      'Understand how documentation affects reimbursement',
      'Recognize common denial and rework patterns',
    ],
    lessons: [
      { id: 'rcb-l1', number: 1, title: 'Revenue Cycle Overview', duration: '16 min' },
      { id: 'rcb-l2', number: 2, title: 'Documentation & Coding Link', duration: '18 min' },
      { id: 'rcb-l3', number: 3, title: 'Claims & Adjudication', duration: '20 min' },
      { id: 'rcb-l4', number: 4, title: 'Denials & Appeals Intro', duration: '17 min' },
      { id: 'rcb-l5', number: 5, title: 'Team Collaboration in RCM', duration: '19 min' },
    ],
    lessonContent: {},
  },
  {
    id: 'leadership-communication-clinical',
    title: 'Leadership Communication in Clinical Settings',
    shortDescription:
      'Communication strategies for clinical leaders and interdisciplinary teams.',
    description:
      'Develop leadership communication skills for high-stakes clinical environments, team alignment, and professional accountability.',
    overview:
      'Covers communication frameworks for clinical leaders — feedback, escalation, conflict resolution, and team clarity under pressure.',
    category: 'Medical Leadership',
    status: 'coming_soon',
    price: 49,
    whatYouLearn: [
      'Lead difficult conversations with clinical clarity',
      'Build trust across interdisciplinary teams',
      'Communicate decisions under operational pressure',
    ],
    lessons: [
      { id: 'lcc-l1', number: 1, title: 'Clinical Leadership Communication', duration: '17 min' },
      { id: 'lcc-l2', number: 2, title: 'Feedback & Accountability', duration: '19 min' },
      { id: 'lcc-l3', number: 3, title: 'Escalation & Conflict', duration: '18 min' },
      { id: 'lcc-l4', number: 4, title: 'Team Alignment Workshops', duration: '21 min' },
    ],
    lessonContent: {},
  },
]

export function getCourseById(courseId: string): Course | undefined {
  return courses.find((course) => course.id === courseId)
}

export function getCoursesByCategory(category: CourseCategory | 'All'): Course[] {
  if (category === 'All') return courses
  return courses.filter((course) => course.category === category)
}

export function formatCoursePrice(price: number): string {
  return `$${price}`
}
