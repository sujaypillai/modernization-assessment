<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import Paginator from 'primevue/paginator'
import { useToast } from 'primevue/usetoast'
import type { Application, ModDriver } from '@/types'
import AppDetails from '@/components/AppDetails.vue'
import { useApplicationStore } from '@/stores/applicationStore'
import { useModDriverStore } from '@/stores/modDriverStore'
import { useFilterStore } from '@/stores/filterStore'
import FilterToolbar from '@/components/FilterToolbar.vue'

const props = defineProps<{ active: boolean }>()

const toast = useToast()
const { loadApplications } = useApplicationStore()
const { modDrivers, loadModDrivers } = useModDriverStore()
const { filteredApplications } = useFilterStore()
const selectedApp = ref<Application | null>(null)
const loading = ref(true)
const first = ref(0)
const pageSize = 25

function getTotalScore(app: Application): number {
  const driverMap = (app.drivers || {}) as Record<string, number>
  return Object.values(driverMap).reduce((sum, score) => sum + score, 0)
}

const sortedApps = computed(() =>
  filteredApplications.value
    .filter(a => a.include)
    .sort((a, b) => getTotalScore(b) - getTotalScore(a))
)

const pagedApps = computed(() =>
  sortedApps.value.slice(first.value, first.value + pageSize)
)

function getAppDrivers(app: Application): ModDriver[] {
  const driverMap = (app.drivers || {}) as Record<string, number>
  const ids = Object.keys(driverMap).map(Number)
  return modDrivers.value.filter(d => ids.includes(d.id))
}

function getDriverScore(app: Application, driverId: number): number {
  const driverMap = (app.drivers || {}) as Record<string, number>
  return driverMap[driverId] ?? 0
}

async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      loadApplications(),
      loadModDrivers()
    ])
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data', life: 3000 })
  } finally {
    loading.value = false
  }
}

watch(() => props.active, (isActive) => {
  if (isActive) loadData()
})

onMounted(loadData)
</script>

<template>
  <div class="results-view">
    <div class="view-header">
      <div>
        <h2>Results</h2>
        <p class="view-description">Applications ranked by total modernization driver score</p>
      </div>
      <FilterToolbar />
    </div>

    <div class="view-content">
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i> Loading...
      </div>
      <div v-else-if="sortedApps.length === 0" class="empty-state">
        <i class="pi pi-chart-bar"></i>
        <p>No results yet</p>
        <small>Assign drivers to applications in the Value Assessment tab</small>
      </div>
      <template v-else>
        <div class="results-list">
          <div v-for="(app, index) in pagedApps" :key="app.id" class="result-row">
            <div class="result-rank">{{ first + index + 1 }}</div>
            <div class="result-body">
              <div class="result-header">
                <a class="result-name" @click="selectedApp = app">{{ app.name }}</a>
                <span class="result-total">{{ getTotalScore(app) }} pts</span>
              </div>
              <div class="result-drivers">
                <div
                  v-for="driver in getAppDrivers(app)"
                  :key="driver.id"
                  class="applied-chip"
                >
                  <span class="chip-name">{{ driver.name }}</span>
                  <span class="chip-score">{{ getDriverScore(app, driver.id) }}</span>
                </div>
                <span v-if="getAppDrivers(app).length === 0" class="no-drivers">No drivers assigned</span>
              </div>
            </div>
          </div>
        </div>
        <Paginator
          v-if="sortedApps.length > pageSize"
          v-model:first="first"
          :rows="pageSize"
          :totalRecords="sortedApps.length"
          class="results-paginator"
        />
      </template>
    </div>
    <AppDetails :application="selectedApp" @close="selectedApp = null" />
  </div>
</template>

<style scoped>
.results-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.view-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.view-description {
  color: #64748b;
  font-size: 0.875rem;
}

.view-content {
  flex: 1;
  overflow: auto;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-row {
  display: flex;
  align-items: stretch;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.result-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  flex-shrink: 0;
  background: #f1f5f9;
  font-weight: 700;
  font-size: 1rem;
  color: #64748b;
}

.result-row:nth-child(1) .result-rank { background: #fef9c3; color: #a16207; }
.result-row:nth-child(2) .result-rank { background: #e2e8f0; color: #475569; }
.result-row:nth-child(3) .result-rank { background: #fed7aa; color: #9a3412; }

.result-body {
  flex: 1;
  padding: 0.75rem 1rem;
  min-height: 56px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.result-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
}

.result-total {
  font-weight: 700;
  font-size: 1rem;
  color: #2563eb;
  white-space: nowrap;
}

.result-drivers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.applied-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.8rem;
  line-height: 1.4;
}

.chip-name {
  font-weight: 500;
}

.chip-score {
  background: #1e40af;
  color: white;
  border-radius: 3px;
  padding: 0 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.no-drivers {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.8rem;
}

.results-paginator {
  margin-top: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}
</style>
