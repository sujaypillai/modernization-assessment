import { ref, computed } from 'vue'
import { useApplicationStore } from './applicationStore'
import { useAppPropertyStore } from './appPropertyStore'
import { formatAppTypeLabel } from '@/types'

const filters = ref<Record<string, unknown[]>>({})

export function useFilterStore() {
  const { applications } = useApplicationStore()
  const { appProperties } = useAppPropertyStore()

  const filterDefinitions = computed(() => {
    const defs: { key: string; label: string; dataType: string }[] = [
      { key: 'type', label: 'Type', dataType: 'VAR' },
      { key: 'target', label: 'Target', dataType: 'VAR' }
    ]
    for (const prop of appProperties.value) {
      defs.push({ key: `prop:${prop.name}`, label: prop.name, dataType: prop.dataType })
    }
    return defs
  })

  function getOptions(key: string): unknown[] {
    const values = new Set<unknown>()
    for (const app of applications.value) {
      let val: unknown
      if (key === 'target') {
        val = app.target
      } else if (key === 'type') {
        val = formatAppTypeLabel(app.appType)
      } else if (key.startsWith('prop:')) {
        val = app.properties?.[key.slice(5)]
      }
      if (val !== undefined && val !== null && val !== '') {
        values.add(val)
      }
    }
    return Array.from(values).sort((a, b) => {
      if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? -1 : 1
      return String(a).localeCompare(String(b), undefined, { numeric: true })
    })
  }

  const filteredApplications = computed(() => {
    return applications.value.filter(app => {
      for (const [key, selected] of Object.entries(filters.value)) {
        if (!selected || selected.length === 0) continue

        let value: unknown
        if (key === 'target') {
          value = app.target
        } else if (key === 'type') {
          value = formatAppTypeLabel(app.appType)
        } else if (key.startsWith('prop:')) {
          value = app.properties?.[key.slice(5)]
        }

        if (!selected.some(s => s === value)) return false
      }
      return true
    })
  })

  function setFilter(key: string, values: unknown[]) {
    filters.value = { ...filters.value, [key]: values }
  }

  function clearFilters() {
    filters.value = {}
  }

  const activeFilterCount = computed(() =>
    Object.values(filters.value).filter(v => v && v.length > 0).length
  )

  return {
    filters,
    filterDefinitions,
    getOptions,
    filteredApplications,
    setFilter,
    clearFilters,
    activeFilterCount
  }
}
