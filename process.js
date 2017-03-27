'use strict'

let {readFile, getFrequencyTable} = require.main.require('./lib')

let NUM = Number(process.env.NUM) || 4
let RANK = Number(process.env.RANK) || 0

let waitMessage = (function * () {
  while (true) {
    console.log(`${RANK} waiting message`)
    yield new Promise((resolve, reject) => {
      process.once('message', m => {
        console.log(`${RANK} message received`)
        resolve(m)
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
  let message = waitMessage.next().value
  console.log(`Hello from ${RANK}-${NUM}`)
  await resolveAfter2Seconds()
  let to = (RANK + 1) % NUM
  sendMessage({to})
  console.log(`${RANK}-${NUM}`, await message)
})().catch(console.error)
