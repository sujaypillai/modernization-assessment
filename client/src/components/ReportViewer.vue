<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'

const props = defineProps<{ filename: string | null }>()
const emit = defineEmits<{ close: [] }>()

const visible = computed({
  get: () => props.filename !== null,
  set: (v) => { if (!v) emit('close') }
})

const reportUrl = computed(() =>
  props.filename ? `/api/assessments/report/${props.filename}` : ''
)
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="filename ?? 'Assessment Report'"
    modal
    :style="{ width: '80vw', height: '80vh' }"
    :contentStyle="{ height: '100%', padding: 0, overflow: 'hidden' }"
    :dismissableMask="true"
  >
    <iframe
      v-if="filename"
      :src="reportUrl"
      class="report-frame"
    />
  </Dialog>
</template>

<style scoped>
.report-frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
