import XLSX from 'xlsx';
import path from 'path';

const filePath = path.join('C:', 'Users', 'BONFIRE BASE', 'Downloads', 'University_of_Antique_Master_Class_List.xlsx');
const wb = XLSX.readFile(filePath);

console.log('Total sheets:', wb.SheetNames.length);
console.log('Sheet names:', JSON.stringify(wb.SheetNames));

let totalStudents = 0;
const summary = {};
wb.SheetNames.forEach(s => {
  const ws = wb.Sheets[s];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const studentCount = data.length - 1; // minus header
  summary[s] = studentCount;
  totalStudents += studentCount;
});

console.log('\nPer-section breakdown:');
Object.entries(summary).forEach(([sheet, count]) => {
  console.log(`  ${sheet}: ${count} students`);
});
console.log('\nTotal students across all sections:', totalStudents);

// Check for duplicates
const allStudents = new Map();
wb.SheetNames.forEach(s => {
  const ws = wb.Sheets[s];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  data.slice(1).forEach(row => {
    const studentNo = row[1];
    const name = row[2];
    if (studentNo) {
      if (!allStudents.has(studentNo)) {
        allStudents.set(studentNo, { name, sections: [s] });
      } else {
        allStudents.get(studentNo).sections.push(s);
      }
    }
  });
});

const uniqueStudents = allStudents.size;
const duplicates = [...allStudents.entries()].filter(([, v]) => v.sections.length > 1);
console.log('\nUnique students (by Student No.):', uniqueStudents);
console.log('Students appearing in multiple sections:', duplicates.length);

// Year level breakdown
const yearLevels = { '1st Year': 0, '2nd Year': 0, '3rd Year': 0, '4th Year': 0 };
wb.SheetNames.forEach(s => {
  const ws = wb.Sheets[s];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const count = data.length - 1;
  if (s.includes('1-')) yearLevels['1st Year'] += count;
  else if (s.includes('2-')) yearLevels['2nd Year'] += count;
  else if (s.includes('3-')) yearLevels['3rd Year'] += count;
  else if (s.includes('4-')) yearLevels['4th Year'] += count;
});
console.log('\nYear level breakdown (by section):');
Object.entries(yearLevels).forEach(([yr, c]) => console.log(`  ${yr}: ${c}`));
