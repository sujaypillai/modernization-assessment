<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Application, ModDriver } from '@/types'
import { formatAppTypeLabel } from '@/types'
import { useApplicationStore } from '@/stores/applicationStore'
import { useModDriverStore } from '@/stores/modDriverStore'
import { useAppPropertyStore } from '@/stores/appPropertyStore'
import { useFilterStore } from '@/stores/filterStore'

const toast = useToast()
const { loadApplications } = useApplicationStore()
const { modDrivers, loadModDrivers } = useModDriverStore()
const { appProperties, loadAppProperties } = useAppPropertyStore()
const { filteredApplications } = useFilterStore()
const loading = ref(true)
const exportingPdf = ref(false)
const exportingCsv = ref(false)

function getTotalScore(app: Application): number {
  const driverMap = (app.drivers || {}) as Record<string, number>
  return Object.values(driverMap).reduce((sum, s) => sum + s, 0)
}

function getAppDrivers(app: Application): ModDriver[] {
  const driverMap = (app.drivers || {}) as Record<string, number>
  const ids = Object.keys(driverMap).map(Number)
  return modDrivers.value.filter(d => ids.includes(d.id))
}

function getDriverScore(app: Application, driverId: number): number {
  const driverMap = (app.drivers || {}) as Record<string, number>
  return driverMap[driverId] ?? 0
}

const includedApps = computed(() => filteredApplications.value.filter(a => a.include))

const sortedApps = computed(() =>
  [...includedApps.value].sort((a, b) => getTotalScore(b) - getTotalScore(a))
)

