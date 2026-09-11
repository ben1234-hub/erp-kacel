import XLSX from 'xlsx';
import * as path from 'path';
import fs from 'fs';

const files = [
  'Table_Patients-2.xlsx',
  'Table_Praticient-1.xlsx',
  'Table_Actes-1.xlsx',
  'Table_Packs-2.xlsx',
  'Table_Abons-2.xlsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  try {
    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];
    console.log(`\n=== File: ${file} | Sheet: ${sheetName} | Rows: ${rows.length} ===`);
    if (rows.length > 0) {
      console.log('Columns:', Object.keys(rows[0]));
      console.log('Sample Row 1:', JSON.stringify(rows[0], null, 2));
      if (rows.length > 1) {
        console.log('Sample Row 2:', JSON.stringify(rows[1], null, 2));
      }
    } else {
      console.log('Empty file.');
    }
  } catch (err: any) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
