import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminGetCategories,
  adminUpdateCategory,
  ApiRequestError,
  type ApiCategoryWithCourseCount,
  type CategoryInput,
} from '../../lib/api'

interface CategoryFormState {
  name: string
  slug: string
  description: string
  sortOrder: number
  isActive: boolean
}

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  sortOrder: 0,
  isActive: true,
}

function categoryToForm(category: ApiCategoryWithCourseCount): CategoryFormState {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  }
}

function formToInput(form: CategoryFormState): CategoryInput {
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || undefined,
    description: form.description.trim() || null,
    sortOrder: form.sortOrder,
    isActive: form.isActive,
  }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ApiCategoryWithCourseCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ApiCategoryWithCourseCount | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminGetCategories()
      setCategories(data)
    } catch {
      setError('Could not load categories from the API.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(category: ApiCategoryWithCourseCount) {
    setEditing(category)
    setForm(categoryToForm(category))
    setFormError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError('Name is required.')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      if (editing) {
        await adminUpdateCategory(editing.id, formToInput(form))
      } else {
        await adminCreateCategory(formToInput(form))
      }
      closeModal()
      await loadCategories()
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'CATEGORY_SLUG_CONFLICT') {
        setFormError('That slug is already in use. Choose a different slug.')
      } else {
        setFormError('Could not save category. Is the backend running?')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category: ApiCategoryWithCourseCount) {
    if (!window.confirm(`Delete category "${category.name}"?`)) return

    setDeletingId(category.id)
    setError(null)

    try {
      await adminDeleteCategory(category.id)
      await loadCategories()
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'CATEGORY_IN_USE') {
        setError(
          'This category is used by existing courses. Reassign or rename the category before deleting.',
        )
      } else {
        setError('Could not delete category.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">Categories</h1>
          <p className="admin-page-head__subtitle">
            Manage course categories used across the academy catalog.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} aria-hidden="true" />
          New category
        </button>
      </div>

      {error && (
        <p className="admin-note admin-note--error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-panel admin-table-wrap">
        {loading ? (
          <p className="admin-empty-text">Loading categories…</p>
        ) : categories.length === 0 ? (
          <p className="admin-empty-text">No categories yet. Create your first category.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Sort order</th>
                <th>Active</th>
                <th>Courses using it</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <p className="admin-table__title">{category.name}</p>
                  </td>
                  <td>{category.slug}</td>
                  <td>{category.description || '—'}</td>
                  <td>{category.sortOrder}</td>
                  <td>
                    <span
                      className={`admin-badge ${category.isActive ? 'admin-badge--success' : 'admin-badge--muted'}`}
                    >
                      {category.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{category.courseCount}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-table__action"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil size={15} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-table__action admin-table__action--danger"
                        disabled={deletingId === category.id}
                        onClick={() => {
                          void handleDelete(category)
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        {deletingId === category.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="admin-modal"
            role="dialog"
            aria-labelledby="category-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal__head">
              <h2 id="category-form-title">{editing ? 'Edit category' : 'New category'}</h2>
              <button
                type="button"
                className="admin-modal__close"
                aria-label="Close"
                onClick={closeModal}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <p className="admin-note admin-note--error" role="alert">
                {formError}
              </p>
            )}

            <form className="admin-form" onSubmit={(e) => void handleSubmit(e)}>
              <div className="admin-form__grid">
                <label className="admin-field admin-field--full">
                  <span className="admin-field__label">Name</span>
                  <input
                    className="admin-field__input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>

                <label className="admin-field admin-field--full">
                  <span className="admin-field__label">Slug</span>
                  <input
                    className="admin-field__input"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="auto-generated from name if empty"
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

                <label className="admin-field">
                  <span className="admin-field__label">Sort order</span>
                  <input
                    type="number"
                    className="admin-field__input"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  />
                </label>

                <label className="admin-field">
                  <span className="admin-field__label">Active</span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                </label>
              </div>

              <div className="admin-form__actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
