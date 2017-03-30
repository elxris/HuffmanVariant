'use strict'

let {BitStream} = require('bit-buffer')
let fs = require('fs')
let _ = require('lodash')

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

let getHuffmanTree = function (freqTable) {
  let table = Array.from(freqTable)
  table = _.orderBy(table, ['weigth'], ['desc'])
  while (table.length > 2) {
    let leafA = table.pop()
    let leafB = table.pop()
    let node = {branchs: [leafA, leafB], weigth: leafA.weigth + leafB.weigth}
    table.push(node)
    table = _.orderBy(table, ['weigth'], ['desc'])
  }
  return table
}

let getHuffmanTable = function (freqTable) {
  let table = {}
  huffmanTable([0], table, freqTable)
  huffmanTable([1], table, freqTable)
  return table
}

let huffmanTable = function (bits = [], table = {}, freqTable) {
  if (Array.isArray(_.get(freqTable, [...bits, 'branchs']))) {
    huffmanTable([...bits, 'branchs', 0], table, freqTable)
    huffmanTable([...bits, 'branchs', 1], table, freqTable)
  } else {
    console.log(JSON.stringify(bits))
    table[_.filter(bits, v => v !== 'branchs').join('')] = _.get(freqTable, bits)
  }
}

module.exports = {getFrequencyTable, readFile, getHuffmanTree, getHuffmanTable}
