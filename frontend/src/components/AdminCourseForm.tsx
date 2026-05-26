import { type FormEvent, useState } from 'react'
import { CATEGORIES, type CourseCategory, type CourseStatus } from '../data/courses'
import type { CourseFormData } from '../lib/api'

interface AdminCourseFormProps {
  initial: CourseFormData
  submitLabel: string
  onSubmit: (data: CourseFormData) => void
}

export default function AdminCourseForm({ initial, submitLabel, onSubmit }: AdminCourseFormProps) {
  const [form, setForm] = useState(initial)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
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
            onChange={(e) => setForm({ ...form, category: e.target.value as CourseCategory })}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
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
  description: '',
  overview: '',
  category: 'Clinical Documentation',
  status: 'coming_soon',
  price: 49,
  whatYouLearn: [],
}
