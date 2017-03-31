'use strict'

let _ = require('lodash')
let fs = require('fs')
let {getFrequencyTable, getHuffmanTree, getHuffmanTable, codingTree, codingPipe} = require.main.require('./lib')

let MIN_SIZE_WORD = 16
let MAX_SIZE_WORD = MIN_SIZE_WORD
let WORD_STEP = MIN_SIZE_WORD * 1

;(async function main () {
  // Get frequency tables
  let tables = []
  for (let n = MIN_SIZE_WORD; n <= MAX_SIZE_WORD; n += WORD_STEP) {
    let Google = fs.createReadStream('./files/Google.htm')
    let table = await getFrequencyTable(Google, n)

    tables[n] = table
  }
  /**
   * Generar super tabla de huffman
   */
  for (let n = MIN_SIZE_WORD; n <= MAX_SIZE_WORD; n += WORD_STEP) {
    let table = tables[n]
    tables[n] = _.map(table, (item) => {
      let {bits, f} = item
      return {bits, f, weigth: f * n}
    })
  }

  let superTable = []
  for (let n = MIN_SIZE_WORD; n <= MAX_SIZE_WORD; n += WORD_STEP) {
    superTable = superTable.concat(tables[n])
  }
  superTable = _.orderBy(superTable, ['weigth'], ['desc'])
  /**
   * Podar tabla
   */
  console.log('PODA', superTable.length)
  let subtable = []
  for (let i = 0; i < superTable.length; i++) {
    let podar = false
    let bits = _.get(superTable[i], 'bits')
    for (let j = 0; j < subtable.length && !podar; j++) {
      let prevBites = _.get(subtable[j], 'bits')
      podar = bits.startsWith(prevBites)
    }
    if (!podar) {
      subtable.push(superTable[i])
      console.log('PODA', (subtable.length / i).toFixed(2), subtable.length, i, superTable.length)
      continue
    }
  }
  /**
   * Volver a pesar la tabla
   */
  for (let i = 0; i < subtable.length; i++) {
    for (let k = 0; k < subtable.length; k++) {
      if (i === k) continue
      if (subtable[i].bits.startsWith(subtable[k])) {
        subtable[i].f -= subtable[k].f
        subtable[i].weigth = subtable[i].k * subtable[i].bits.length
      }
    }
  }

  /**
   * Generar árbol de huffman
   */
  let tree = getHuffmanTree(subtable)
  let htable = getHuffmanTable(tree)
  // console.log('TREE', JSON.stringify(htable))

  /**
   * Generar árbol codificador
   */
  let codificador = codingTree(htable)
  let Google = fs.createReadStream('./files/Google.htm')
  Google.pipe(codingPipe(codificador)).pipe(fs.createWriteStream('./Google.huff'))
})().catch(console.error)
