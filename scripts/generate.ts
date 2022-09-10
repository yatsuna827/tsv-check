import { JSDOM } from 'jsdom'
import { readFileSync, writeFileSync } from 'fs'

const html = readFileSync('src/index.html')
const dom = new JSDOM(html)
const document = dom.window.document
// prettier-ignore
const capitalize = (str: string) => str[0].toUpperCase() + str.substring(1).toLowerCase()

const store = new Map<string, string[]>()
let queue: Element[] = Array.from(document.children)
while (queue.length) {
  const node = queue.pop()
  if (!node) continue

  if (node.id) {
    const el = `${capitalize(node.tagName)}Element`
    const arr = store.get(el)
    if (arr) arr.push(node.id)
    else store.set(el, [node.id])
  }

  if (node.children.length) {
    queue = [...queue, ...Array.from(node.children)]
  }
}

const elNames = Array.from(store.keys())

// prettier-ignore
const body = 
`${Array.from(store).map(([tagName, ids]) => `type ${tagName}Id = ${ids.map(_ => `'${_}'`).join(' | ')}`).join('\n')}

type Id = ${elNames.map((_) => `${_}Id`).join(' | ')}

interface Document {
  getElementById<T extends Id>(elementId: T): ${elNames.map((_) => `(T extends ${_}Id ? HTML${_} : never)`).join(' | ')}
}
declare global {
  const document: Document
}
`

writeFileSync('gen/elementId.d.ts', body)
