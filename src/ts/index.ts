const getValue = (el: HTMLInputElement) =>
  el.checkValidity() ? Number(el.value) : null
const getID = () =>
  getValue(document.getElementById('id-input') as HTMLInputElement)
    ?.toString()
    .padStart(6, '0')
const getIVs = () =>
  ['h', 'a', 'b', 'c', 'd', 's'].map((_) =>
    getValue(document.getElementById(`ivs-${_}`) as HTMLInputElement)
  )
const addRow = (txt: string, onClick?: () => void) => {
  const div = document.createElement('div')
  const classes = ['message', 'card']
  if (onClick) {
    classes.push('clickable')
    div.addEventListener('click', onClick)
  }
  div.className = classes.join(' ')
  div.append(txt)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  document.getElementById('message-container')!.appendChild(div)
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById('start-button')!.removeAttribute('disabled')
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

const fetchSeedList = async (id: string, version: 'sm' | 'usum') => {
  const url = `https://jyk6mdg08i.execute-api.ap-northeast-1.amazonaws.com/rng/gen7/tsvsupport?version=${version}&g7tid=${id}`
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      return res.json()
    })
    .catch((e) => {
      console.log(e)
      return null
    })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function run() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  document.getElementById('start-button')!.setAttribute('disabled', 'true')

  const version = (document.getElementById('ver-sm') as HTMLInputElement)
    .checked
    ? 'sm'
    : 'usum'

  const id = getID()
  if (id == null) return alert('IDの入力にエラーがあります')

  const ivs = getIVs()
  if (ivs.includes(null)) return alert('個体値の入力にエラーがあります')

  const nature = Number(
    (document.getElementById('nature-select') as HTMLSelectElement).value
  )

  const max = getValue(
    document.getElementById('search-max') as HTMLInputElement
  )
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
    .catch(() => {
      alert('seedリストの取得に失敗しました (・ω<)')
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById('start-button')!.removeAttribute('disabled')
    })
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cancel() {
  if (worker) {
    worker.terminate()
    worker = null

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.getElementById('start-button')!.removeAttribute('disabled')
    addRow('計算を中止しました')
  }
}
