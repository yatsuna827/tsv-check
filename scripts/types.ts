export type ENV = 'dev' | 'prod'
export type ConfigItem<T> = {
  [key in ENV]: T
}
export type Config = {
  getUrl: ConfigItem<(id: string, version: 'sm' | 'usum') => string>
}
