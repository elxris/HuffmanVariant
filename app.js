'use strict'

let cp = require('child_process')
let os = require('os')
let NUM = Math.max(Number(process.env.NUM) || os.cpus().length, 2)

let childs = []

for (let cid = 0; cid < NUM; cid++) {
  let child = cp.fork('./process', {
    env: {RANK: cid}
  })
  childs[cid] = child
  child.on('message', ({to = 0, data}) => {
    childs[to].send({data, from: cid}, (error) => {
      if (error) return console.error(`Error al enviar el mensaje a ${to}`)
    })
  })
}
