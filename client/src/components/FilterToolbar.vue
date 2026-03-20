<script setup lang="ts">
import { ref } from 'vue'
import MultiSelect from 'primevue/multiselect'
import Button from 'primevue/button'
import { useFilterStore } from '@/stores/filterStore'

const { filters, filterDefinitions, getOptions, setFilter, clearFilters, activeFilterCount } = useFilterStore()
const expanded = ref(false)

function formatLabel(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function getFilterOptions(key: string) {
  return getOptions(key).map(v => ({ label: formatLabel(v), value: v }))
}
</script>

<template>
  <div class="filter-wrapper">
    <transition name="slide">
      <div v-if="expanded" class="filter-panel">
        <Button
          v-if="activeFilterCount > 0"
          icon="pi pi-filter-slash"
          text
          size="small"
          rounded
          severity="secondary"
          @click="clearFilters"
          v-tooltip.bottom="'Clear all filters'"
          class="filter-clear-btn"
        />
        <MultiSelect
          v-for="def in filterDefinitions"
          :key="def.key"
          :modelValue="filters[def.key] || []"
          :options="getFilterOptions(def.key)"
          optionLabel="label"
          optionValue="value"
          :placeholder="def.label"
          :maxSelectedLabels="2"
          :showToggleAll="false"
          class="filter-select"
          @update:modelValue="(v: unknown[]) => setFilter(def.key, v)"
        />
      </div>
    </transition>
    <button class="filter-toggle" :class="{ active: activeFilterCount > 0 }" @click="expanded = !expanded">
      <i class="pi pi-filter"></i>
      <span v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</span>
    </button>
  </div>
</template>

<style scoped>
.filter-wrapper {
  display: flex;
  align-items: center;
  height: 36px;
}

.filter-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.filter-toggle:hover {
  border-color: #cbd5e1;
  color: #334155;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.filter-toggle.active {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1e40af;
}

.filter-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.filter-panel {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-right: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-select {
  min-width: 130px;
  max-width: 200px;
}

:deep(.filter-select .p-multiselect-label) {
  padding: 0.3rem 0.5rem;
  font-size: 0.8rem;
}

:deep(.filter-select .p-multiselect-trigger) {
  width: 1.75rem;
}

.filter-clear-btn {
  flex-shrink: 0;
}

/* slide transition */
.slide-enter-active {
  transition: all 0.25s ease-out;
}
.slide-leave-active {
  transition: all 0.2s ease-in;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>

