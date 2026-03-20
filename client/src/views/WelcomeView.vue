<script setup lang="ts">
import Button from 'primevue/button'

const emit = defineEmits<{ 'navigate': [tab: string] }>()
</script>

<template>
  <div class="welcome-container">
    <div class="hero">
      <div class="hero-icon">
        <i class="pi pi-chart-bar"></i>
      </div>
      <h2>Modernization Value Assessment</h2>
      <p class="hero-subtitle">
        This tool is built to help guide the prioritization discussion for modernizing legacy applications.
        It takes the assessment results from the Copilot AppMod extension as input, and provides a visual tool to drive further discussion.
      </p>
      <p class="hero-subtitle">
        Nobody modernizes applications for fun. Even if LLMs can greatly accelerate the pace of the modernization itself, human effort is still needed to drive the initiative at scale.
        This means that effort should be targeted towards business value.
      </p>
    </div>

    <div class="steps">
      <h3>How it works</h3>

      <div class="steps-grid">
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-header">
              <i class="pi pi-file-import"></i>
              <h4>Import Assessments</h4>
            </div>
            <p>Use the AppMod extension to assess your applications. Load the resulting HTML files by adding them on the <b>Applications</b> page, or by copying them into <code>/data/assessments</code>.</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-header">
              <i class="pi pi-list"></i>
              <h4>Review Applications</h4>
            </div>
            <p>Go through the <strong>Applications</strong> page and exclude any applications that are not relevant for modernization.</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-header">
              <i class="pi pi-cog"></i>
              <h4>Customize Setup</h4>
            </div>
            <p><em>Optional.</em> Customize the application properties needed for decision making, as well as the business drivers to include.</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">4</div>
          <div class="step-content">
            <div class="step-header">
              <i class="pi pi-pencil"></i>
              <h4>Collect Data</h4>
            </div>
            <p><em>Optional.</em> Collect additional data on each application — such as criticality, userbase location, and whether it's revenue generating.</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">5</div>
          <div class="step-content">
            <div class="step-header">
              <i class="pi pi-bolt"></i>
              <h4>Value Assessment</h4>
            </div>
            <p>Assign relevant modernization drivers to each of the applications.</p>
          </div>
        </div>

        <div class="step-card">
          <div class="step-number">6</div>
          <div class="step-content">
            <div class="step-header">
              <i class="pi pi-trophy"></i>
              <h4>Review Results</h4>
            </div>
            <p>See the outcome on the <strong>Results</strong> and <strong>Quadrant</strong> pages. Start with the high-value, low-effort projects.</p>
          </div>
        </div>
      </div>
    </div>

    <Button label="Get Started" icon="pi pi-arrow-right" iconPos="right" @click="emit('navigate', 'applications')" class="get-started-btn" />
  </div>
</template>

<style scoped>
.welcome-container {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem 1rem;
}

.hero {
  text-align: center;
  max-width: 840px;
}

.hero-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin: 0 auto 1rem;
}

.hero h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.75rem;
}

.hero-subtitle {
  font-size: 0.925rem;
  color: #64748b;
  margin: 0 0 0.5rem;
  line-height: 1.7;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 840px;
}

.steps h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.steps-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: white;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.step-header i {
  color: #2563eb;
  font-size: 0.9rem;
}

.step-header h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.step-content p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.step-content code {
  background: #f1f5f9;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #334155;
}

.step-content strong {
  color: #475569;
}

.step-content em {
  color: #94a3b8;
  font-style: normal;
  font-size: 0.8rem;
}

.get-started-btn {
  font-size: 1rem;
  padding: 0.75rem 2rem;
  margin-bottom: 1rem;
}


</style>
