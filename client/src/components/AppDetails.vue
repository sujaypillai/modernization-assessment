<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import { getAppProperties, getModDrivers } from '@/services/api'
import type { Application, AppProperty, ModDriver } from '@/types'

const props = defineProps<{ application: Application | null }>()
const emit = defineEmits<{ close: [] }>()

const visible = computed({
  get: () => props.application !== null,
  set: (v) => { if (!v) emit('close') }
})

const appProperties = ref<AppProperty[]>([])
const modDrivers = ref<ModDriver[]>([])

watch(() => props.application, async (app) => {
  if (!app) return
  const [properties, drivers] = await Promise.all([
    getAppProperties(),
    getModDrivers()
  ])
  appProperties.value = properties
  modDrivers.value = drivers
})

const assignedDrivers = computed(() => {
  if (!props.application) return []
  const driverMap = (props.application.drivers || {}) as Record<string, number>
  const ids = Object.keys(driverMap).map(Number)
  return modDrivers.value
    .filter(d => ids.includes(d.id))
    .map(d => ({ ...d, assignedScore: driverMap[d.id] ?? d.score }))
})

const totalScore = computed(() =>
  assignedDrivers.value.reduce((sum, d) => sum + d.assignedScore, 0)
)

function getPropertyValue(propName: string): string {
  if (!props.application) return '-'
  const val = props.application.properties?.[propName]
  if (val !== undefined && val !== null) return String(val)
  const prop = appProperties.value.find(p => p.name === propName)
  return prop?.defaultValue ?? '-'
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="application?.name ?? 'Application Details'"
    modal
    :style="{ width: '640px' }"
    :dismissableMask="true"
  >
    <div v-if="application" class="details-content">
      <!-- General Info -->
      <section class="details-section">
        <h4>General</h4>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Included</span>
            <Tag :value="application.include ? 'Yes' : 'No'" :severity="application.include ? 'success' : 'secondary'" />
          </div>
          <div class="detail-item">
            <span class="detail-label">Effort</span>
            <span class="detail-value">{{ application.effort ?? 'N/A' }} {{ application.effort != null ? 'pts' : '' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Target</span>
            <span class="detail-value">{{ application.target || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Report File</span>
            <span class="detail-value">{{ application.reportFilename || 'N/A' }}</span>
          </div>
        </div>
      </section>

      <!-- Properties -->
      <section class="details-section">
        <h4>Properties</h4>
        <div v-if="appProperties.length === 0" class="empty-note">No properties defined</div>
        <div v-else class="details-grid">
          <div v-for="prop in appProperties" :key="prop.id" class="detail-item">
            <span class="detail-label">{{ prop.name }}</span>
            <span class="detail-value">{{ getPropertyValue(prop.name) }}</span>
          </div>
        </div>
      </section>

      <!-- Drivers -->
      <section class="details-section">
        <h4>
          Modernization Drivers
          <span v-if="assignedDrivers.length > 0" class="total-score">{{ totalScore }} pts</span>
        </h4>
        <div v-if="assignedDrivers.length === 0" class="empty-note">No drivers assigned</div>
        <div v-else class="drivers-list">
          <div v-for="driver in assignedDrivers" :key="driver.id" class="driver-row">
            <span class="driver-name">{{ driver.name }}</span>
            <span class="driver-desc">{{ driver.desc }}</span>
            <span class="driver-score">{{ driver.assignedScore }}</span>
          </div>
        </div>
      </section>
    </div>
  </Dialog>
</template>

<style scoped>
.details-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.details-section h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-score {
  font-size: 0.85rem;
  font-weight: 700;
  color: #2563eb;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-value {
  font-size: 0.9rem;
  color: #1e293b;
}

.drivers-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.driver-row {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.6rem;
  background: #f8fafc;
  border-radius: 6px;
}

.driver-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: #1e293b;
}

.driver-desc {
  font-size: 0.78rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.driver-score {
  background: #1e40af;
  color: white;
  border-radius: 4px;
  padding: 0.15rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.empty-note {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.85rem;
}
</style>
