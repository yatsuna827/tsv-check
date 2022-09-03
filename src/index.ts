const getValue = (el: HTMLInputElement) => el.checkValidity() ? Number(el.value) : null
const getID = () => getValue(document.getElementById('id-input') as HTMLInputElement)?.toString().padStart(6,'0')
const getIVs = () => ['h','a','b','c','d','s'].map(_ => getValue(document.getElementById(`ivs-${_}`) as HTMLInputElement))
const addRow = (txt: string) => {
    const div = document.createElement('div')
    div.className = 'message card'
    div.append(txt)
    document.getElementById('message-container')!.appendChild(div)
    scrollToBottom()
}
const scrollToBottom = () => {
  const el = document.documentElement
  window.scroll({
    top: el.scrollHeight - el.clientHeight,
    behavior: 'smooth'
  })
}

type Result = {
  seed: string
  index: number
  tsv: number
  trv: string
}

let worker: Worker | null = null
const createWorker = () => {
  worker = new Worker('/js/worker.js')
  worker.addEventListener('message', (e) => {
    if (e.data === 'completed'){
        document.getElementById('start-button')!.removeAttribute('disabled')
        addRow('計算を終了しました')
    }
    else {
      const {seed, index, tsv, trv} = e.data as Result
      addRow(`${seed} ${index}[F] tsv=${tsv} trv=${trv}`)
    }
  })

  return worker
}

const fetchSeedList = async (id: string) => {
  const url = `http://localhost:8080/api/${id}.json` // デバッグ用。
  return fetch(url)
    .then((res) => res.json())
    .catch(() => null)
}

async function run() {
  const version = (document.getElementById('ver-sm') as HTMLInputElement).checked
    ? 'sm' : 'usum'

    const id = getID();
    if (id == null) return alert('IDの入力にエラーがあります')

    const seedList = await fetchSeedList(id)
    if (!seedList) return alert('seedリストの取得に失敗しました (・ω<)')

    const ivs = getIVs();
    if (ivs.includes(null)) return alert('個体値の入力にエラーがあります')

    const nature = Number((document.getElementById('nature-select') as HTMLSelectElement).value)

    const max = getValue(document.getElementById('search-max') as HTMLInputElement)
    if (max == null) return alert('上限の入力にエラーがあります')

    createWorker().postMessage({ method: 'start', version, ivs, nature, seedList, max })
    document.getElementById('start-button')!.setAttribute('disabled', 'true')
    addRow('計算を開始しました')
}
function cancel() {
  if (worker) {
    worker.terminate()
    worker = null;
    
    document.getElementById('start-button')!.removeAttribute('disabled')
    addRow('計算を中止しました')
  }
}
