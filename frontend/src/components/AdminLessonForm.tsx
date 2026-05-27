import { type FormEvent, useState } from 'react'
import type { LessonFormData } from '../lib/api'

interface AdminLessonFormProps {
  initial: LessonFormData
  submitLabel: string
  onSubmit: (data: LessonFormData) => void
}

export default function AdminLessonForm({ initial, submitLabel, onSubmit }: AdminLessonFormProps) {
  const [form, setForm] = useState(initial)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form__grid">
        <label className="admin-field">
          <span className="admin-field__label">Lesson number</span>
          <input
            type="number"
            min={1}
            className="admin-field__input"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            required
          />
        </label>

        <label className="admin-field">
          <span className="admin-field__label">Duration</span>
          <input
            className="admin-field__input"
            placeholder="18 min"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            required
          />
        </label>

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
          <span className="admin-field__label">Description</span>
          <textarea
            className="admin-field__textarea"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <label className="admin-field admin-field--full">
          <span className="admin-field__label">Learning objectives (one per line)</span>
          <textarea
            className="admin-field__textarea"
            rows={4}
            value={form.objectives.join('\n')}
            onChange={(e) =>
              setForm({
                ...form,
                objectives: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
              })
            }
          />
        </label>

        <label className="admin-field admin-field--full">
          <span className="admin-field__label">Lesson notes</span>
          <textarea
            className="admin-field__textarea"
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
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

export const emptyLessonForm: LessonFormData = {
  title: '',
  duration: '',
  sortOrder: 1,
  description: '',
  objectives: [],
  notes: '',
}
