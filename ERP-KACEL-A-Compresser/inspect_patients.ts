import XLSX from 'xlsx';
import * as path from 'path';

try {
  const filePath = path.join(process.cwd(), 'Table_Patients.xlsx');
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet) as any[];
  
  console.log(`Total rows in Patients: ${rows.length}`);
  console.log('Sample Patient rows (first 10):');
  console.log(JSON.stringify(rows.slice(0, 10), null, 2));

  // Let's check some N° formats.
  const formats = new Set<string>();
  rows.slice(0, 100).forEach(r => {
    const code = String(r['N°']);
    if (code.includes('/')) formats.add('Contains slash');
    else if (!isNaN(Number(code))) formats.add('Numeric');
    else formats.add('Other');
  });
  console.log('N° formats found in first 100 rows:', Array.from(formats));

} catch (err: any) {
  console.error('Error:', err.message);
}
