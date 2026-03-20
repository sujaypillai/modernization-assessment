<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import WelcomeView from './views/WelcomeView.vue'
import ApplicationsView from './views/ApplicationsView.vue'
import DataCollectionView from './views/DataCollectionView.vue'
import ValueAssessmentView from './views/ValueAssessmentView.vue'
import ResultsView from './views/ResultsView.vue'
import QuadrantView from './views/QuadrantView.vue'
import SetupView from './views/SetupView.vue'
import ExportView from './views/ExportView.vue'
import { useAppPropertyStore } from './stores/appPropertyStore'

const activeTab = ref('welcome')
const { loadAppProperties } = useAppPropertyStore()

onMounted(() => {
  loadAppProperties()
})
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>
        <i class="pi pi-chart-bar"></i>
        Modernization Value Assessment
      </h1>
    </header>
    
    <main class="app-main">
      <Tabs v-model:value="activeTab" class="app-tabs">
        <TabList>
          <Tab value="welcome">Welcome</Tab>
          <Tab value="applications">Applications</Tab>
          <Tab value="data-collection">Data Collection</Tab>
          <Tab value="value-assessment">Value Assessment</Tab>
          <Tab value="results">Results</Tab>
          <Tab value="quadrant">Quadrant</Tab>
          <Tab value="setup">Setup</Tab>
          <Tab value="export">Export</Tab>
        </TabList>
        <TabPanels>
            <TabPanel value="welcome">
              <WelcomeView @navigate="(tab: string) => activeTab = tab" />
            </TabPanel>
            <TabPanel value="applications">
              <ApplicationsView />
            </TabPanel>
            <TabPanel value="data-collection">
              <DataCollectionView />
            </TabPanel>
            <TabPanel value="value-assessment">
              <ValueAssessmentView />
            </TabPanel>
            <TabPanel value="results">
              <ResultsView :active="activeTab === 'results'" />
            </TabPanel>
            <TabPanel value="quadrant">
              <QuadrantView :active="activeTab === 'quadrant'" />
            </TabPanel>
            <TabPanel value="setup">
              <SetupView />
            </TabPanel>
            <TabPanel value="export">
              <ExportView />
            </TabPanel>
        </TabPanels>
      </Tabs>
    </main>
    
    <Toast position="top-right" />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  flex-shrink: 0;
}

.app-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-header h1 i {
  font-size: 1.25rem;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafc;
}

.app-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.p-tabpanels) {
  flex: 1;
  overflow: hidden;
  padding: 1rem;
}

:deep(.p-tabpanel) {
  height: 100%;
}

:deep(.p-tablist) {
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.p-tab) {
  padding: 1rem 1.5rem;
  font-weight: 500;
}
</style>
