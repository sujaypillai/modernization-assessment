import type { Application, AppType, AppProperty, ModDriver } from '@/types'

const API_BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// Applications
export async function getApplications(): Promise<Application[]> {
  return fetchJson<Application[]>(`${API_BASE}/applications`)
}

export async function getApplication(id: number): Promise<Application> {
  return fetchJson<Application>(`${API_BASE}/applications/${id}`)
}

export async function updateApplication(id: number, data: Partial<Application>): Promise<Application> {
  return fetchJson<Application>(`${API_BASE}/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function createApplication(data: Omit<Application, 'id'>): Promise<Application> {
  return fetchJson<Application>(`${API_BASE}/applications`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function deleteApplication(id: number): Promise<void> {
  await fetch(`${API_BASE}/applications/${id}`, { method: 'DELETE' })
}

export async function refreshAssessments(): Promise<{ message: string; count: number }> {
  return fetchJson<{ message: string; count: number }>(`${API_BASE}/assessments/refresh`, {
    method: 'POST'
  })
}

export async function uploadReports(files: File[]): Promise<{ message: string; uploaded: number; processed: number }> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }
  const response = await fetch(`${API_BASE}/assessments/upload`, {
    method: 'POST',
    body: formData
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${response.status}`)
  }
  return response.json()
}

// AppTypes
export async function getAppTypes(): Promise<AppType[]> {
  return fetchJson<AppType[]>(`${API_BASE}/app-types`)
}

export async function getAppType(id: number): Promise<AppType> {
  return fetchJson<AppType>(`${API_BASE}/app-types/${id}`)
}

export async function createAppType(data: Omit<AppType, 'id'>): Promise<AppType> {
  return fetchJson<AppType>(`${API_BASE}/app-types`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateAppType(id: number, data: Partial<AppType>): Promise<AppType> {
  return fetchJson<AppType>(`${API_BASE}/app-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteAppType(id: number): Promise<void> {
  await fetch(`${API_BASE}/app-types/${id}`, { method: 'DELETE' })
}

// AppProperties
export async function getAppProperties(): Promise<AppProperty[]> {
  return fetchJson<AppProperty[]>(`${API_BASE}/app-properties`)
}

export async function getAppProperty(id: number): Promise<AppProperty> {
  return fetchJson<AppProperty>(`${API_BASE}/app-properties/${id}`)
}

export async function createAppProperty(data: Omit<AppProperty, 'id'>): Promise<AppProperty> {
  return fetchJson<AppProperty>(`${API_BASE}/app-properties`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateAppProperty(id: number, data: Partial<AppProperty>): Promise<AppProperty> {
  return fetchJson<AppProperty>(`${API_BASE}/app-properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteAppProperty(id: number): Promise<void> {
  await fetch(`${API_BASE}/app-properties/${id}`, { method: 'DELETE' })
}

// ModDrivers
export async function getModDrivers(): Promise<ModDriver[]> {
  return fetchJson<ModDriver[]>(`${API_BASE}/mod-drivers`)
}

export async function getModDriver(id: number): Promise<ModDriver> {
  return fetchJson<ModDriver>(`${API_BASE}/mod-drivers/${id}`)
}

export async function createModDriver(data: Omit<ModDriver, 'id'>): Promise<ModDriver> {
  return fetchJson<ModDriver>(`${API_BASE}/mod-drivers`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateModDriver(id: number, data: Partial<ModDriver>): Promise<ModDriver> {
  return fetchJson<ModDriver>(`${API_BASE}/mod-drivers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteModDriver(id: number): Promise<void> {
  await fetch(`${API_BASE}/mod-drivers/${id}`, { method: 'DELETE' })
}
