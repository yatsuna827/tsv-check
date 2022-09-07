"use strict";
if (!Math.imul) {
  Math.imul = function(opA, opB) {
      opB |= 0
      let result = (opA & 0x003fffff) * opB
      if (opA & 0xffc00000) result += (opA & 0xffc00000) * opB |0;
      return result |0;
  }
}

const MSK1 = 0xdfffffef;
const MSK2 = 0xddfecb7f;
const MSK3 = 0xbffaffff;
const MSK4 = 0xbffffff6;

class SFMT {
  private stateVector: number[]
  private randIndex: number
  private index32: number

  constructor(seed: number) {
    this.stateVector = [] // 624

    this.stateVector[0] = seed >>> 0
    for (let i = 1; i < 624; i++) 
      this.stateVector[i] = (Math.imul(0x6C078965, this.stateVector[i - 1] ^ (this.stateVector[i - 1] >>> 30)) + i) & 0xFFFFFFFF

    this.periodCertification()

    this.randIndex = 624

    this.index32 = 0;
  }

  periodCertification() {
    const PARITY = [1,0,0,0x13c9e684]
  
    let inner = 0;
    for (let i = 0; i < 4; i++) inner ^= this.stateVector[i] & PARITY[i];
    for (let i = 16; i > 0; i >>= 1) inner ^= inner >> i;
  
    // check OK
    if ((inner & 1) == 1) return;
  
    // check NG, and modification
    for (let i = 0; i < 4; i++) {
      let work = 1;
      for (let j = 0; j < 32; j++, work <<= 1) {
        if ((work & PARITY[i]) != 0) {
          this.stateVector[i] ^= work;
          return;
        }
      }
    }
  }

  getRand32() {
    if (this.randIndex >= 624){
        this.generateRandAll();
        this.randIndex = 0;
    }

    this.index32++;
    return this.stateVector[this.randIndex++];
  }

  getRand64() {
    return [this.getRand32(), this.getRand32()]
  }

  getIndex = () => this.index32 >>> 1;

  private generateRandAll() {
    const p = this.stateVector;

    let a = 0;
    let b = 488;
    let c = 616;
    let d = 620;
    do
    {
      p[a + 3] = p[a + 3] ^ (p[a + 3] << 8) ^ (p[a + 2] >>> 24) ^ (p[c + 3] >>> 8) ^ (((p[b + 3] >>> 11) & MSK4) >>> 0) ^ (p[d + 3] << 18);
      p[a + 2] = p[a + 2] ^ (p[a + 2] << 8) ^ (p[a + 1] >>> 24) ^ (p[c + 3] << 24) ^ (p[c + 2] >>> 8) ^ (((p[b + 2] >>> 11) & MSK3) >>> 0) ^ (p[d + 2] << 18);
      p[a + 1] = p[a + 1] ^ (p[a + 1] << 8) ^ (p[a + 0] >>> 24) ^ (p[c + 2] << 24) ^ (p[c + 1] >>> 8) ^ (((p[b + 1] >>> 11) & MSK2) >>> 0) ^ (p[d + 1] << 18);
      p[a + 0] = p[a + 0] ^ (p[a + 0] << 8) ^ (p[c + 1] << 24) ^ (p[c + 0] >>> 8) ^ (((p[b + 0] >>> 11) & MSK1) >>> 0) ^ (p[d + 0] << 18);
      c = d; d = a; a += 4; b += 4;
      if (b >= 624) b = 0;
    } while (a < 624);
  }

  toString() {
    return this.stateVector.map(_ => (_ >>> 0).toString(16).padStart(8, '0')).join(',')
  }
}
class SFMTStream {
  private sfmt: SFMT
  private ivsCode: number
  private nextIV: number
  constructor(seed: number) {
    this.sfmt = new SFMT(seed)
    this.ivsCode = 0;

    for (let i=0; i<6; i++) {
      const [l] = this.sfmt.getRand64()
      this.ivsCode = ((this.ivsCode << 5) | ((l>>>0) & 0x1F)) & 0x3FFFFFFF
    }
    this.nextIV = this.sfmt.getRand64()[0] & 0x1F
  }
  
  get(): [number,number] {
    const [l, h] = this.sfmt.getRand64()
    const nature = ((h>>>0) * 21 + (l>>>0)) % 25
    const ivs = this.ivsCode
    this.ivsCode = ((this.ivsCode << 5) | this.nextIV) & 0x3FFFFFFF
    this.nextIV = (l & 0x1F)

    return [ivs, nature]
  }
  getId(): number {
    const [l, h] = this.sfmt.getRand64()
    const nature = ((h>>>0) * 21 + (l>>>0)) % 25
    const ivs = this.ivsCode
    this.ivsCode = ((this.ivsCode << 5) | this.nextIV) & 0x3FFFFFFF
    this.nextIV = (l & 0x1F)

    return (l & 0xFFFF) ^ (l >>> 16)
  }

  toString = () => this.sfmt.toString()
  getIndex = () => this.sfmt.getIndex()
}

const encode = (ivs: number[]) => {
    let code = 0;
    for (let i = 0; i < 6; i++)
        code = (code << 5) | ivs[i];
    return code;
};

self.addEventListener("message", (e) => {
  start(e.data)
})

type Props = {
  version: 'sm' | 'usum'
  seedList: number[]
  ivs: number[]
  nature: number
  max: number
}
const start = ({version, seedList, ivs, nature, max}: Props) => {
  const targetIVs = encode(ivs)
  const targetNature = nature

  console.log("start", {'#seeds': seedList.length, ivs, nature })

  const init = (version === 'sm' ? 1005 : 1125)

  for (const seed of seedList) {
    const rng = new SFMTStream(seed);
    for (let i=0; i<init; i++) {
      rng.get()
    }
    const xor = rng.getId()
    const [tsv, trv] = [xor >> 4, (xor & 0xF).toString(16).toUpperCase()]
    for (let i = init+1; i <= max; i++) {
        let [ivs, nature] = rng.get();
        if (ivs === targetIVs && nature === targetNature) {
          postMessage({
            seed: (seed>>>0).toString(16).padStart(8,'0').toUpperCase(), 
            index: rng.getIndex() - 1,
            tsv, trv
          })
        }
    }
  }

  self.postMessage("completed")
}