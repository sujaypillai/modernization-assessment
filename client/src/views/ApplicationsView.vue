<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { refreshAssessments, uploadReports } from '@/services/api'
import type { Application } from '@/types'
import AppDetails from '@/components/AppDetails.vue'
import ReportViewer from '@/components/ReportViewer.vue'
import { useApplicationStore } from '@/stores/applicationStore'
import { useFilterStore } from '@/stores/filterStore'
import FilterToolbar from '@/components/FilterToolbar.vue'

const toast = useToast()
const { loadApplications, updateApplication } = useApplicationStore()
const { filteredApplications } = useFilterStore()
const loading = ref(true)
const refreshing = ref(false)
const selectedApp = ref<Application | null>(null)
const viewingReport = ref<string | null>(null)

const showUpload = ref(false)
const uploading = ref(false)
const selectedFiles = ref<File[]>([])
const dragging = ref(false)

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) {
    addFiles(Array.from(input.files))
    input.value = ''
  }
}

function addFiles(files: File[]) {
  const htmlFiles = files.filter(f => f.name.toLowerCase().endsWith('.html'))
  for (const file of htmlFiles) {
    if (!selectedFiles.value.some(f => f.name === file.name)) {
      selectedFiles.value.push(file)
    }
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

async function handleUpload() {
  if (selectedFiles.value.length === 0) return
  uploading.value = true
  try {
    const result = await uploadReports(selectedFiles.value)
    toast.add({
      severity: 'success',
      summary: 'Uploaded',
      detail: result.message,
      life: 3000
    })
    showUpload.value = false
    selectedFiles.value = []
    await loadApplications()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to upload reports',
      life: 3000
    })
  } finally {
    uploading.value = false
  }
}

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
        <FilterToolbar />
        <Button
          label="Upload Reports"
          icon="pi pi-upload"
          @click="showUpload = true"
          outlined
        />
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
        :value="filteredApplications"
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
            <a v-if="data.reportFilename" class="report-link" @click="viewingReport = data.reportFilename">{{ data.reportFilename }}</a>
            <span v-else>-</span>
          </template>
        </Column>
      </DataTable>
    </div>
    <AppDetails :application="selectedApp" @close="selectedApp = null" />
    <ReportViewer :filename="viewingReport" @close="viewingReport = null" />

    <Dialog v-model:visible="showUpload" header="Upload Assessment Reports" modal :style="{ width: '520px' }">
      <div
        class="upload-dropzone"
        :class="{ 'upload-dragging': dragging }"
        @dragenter.prevent="dragging = true"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <i class="pi pi-cloud-upload"></i>
        <p>Drag &amp; drop HTML report files here</p>
        <span>or</span>
        <label class="upload-browse-btn">
          Browse Files
          <input type="file" accept=".html" multiple hidden @change="onFilesSelected" />
        </label>
      </div>

      <div v-if="selectedFiles.length > 0" class="upload-file-list">
        <div v-for="(file, index) in selectedFiles" :key="file.name" class="upload-file-item">
          <i class="pi pi-file"></i>
          <span class="upload-file-name">{{ file.name }}</span>
          <span class="upload-file-size">{{ (file.size / 1024).toFixed(0) }} KB</span>
          <button class="upload-remove-btn" @click="removeFile(index)">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="showUpload = false" />
        <Button
          label="Upload"
          icon="pi pi-upload"
          :loading="uploading"
          :disabled="selectedFiles.length === 0"
          @click="handleUpload"
        />
      </template>
    </Dialog>
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.report-link {
  font-family: monospace;
  font-size: 0.875rem;
  color: #1e40af;
  cursor: pointer;
  text-decoration: none;
}

.report-link:hover {
  text-decoration: underline;
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

.upload-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s;
  background: #fafafa;
}

.upload-dropzone.upload-dragging {
  border-color: #2563eb;
  background: #eff6ff;
}

.upload-dropzone i {
  font-size: 2.5rem;
  color: #94a3b8;
  display: block;
  margin-bottom: 0.75rem;
}

.upload-dragging i {
  color: #2563eb;
}

.upload-dropzone p {
  font-size: 0.95rem;
  color: #475569;
  margin: 0 0 0.25rem;
}

.upload-dropzone span {
  font-size: 0.8rem;
  color: #94a3b8;
  display: block;
  margin-bottom: 0.5rem;
}

.upload-browse-btn {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background: #2563eb;
  color: white;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-browse-btn:hover {
  background: #1d4ed8;
}

.upload-file-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.upload-file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
}

.upload-file-item > i {
  color: #64748b;
  flex-shrink: 0;
}

.upload-file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1e293b;
  font-family: monospace;
  font-size: 0.8rem;
}

.upload-file-size {
  color: #94a3b8;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.upload-remove-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-remove-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}
</style>
