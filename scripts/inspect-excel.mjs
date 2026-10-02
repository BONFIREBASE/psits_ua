#!/usr/bin/env node
import pkg from 'xlsx'
const { readFile, utils } = pkg

const workbook = readFile('./scripts/University_of_Antique_Master_Class_List.xlsx')
const sheetName = workbook.SheetNames[0]
const worksheet = workbook.Sheets[sheetName]
const rawData = utils.sheet_to_json(worksheet)

console.log('Total rows:', rawData.length)
console.log('\nFirst row columns:')
if (rawData[0]) {
  Object.keys(rawData[0]).forEach(key => {
    console.log(`  - "${key}": "${rawData[0][key]}"`)
  })
}

console.log('\nFirst 3 rows sample:')
console.log(JSON.stringify(rawData.slice(0, 3), null, 2))
