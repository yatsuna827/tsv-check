type DivElementId = 'page-container' | 'message-container' | 'buttons-container' | 'versions'
type ButtonElementId = 'cancel-button' | 'start-button'
type InputElementId = 'search-max' | 'ivs-s' | 'ivs-d' | 'ivs-c' | 'ivs-b' | 'ivs-a' | 'ivs-h' | 'id-input' | 'ver-usum' | 'ver-sm'
type SelectElementId = 'nature-select'

type Id = DivElementId | ButtonElementId | InputElementId | SelectElementId

interface Document {
  getElementById<T extends Id>(elementId: T): (T extends DivElementId ? HTMLDivElement : never) | (T extends ButtonElementId ? HTMLButtonElement : never) | (T extends InputElementId ? HTMLInputElement : never) | (T extends SelectElementId ? HTMLSelectElement : never)
}
declare global {
  const document: Document
}
