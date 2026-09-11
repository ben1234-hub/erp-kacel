import fs from 'fs';

const db = JSON.parse(fs.readFileSync('stored_erp_db.json', 'utf8'));

console.log("=== PATIENT ===");
const patient = db.patients.find((p: any) => p.ID_Patient === 6242 || p.Nom_Patient.toLowerCase().includes("medrous"));
console.log(patient);

if (patient) {
  console.log("\n=== ABONNEMENTS ===");
  const abons = db.abonnements.filter((a: any) => Number(a.ID_Patient) === Number(patient.ID_Patient));
  console.log(abons);

  console.log("\n=== RENDEZ-VOUS ===");
  const rdvs = db.rendezVous.filter((r: any) => Number(r.ID_Patient) === Number(patient.ID_Patient));
  console.log(rdvs);

  console.log("\n=== SEANCES ===");
  const seances = db.seances.filter((s: any) => Number(s.ID_Patient) === Number(patient.ID_Patient));
  console.log(seances);
}
