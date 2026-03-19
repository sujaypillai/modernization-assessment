export interface Application {
  id: number
  name: string
  include: boolean
  effort: number
  target: string
  reportFilename: string
  properties: Record<string, unknown>
  drivers: Record<string, unknown>
}

export interface AppType {
  id: number
  name: string
  language: string
  langVer: string
  framework: string
  frameworkVer: string
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
