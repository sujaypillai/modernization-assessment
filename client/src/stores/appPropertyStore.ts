import { ref } from 'vue'
import type { AppProperty } from '@/types'
import {
  getAppProperties,
  createAppProperty as apiCreate,
  updateAppProperty as apiUpdate,
  deleteAppProperty as apiDelete
} from '@/services/api'

const appProperties = ref<AppProperty[]>([])
const loaded = ref(false)

export function useAppPropertyStore() {
  async function loadAppProperties() {
    appProperties.value = await getAppProperties()
    loaded.value = true
  }

  async function createAppProperty(data: Partial<AppProperty>): Promise<AppProperty> {
    const created = await apiCreate(data as Omit<AppProperty, 'id'>)
    appProperties.value.push(created)
    return created
  }

  async function updateAppProperty(id: number, data: Partial<AppProperty>) {
    const updated = await apiUpdate(id, data)
    const idx = appProperties.value.findIndex(p => p.id === id)
    if (idx !== -1) appProperties.value[idx] = updated
    return updated
  }

  async function deleteAppProperty(id: number) {
    await apiDelete(id)
    appProperties.value = appProperties.value.filter(p => p.id !== id)
  }

  return { appProperties, loaded, loadAppProperties, createAppProperty, updateAppProperty, deleteAppProperty }
}
