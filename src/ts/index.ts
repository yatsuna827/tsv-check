import { getUrl } from './getUrl.js'

const getValue = (el: HTMLInputElement) => (el.checkValidity() ? Number(el.value) : null)
const getID = () => getValue(document.getElementById('id-input'))?.toString().padStart(6, '0')
const getIVs = () => (['h', 'a', 'b', 'c', 'd', 's'] as const).map((_) => getValue(document.getElementById(`ivs-${_}`)))
const addRow = (txt: string, onClick?: () => void) => {
  const div = document.createElement('div')
  const classes = ['message', 'card']
  if (onClick) {
    classes.push('clickable')
    div.addEventListener('click', onClick)
  }
  div.className = classes.join(' ')
  div.append(txt)
  document.getElementById('message-container').appendChild(div)
  scrollToBottom()
}
const scrollToBottom = () => {
  const el = document.documentElement
  window.scroll({
    top: el.scrollHeight - el.clientHeight,
    behavior: 'smooth',
  })
}

type Result = {
  seed: string
  index: number
  tsv: number
  trv: string
}

let worker: Worker | null = null
const createWorker = (id: string) => {
  worker = new Worker('./js/worker.js')
  let found = false
  worker.addEventListener('message', (e) => {
    if (e.data === 'completed') {
      document.getElementById('start-button').removeAttribute('disabled')
      addRow('計算を終了しました')
      if (found) {
        addRow('結果をクリック/タップするとツイートできます')
      }
    } else {
      found = true
      const { seed, index, tsv, trv } = e.data as Result
      addRow(`${seed} ${index}[F] tsv=${tsv} trv=${trv}`, () => {
        const tweet = `ID ${id} のセーブデータのTSVを特定したよ！ seed=${seed} TSV=${tsv} TRV=${trv}`
        const shareURL = `https://twitter.com/intent/tweet?text=${tweet}`
        window.open(shareURL)
      })
    }
  })

  return worker
}

const fetchSeedList = async (id: string, version: 'sm' | 'usum'): Promise<number[]> => {
  const url = getUrl(id, version)
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.json()
  })
}

const run = async () => {
  document.getElementById('start-button').setAttribute('disabled', 'true')

  const version = document.getElementById('ver-sm').checked ? 'sm' : 'usum'

  const id = getID()
  if (id == null) return alert('IDの入力にエラーがあります')

  const ivs = getIVs()
  if (ivs.includes(null)) return alert('個体値の入力にエラーがあります')

  const nature = Number(document.getElementById('nature-select').value)

  const max = getValue(document.getElementById('search-max'))
  if (max == null) return alert('上限の入力にエラーがあります')

  fetchSeedList(id, version)
    .then((seedList) => {
      createWorker(id).postMessage({
        method: 'start',
        version,
        ivs,
        nature,
        seedList,
        max,
      })
      addRow('計算を開始しました')
    })
    .catch((e) => {
      alert('seedリストの取得に失敗しました (・ω<)')
      console.log(e)
      document.getElementById('start-button').removeAttribute('disabled')
    })
}
const cancel = () => {
  if (worker) {
    worker.terminate()
    worker = null

    document.getElementById('start-button').removeAttribute('disabled')
    addRow('計算を中止しました')
  }
}

document.getElementById('start-button').onclick = run
document.getElementById('cancel-button').onclick = cancel
