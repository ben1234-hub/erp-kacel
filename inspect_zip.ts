import fs from 'fs';

try {
  if (fs.existsSync('stored_erp_db.json')) {
    const data = JSON.parse(fs.readFileSync('stored_erp_db.json', 'utf8'));
    console.log("Database keys:", Object.keys(data));
    console.log("Number of patients:", data.patients?.length);
    console.log("Number of abonnements:", data.abonnements?.length);
    console.log("Number of versements:", data.versements?.length);
    console.log("Number of rendezVous:", data.rendezVous?.length);
    console.log("Number of seances:", data.seances?.length);
    if (data.patients && data.patients.length > 0) {
      console.log("Sample patient:", data.patients[0]);
    }
  } else {
    console.log("stored_erp_db.json does not exist yet.");
  }
} catch (err: any) {
  console.error("Error analyzing stored_erp_db.json:", err.message);
}


