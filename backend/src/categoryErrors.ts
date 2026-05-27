export class CategoryInUseError extends Error {
  readonly code = 'CATEGORY_IN_USE'

  constructor() {
    super('Category is in use by courses.')
    this.name = 'CategoryInUseError'
  }
}

export class CategorySlugConflictError extends Error {
  readonly code = 'CATEGORY_SLUG_CONFLICT'

  constructor() {
    super('Category slug is already in use.')
    this.name = 'CategorySlugConflictError'
  }
}

export function isCategoryInUseError(error: unknown): error is CategoryInUseError {
  return error instanceof CategoryInUseError
}

export function isCategorySlugConflictError(error: unknown): error is CategorySlugConflictError {
  return error instanceof CategorySlugConflictError
}
