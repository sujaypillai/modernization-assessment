<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Paginator from 'primevue/paginator'
import { useToast } from 'primevue/usetoast'
import type { Application, ModDriver } from '@/types'
import AppDetails from '@/components/AppDetails.vue'
import { useApplicationStore } from '@/stores/applicationStore'
import { useModDriverStore } from '@/stores/modDriverStore'

const toast = useToast()
const { applications, loadApplications, updateApplication } = useApplicationStore()
const { modDrivers, loadModDrivers } = useModDriverStore()
const loading = ref(true)
const draggedDriver = ref<ModDriver | null>(null)
const selectedApp = ref<Application | null>(null)
const first = ref(0)
const pageSize = 25

const includedApps = computed(() =>
  applications.value.filter(a => a.include)
)

const pagedApps = computed(() =>
  includedApps.value.slice(first.value, first.value + pageSize)
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

function hasDriver(app: Application, driver: ModDriver): boolean {
  const driverMap = (app.drivers || {}) as Record<string, number>
  return driver.id.toString() in driverMap
}

function onDragStart(event: DragEvent, driver: ModDriver) {
  draggedDriver.value = driver
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', driver.id.toString())
  }
}

function onDragEnd() {
  draggedDriver.value = null
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

async function onDrop(event: DragEvent, app: Application) {
  event.preventDefault()
  if (!draggedDriver.value) return

  const driver = draggedDriver.value
  if (hasDriver(app, driver)) {
    toast.add({ severity: 'info', summary: 'Already Applied', detail: `${driver.name} is already applied to ${app.name}`, life: 2000 })
    return
  }

  const newDrivers = { ...(app.drivers as Record<string, number> || {}), [driver.id]: driver.score }

  try {
    await updateApplication(app.id, { drivers: newDrivers })
    app.drivers = newDrivers
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to apply driver', life: 3000 })
  }
}

async function removeDriver(app: Application, driver: ModDriver) {
  const newDrivers = { ...(app.drivers as Record<string, number> || {}) }
  delete newDrivers[driver.id]

  try {
    await updateApplication(app.id, { drivers: newDrivers })
    app.drivers = newDrivers
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove driver', life: 3000 })
  }
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

onMounted(loadData)
</script>

<template>
  <div class="value-assessment-view">
    <div class="view-header">
      <h2>Value Assessment</h2>
      <p class="view-description">Drag modernization drivers onto applications to assign them</p>
    </div>

    <div class="assessment-layout">
      <!-- Applications on the left -->
      <div class="applications-panel">
        <h3><i class="pi pi-box"></i> Applications</h3>
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i> Loading...
        </div>
        <div v-else-if="includedApps.length === 0" class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>No included applications</p>
        </div>
        <template v-else>
          <div class="applications-list">
            <div
              v-for="app in pagedApps"
              :key="app.id"
              class="app-box"
              :class="{ 'drag-over': draggedDriver && !hasDriver(app, draggedDriver) }"
              @dragover="onDragOver"
              @drop="onDrop($event, app)"
            >
              <div class="app-box-title" @click="selectedApp = app">{{ app.name }}</div>
              <div class="app-box-drivers">
                <div
                  v-for="driver in getAppDrivers(app)"
                  :key="driver.id"
                  class="applied-chip"
                >
                  <span class="chip-name">{{ driver.name }}</span>
                  <span class="chip-score">{{ getDriverScore(app, driver.id) }}</span>
                  <button class="chip-remove" @click="removeDriver(app, driver)" title="Remove">×</button>
                </div>
                <span v-if="getAppDrivers(app).length === 0" class="drop-hint">Drop drivers here</span>
              </div>
            </div>
          </div>
          <Paginator
            v-if="includedApps.length > pageSize"
            v-model:first="first"
            :rows="pageSize"
            :totalRecords="includedApps.length"
            class="app-paginator"
          />
        </template>
      </div>

      <!-- Drivers on the right -->
      <div class="drivers-panel">
        <h3><i class="pi pi-bolt"></i> Modernization Drivers</h3>
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i> Loading...
        </div>
        <div v-else-if="modDrivers.length === 0" class="empty-state">
          <i class="pi pi-info-circle"></i>
          <p>No drivers defined</p>
        </div>
        <div v-else class="drivers-grid">
          <div
            v-for="driver in modDrivers"
            :key="driver.id"
            class="driver-card"
            draggable="true"
            @dragstart="onDragStart($event, driver)"
            @dragend="onDragEnd"
          >
            <div class="driver-header">
              <span class="driver-name">{{ driver.name }}</span>
              <span class="driver-score">{{ driver.score }}</span>
            </div>
            <p class="driver-desc">{{ driver.desc }}</p>
          </div>
        </div>
      </div>
    </div>
    <AppDetails :application="selectedApp" @close="selectedApp = null" />
  </div>
</template>

<style scoped>
.value-assessment-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.view-header {
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

.assessment-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
  overflow: hidden;
}

/* Applications panel (left) */
.applications-panel,
.drivers-panel {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-width: 0;
}

.applications-panel h3,
.drivers-panel h3 {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.applications-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.app-box {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  min-height: 64px;
  transition: all 0.15s;
  background: #fafafa;
  flex-shrink: 0;
}

.app-box.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  border-style: dashed;
}

.app-box-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.app-box-drivers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding-right: 0.5rem;
}

.applied-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.3;
}

.chip-name {
  font-weight: 500;
  white-space: nowrap;
}

.chip-score {
  background: #1e40af;
  color: white;
  border-radius: 3px;
  padding: 0 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.chip-remove {
  background: none;
  border: none;
  color: #1e40af;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  opacity: 0.6;
}

.chip-remove:hover {
  opacity: 1;
}

.drop-hint {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.8rem;
}

.app-paginator {
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

/* Drivers panel (right) */
.drivers-grid {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  align-content: start;
}

.driver-card {
  padding: 0.6rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.15s;
}

.driver-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.driver-card:active {
  cursor: grabbing;
}

.driver-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.driver-name {
  font-weight: 600;
  font-size: 0.8rem;
  color: #1e293b;
}

.driver-score {
  background: #3b82f6;
  color: white;
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.driver-desc {
  font-size: 0.7rem;
  color: #64748b;
  line-height: 1.3;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #64748b;
}

.loading-state i,
.empty-state i {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.5;
}
</style>
