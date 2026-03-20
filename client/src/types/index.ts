export interface Application {
  id: number
  name: string
  include: boolean
  effort: number
  target: string
  reportFilename: string
  typeId: number | null
  appType: AppType | null
  properties: Record<string, unknown>
  drivers: Record<string, unknown>
}

export interface AppType {
  id: number
  language: string
  langVer: string
  framework: string
  frameworkVer: string
}

export function formatAppTypeLabel(t: AppType | null | undefined): string {
  if (!t) return ''
  const lang = [t.language, t.langVer].filter(Boolean).join(' ')
  const fw = [t.framework, t.frameworkVer].filter(Boolean).join(' ')
  return [lang, fw].filter(Boolean).join(' / ')
}

export interface AppProperty {
  id: number
  name: string
  dataType: string
  defaultValue: string
}

export interface ModDriver {
  id: number
  name: string
  desc: string
  score: number
}
