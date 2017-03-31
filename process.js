'use strict'

const fs = require('fs')
let {getFrequencyTable} = require.main.require('./lib')

let NUM = Number(process.env.NUM) || 4
let RANK = Number(process.env.RANK) || 0

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
    for (let n = 2; n <= 16; n++) {
      for (let offset = 0; offset < n; offset++) {
        let p = (count++ % (NUM - 1)) + 1
        sendMessage({to: p, data: {task: 'getTable', n, offset}})
      }
    }
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
        console.log(table)
        sendMessage({to: 0})
      }
    }
  }
  exit()
})().catch(console.error)

function exit () {
  process.removeAllListeners('message')
}
