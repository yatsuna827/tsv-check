import type { Config } from './types'
export const config: Config = {
  getUrl: {
    dev: (id, version) => `http://localhost:8080/${version}/${id}`,
    prod: (id, version) => `https://jyk6mdg08i.execute-api.ap-northeast-1.amazonaws.com/rng/gen7/tsvsupport?version=${version}&g7tid=${id}`,
  },
}
