import { useMemo, type FormEvent, useState } from 'react'
import { type CourseStatus } from '../data/courses'
import type { ApiCategory, CourseFormData } from '../lib/api'

interface AdminCourseFormProps {
  initial: CourseFormData
  categories: ApiCategory[]
  submitLabel: string
  onSubmit: (data: CourseFormData) => void
  formId?: string
}

export default function AdminCourseForm({
  initial,
  categories,
  submitLabel,
  onSubmit,
  formId,
}: AdminCourseFormProps) {
  const [form, setForm] = useState(initial)

  const categoryOptions = useMemo(() => {
    const active = categories.filter((category) => category.isActive)
    const names = new Set(active.map((category) => category.name))
    const options = active.map((category) => ({
      value: category.name,
      label: category.name,
    }))

    if (form.category && !names.has(form.category)) {
      options.unshift({
        value: form.category,
        label: `Current: ${form.category}`,
      })
    }

    return options
  }, [categories, form.category])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form id={formId} className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form__grid">
        <label className="admin-field admin-field--full">
          <span className="admin-field__label">Title</span>
          <input
            className="admin-field__input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>

        <label className="admin-field admin-field--full">
          <span className="admin-field__label">Short description</span>
          <input
            className="admin-field__input"
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            required
          />
        </label>

        <label className="admin-field admin-field--full">
          <span className="admin-field__label">Instructor</span>
          <input
            className="admin-field__input"
            value={form.instructor}
            onChange={(e) => setForm({ ...form, instructor: e.target.value })}
            placeholder="Instructor name"
          />
        </label>

        <label className="admin-field admin-field--full">
          <span className="admin-field__label">Description</span>
          <textarea
            className="admin-field__textarea"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </label>

        <label className="admin-field admin-field--full">
          <span className="admin-field__label">Overview</span>
          <textarea
            className="admin-field__textarea"
            rows={3}
            value={form.overview}
            onChange={(e) => setForm({ ...form, overview: e.target.value })}
            required
          />
        </label>

        <label className="admin-field">
          <span className="admin-field__label">Category</span>
          <select
            className="admin-field__input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-field__label">Status</span>
          <select
            className="admin-field__input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as CourseStatus })}
          >
            <option value="available">Available</option>
            <option value="coming_soon">Coming soon</option>
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-field__label">Price (USD)</span>
          <input
            type="number"
            min={0}
            className="admin-field__input"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            required
          />
        </label>

        <label className="admin-field admin-field--full">
          <span className="admin-field__label">What you&apos;ll learn (one item per line)</span>
          <textarea
            className="admin-field__textarea"
            rows={4}
            value={form.whatYouLearn.join('\n')}
            onChange={(e) =>
              setForm({
                ...form,
                whatYouLearn: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
              })
            }
          />
        </label>
      </div>

      <div className="admin-form__actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

export const emptyCourseForm: CourseFormData = {
  title: '',
  shortDescription: '',
  instructor: '',
  description: '',
  overview: '',
  category: 'Clinical Documentation',
  status: 'coming_soon',
  price: 49,
  whatYouLearn: [],
}
