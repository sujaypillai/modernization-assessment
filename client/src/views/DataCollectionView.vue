<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import type { Application, AppProperty } from '@/types'
import AppDetails from '@/components/AppDetails.vue'
import { useApplicationStore } from '@/stores/applicationStore'
import { useAppPropertyStore } from '@/stores/appPropertyStore'

const toast = useToast()
const selectedApp = ref<Application | null>(null)
const { applications, loadApplications, updateApplication } = useApplicationStore()
const { appProperties, loadAppProperties } = useAppPropertyStore()
const loading = ref(true)

const includedApps = computed(() => applications.value.filter(a => a.include))

const boolOptions = [
  { label: 'true', value: true },
  { label: 'false', value: false }
]

async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      loadApplications(),
      loadAppProperties()
    ])
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data', life: 3000 })
  } finally {
    loading.value = false
  }
}

function getPropertyValue(app: Application, prop: AppProperty): unknown {
  const val = app.properties?.[prop.name]
  if (val !== undefined && val !== null) return val
  if (prop.dataType === 'BOOL') return prop.defaultValue === 'true'
  if (prop.dataType === 'INT') return parseInt(prop.defaultValue, 10) || 0
  return prop.defaultValue ?? ''
}

async function saveProperty(app: Application, propName: string, value: unknown) {
  const newProperties = { ...app.properties, [propName]: value }
  try {
    await updateApplication(app.id, { properties: newProperties })
    app.properties = newProperties
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: `Failed to save ${propName}`, life: 3000 })
  }
}

function onBoolChange(app: Application, prop: AppProperty, value: boolean) {
  saveProperty(app, prop.name, value)
}

function onIntChange(app: Application, prop: AppProperty, value: number | null) {
  if (value === null) return
  saveProperty(app, prop.name, value)
}

function onTextBlur(app: Application, prop: AppProperty, event: Event) {
  const input = event.target as HTMLInputElement
  const current = app.properties?.[prop.name]
  if (input.value !== (current ?? prop.defaultValue ?? '')) {
    saveProperty(app, prop.name, input.value)
  }
}

onMounted(loadData)
</script>

<template>
  <div class="data-collection-view">
    <div class="view-header">
      <h2>Data Collection</h2>
    </div>

    <div class="view-content">
      <DataTable
        :value="includedApps"
        :loading="loading"
        scrollable
        scrollHeight="flex"
        stripedRows
        dataKey="id"
        class="collection-table"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-table"></i>
            <p>No applications found</p>
          </div>
        </template>

        <Column field="name" header="Application" frozen style="min-width: 220px">
          <template #body="{ data }">
            <a class="app-name" @click="selectedApp = data">{{ data.name }}</a>
          </template>
        </Column>

        <Column
          v-for="prop in appProperties"
          :key="prop.id"
          :header="prop.name"
          style="min-width: 160px"
        >
          <template #body="{ data }">
            <Select
              v-if="prop.dataType === 'BOOL'"
              :modelValue="getPropertyValue(data, prop)"
              :options="boolOptions"
              optionLabel="label"
              optionValue="value"
              class="property-input"
              @update:modelValue="(v: boolean) => onBoolChange(data, prop, v)"
            />
            <InputNumber
              v-else-if="prop.dataType === 'INT'"
              :modelValue="getPropertyValue(data, prop) as number"
              class="property-input"
              :useGrouping="false"
              @update:modelValue="(v: number | null) => onIntChange(data, prop, v)"
            />
            <InputText
              v-else
              :modelValue="String(getPropertyValue(data, prop))"
              class="property-input"
              @blur="(e: Event) => onTextBlur(data, prop, e)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
    <AppDetails :application="selectedApp" @close="selectedApp = null" />
  </div>
</template>

<style scoped>
.data-collection-view {
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
}

.view-content {
  flex: 1;
  overflow: hidden;
}

.collection-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.app-name {
  font-weight: 500;
  color: #334155;
}

.property-input {
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}
</style>