// Quadrant plotting (same logic as QuadrantView)
const DOT_SIZE = 14
const plottedApps = computed(() => {
  const apps = includedApps.value
  if (apps.length === 0) return []

  const scores = apps.map(a => getTotalScore(a))
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const scoreRange = maxScore - minScore || 1

  const efforts = apps.map(a => a.effort ?? 0)
  const minEffort = Math.min(...efforts)
  const maxEffort = Math.max(...efforts)
  const effortRange = maxEffort - minEffort || 1

  const items = apps.map(app => {
    const score = getTotalScore(app)
    const normValue = (score - minScore) / scoreRange
    const normEffort = 1 - ((app.effort ?? 0) - minEffort) / effortRange
    return { app, x: normEffort, y: normValue, score, offsetX: 0, offsetY: 0 }
  })

  const groups = new Map<string, typeof items>()
  for (const item of items) {
    const key = `${item.x},${item.y}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }

  for (const group of groups.values()) {
    if (group.length <= 1) continue
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
    await Promise.all([loadApplications(), loadModDrivers(), loadAppProperties()])
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function exportPdf() {
  exportingPdf.value = true
  try {
    await nextTick()
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 10

    // Capture quadrant
    const quadrantEl = document.getElementById('export-quadrant')
    if (quadrantEl) {
      const canvas = await html2canvas(quadrantEl, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const ratio = canvas.width / canvas.height
      const imgW = pageW - margin * 2
      const imgH = Math.min(imgW / ratio, pageH - margin * 2)
      pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH)
    }

    // Capture results
    const resultsEl = document.getElementById('export-results')
    if (resultsEl) {
      pdf.addPage('a4', 'landscape')
      const canvas = await html2canvas(resultsEl, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const ratio = canvas.width / canvas.height
      const imgW = pageW - margin * 2
      const imgH = Math.min(imgW / ratio, pageH - margin * 2)
      pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH)
    }

    pdf.save('modernization-assessment.pdf')
    toast.add({ severity: 'success', summary: 'Exported', detail: 'PDF report downloaded', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate PDF', life: 3000 })
  } finally {
    exportingPdf.value = false
  }
}

function exportCsv() {
  exportingCsv.value = true
  try {
    const allApps = filteredApplications.value
    const propNames = appProperties.value.map(p => p.name)
    const driverNames = modDrivers.value.map(d => d.name)

    const headers = [
      'Name', 'Type', 'Include', 'Effort', 'Target',
      ...propNames,
      ...driverNames,
      'Total Score'
    ]

    const rows = allApps.map(app => {
      const driverMap = (app.drivers || {}) as Record<string, number>
      const totalScore = Object.values(driverMap).reduce((sum, s) => sum + s, 0)

      return [
        app.name,
        formatAppTypeLabel(app.appType),
        app.include ? 'Yes' : 'No',
        String(app.effort ?? ''),
        app.target || '',
        ...propNames.map(name => {
          const val = app.properties?.[name]
          return val !== undefined && val !== null ? String(val) : ''
        }),
        ...modDrivers.value.map(d => {
          const score = driverMap[d.id]
          return score !== undefined ? String(score) : ''
        }),
        String(totalScore)
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => {
        const s = String(cell)
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      }).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modernization-assessment.csv'
    link.click()
    URL.revokeObjectURL(url)

    toast.add({ severity: 'success', summary: 'Exported', detail: 'CSV file downloaded', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate CSV', life: 3000 })
  } finally {
    exportingCsv.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="export-view">
    <div class="view-header">
      <h2>Export</h2>
      <p class="view-description">Download assessment data as PDF report or CSV spreadsheet</p>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i> Loading data...
    </div>

    <div v-else class="export-options">
      <div class="export-card">
        <div class="export-icon"><i class="pi pi-file-pdf"></i></div>
        <h3>PDF Report</h3>
        <p>Visual report with the quadrant chart followed by ranked results.</p>
        <Button
          label="Download PDF"
          icon="pi pi-download"
          :loading="exportingPdf"
          @click="exportPdf"
          :disabled="includedApps.length === 0"
        />
      </div>

      <div class="export-card">
        <div class="export-icon"><i class="pi pi-file-excel"></i></div>
        <h3>CSV Data</h3>
        <p>All application data including properties, drivers, and total scores.</p>
        <Button
          label="Download CSV"
          icon="pi pi-download"
          :loading="exportingCsv"
          @click="exportCsv"
          :disabled="filteredApplications.length === 0"
        />
      </div>
    </div>

    <!-- Offscreen print area for PDF capture -->
    <div class="print-area" aria-hidden="true">
      <!-- Quadrant page -->
      <div id="export-quadrant" class="print-page">
        <h2 class="print-title">Modernization Value Assessment — Quadrant</h2>
        <div class="print-chart-area">
          <!-- Quadrant backgrounds -->
          <div class="q-bg q-bg-tl"></div>
          <div class="q-bg q-bg-tr"></div>
          <div class="q-bg q-bg-bl"></div>
          <div class="q-bg q-bg-br"></div>

          <!-- Quadrant labels -->
          <div class="q-label q-tl">High Value / High Effort</div>
          <div class="q-label q-tr">High Value / Low Effort</div>
          <div class="q-label q-bl">Low Value / High Effort</div>
          <div class="q-label q-br">Low Value / Low Effort</div>

          <!-- Grid lines -->
          <div class="grid-h"></div>
          <div class="grid-v"></div>

          <!-- Dots -->
          <div
            v-for="item in plottedApps"
            :key="item.app.id"
            class="print-dot"
            :style="{
              left: `calc(${5 + item.x * 90}% + ${item.offsetX}px)`,
              bottom: `calc(${5 + item.y * 90}% + ${item.offsetY}px)`
            }"
          >
            <div class="print-dot-marker"></div>
            <div class="print-dot-label">{{ item.app.name }}</div>
          </div>
        </div>
        <div class="print-axis-x">
          <span>← High Effort</span>
          <span>Low Effort →</span>
        </div>
        <div class="print-axis-y-top">↑ High Value</div>
        <div class="print-axis-y-bottom">↓ Low Value</div>
      </div>

      <!-- Results page -->
      <div id="export-results" class="print-page">
        <h2 class="print-title">Modernization Value Assessment — Results</h2>
        <table class="print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Application</th>
              <th>Type</th>
              <th>Effort</th>
              <th>Drivers</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(app, index) in sortedApps" :key="app.id">
              <td class="print-rank">{{ index + 1 }}</td>
              <td>{{ app.name }}</td>
              <td class="print-type">{{ formatAppTypeLabel(app.appType) || '-' }}</td>
              <td class="print-effort">{{ app.effort ?? '-' }}</td>
              <td class="print-drivers">
                <span v-for="d in getAppDrivers(app)" :key="d.id" class="print-chip">
                  {{ d.name }} ({{ getDriverScore(app, d.id) }})
                </span>
                <span v-if="getAppDrivers(app).length === 0" class="print-muted">—</span>
              </td>
              <td class="print-score">{{ getTotalScore(app) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.view-header {
  margin-bottom: 1.5rem;
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

.export-options {
  display: flex;
  gap: 1.5rem;
}

.export-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.export-icon {
  font-size: 2rem;
  color: #2563eb;
}

.export-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.export-card p {
  color: #64748b;
  font-size: 0.875rem;
  flex: 1;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
}

/* ── Offscreen print area ── */
.print-area {
  position: absolute;
  left: -10000px;
  top: 0;
}

.print-page {
  width: 1100px;
  padding: 32px;
  background: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
}

.print-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
}

/* ── Print quadrant ── */
.print-chart-area {
  position: relative;
  width: 1000px;
  height: 560px;
  margin: 0 auto;
  border-left: 2px solid #94a3b8;
  border-bottom: 2px solid #94a3b8;
}

.q-bg { position: absolute; width: 50%; height: 50%; }
.q-bg-tl { top: 0; left: 0; background: rgba(250, 204, 21, 0.15); }
.q-bg-tr { top: 0; right: 0; background: rgba(34, 197, 94, 0.18); }
.q-bg-bl { bottom: 0; left: 0; background: rgba(239, 68, 68, 0.15); }
.q-bg-br { bottom: 0; right: 0; background: rgba(250, 204, 21, 0.15); }

.q-label {
  position: absolute;
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}
.q-tl { top: 12px; left: 12px; }
.q-tr { top: 12px; right: 12px; }
.q-bl { bottom: 12px; left: 12px; }
.q-br { bottom: 12px; right: 12px; }

.grid-h, .grid-v { position: absolute; background: #e2e8f0; }
.grid-h { left: 0; right: 0; top: 50%; height: 1px; }
.grid-v { top: 0; bottom: 0; left: 50%; width: 1px; }

.print-dot {
  position: absolute;
  transform: translate(-50%, 50%);
}

.print-dot-marker {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3b82f6;
  border: 1.5px solid white;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.5);
  margin: 0 auto;
}

.print-dot-label {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 13px;
  white-space: nowrap;
  font-size: 8px;
  font-weight: 500;
  color: #334155;
  background: rgba(255, 255, 255, 0.9);
  padding: 1px 3px;
  border-radius: 2px;
}

.print-axis-x {
  display: flex;
  justify-content: space-between;
  width: 1000px;
  margin: 8px auto 0;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.print-axis-y-top,
.print-axis-y-bottom {
  position: absolute;
  left: 0;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}
.print-axis-y-top { top: 60px; }
.print-axis-y-bottom { bottom: 40px; }

/* ── Print results table ── */
.print-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.print-table th {
  background: #f1f5f9;
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: #334155;
  border-bottom: 2px solid #cbd5e1;
}

.print-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
  vertical-align: top;
}

.print-table tr:nth-child(even) td {
  background: #f8fafc;
}

.print-rank { text-align: center; font-weight: 700; color: #64748b; width: 36px; }
.print-type { color: #475569; font-size: 10px; }
.print-effort { text-align: center; }
.print-score { font-weight: 700; text-align: center; color: #1e40af; }

.print-drivers {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.print-chip {
  background: #dbeafe;
  color: #1e40af;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 9px;
  font-weight: 500;
  white-space: nowrap;
}

.print-muted {
  color: #94a3b8;
}
</style>
