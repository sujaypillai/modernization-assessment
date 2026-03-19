<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import type { Application } from '@/types'
import AppDetails from '@/components/AppDetails.vue'
import { useApplicationStore } from '@/stores/applicationStore'
import { useModDriverStore } from '@/stores/modDriverStore'

const props = defineProps<{ active: boolean }>()

const toast = useToast()
const { applications, loadApplications } = useApplicationStore()
const { loadModDrivers } = useModDriverStore()
const loading = ref(true)
const selectedApp = ref<Application | null>(null)

function getTotalScore(app: Application): number {
  const driverMap = (app.drivers || {}) as Record<string, number>
  return Object.values(driverMap).reduce((sum, s) => sum + s, 0)
}

const DOT_SIZE = 16

const plottedApps = computed(() => {
  const included = applications.value.filter(a => a.include)
  if (included.length === 0) return []

  const scores = included.map(a => getTotalScore(a))
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const scoreRange = maxScore - minScore || 1

  const efforts = included.map(a => a.effort ?? 0)
  const minEffort = Math.min(...efforts)
  const maxEffort = Math.max(...efforts)
  const effortRange = maxEffort - minEffort || 1

  const items = included.map(app => {
    const score = getTotalScore(app)
    const normValue = (score - minScore) / scoreRange
    // High effort on left (0), low effort on right (1)
    const normEffort = 1 - ((app.effort ?? 0) - minEffort) / effortRange

    return {
      app,
      x: normEffort,
      y: normValue,
      score,
      offsetX: 0,
      offsetY: 0
    }
  })

  // Group by same logical position, spread groups so dots sit adjacent
  const groups = new Map<string, typeof items>()
  for (const item of items) {
    const key = `${item.x},${item.y}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }

  for (const group of groups.values()) {
    if (group.length <= 1) continue
    // Fan out in a row, centered on the logical position
    const totalWidth = group.length * DOT_SIZE
    for (let i = 0; i < group.length; i++) {
      group[i].offsetX = -totalWidth / 2 + DOT_SIZE / 2 + i * DOT_SIZE
    }
  }

  return items
})

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
  <div class="quadrant-view">
    <div class="view-header">
      <h2>Quadrant</h2>
      <p class="view-description">Applications plotted by modernization effort vs. driver value</p>
    </div>

    <div class="quadrant-container">
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i> Loading...
      </div>
      <div v-else-if="plottedApps.length === 0" class="empty-state">
        <i class="pi pi-chart-scatter"></i>
        <p>No data to display</p>
        <small>Assign drivers to included applications first</small>
      </div>
      <template v-else>
        <div class="chart-wrapper">
          <!-- Y axis labels (horizontal, left side) -->
          <div class="axis-label-y-column">
            <div class="axis-label axis-label-y-top">↑<br>High<br>Modernization<br>Value</div>
            <div class="axis-label axis-label-y-bottom">Low<br>Modernization<br>Value<br>↓</div>
          </div>

          <div class="chart-column">
            <div class="chart-area">
              <!-- Quadrant backgrounds -->
              <div class="quadrant-bg q-bg-tl"></div>
              <div class="quadrant-bg q-bg-tr"></div>
              <div class="quadrant-bg q-bg-bl"></div>
              <div class="quadrant-bg q-bg-br"></div>

              <!-- Quadrant labels -->
              <div class="quadrant-label q-tl">High Value / High Effort</div>
              <div class="quadrant-label q-tr">High Value / Low Effort</div>
              <div class="quadrant-label q-bl">Low Value / High Effort</div>
              <div class="quadrant-label q-br">Low Value / Low Effort</div>

              <!-- Grid lines -->
              <div class="grid-line grid-line-h"></div>
              <div class="grid-line grid-line-v"></div>

              <!-- Application dots -->
              <div
                v-for="item in plottedApps"
                :key="item.app.id"
                class="app-dot"
                :style="{
                  left: `calc(${5 + item.x * 90}% + ${item.offsetX}px)`,
                  bottom: `calc(${5 + item.y * 90}% + ${item.offsetY}px)`
                }"
                @click="selectedApp = item.app"
              >
                <div class="dot-marker"></div>
                <div class="dot-label">{{ item.app.name }}</div>
              </div>
            </div>

            <!-- X axis label -->
            <div class="axis-label axis-label-x">
              <span>← High Effort</span>
              <span>Low Effort →</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <AppDetails :application="selectedApp" @close="selectedApp = null" />
  </div>
</template>

<style scoped>
.quadrant-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.view-header {
  margin-bottom: 1rem;
  flex-shrink: 0;
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

.quadrant-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  overflow: hidden;
}

.chart-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.axis-label {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.axis-label-y-column {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  width: 7rem;
  height: 75%;
  padding: 0 0.5rem 2rem 0;
}

.axis-label-y-top,
.axis-label-y-bottom {
  text-align: center;
  line-height: 1.3;
}

.chart-column {
  width: 75%;
  height: 75%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-shrink: 0;
}

.axis-label-x {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0 2%;
  flex-shrink: 0;
}

.chart-area {
  position: relative;
  border-left: 2px solid #cbd5e1;
  border-bottom: 2px solid #cbd5e1;
  flex: 1;
  width: 100%;
  overflow: visible;
}

/* Quadrant backgrounds */
.quadrant-bg {
  position: absolute;
  width: 50%;
  height: 50%;
}

.q-bg-tl {
  top: 0; left: 0;
  background: radial-gradient(ellipse at top left, rgba(250, 204, 21, 0.30) 0%, rgba(250, 204, 21, 0.12) 60%, transparent 100%);
}

.q-bg-tr {
  top: 0; right: 0;
  background: radial-gradient(ellipse at top right, rgba(34, 197, 94, 0.32) 0%, rgba(34, 197, 94, 0.12) 60%, transparent 100%);
}

.q-bg-bl {
  bottom: 0; left: 0;
  background: radial-gradient(ellipse at bottom left, rgba(239, 68, 68, 0.30) 0%, rgba(239, 68, 68, 0.12) 60%, transparent 100%);
}

.q-bg-br {
  bottom: 0; right: 0;
  background: radial-gradient(ellipse at bottom right, rgba(250, 204, 21, 0.30) 0%, rgba(250, 204, 21, 0.12) 60%, transparent 100%);
}

/* Quadrant labels */
.quadrant-label {
  position: absolute;
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  pointer-events: none;
  z-index: 0;
}

.q-tl { top: 8%; left: 8%; }
.q-tr { top: 8%; right: 8%; }
.q-bl { bottom: 8%; left: 8%; }
.q-br { bottom: 8%; right: 8%; }

/* Grid lines (center cross) */
.grid-line {
  position: absolute;
  background: #e2e8f0;
}

.grid-line-h {
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
}

.grid-line-v {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
}

/* Application dots */
.app-dot {
  position: absolute;
  transform: translate(-50%, 50%);
  cursor: pointer;
  z-index: 1;
}

.app-dot:hover {
  z-index: 10;
}

.dot-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(59, 130, 246, 0.4);
  margin: 0 auto;
  transition: transform 0.15s;
}

.app-dot:hover .dot-marker {
  transform: scale(1.4);
  background: #1d4ed8;
}

.dot-label {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 16px;
  white-space: nowrap;
  font-size: 0.7rem;
  font-weight: 500;
  color: #334155;
  background: rgba(255, 255, 255, 0.85);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  pointer-events: none;
}

.app-dot:hover .dot-label {
  z-index: 10;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  font-weight: 600;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #64748b;
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}
</style>
