import express from 'express'
import cors from 'cors'
import { readFileSync, existsSync } from 'fs'

const webapp = express()
webapp.use(express.static('page'))

try {
  webapp.listen(3000, () => {
    console.log('Web-Server running at http://localhost:3000')
  })
} catch (e) {
  if (e instanceof Error) {
    console.log(e.message)
  } else {
    console.log(e)
  }
}

const api = express()
api.use(cors())
api.get('/:ver/:id', (req, res) => {
  const { id, ver } = req.params
  const path = `./mock-server/data/${ver}/${id.padStart(6, '0')}.json`
  let data: string | undefined = undefined

  if (
    !['sm', 'usum'].includes(ver) ||
    !/\d{1,6}/.test(id) ||
    !existsSync(path)
  ) {
    res.status(404)
  } else {
    try {
      data = JSON.parse(readFileSync(path, 'utf-8'))
    } catch {
      res.status(500)
    }
  }

  res.json(data)
})

try {
  api.listen(8080, () => {
    console.log('API-Server running at http://localhost:8080')
  })
} catch (e) {
  if (e instanceof Error) {
    console.log(e.message)
  } else {
    console.log(e)
  }
}
