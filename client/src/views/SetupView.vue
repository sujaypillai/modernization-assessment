<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import type { AppProperty, ModDriver } from '@/types'
import { useAppPropertyStore } from '@/stores/appPropertyStore'
import { useModDriverStore } from '@/stores/modDriverStore'

const toast = useToast()
const confirm = useConfirm()

const activeSetupTab = ref('app-properties')

// AppProperties (shared store)
const {
  appProperties,
  loadAppProperties: storeLoadAppProperties,
  createAppProperty: storeCreateAppProperty,
  updateAppProperty: storeUpdateAppProperty,
  deleteAppProperty: storeDeleteAppProperty
} = useAppPropertyStore()
const appPropertiesLoading = ref(true)
const showAppPropertyDialog = ref(false)
const editingAppProperty = ref<Partial<AppProperty>>({})
const savingAppProperty = ref(false)

// ModDrivers (shared store)
const {
  modDrivers,
  loadModDrivers: storeLoadModDrivers,
  createModDriver: storeCreateModDriver,
  updateModDriver: storeUpdateModDriver,
  deleteModDriver: storeDeleteModDriver
} = useModDriverStore()
const modDriversLoading = ref(true)
const showModDriverDialog = ref(false)
const editingModDriver = ref<Partial<ModDriver>>({})
const savingModDriver = ref(false)

// AppProperties CRUD
async function loadAppProperties() {
  appPropertiesLoading.value = true
  try {
    await storeLoadAppProperties()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load app properties', life: 3000 })
  } finally {
    appPropertiesLoading.value = false
  }
}

function openNewAppProperty() {
  editingAppProperty.value = { name: '', dataType: 'VAR', defaultValue: '' }
  showAppPropertyDialog.value = true
}

function editAppProperty(appProperty: AppProperty) {
  editingAppProperty.value = { ...appProperty }
  showAppPropertyDialog.value = true
}

async function saveAppProperty() {
  savingAppProperty.value = true
  try {
    if (editingAppProperty.value.id) {
      await storeUpdateAppProperty(editingAppProperty.value.id, editingAppProperty.value)
      toast.add({ severity: 'success', summary: 'Updated', detail: 'App property updated', life: 2000 })
    } else {
      await storeCreateAppProperty(editingAppProperty.value as Omit<AppProperty, 'id'>)
      toast.add({ severity: 'success', summary: 'Created', detail: 'App property created', life: 2000 })
    }
    showAppPropertyDialog.value = false
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save app property', life: 3000 })
  } finally {
    savingAppProperty.value = false
  }
}

function confirmDeleteAppProperty(appProperty: AppProperty) {
  confirm.require({
    message: `Delete "${appProperty.name}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await storeDeleteAppProperty(appProperty.id)
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'App property deleted', life: 2000 })
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete app property', life: 3000 })
      }
    }
  })
}

// ModDrivers CRUD
async function loadModDrivers() {
  modDriversLoading.value = true
  try {
    await storeLoadModDrivers()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load mod drivers', life: 3000 })
  } finally {
    modDriversLoading.value = false
  }
}

function openNewModDriver() {
  editingModDriver.value = { name: '', desc: '', score: 0 }
  showModDriverDialog.value = true
}

function editModDriver(modDriver: ModDriver) {
  editingModDriver.value = { ...modDriver }
  showModDriverDialog.value = true
}

async function saveModDriver() {
  savingModDriver.value = true
  try {
    if (editingModDriver.value.id) {
      await storeUpdateModDriver(editingModDriver.value.id, editingModDriver.value)
      toast.add({ severity: 'success', summary: 'Updated', detail: 'Mod driver updated', life: 2000 })
    } else {
      await storeCreateModDriver(editingModDriver.value as Omit<ModDriver, 'id'>)
      toast.add({ severity: 'success', summary: 'Created', detail: 'Mod driver created', life: 2000 })
    }
    showModDriverDialog.value = false
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save mod driver', life: 3000 })
  } finally {
    savingModDriver.value = false
  }
}

function confirmDeleteModDriver(modDriver: ModDriver) {
  confirm.require({
    message: `Delete "${modDriver.name}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await storeDeleteModDriver(modDriver.id)
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Mod driver deleted', life: 2000 })
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete mod driver', life: 3000 })
      }
    }
  })
}

onMounted(() => {
  loadAppProperties()
  loadModDrivers()
})
</script>

