import XLSX from 'xlsx';
import * as path from 'path';

try {
  const filePath = path.join(process.cwd(), 'Table_Abons.xlsx');
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet) as any[];
  
  const combos = new Map<string, { count: number, minPrice: number, maxPrice: number }>();
  rows.forEach(r => {
    const service = r['Service'] || 'Unknown';
    const numSessions = r['Nombre des séances'] || 0;
    const priceAbn = r["Prix d'abonnement"] || 0;
    
    const key = `${service} | Sessions: ${numSessions}`;
    if (!combos.has(key)) {
      combos.set(key, { count: 1, minPrice: priceAbn, maxPrice: priceAbn });
    } else {
      const c = combos.get(key)!;
      c.count++;
      c.minPrice = Math.min(c.minPrice, priceAbn);
      c.maxPrice = Math.max(c.maxPrice, priceAbn);
    }
  });

  console.log('Unique combinations in Abons:');
  for (const [key, val] of combos.entries()) {
    console.log(`- ${key} -> occurrences: ${val.count}, Price range: ${val.minPrice} to ${val.maxPrice} DA`);
  }
} catch (err: any) {
  console.error('Error:', err.message);
}
