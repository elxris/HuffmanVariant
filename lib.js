'use strict'

let {BitStream} = require('bit-buffer')
const Transform = require('stream').Transform
let _ = require('lodash')

let getFrequencyTable = function (stream, n = 64, offset = 0) {
  let table = {}
  let pipe = new Transform()
  let bits = new Uint8Array(n)
  let count = 0
  return new Promise(function (resolve, reject) {
    pipe._transform = function (data, enconding, done) {
      let bs = new BitStream(data)
      while (bs.bitsLeft > 0) {
        if (offset > 0) {
          bs.readBoolean()
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
      table = _.map(table, (f, bits) => ({bits, f}))
      table = _.orderBy(table, ['f'], ['desc'])
      resolve(table)
    }
    stream.pipe(pipe)
  })
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

let getHuffmanTable = function (tree) {
  let table = {}
  huffmanTable([0], table, tree)
  huffmanTable([1], table, tree)

  _.mapValues(table, (v, k) => {
    v.code = Buffer.from(Uint8Array.from(k.split('').map(v => Number(v)))).toString()
    return v
  })

  return table
}

let huffmanTable = function (bits = [], table = {}, tree) {
  if (Array.isArray(_.get(tree, [...bits, 'branchs']))) {
    huffmanTable([...bits, 'branchs', 0], table, tree)
    huffmanTable([...bits, 'branchs', 1], table, tree)
  } else {
    table[_.filter(bits, v => v !== 'branchs').join('')] = _.get(tree, bits)
  }
}

let codingTree = function (table) {
  // Los bits son ahora las llaves de codificación
  table = _.mapKeys(table, (v, k) => {
    return v.bits
  })

  let tree = []
  _.forEach(table, (value, key) => {
    _.set(tree, Array.from(Uint8Array.from(Buffer.from(key))).map(v => v.toString()), value)
  })
  return tree
}

let codingPipe = function (codingTree) {
  let pipe = new Transform()
  let token = []
  let byte = new BitStream(new Buffer(8))
  pipe._transform = function (data, enconding, done) {
    let bs = new BitStream(data)
    while (bs.bitsLeft > 0) {
      token.push(Number(bs.readBoolean()).toString())
      if (_.get(codingTree, token)) {
        let code = _.get(codingTree, [...token, 'code'])
        if (code !== undefined) {
          let bits = Array.from(Uint8Array.from(Buffer.from(code)))
          while (bits.length > 0) {
            byte.writeBoolean(bits.shift())
            if (byte.index === 8) {
              byte.index = 0
              this.push(Buffer.of(byte.readBits(8, false)))
              byte.index = 0
            }
          }
          token = []
        }
      } else {
        token = []
        console.error('El token', token, 'no ha sido encontrado en el árbol.')
      }
    }
    done()
  }
  return pipe
}

module.exports = {getFrequencyTable, getHuffmanTree, getHuffmanTable, codingTree, codingPipe}
