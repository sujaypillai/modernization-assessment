<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  activeTab: string
}>()

const emit = defineEmits<{ navigate: [tab: string] }>()

const STEPS = [
  { id: 1, label: 'Applications', tabs: ['applications'], icon: 'pi-file-import', optional: false },
  { id: 2, label: 'Setup', tabs: ['setup'], icon: 'pi-cog', optional: true },
  { id: 3, label: 'Data Collection', tabs: ['data-collection'], icon: 'pi-pencil', optional: true },
  { id: 4, label: 'Value Assessment', tabs: ['value-assessment'], icon: 'pi-bolt', optional: false },
  { id: 5, label: 'Results', tabs: ['results', 'quadrant'], icon: 'pi-trophy', optional: false },
  { id: 6, label: 'Export', tabs: ['export'], icon: 'pi-download', optional: false },
]

const STORAGE_KEY = 'mva-completed-steps'

function loadCompleted(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

const completedTabs = ref<Set<string>>(loadCompleted())

watch(() => props.activeTab, (_newTab, oldTab) => {
  if (oldTab && oldTab !== 'welcome') {
    completedTabs.value.add(oldTab)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedTabs.value]))
  }
})

function getStatus(step: typeof STEPS[0]): 'active' | 'completed' | 'pending' {
  if (step.tabs.includes(props.activeTab)) return 'active'
  if (step.tabs.some(t => completedTabs.value.has(t))) return 'completed'
  return 'pending'
}

function navigateTo(step: typeof STEPS[0]) {
  emit('navigate', step.tabs[0])
}

</script>

<template>
  <div class="workflow-stepper" v-if="activeTab !== 'welcome'">
    <div class="stepper-inner">
      <template v-for="(step, idx) in STEPS" :key="step.id">
        <button
          class="step-item"
          :class="getStatus(step)"
          @click="navigateTo(step)"
          :title="step.optional ? step.label + ' (optional)' : step.label"
        >
          <div class="step-bubble">
            <i v-if="getStatus(step) === 'completed'" class="pi pi-check"></i>
            <i v-else :class="['pi', step.icon]"></i>
          </div>
          <div class="step-label">
            {{ step.label }}
            <span v-if="step.optional" class="optional-tag">opt</span>
          </div>
        </button>
        <div v-if="idx < STEPS.length - 1" class="step-connector" :class="{ done: getStatus(step) === 'completed' }"></div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.workflow-stepper {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem 1.5rem;
}

.stepper-inner {
  display: flex;
  align-items: center;
  max-width: 900px;
  margin: 0 auto;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: background 0.15s;
  min-width: 80px;
}

.step-item:hover {
  background: #f1f5f9;
}

.step-bubble {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.step-item.pending .step-bubble {
  background: #f1f5f9;
  color: #94a3b8;
  border: 2px solid #e2e8f0;
}

.step-item.active .step-bubble {
  background: #2563eb;
  color: white;
  border: 2px solid #2563eb;
  box-shadow: 0 0 0 3px #dbeafe;
}

.step-item.completed .step-bubble {
  background: #10b981;
  color: white;
  border: 2px solid #10b981;
}

.step-label {
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.step-item.pending .step-label {
  color: #94a3b8;
}

.step-item.active .step-label {
  color: #2563eb;
  font-weight: 600;
}

.step-item.completed .step-label {
  color: #10b981;
}

.optional-tag {
  font-size: 0.6rem;
  background: #f1f5f9;
  color: #94a3b8;
  padding: 0 3px;
  border-radius: 3px;
  font-weight: 400;
}

.step-connector {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0 0.25rem;
  margin-bottom: 1rem;
  transition: background 0.3s;
}

.step-connector.done {
  background: #10b981;
}
</style>
