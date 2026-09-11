import XLSX from 'xlsx';
import * as path from 'path';
import fs from 'fs';
import { INITIAL_DATABASE } from '../dbStore';

export function cleanAlgerianWilaya(rawVal: string): { code: string; detectedCity?: string } {
  if (!rawVal) return { code: '16' };

  const normalized = rawVal.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .trim();

  // 1. Check if it already contains/starts with a valid 1-58 numeric code
  const numMatch = normalized.match(/^(?:0?([1-9])|([1-5][0-8]))(?:\s+|$|[^0-9])/);
  if (numMatch) {
    const codeNum = numMatch[1] || numMatch[2];
    const padded = codeNum.padStart(2, '0');
    return { code: padded };
  }

  // 2. Exact or substring matching for communes and known regions
  if (normalized.includes("ouled moussa") || normalized.includes("ouled-moussa") || normalized.includes("boumerdes") || normalized.includes("moussa")) {
    return { code: "35", detectedCity: "Ouled Moussa" };
  }
  
  if (
    normalized.includes("beaulieu") || 
    normalized.includes("alger") || 
    normalized.includes("algiers") || 
    normalized.includes("el harrach") || 
    normalized.includes("harrach") || 
    normalized.includes("bab ezzouar") || 
    normalized.includes("cheraga") || 
    normalized.includes("baraki") || 
    normalized.includes("kouba") || 
    normalized.includes("reghaia") || 
    normalized.includes("bouzareah") || 
    normalized.includes("hydra") || 
    normalized.includes("dely ibrahim")
  ) {
    let city = undefined;
    if (normalized.includes("beaulieu")) city = "Beaulieu";
    else if (normalized.includes("el harrach") || normalized.includes("harrach")) city = "El Harrach";
    else if (normalized.includes("bab ezzouar")) city = "Bab Ezzouar";
    else if (normalized.includes("cheraga")) city = "Chéraga";
    return { code: "16", detectedCity: city };
  }

  if (normalized.includes("blida") || normalized.includes("boufarik") || normalized.includes("ouled yaich")) {
    return { code: "09" };
  }

  if (normalized.includes("oran") || normalized.includes("bir el djir")) {
    return { code: "31" };
  }

  if (normalized.includes("constantine") || normalized.includes("el khroub")) {
    return { code: "25" };
  }

  if (normalized.includes("bejaia") || normalized.includes("amizour") || normalized.includes("akbou")) {
    return { code: "06" };
  }

  if (normalized.includes("tizi") || normalized.includes("azazga")) {
    return { code: "15" };
  }

  if (normalized.includes("bouira") || normalized.includes("lakhdaria")) {
    return { code: "10" };
  }

  if (normalized.includes("tipaza") || normalized.includes("kolea") || normalized.includes("bou ismail")) {
    return { code: "42" };
  }

  const stdWilayas = [
    { code: "01", name: "adrar" }, { code: "02", name: "chlef" }, { code: "03", name: "laghouat" }, { code: "04", name: "oum el bouaghi" },
    { code: "05", name: "batna" }, { code: "06", name: "bejaia" }, { code: "07", name: "biskra" }, { code: "08", name: "bechar" },
    { code: "09", name: "blida" }, { code: "10", name: "bouira" }, { code: "11", name: "tamanrasset" }, { code: "12", name: "tebessa" },
    { code: "13", name: "tlemcen" }, { code: "14", name: "tiaret" }, { code: "15", name: "tizi ouzou" }, { code: "16", name: "alger" },
    { code: "17", name: "djelfa" }, { code: "18", name: "jijel" }, { code: "19", name: "setif" }, { code: "20", name: "saida" },
    { code: "21", name: "skikda" }, { code: "22", name: "sidi bel abbes" }, { code: "23", name: "annaba" }, { code: "24", name: "guelma" },
    { code: "25", name: "constantine" }, { code: "26", name: "medea" }, { code: "27", name: "mostaganem" }, { code: "28", name: "msila" },
    { code: "29", name: "mascara" }, { code: "30", name: "ouargla" }, { code: "31", name: "oran" }, { code: "32", name: "el bayadh" },
    { code: "33", name: "illizi" }, { code: "34", name: "bordj bou arreridj" }, { code: "35", name: "boumerdes" }, { code: "36", name: "el tarf" },
    { code: "37", name: "tindouf" }, { code: "38", name: "tissemsilt" }, { code: "39", name: "el oued" }, { code: "40", name: "khenchela" },
    { code: "41", name: "souk ahras" }, { code: "42", name: "tipaza" }, { code: "43", name: "mila" }, { code: "44", name: "ain defla" },
    { code: "45", name: "naama" }, { code: "46", name: "ain temouchent" }, { code: "47", name: "ghardaia" }, { code: "48", name: "relizane" },
    { code: "49", name: "timimoun" }, { code: "50", name: "bordj badji mokhtar" }, { code: "51", name: "ouled djellal" }, { code: "52", name: "beni abbes" },
    { code: "53", name: "in salah" }, { code: "54", name: "in guezzam" }, { code: "55", name: "touggourt" }, { code: "56", name: "djanet" },
    { code: "57", name: "el m'ghair" }, { code: "58", name: "el meniaa" }
  ];

  const matchedVal = stdWilayas.find(w => normalized.includes(w.name));
  if (matchedVal) {
    return { code: matchedVal.code };
  }

  return { code: '16' }; // Default fallback
}

function excelDateToISO(serial: any): string {
  if (!serial) return '';
  const num = Number(serial);
  if (isNaN(num)) {
    const str = String(serial).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const parts = str.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return str;
  }
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
  return 1;
}

