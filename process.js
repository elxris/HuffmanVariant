'use strict'

const fs = require('fs')
let _ = require('lodash')
let {getFrequencyTable, getHuffmanTree, getHuffmanTable, codingTree, codingPipe} = require.main.require('./lib')

let NUM = Number(process.env.NUM) || 4
let RANK = Number(process.env.RANK) || 0

let MIN_SIZE_WORD = 8
let MAX_SIZE_WORD = 32
let WORD_STEP = MIN_SIZE_WORD * 1

let queue = []
process.on('message', m => {
  queue.push(m)
})

let waitMessage = (function * () {
  while (true) {
    while (queue.length > 0) {
      console.log(`${RANK} message fetched from queue`)
      yield Promise.resolve(queue.shift())
    }
    console.log(`${RANK} waiting message`)
    yield new Promise((resolve, reject) => {
      process.once('message', m => {
        console.log(`${RANK} message received`)
        resolve(m)
        queue.shift()
      })
    })
  }
})()

let sendMessage = function ({to = 0, data = {}}) {
  process.send({to, data})
}

;(async function main () {
  console.log(`Hello from ${RANK}-${NUM}`)
  let Google = fs.createReadStream('./files/Google.htm')
  if (RANK === 0) {
    let count = 0
    for (let n = MIN_SIZE_WORD; n <= MAX_SIZE_WORD; n += WORD_STEP) {
      let p = (count++ % (NUM - 1)) + 1
      sendMessage({to: p, data: {task: 'getTable', n}})
    }

    let superTable = []
    for (let n = MIN_SIZE_WORD; n <= MAX_SIZE_WORD; n += WORD_STEP) {
      let table = (await (waitMessage.next().value)).data.table
      table = _.map(table, (item) => {
        let {bits, f} = item
        return {bits, f, weigth: f * bits.length}
      })
      superTable = superTable.concat(table)
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

    for (let i = 1; i < NUM; i++) {
      sendMessage({to: i, data: {task: 'quit'}})
    }

    for (let i = 1; i < NUM; i++) {
      await (waitMessage.next().value)
    }
  } else {
    while (true) {
      let data = (await (waitMessage.next().value)).data
      let {task} = data
      if (task === 'quit') {
        sendMessage({to: 0})
        break
      } else if (task === 'getTable') {
        let {n, offset} = data
        let table = await getFrequencyTable(Google, n, offset)
        // console.log(table)
        sendMessage({to: 0, data: {table: table}})
      }
    }
  }
  exit()
})().catch(console.error)

function exit () {
  process.removeAllListeners('message')
}
