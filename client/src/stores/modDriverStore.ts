import { ref } from 'vue'
import type { ModDriver } from '@/types'
import {
  getModDrivers,
  createModDriver as apiCreate,
  updateModDriver as apiUpdate,
  deleteModDriver as apiDelete
} from '@/services/api'

const modDrivers = ref<ModDriver[]>([])
const loaded = ref(false)

export function useModDriverStore() {
  async function loadModDrivers() {
    modDrivers.value = await getModDrivers()
    loaded.value = true
  }

  async function createModDriver(data: Partial<ModDriver>): Promise<ModDriver> {
    const created = await apiCreate(data as Omit<ModDriver, 'id'>)
    modDrivers.value.push(created)
    return created
  }

  async function updateModDriver(id: number, data: Partial<ModDriver>) {
    const updated = await apiUpdate(id, data)
    const idx = modDrivers.value.findIndex(d => d.id === id)
    if (idx !== -1) modDrivers.value[idx] = updated
    return updated
  }

  async function deleteModDriver(id: number) {
    await apiDelete(id)
    modDrivers.value = modDrivers.value.filter(d => d.id !== id)
  }

  return { modDrivers, loaded, loadModDrivers, createModDriver, updateModDriver, deleteModDriver }
}
