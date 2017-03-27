'use strict'

let {readFile, getFrequencyTable} = require.main.require('./lib')

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

function resolveAfter2Seconds (x) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(x)
    }, 2000)
  })
}

(async function main () {
  console.log(`Hello from ${RANK}-${NUM}`)
  await resolveAfter2Seconds()
  let to = (RANK + 1) % NUM
  sendMessage({to})
  sendMessage({to})
  console.log(`${RANK}-${NUM}`, await (waitMessage.next().value))
  console.log(`${RANK}-${NUM}`, await (waitMessage.next().value))
  exit()
})().catch(console.error)

function exit () {
  process.removeAllListeners('message')
}
