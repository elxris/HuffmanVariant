'use strict'

let {BitStream} = require('bit-buffer')
let fs = require('fs')

let readFile = async function (file) {
  return await new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) return reject(err)
      resolve(new BitStream(data))
    })
  })
}

let getFrequencyTable = async function (file, n = 2, offset = 0) {
  let table = {}
  file.index = 0
  if (offset !== 0) {
    let bits = ('0'.repeat(n) + file.readBits(offset, false).toString(2)).substr(-n)
    table[bits] = (table[bits] || 0) + 1
  }
  while (file.bitsLeft > n) {
    let bits = ('0'.repeat(n) + file.readBits(n, false).toString(2)).substr(-n)
    table[bits] = (table[bits] || 0) + 1
  }
  if (file.bitsLeft > 0) {
    let bits = ('0'.repeat(n) + file.readBits(file.bitsLeft, false).toString(2)).substr(-n)
    table[bits] = (table[bits] || 0) + 1
  }
  return table
}

module.exports = {getFrequencyTable, readFile}
