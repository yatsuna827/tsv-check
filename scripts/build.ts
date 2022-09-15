import { config } from './config'
import { writeFileSync } from 'fs'
import mkdirp from 'mkdirp'
import ncp from 'ncp'

const main = async () => {
  const env = process.env.NODE_ENV?.trim()
  if (env !== 'dev' && env !== 'prod') {
    throw new Error('unexpected NODE_ENV: ' + env)
  }

  await Promise.all([mkdirp('./page/js'), mkdirp('./page/css')])
  ncp('./src/index.html', './page/index.html', (err) => err && console.log(err))
  ncp('./src/css', './page/css', (err) => err && console.log(err))

  writeFileSync('./page/js/getUrl.js', `export const getUrl = ${config.getUrl[env].toString()}\n`)
}

main()
