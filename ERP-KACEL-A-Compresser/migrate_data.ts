import XLSX from 'xlsx';
import * as path from 'path';
import fs from 'fs';
import { cleanAlgerianWilaya } from './src/components/DatabaseSection';

function excelDateToISO(serial: any): string {
  if (!serial) return '';
  const num = Number(serial);
  if (isNaN(num)) {
    const str = String(serial).trim();
    // Try to match DD/MM/YYYY or YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const parts = str.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return str;
  }
  // Convert excel serial date to JS Date
  const utc_days  = Math.floor(num - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  
  const year = date_info.getFullYear();
  const month = String(date_info.getMonth() + 1).padStart(2, '0');
  const day = String(date_info.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function determineSceId(affectation: string): number {
  if (!affectation) return 1;
  const affLower = affectation.toLowerCase();
  if (affLower.includes('balneo') || affLower.includes('bassin')) return 2;
  if (affLower.includes('étage 2') || affLower.includes('etage 2') || affLower.includes('sce_3') || affLower.includes('intensif 2')) return 3;
  if (affLower.includes('étage 3') || affLower.includes('etage 3') || affLower.includes('sce_4') || affLower.includes('intensif 3')) return 4;
  if (affLower.includes('étage 4') || affLower.includes('etage 4') || affLower.includes('sce_5') || affLower.includes('intensif 4')) return 5;
  return 1; // Rééducation fonctionnelle
}

function determineRepere(fonction: string, defaultRepere: string): 'K' | 'P' | 'O' | 'MPR' {
  if (!fonction) return 'K';
  const fLower = fonction.toLowerCase();
  if (fLower.includes('kiné') || fLower.includes('kine')) return 'K';
  if (fLower.includes('ortho')) return 'O';
  if (fLower.includes('psy') || fLower.includes('psychomot')) return 'P';
  if (fLower.includes('mpr') || fLower.includes('medecin') || fLower.includes('médecin')) return 'MPR';
  
  if (defaultRepere === 'K' || defaultRepere === 'P' || defaultRepere === 'O' || defaultRepere === 'MPR') {
    return defaultRepere;
  }
  return 'K';
}

function cleanPhone(raw: any): string {
  if (!raw) return 'Non renseigné';
  const clean = String(raw).trim().replace(/[.\-\s]/g, '');
  if (!clean) return 'Non renseigné';
  return clean;
}

try {
  console.log("=== STARTING DATA INJECTION MIGRATION ===");
  const DB_FILE = path.join(process.cwd(), "stored_erp_db.json");
  
  let database: any = {
    services: [
      { ID_Sce: 1, Libelle_Sce: 'Rééducation Fonctionnelle' },
      { ID_Sce: 2, Libelle_Sce: 'Balnéothérapie' },
      { ID_Sce: 3, Libelle_Sce: 'Services Intensifs - Étage 2' },
      { ID_Sce: 4, Libelle_Sce: 'Services Intensifs - Étage 3' },
      { ID_Sce: 5, Libelle_Sce: 'Services Intensifs - Étage 4' }
    ],
    utilisateurs: [],
    praticiens: [],
    actes: [],
    packs: [],
    patients: [],
    abonnements: [],
    versements: [],
    rendezVous: [],
    seances: [],
    fileAttente: [],
    consultations: [],
    deficitsCliniques: [],
    fichesKineAutomatisees: [],
    detailsFicheActes: [],
    reglesAutomatisation: []
  };

  if (fs.existsSync(DB_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      // Preserve existing structural config like users, SSE configurations, metadata, etc.
      if (existing.utilisateurs && existing.utilisateurs.length > 0) {
        database.utilisateurs = existing.utilisateurs;
      }
      if (existing.reglesAutomatisation && existing.reglesAutomatisation.length > 0) {
        database.reglesAutomatisation = existing.reglesAutomatisation;
      }
      console.log("Preserved existing users and rules configurations.");
    } catch (e) {
      console.warn("Could not parse existing database, starting from scratch.");
    }
  }

  // 1. IMPORT ACTES
  console.log("\n--- Importing Actes ---");
  const actesPath = path.join(process.cwd(), 'Table_Actes-1.xlsx');
  let actesList: any[] = [];
  if (fs.existsSync(actesPath)) {
    const wb = XLSX.readFile(actesPath);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
    rows.forEach((row, i) => {
      actesList.push({
        ID_Acte: i + 1,
        Libelle_Acte: String(row['Motif'] || '').trim(),
        Prix_Acte: Number(row['Prix public'] || row['Prix convention'] || 0),
        Const_Act: String(row['Motif'] || '').toLowerCase().includes('consult')
      });
    });
    database.actes = actesList;
    console.log(`Successfully imported ${actesList.length} Actes.`);
  } else {
    console.log("Table_Actes-1.xlsx not found.");
  }

  // 2. IMPORT PACKS
  console.log("\n--- Importing Packs ---");
  const packsPath = path.join(process.cwd(), 'Table_Packs-2.xlsx');
  let packsList: any[] = [];
  if (fs.existsSync(packsPath)) {
    const wb = XLSX.readFile(packsPath);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
    rows.forEach((row, i) => {
      packsList.push({
        ID_Pack: i + 1,
        Libelle_Pack: String(row['Libele'] || '').trim(),
        Nbre_Seance_Pack: Number(row['Nbre Séance'] || 0),
        Prix_Pack: Number(row['Prix'] || 0),
        Prix_Seanc_Pack: Number(row['Prix_Seance_Pack'] || 0),
        Cat_Pack: String(row['Libele'] || '').toLowerCase().includes('balneo') ? 'B' : 'R'
      });
    });
    database.packs = packsList;
    console.log(`Successfully imported ${packsList.length} Packs.`);
  } else {
    console.log("Table_Packs-2.xlsx not found.");
  }

  // 3. IMPORT PRATICIENS
  console.log("\n--- Importing Praticiens ---");
  const praticiensPath = path.join(process.cwd(), 'Table_Praticient-1.xlsx');
  let praticiensList: any[] = [];
  if (fs.existsSync(praticiensPath)) {
    const wb = XLSX.readFile(praticiensPath);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
    rows.forEach((row, i) => {
      const nom = String(row['Nom'] || '').trim();
      const prenom = String(row['Prénom'] || '').trim();
      if (!nom && !prenom) return;
      
      const sceId = determineSceId(row['Affectation'] || row['ID']);
      const repere = determineRepere(row['Fonction '], row['Repere'] || 'K');
      
      praticiensList.push({
        ID_Prat: Number(row['Mle'] || i + 1),
        ID_Sce: sceId,
        Repere: repere,
        Nom_Prat: nom,
        Prenom_Prat: prenom,
        Nom_Arb: row['Nom & Pren Arabe'] ? String(row['Nom & Pren Arabe']).trim() : undefined,
        Date_Nais_Prat: excelDateToISO(row['Date de naissance']),
        Date_Recrut_Prat: excelDateToISO(row["Date d'Entrée"]),
        Type_Cont_Prat: row['type de contrat '] === 'CDD' ? 'CDD' : 'CDI',
        Genre_Prat: row['Sexe'] === 'Homme' ? 'H' : 'F'
      });
    });
    database.praticiens = praticiensList;
    console.log(`Successfully imported ${praticiensList.length} Praticiens.`);
  } else {
    console.log("Table_Praticient-1.xlsx not found.");
  }

  // 4. IMPORT PATIENTS
  console.log("\n--- Importing Patients ---");
  const patientsPath = path.join(process.cwd(), 'Table_Patients-2.xlsx');
  let patientsList: any[] = [];
  const patientCodeMap = new Map<string, number>(); // Map N° code to ID_Patient
  let maxPatientId = 0;

  if (fs.existsSync(patientsPath)) {
    const wb = XLSX.readFile(patientsPath);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
    console.log(`Processing ${rows.length} patient records...`);
    
    rows.forEach((row) => {
      const rawCode = String(row['N°'] || '').trim();
      const fullName = String(row['Nom & Prénom'] || '').trim();
      if (!fullName) return;

      // Deduplicate by Code or Name
      if (rawCode && patientCodeMap.has(rawCode)) {
        return; // Skip duplicate code
      }

      maxPatientId++;
      patientCodeMap.set(rawCode, maxPatientId);

      const genre = row['Genre'] === 'Femme' ? 'Femme' : (row['Genre'] === 'Enfant' ? 'Enfant' : 'Homme');
      const wilayaCleaned = cleanAlgerianWilaya(row['Wilaya_Officielle'] || '');

      let ddnStr = '';
      if (row['D.D.N']) {
        ddnStr = excelDateToISO(row['D.D.N']);
      }

      patientsList.push({
        ID_Patient: maxPatientId,
        code_patient_origine: rawCode, // Preserve the exact dossier number code (e.g., "00002/23")
        Nom_Patient: fullName,
        Nom_Pat_Arb: row['Nom arab'] ? String(row['Nom arab']).trim() : undefined,
        Pren_Pat_Arb: row['Prénom arab'] ? String(row['Prénom arab']).trim() : undefined,
        Genre_Patient: genre,
        type_patient: String(row['Type Patient'] || 'Adulte').trim(),
        phone: cleanPhone(row['Tél'] || row['Mobile'] || ''),
        address: 'Non renseignée',
        street: 'Non renseignée',
        city: wilayaCleaned.detectedCity || 'Non renseignée',
        wilaya: wilayaCleaned.code,
        Date_Nais_Pat: ddnStr || undefined
      });
    });
    database.patients = patientsList;
    console.log(`Successfully imported ${patientsList.length} Patients.`);
  } else {
    console.log("Table_Patients-2.xlsx not found.");
  }

  // 5. IMPORT ABONNEMENTS
  console.log("\n--- Importing Abonnements ---");
  const abonsPath = path.join(process.cwd(), 'Table_Abons-2.xlsx');
  let abonsList: any[] = [];
  let versementsList: any[] = [];
  
  if (fs.existsSync(abonsPath)) {
    const wb = XLSX.readFile(abonsPath);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
    console.log(`Processing ${rows.length} subscription records...`);

    let maxAbnId = 0;
    let maxVersId = 0;

    rows.forEach((row) => {
      const docNo = String(row['N° Dossier'] || '').trim();
      let patientId = patientCodeMap.get(docNo);

      // If patient not found in patient map, let's look by name or create a new patient
      if (!patientId && docNo) {
        const pName = String(row['Nom'] || '').trim() + ' ' + String(row['Prénom'] || '').trim();
        if (pName.trim()) {
          // Check if patient name exists already
          const matchedPat = patientsList.find(p => p.Nom_Patient.toLowerCase() === pName.toLowerCase());
          if (matchedPat) {
            patientId = matchedPat.ID_Patient;
            patientCodeMap.set(docNo, patientId);
          } else {
            // Create a new patient on the fly
            maxPatientId++;
            patientId = maxPatientId;
            patientCodeMap.set(docNo, patientId);
            
            const genre = row['Sexe'] === 'Femme' ? 'Femme' : (row['Sexe'] === 'Enfant' ? 'Enfant' : 'Homme');
            patientsList.push({
              ID_Patient: patientId,
              code_patient_origine: docNo,
              Nom_Patient: pName,
              Genre_Patient: genre,
              type_patient: String(row['Type Patient'] || 'Adulte').trim(),
              phone: cleanPhone(row['Tél.'] || ''),
              address: 'Non renseignée',
              street: 'Non renseignée',
              city: 'Non renseignée',
              wilaya: '16'
            });
          }
        }
      }

      if (!patientId) return; // Skip if no patient resolved

      maxAbnId++;
      
      // Match with correct pack from Excel packs list
      const numSessions = Number(row['Nombre des séances'] || 0);
      const abnPrice = Number(row["Prix d'abonnement"] || 0);
      
      let matchedPack = packsList.find(p => p.Nbre_Seance_Pack === numSessions);
      if (!matchedPack && numSessions > 0) {
        // Create an ad-hoc pack for this specific session count if not exists
        const adHocPackId = packsList.length + 1;
        matchedPack = {
          ID_Pack: adHocPackId,
          Libelle_Pack: `Pack ${numSessions} Séances`,
          Nbre_Seance_Pack: numSessions,
          Prix_Pack: abnPrice,
          Prix_Seanc_Pack: numSessions > 0 ? abnPrice / numSessions : 0,
          Cat_Pack: String(row['Service'] || '').toLowerCase().includes('balneo') ? 'B' : 'R'
        };
        packsList.push(matchedPack);
      }

      const packId = matchedPack ? matchedPack.ID_Pack : 1;
      const dateAbn = excelDateToISO(row["Date d'abonnement"]);
      const dateDebut = excelDateToISO(row["Date debut"]) || dateAbn;
      const dateFin = excelDateToISO(row["Date Fin"]) || dateDebut;
      
      let status: 'Actif' | 'Fermé' | 'Gelé' = 'Actif';
      if (String(row['Etat'] || '').toLowerCase().includes('ferm')) {
        status = 'Fermé';
      } else if (String(row['Etat'] || '').toLowerCase().includes('gel')) {
        status = 'Gelé';
      }

      abonsList.push({
        ID_Abn: maxAbnId,
        ID_Patient: patientId,
        ID_Pack: packId,
        Date_Debut_Abn: dateDebut,
        Date_Fin_Abn: dateFin,
        Nbre_Sean_Consom_Abn: Number(row['Séances faites'] || 0),
        ID_Acte_Add1: null,
        ID_Acte_Add2: null,
        Etat: status,
        Date_Abn: dateAbn
      });

      // Handle payments (versements)
      const versementTotal = Number(row['Versement total'] || 0);
      if (versementTotal > 0) {
        maxVersId++;
        versementsList.push({
          ID_Vers: maxVersId,
          ID_Abn: maxAbnId,
          Mont_Vers: versementTotal,
          Date_Vers: dateDebut + ' 12:00:00',
          Mode_Vers: 'Espèces'
        });
      }
    });

    database.abonnements = abonsList;
    database.versements = versementsList;
    console.log(`Successfully imported ${abonsList.length} Abonnements and ${versementsList.length} Versements.`);
  } else {
    console.log("Table_Abons-2.xlsx not found.");
  }

  // Save back to stored_erp_db.json
  fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2), 'utf8');
  console.log(`\n=== MIGRATION COMPLETED SUCCESSFULLY ! Saved to: ${DB_FILE} ===`);
  console.log(`- Services: ${database.services.length}`);
  console.log(`- Actes: ${database.actes.length}`);
  console.log(`- Packs: ${database.packs.length}`);
  console.log(`- Praticiens: ${database.praticiens.length}`);
  console.log(`- Patients: ${database.patients.length}`);
  console.log(`- Abonnements: ${database.abonnements.length}`);
  console.log(`- Versements: ${database.versements.length}`);

} catch (err: any) {
  console.error("Migration error:", err);
}
