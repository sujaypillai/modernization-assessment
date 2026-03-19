import { ref } from 'vue'
import type { Application } from '@/types'
import { getApplications, updateApplication as apiUpdateApplication } from '@/services/api'

const applications = ref<Application[]>([])
const loaded = ref(false)

export function useApplicationStore() {
  async function loadApplications() {
    applications.value = await getApplications()
    loaded.value = true
  }

  async function updateApplication(id: number, data: Partial<Application>) {
    await apiUpdateApplication(id, data)
    const idx = applications.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      Object.assign(applications.value[idx], data)
    }
  }

  function refreshIfLoaded() {
    if (loaded.value) return loadApplications()
  }

  return { applications, loaded, loadApplications, updateApplication, refreshIfLoaded }
}
