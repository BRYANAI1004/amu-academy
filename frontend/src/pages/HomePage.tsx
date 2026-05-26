import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  BookOpen,
  Briefcase,
  Clock,
  GraduationCap,
  Menu,
  Play,
  Shield,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { login } from '../lib/auth'

const NAV_LINKS = [
  { label: 'Courses', href: '#featured-courses' },
  { label: 'Programs', href: '#categories' },
  { label: 'For Professionals', href: '#why-amu' },
  { label: 'About', href: '#bottom-cta' },
]

const CATEGORIES = [
  'Medical Documentation',
  'Clinical Criteria',
  'Healthcare Operations',
  'Leadership',
  'Continuing Education',
]

const FEATURED_COURSES = [
  {
    id: 'clinical-documentation',
    icon: BookOpen,
    title: 'Advanced Clinical Documentation',
    description:
      'Master admission criteria, charting standards, and compliance workflows used in leading healthcare institutions.',
    duration: '6 weeks',
    level: 'Intermediate',
    price: '$249',
  },
  {
    id: 'healthcare-leadership',
    icon: GraduationCap,
    title: 'Healthcare Leadership Essentials',
    description:
      'Build executive communication, team coordination, and strategic decision-making skills for clinical environments.',
    duration: '8 weeks',
    level: 'Advanced',
    price: '$329',
  },
  {
    id: 'operations-excellence',
    icon: Briefcase,
    title: 'Healthcare Operations Excellence',
    description:
      'Optimize patient flow, resource planning, and operational metrics with practical frameworks you can apply immediately.',
    duration: '5 weeks',
    level: 'Professional',
    price: '$199',
  },
]

const FLOATING_BADGES = [
  { label: 'Self-paced', position: 'top-left' as const },
  { label: 'Certificate-ready', position: 'top-right' as const },
  { label: 'Professional track', position: 'bottom-right' as const },
]

