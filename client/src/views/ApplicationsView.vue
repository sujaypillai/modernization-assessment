<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { refreshAssessments } from '@/services/api'
import type { Application } from '@/types'
import AppDetails from '@/components/AppDetails.vue'
import { useApplicationStore } from '@/stores/applicationStore'

const toast = useToast()
const { applications, loadApplications, updateApplication } = useApplicationStore()
const loading = ref(true)
const refreshing = ref(false)
const selectedApp = ref<Application | null>(null)

async function load() {
  loading.value = true
  try {
    await loadApplications()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load applications',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

async function toggleInclude(app: Application) {
  try {
    await updateApplication(app.id, { include: app.include })
    toast.add({
      severity: 'success',
      summary: 'Updated',
      detail: `${app.name} ${app.include ? 'included' : 'excluded'}`,
      life: 2000
    })
  } catch (error) {
    app.include = !app.include
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update application',
      life: 3000
    })
  }
}

async function handleRefresh() {
  refreshing.value = true
  try {
    const result = await refreshAssessments()
    toast.add({
      severity: 'success',
      summary: 'Refreshed',
      detail: result.message,
      life: 3000
    })
    await loadApplications()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to refresh assessments',
      life: 3000
    })
  } finally {
    refreshing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="applications-view">
    <div class="view-header">
      <h2>Applications</h2>
      <div class="header-actions">
        <Button
          label="Refresh Assessments"
          icon="pi pi-refresh"
          :loading="refreshing"
          @click="handleRefresh"
          outlined
        />
      </div>
    </div>
    
    <div class="view-content">
      <DataTable
        :value="applications"
        :loading="loading"
        stripedRows
        paginator
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50]"
        dataKey="id"
        class="applications-table"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox"></i>
            <p>No applications found</p>
            <small>Click "Refresh Assessments" to load assessment files</small>
          </div>
        </template>
        
        <Column field="name" header="Name" sortable style="min-width: 200px">
          <template #body="{ data }">
            <a class="app-name" @click="selectedApp = data">{{ data.name }}</a>
          </template>
        </Column>
        
        <Column field="include" header="Include" sortable style="width: 100px">
          <template #body="{ data }">
            <ToggleSwitch v-model="data.include" @change="toggleInclude(data)" />
          </template>
        </Column>
        
        <Column field="effort" header="Effort" sortable style="width: 120px">
          <template #body="{ data }">
            <span class="effort-value">{{ data.effort ?? '-' }} <small>pts</small></span>
          </template>
        </Column>
        
        <Column field="target" header="Target" sortable style="width: 150px">
          <template #body="{ data }">
            {{ data.target || '-' }}
          </template>
        </Column>
        
        <Column field="reportFilename" header="Report File" sortable style="min-width: 200px">
          <template #body="{ data }">
            <span class="report-filename">{{ data.reportFilename || '-' }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
    <AppDetails :application="selectedApp" @close="selectedApp = null" />
  </div>
</template>

<style scoped>
.applications-view {
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
  overflow: auto;
}

.applications-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.app-name {
  font-weight: 500;
  color: #1e40af;
}

.report-filename {
  font-family: monospace;
  font-size: 0.875rem;
  color: #64748b;
}

.effort-value {
  font-weight: 600;
  color: #1e293b;
}

.effort-value small {
  font-weight: 400;
  color: #94a3b8;
  font-size: 0.75rem;
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

.empty-state p {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}
</style>