<template>
  <div class="setup-view">
    <div class="view-header">
      <h2>Setup</h2>
      <p class="view-description">Configure application properties and modernization drivers</p>
    </div>
    
    <Tabs v-model:value="activeSetupTab" class="setup-tabs">
      <TabList>
        <Tab value="app-properties">App Properties</Tab>
        <Tab value="mod-drivers">Mod Drivers</Tab>
      </TabList>
      <TabPanels>
        <!-- App Properties Tab -->
        <TabPanel value="app-properties">
        <div class="section-header">
          <h3>Application Properties</h3>
          <Button label="Add Property" icon="pi pi-plus" @click="openNewAppProperty" />
        </div>
        <DataTable
          :value="appProperties"
          :loading="appPropertiesLoading"
          stripedRows
          dataKey="id"
          class="setup-table"
        >
          <template #empty>
            <div class="empty-state">
              <p>No app properties defined</p>
            </div>
          </template>
          <Column field="name" header="Name" sortable />
          <Column field="dataType" header="Data Type" sortable />
          <Column field="defaultValue" header="Default Value" />
          <Column header="Actions" style="width: 150px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button icon="pi pi-pencil" text rounded @click="editAppProperty(data)" />
                <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteAppProperty(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
        </TabPanel>
        
        <!-- Mod Drivers Tab -->
        <TabPanel value="mod-drivers">
        <div class="section-header">
          <h3>Modernization Drivers</h3>
          <Button label="Add Driver" icon="pi pi-plus" @click="openNewModDriver" />
        </div>
        <DataTable
          :value="modDrivers"
          :loading="modDriversLoading"
          stripedRows
          dataKey="id"
          class="setup-table"
        >
          <template #empty>
            <div class="empty-state">
              <p>No mod drivers defined</p>
            </div>
          </template>
          <Column field="name" header="Name" sortable />
          <Column field="desc" header="Description" />
          <Column field="score" header="Score" sortable style="width: 100px" />
          <Column header="Actions" style="width: 150px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button icon="pi pi-pencil" text rounded @click="editModDriver(data)" />
                <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteModDriver(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
        </TabPanel>
      </TabPanels>
    </Tabs>
    
    <!-- App Property Dialog -->
    <Dialog
      v-model:visible="showAppPropertyDialog"
      :header="editingAppProperty.id ? 'Edit App Property' : 'New App Property'"
      modal
      :style="{ width: '450px' }"
    >
      <div class="dialog-form">
        <div class="form-field">
          <label for="appprop-name">Name</label>
          <InputText id="appprop-name" v-model="editingAppProperty.name" class="w-full" />
        </div>
        <div class="form-field">
          <label for="appprop-type">Data Type</label>
          <Select
            id="appprop-type"
            v-model="editingAppProperty.dataType"
            :options="[{ label: 'Text', value: 'VAR' }, { label: 'Integer', value: 'INT' }, { label: 'Boolean', value: 'BOOL' }]"
            optionLabel="label"
            optionValue="value"
            placeholder="Select data type"
            class="w-full"
          />
        </div>
        <div class="form-field">
          <label for="appprop-default">Default Value</label>
          <InputText id="appprop-default" v-model="editingAppProperty.defaultValue" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="showAppPropertyDialog = false" />
        <Button label="Save" :loading="savingAppProperty" @click="saveAppProperty" />
      </template>
    </Dialog>
    
    <!-- Mod Driver Dialog -->
    <Dialog
      v-model:visible="showModDriverDialog"
      :header="editingModDriver.id ? 'Edit Mod Driver' : 'New Mod Driver'"
      modal
      :style="{ width: '450px' }"
    >
      <div class="dialog-form">
        <div class="form-field">
          <label for="moddriver-name">Name</label>
          <InputText id="moddriver-name" v-model="editingModDriver.name" class="w-full" />
        </div>
        <div class="form-field">
          <label for="moddriver-desc">Description</label>
          <Textarea id="moddriver-desc" v-model="editingModDriver.desc" rows="3" class="w-full" />
        </div>
        <div class="form-field">
          <label for="moddriver-score">Score</label>
          <InputNumber id="moddriver-score" v-model="editingModDriver.score" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="showModDriverDialog = false" />
        <Button label="Save" :loading="savingModDriver" @click="saveModDriver" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.setup-view {
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

.setup-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.p-tabview-panels) {
  flex: 1;
  overflow: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
}

.setup-table {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-field {
  flex: 1;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.w-full {
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}
</style>
