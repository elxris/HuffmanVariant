'use strict'

let {readFile, getFrequencyTable} = require.main.require('./lib')

;(async function main () {
  let Google = await readFile('./files/Google.htm')
  for (let n = 2; n <= 16; n++) {
    for (let offset = 0; offset < n; offset++) {
      let table = await getFrequencyTable(Google, n, offset)
      console.log(table)
    }
  }
})().catch(console.error)
