import XLSX from 'xlsx';
import * as path from 'path';
import fs from 'fs';

const filesToInspect = {
  services: 'Table Sces-1.xlsx',
  patients: 'Table_Patients-3.xlsx',
  abonnements: 'Table_Abons-3.xlsx',
  packs: 'Table_Packs-3.xlsx',
  actes: 'Table_Actes-2.xlsx',
  praticiens: 'Table_Praticient-2.xlsx'
};

Object.entries(filesToInspect).forEach(([key, file]) => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`\n❌ [${key}] Fichier introuvable: ${file}`);
    return;
  }
  try {
    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]) as any[];
    console.log(`\n=== 📊 Fichier: ${file} | Lignes: ${rows.length} ===`);
    if (rows.length > 0) {
      console.log('Colonnes détectées:', Object.keys(rows[0]));
      console.log('Exemple de ligne 1:', JSON.stringify(rows[0], null, 2));
      
      if (key === 'patients') {
        // Analyse spécifique pour les patients
        const codeCounts = new Map<string, number>();
        const nameCounts = new Map<string, number>();
        let missingCodeCount = 0;
        let missingNameCount = 0;

        rows.forEach(r => {
          const code = r['N°'] ? String(r['N°']).trim() : '';
          const name = r['Nom & Prénom'] ? String(r['Nom & Prénom']).trim() : '';
          if (!code) missingCodeCount++;
          else codeCounts.set(code, (codeCounts.get(code) || 0) + 1);

          if (!name) missingNameCount++;
          else nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
        });

        const duplicateCodes = Array.from(codeCounts.entries()).filter(([_, count]) => count > 1);
        const duplicateNames = Array.from(nameCounts.entries()).filter(([_, count]) => count > 1);

        console.log(`Analyse des patients :`);
        console.log(`- Codes manquants : ${missingCodeCount}`);
        console.log(`- Noms manquants : ${missingNameCount}`);
        console.log(`- Doublons par Code (N°) : ${duplicateCodes.length} codes uniques en doublon`);
        if (duplicateCodes.length > 0) {
          console.log('Exemples de codes en doublon (Top 5):', duplicateCodes.slice(0, 5));
        }
        console.log(`- Doublons par Nom & Prénom : ${duplicateNames.length} noms uniques en doublon`);
        if (duplicateNames.length > 0) {
          console.log('Exemples de noms en doublon (Top 5):', duplicateNames.slice(0, 5));
        }
      }
    } else {
      console.log('Fichier vide.');
    }
  } catch (err: any) {
    console.error(`❌ Erreur de lecture pour ${file}:`, err.message);
  }
});
