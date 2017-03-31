'use strict'

const fs = require('fs')
const Transform = require('stream').Transform
const {BitStream} = require('bit-buffer')
const _ = require('lodash')

let file = fs.createReadStream('./files/large.bin')

let getFrequencyTable = function (stream, n = 64, offset = 0) {
  let table = {}
  let pipe = new Transform()
  let bits = new Uint8Array(n)
  let offsetBits = []
  let count = 0
  return new Promise(function (resolve, reject) {
    pipe._transform = function (data, enconding, done) {
      let bs = new BitStream(data)
      while (bs.bitsLeft > 0) {
        if (offset > 0) {
          offsetBits.push(bs.readBoolean())
          offset--
          continue
        }
        bits[count++ % n] = bs.readBoolean()
        if (count % n === 0) {
          if (isNaN(++table[Buffer.from(bits)])) {
            table[Buffer.from(bits)] = 1
          }
        }
      }
      done()
    }
    pipe._flush = function () {
      while (count % n !== 0) {
        offsetBits.unshift(bits[count-- % n])
      }
      if (offsetBits.length > 0) {
        table[Buffer.from(offsetBits)]++
      }
      resolve(table)
    }
    stream.pipe(pipe)
  })
}

;(async function main () {
  let table = await getFrequencyTable(file, 2048)
  exit()
})().catch(console.error)

let interval = setInterval(() => {}, 1000)
let exit = function () { clearInterval(interval) }

module.exports = {}
