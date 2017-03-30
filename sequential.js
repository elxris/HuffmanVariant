'use strict'

let _ = require('lodash')
let {readFile, getFrequencyTable, getHuffmanTree, getHuffmanTable} = require.main.require('./lib')

;(async function main () {
  let Google = await readFile('./files/Google.htm')
  // Get frequency tables
  let tables = []
  for (let n = 4; n <= 16; n = n + 2) {
    let best = []
    for (let offset = 0; offset < 1; offset++) {
      let table = await getFrequencyTable(Google, n, offset)
      table = _.map(table, (f, bites) => ({bites, f}))
      table = _.orderBy(table, ['f'], ['desc'])
      if (_.get(_.head(best), 'f', 0) < _.get(_.head(table), 'f', 0)) {
        best = table
      }
    }
    tables[n] = best
  }
  // console.log(tables)
  /**
   * Generar super tabla de huffman
   */
  for (let n = 4; n <= 16; n = n + 2) {
    let table = tables[n]
    tables[n] = _.map(table, (item) => {
      let {bites, f} = item
      return {bites, f, weigth: f * ((n - 2) / 2)}
    })
  }
  let superTable = []
  for (let n = 4; n <= 16; n = n + 2) {
    superTable = superTable.concat(tables[n])
  }
  superTable = _.orderBy(superTable, ['weigth'], ['desc'])
  // console.log(superTable)
  /**
   * Podar tabla
   */
  let subtable = []
  for (let i = 0; i < superTable.length; i++) {
    let podar = false
    let bites = _.get(superTable[i], 'bites')
    for (let j = 0; j < i && !podar; j++) {
      let prevBites = _.get(superTable[j], 'bites')
      podar = bites.startsWith(prevBites)
    }
    if (!podar) {
      subtable.push(superTable[i])
    }
  }
  /**
   * Generar árbol de huffman
   */
  console.log('TREE', JSON.stringify(subtable))
  let tree = getHuffmanTree(subtable)
  console.log('TREE', tree)
  let ht = getHuffmanTable(tree)
  console.log(ht)
})().catch(console.error)