function determineRepere(fonction: string, defaultRepere: string): 'K' | 'P' | 'O' | 'MPR' {
  if (!fonction) return 'K';
  const fLower = fonction.toLowerCase();
  if (fLower.includes('kiné') || fLower.includes('kine')) return 'K';
  if (fLower.includes('ortho')) return 'O';
  if (fLower.includes('psy') || fLower.includes('psychomot')) return 'P';
  if (fLower.includes('mpr') || fLower.includes('medecin') || fLower.includes('médecin')) return 'MPR';
  return (defaultRepere === 'K' || defaultRepere === 'P' || defaultRepere === 'O' || defaultRepere === 'MPR') ? defaultRepere : 'K';
}

function cleanPhone(raw: any): string {
  if (!raw) return 'Non renseigné';
  const clean = String(raw).trim().replace(/[.\-\s]/g, '');
  if (!clean) return 'Non renseigné';
  return clean;
}

export function runInjectionMigration(): { success: boolean; database: any; summary: string } {
  try {
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
        if (existing.utilisateurs && existing.utilisateurs.length > 0) {
          database.utilisateurs = existing.utilisateurs;
        }
        if (existing.reglesAutomatisation && existing.reglesAutomatisation.length > 0) {
          database.reglesAutomatisation = existing.reglesAutomatisation;
        }
      } catch (e) {
        console.warn("Could not parse existing database, starting from scratch.");
      }
    }

    // 1. IMPORT ACTES
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
    }

    // 2. IMPORT PACKS
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
    }

    // 3. IMPORT PRATICIENS
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
    }

    // 4. IMPORT PATIENTS
    const patientsPath = path.join(process.cwd(), 'Table_Patients-2.xlsx');
    let patientsList: any[] = [];
    const patientCodeMap = new Map<string, number>();
    let maxPatientId = 0;

    if (fs.existsSync(patientsPath)) {
      const wb = XLSX.readFile(patientsPath);
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
      
      rows.forEach((row) => {
        const rawCode = String(row['N°'] || '').trim();
        const fullName = String(row['Nom & Prénom'] || '').trim();
        if (!fullName) return;

        if (rawCode && patientCodeMap.has(rawCode)) {
          return; // Skip duplicate
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
          code_patient_origine: rawCode,
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
    }

    // 5. IMPORT ABONNEMENTS
    const abonsPath = path.join(process.cwd(), 'Table_Abons-2.xlsx');
    let abonsList: any[] = [];
    let versementsList: any[] = [];
    
    if (fs.existsSync(abonsPath)) {
      const wb = XLSX.readFile(abonsPath);
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];

      let maxAbnId = 0;
      let maxVersId = 0;

      rows.forEach((row) => {
        const docNo = String(row['N° Dossier'] || '').trim();
        let patientId = patientCodeMap.get(docNo);

        if (!patientId && docNo) {
          const pName = String(row['Nom'] || '').trim() + ' ' + String(row['Prénom'] || '').trim();
          if (pName.trim()) {
            const matchedPat = patientsList.find(p => p.Nom_Patient.toLowerCase() === pName.toLowerCase());
            if (matchedPat) {
              patientId = matchedPat.ID_Patient;
              patientCodeMap.set(docNo, patientId);
            } else {
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

        if (!patientId) return;

        maxAbnId++;
        
        const numSessions = Number(row['Nombre des séances'] || 0);
        const abnPrice = Number(row["Prix d'abonnement"] || 0);
        
        let matchedPack = database.packs.find((p: any) => p.Nbre_Seance_Pack === numSessions);
        if (!matchedPack && numSessions > 0) {
          const adHocPackId = database.packs.length + 1;
          matchedPack = {
            ID_Pack: adHocPackId,
            Libelle_Pack: `Pack ${numSessions} Séances`,
            Nbre_Seance_Pack: numSessions,
            Prix_Pack: abnPrice,
            Prix_Seanc_Pack: numSessions > 0 ? abnPrice / numSessions : 0,
            Cat_Pack: String(row['Service'] || '').toLowerCase().includes('balneo') ? 'B' : 'R'
          };
          database.packs.push(matchedPack);
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
    }

    // Merge missing arrays or structures from INITIAL_DATABASE to avoid undefined runtime errors on clients
    Object.keys(INITIAL_DATABASE).forEach(key => {
      if (database[key] === undefined || (Array.isArray(database[key]) && database[key].length === 0)) {
        if (key === 'utilisateurs' && database[key] && database[key].length > 0) return;
        if (key === 'patients' && database[key] && database[key].length > 0) return;
        if (key === 'abonnements' && database[key] && database[key].length > 0) return;
        if (key === 'versements' && database[key] && database[key].length > 0) return;
        if (key === 'actes' && database[key] && database[key].length > 0) return;
        if (key === 'packs' && database[key] && database[key].length > 0) return;
        if (key === 'praticiens' && database[key] && database[key].length > 0) return;

        database[key] = JSON.parse(JSON.stringify((INITIAL_DATABASE as any)[key]));
      }
    });

    if (Array.isArray(database.actes)) {
      database.actes = database.actes.filter((a: any) => a && a.ID_Acte && a.Libelle_Acte);
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2), 'utf8');
    
    const summary = `Importation réussie : ${database.patients.length} patients, ${database.praticiens.length} praticiens, ${database.actes.length} actes, ${database.packs.length} packs, ${database.abonnements.length} abonnements, ${database.versements.length} règlements.`;
    return { success: true, database, summary };
  } catch (error: any) {
    console.error("Migration error in helper:", error);
    return { success: false, database: null, summary: error.message || "Unknown error" };
  }
}