const WHY_FEATURES = [
  {
    icon: GraduationCap,
    title: 'Expert-led content',
    description: 'Courses shaped by clinicians, educators, and healthcare leaders with real-world experience.',
  },
  {
    icon: Clock,
    title: 'Flexible online access',
    description: 'Learn on your schedule with self-paced modules designed for busy medical professionals.',
  },
  {
    icon: Award,
    title: 'Certificate-ready learning',
    description: 'Structured pathways that prepare you for professional credentials and career advancement.',
  },
  {
    icon: Users,
    title: 'Built for healthcare careers',
    description: 'Every program aligns with the skills, standards, and expectations of modern healthcare practice.',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const featuredRef = useRef<HTMLElement>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const enterDemo = useCallback(() => {
    login()
    navigate('/learn')
  }, [navigate])

  const scrollToFeatured = useCallback(() => {
    featuredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileNavOpen(false)
  }, [])

  const handleNavClick = (href: string) => {
    setMobileNavOpen(false)
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="academy-home">
      <div className="academy-home__bg" aria-hidden="true">
        <div className="academy-home__blob academy-home__blob--red" />
        <div className="academy-home__blob academy-home__blob--gold" />
        <div className="academy-home__blob academy-home__blob--yellow" />
        <div className="academy-home__blob academy-home__blob--ivory" />
        <div className="academy-home__shape academy-home__shape--ring" />
        <div className="academy-home__shape academy-home__shape--arc" />
        <div className="academy-home__grain" />
      </div>

      <header className="academy-home__nav">
        <div className="academy-home__nav-inner">
          <a href="/home" className="academy-home__logo" aria-label="AMU Academy home">
            <span className="academy-home__logo-mark">AMU</span>
            <span className="academy-home__logo-text">Academy</span>
          </a>

          <nav className="academy-home__nav-links" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                className="academy-home__nav-link"
                onClick={() => handleNavClick(link.href)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="academy-home__nav-actions">
            <button
              type="button"
              className="academy-home__btn academy-home__btn--ghost"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className="academy-home__btn academy-home__btn--primary"
              onClick={enterDemo}
            >
              Preview Course
            </button>
          </div>

          <button
            type="button"
            className="academy-home__menu-toggle"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="academy-home__mobile-nav">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                className="academy-home__mobile-nav-link"
                onClick={() => handleNavClick(link.href)}
              >
                {link.label}
              </button>
            ))}
            <div className="academy-home__mobile-nav-actions">
              <button
                type="button"
                className="academy-home__btn academy-home__btn--ghost academy-home__btn--full"
                onClick={() => {
                  setMobileNavOpen(false)
                  navigate('/login')
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className="academy-home__btn academy-home__btn--primary academy-home__btn--full"
                onClick={enterDemo}
              >
                Preview Course
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="academy-home__main">
        <section className="academy-home__hero">
          <div className="academy-home__hero-content">
            <p className="academy-home__eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              Premium medical education
            </p>
            <h1 className="academy-home__headline">
              Advance Your{' '}
              <span className="academy-home__headline-accent">Medical Career</span> with{' '}
              <span className="academy-home__headline-accent academy-home__headline-accent--gold">
                AMU Academy
              </span>
            </h1>
            <p className="academy-home__subtitle">
              Premium online courses designed for healthcare professionals, lifelong learners, and
              future medical leaders.
            </p>
            <div className="academy-home__hero-actions">
              <button
                type="button"
                className="academy-home__btn academy-home__btn--primary academy-home__btn--lg"
                onClick={scrollToFeatured}
              >
                Explore Courses
              </button>
              <button
                type="button"
                className="academy-home__btn academy-home__btn--outline academy-home__btn--lg"
                onClick={enterDemo}
              >
                <Play size={18} aria-hidden="true" />
                Watch Preview
              </button>
            </div>
            <p className="academy-home__trust">
              Professional online learning • Certificate-ready courses • Flexible access
            </p>
          </div>

          <div className="academy-home__hero-visual">
            <div className="academy-home__preview-wrap">
              {FLOATING_BADGES.map((badge) => (
                <span
                  key={badge.label}
                  className={`academy-home__float-badge academy-home__float-badge--${badge.position}`}
                >
                  {badge.label}
                </span>
              ))}
              <div className="academy-home__preview-card">
                <div className="academy-home__preview-thumb">
                  <div className="academy-home__preview-thumb-inner">
                    <span className="academy-home__preview-tag">Featured Preview</span>
                    <button
                      type="button"
                      className="academy-home__play-btn"
                      aria-label="Play course preview"
                      onClick={enterDemo}
                    >
                      <Play size={28} fill="currentColor" aria-hidden="true" />
                    </button>
                    <div className="academy-home__preview-overlay">
                      <span className="academy-home__preview-lesson">Module 1</span>
                      <span className="academy-home__preview-video-title">
                        Introduction to Clinical Standards
                      </span>
                    </div>
                  </div>
                </div>
                <div className="academy-home__preview-body">
                  <h2 className="academy-home__preview-title">
                    Advanced Clinical Documentation &amp; Admission Criteria
                  </h2>
                  <div className="academy-home__badges">
                    <span className="academy-home__badge">
                      <BookOpen size={12} aria-hidden="true" />
                      Video Course
                    </span>
                    <span className="academy-home__badge">
                      <Shield size={12} aria-hidden="true" />
                      Certificate Track
                    </span>
                    <span className="academy-home__badge">
                      <Clock size={12} aria-hidden="true" />
                      Self-paced
                    </span>
                  </div>
                  <div className="academy-home__progress">
                    <div className="academy-home__progress-labels">
                      <span>Your learning pathway</span>
                      <span className="academy-home__progress-pct">32%</span>
                    </div>
                    <div className="academy-home__progress-bar">
                      <div className="academy-home__progress-fill" style={{ width: '32%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="categories" className="academy-home__categories">
          <div className="academy-home__categories-track">
            {CATEGORIES.map((category) => (
              <span key={category} className="academy-home__category-pill">
                {category}
              </span>
            ))}
          </div>
        </section>

        <section
          id="featured-courses"
          ref={featuredRef}
          className="academy-home__featured"
        >
          <div className="academy-home__section-header">
            <p className="academy-home__section-eyebrow">Curated for professionals</p>
            <h2 className="academy-home__section-title">Featured courses</h2>
            <p className="academy-home__section-desc">
              Explore programs designed to elevate clinical expertise, leadership, and operational
              excellence.
            </p>
          </div>
          <div className="academy-home__course-grid">
            {FEATURED_COURSES.map((course) => (
              <article key={course.id} className="academy-home__course-card">
                <div className="academy-home__course-card-accent" aria-hidden="true" />
                <div className="academy-home__course-icon" aria-hidden="true">
                  <course.icon size={20} />
                </div>
                <div className="academy-home__course-meta">
                  <span className="academy-home__course-level">{course.level}</span>
                  <span className="academy-home__course-duration">
                    <Clock size={13} aria-hidden="true" />
                    {course.duration}
                  </span>
                </div>
                <h3 className="academy-home__course-title">{course.title}</h3>
                <p className="academy-home__course-desc">{course.description}</p>
                <div className="academy-home__course-footer">
                  <span className="academy-home__course-price">{course.price}</span>
                  <button
                    type="button"
                    className="academy-home__btn academy-home__btn--secondary"
                    onClick={enterDemo}
                  >
                    View course
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="why-amu" className="academy-home__why">
          <div className="academy-home__section-header">
            <p className="academy-home__section-eyebrow">Why AMU Academy</p>
            <h2 className="academy-home__section-title">Education with purpose and polish</h2>
          </div>
          <div className="academy-home__feature-grid">
            {WHY_FEATURES.map(({ icon: Icon, title, description }) => (
              <article key={title} className="academy-home__feature-card">
                <div className="academy-home__feature-icon">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="academy-home__feature-title">{title}</h3>
                <p className="academy-home__feature-desc">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="bottom-cta" className="academy-home__cta">
          <div className="academy-home__cta-panel">
            <h2 className="academy-home__cta-title">
              Start building your professional learning pathway today.
            </h2>
            <button
              type="button"
              className="academy-home__btn academy-home__btn--cta"
              onClick={enterDemo}
            >
              Enter Demo Course
            </button>
          </div>
        </section>
      </main>

      <footer className="academy-home__footer">
        <p>&copy; {new Date().getFullYear()} AMU Academy. Professional online learning.</p>
      </footer>
    </div>
  )
}
