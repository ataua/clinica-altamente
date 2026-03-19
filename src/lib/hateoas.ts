export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface Link {
  href: string
  method?: HTTPMethod
  templated?: boolean
}

export interface PaginationLinks {
  self: Link
  first: Link
  prev: Link | null
  next: Link | null
  last: Link
}

export function generatePaginationLinks(
  basePath: string,
  currentPage: number,
  totalPages: number,
  additionalParams: Record<string, string> = {}
): PaginationLinks {
  const params = new URLSearchParams(additionalParams)

  const makeUrl = (page: number): string => {
    const p = new URLSearchParams(params)
    p.set('page', page.toString())
    const queryString = p.toString()
    return `${basePath}${queryString ? `?${queryString}` : ''}`
  }

  return {
    self: { href: makeUrl(currentPage) },
    first: { href: makeUrl(1) },
    prev: currentPage > 1 ? { href: makeUrl(currentPage - 1) } : null,
    next: currentPage < totalPages ? { href: makeUrl(currentPage + 1) } : null,
    last: { href: makeUrl(totalPages) },
  }
}

export function generateResourceLinks(
  resourcePath: string,
  id: string,
  actions: HTTPMethod[] = ['GET']
): Record<string, Link> {
  const base = `/api${resourcePath}/${id}`
  const links: Record<string, Link> = {
    self: { href: base },
  }

  if (actions.includes('PUT')) links.update = { href: base, method: 'PUT' }
  if (actions.includes('DELETE')) links.delete = { href: base, method: 'DELETE' }
  if (actions.includes('PATCH')) links.patch = { href: base, method: 'PATCH' }

  return links
}

export function generateResourceLinksWithRelations(
  resourcePath: string,
  id: string,
  actions: HTTPMethod[] = ['GET'],
  relations: Record<string, string> = {}
): Record<string, Link> {
  const links = generateResourceLinks(resourcePath, id, actions)

  Object.entries(relations).forEach(([key, path]) => {
    links[key] = { href: `/api${path.replace(':id', id)}` }
  })

  return links
}

export function generateCollectionLinks(
  resourcePath: string,
  context: Record<string, string> = {}
): Record<string, Link> {
  const base = `/api${resourcePath}`
  const links: Record<string, Link> = {
    self: { href: base },
    create: { href: base, method: 'POST' },
  }

  Object.entries(context).forEach(([key, value]) => {
    links[key] = { href: `/api${resourcePath}?${key}=${value}` }
  })

  return links
}

export function generateAppointmentLinks(
  appointmentId: string,
  patientId: string,
  professionalId: string,
  status: string
): Record<string, Link> {
  const base = `/api/appointments/${appointmentId}`
  const links: Record<string, Link> = {
    self: { href: base },
    patient: { href: `/api/patients/${patientId}` },
    professional: { href: `/api/professionals/${professionalId}` },
  }

  if (status === 'SCHEDULED' || status === 'CONFIRMED') {
    links.start = { href: `${base}/start`, method: 'POST' }
    links.cancel = { href: `${base}/cancel`, method: 'POST' }
    links.reschedule = { href: `${base}/reschedule`, method: 'POST' }
  }

  if (status === 'IN_PROGRESS') {
    links.complete = { href: `${base}/complete`, method: 'POST' }
  }

  return links
}

export function generatePatientLinks(
  patientId: string,
  userId: string
): Record<string, Link> {
  return {
    self: { href: `/api/patients/${patientId}` },
    user: { href: `/api/users/${userId}` },
    appointments: { href: `/api/appointments?patientId=${patientId}` },
    attendances: { href: `/api/attendances?patientId=${patientId}` },
    update: { href: `/api/patients/${patientId}`, method: 'PUT' },
    delete: { href: `/api/patients/${patientId}`, method: 'DELETE' },
  }
}

export function generateAttendanceLinks(
  attendanceId: string,
  appointmentId: string,
  patientId: string,
  professionalId: string,
  status: string
): Record<string, Link> {
  const base = `/api/attendances/${attendanceId}`
  const links: Record<string, Link> = {
    self: { href: base },
    appointment: { href: `/api/appointments/${appointmentId}` },
    patient: { href: `/api/patients/${patientId}` },
    professional: { href: `/api/professionals/${professionalId}` },
  }

  if (status === 'PENDING') {
    links.start = { href: `${base}/start`, method: 'POST' }
  }

  if (status === 'IN_PROGRESS') {
    links.complete = { href: `${base}/complete`, method: 'POST' }
  }

  return links
}
