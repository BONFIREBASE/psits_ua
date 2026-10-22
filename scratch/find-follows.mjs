import * as fs from 'fs'

const content = fs.readFileSync('app/community/actions.ts', 'utf8')
const lines = content.split('\n')
lines.forEach((l, idx) => {
  if (l.includes('FOLLOWS')) {
    console.log(`${idx + 1}: ${l.trim()}`)
  }
})
