import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { INITIAL_DATABASE } from "./src/dbStore";
import { runInjectionMigration } from "./src/db/injector";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function translateToArabic(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Traduisez le nom suivant du français vers l'arabe. Répondez uniquement avec le nom traduit en arabe, sans ponctuation inutile : "${text}"`
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Translation error:", error);
    return "";
  }
}

// File system database persistence setup
const POSSIBLE_DB_DIRS = [
  "/home/adel/kacel_sante_DATA",
  process.cwd()
];

let DB_FILE = path.join(process.cwd(), "stored_erp_db.json");
for (const dir of POSSIBLE_DB_DIRS) {
  try {
    if (fs.existsSync(dir)) {
      // Test writing permission
      const testFile = path.join(dir, ".write_test");
      fs.writeFileSync(testFile, "test", "utf-8");
      fs.unlinkSync(testFile);
      
      DB_FILE = path.join(dir, "stored_erp_db.json");
      console.log(`Database persistence path set to: ${DB_FILE}`);
      break;
    }
  } catch (e) {
    // Directory exists but not writable, continue searching
  }
}

function safeWriteFileSync(filePath: string, content: string) {
  const tempPath = filePath + ".tmp";
  fs.writeFileSync(tempPath, content, "utf-8");
  fs.renameSync(tempPath, filePath);
}

let currentDb: any = null;

try {
  if (fs.existsSync(DB_FILE)) {
    const fileContent = fs.readFileSync(DB_FILE, "utf-8");
    if (fileContent.trim()) {
      const parsed = JSON.parse(fileContent);
      if (parsed && typeof parsed === "object" && (parsed.fileAttente || parsed.fileAttenteIMC)) {
        currentDb = parsed;
        console.log("Central synchronized database loaded from file successfully.");
        
        // Garantie absolue : Toujours s'assurer que tous les utilisateurs par défaut de INITIAL_DATABASE sont présents
        if (currentDb && Array.isArray(currentDb.utilisateurs)) {
          let updated = false;
          (INITIAL_DATABASE.utilisateurs || []).forEach((defU: any) => {
            const exists = currentDb.utilisateurs.some((u: any) => u.ID_Utilisateur === defU.ID_Utilisateur || (u.Login && u.Login.trim().toLowerCase() === defU.Login.trim().toLowerCase()));
            if (!exists) {
              console.log(`Restoring missing default user in database file: ${defU.Nom_Utilisateur}`);
              currentDb.utilisateurs.push(defU);
              updated = true;
            }
          });
          if (updated) {
            safeWriteFileSync(DB_FILE, JSON.stringify(currentDb, null, 2));
            console.log("Central database users table repaired with missing default accounts.");
          }
        }
      }
    }
  }
} catch (err) {
  console.error("Error reading stored_erp_db.json, falling back to initial data:", err);
}

// Ensure database is NEVER null on server so that clients always have a source of truth
if (!currentDb) {
  currentDb = JSON.parse(JSON.stringify(INITIAL_DATABASE));
  if (Array.isArray(currentDb.actes)) {
    currentDb.actes = currentDb.actes.filter((a: any) => a && a.ID_Acte && a.Libelle_Acte);
  }
  try {
    safeWriteFileSync(DB_FILE, JSON.stringify(currentDb, null, 2));
    console.log("Central database initialized and seeded with default INITIAL_DATABASE template state.");
  } catch (err) {
    console.error("Error seeding default stored_erp_db.json file:", err);
  }
} else {
  // Final safeguard check if somehow database existed but users array was empty/missing
  if (!Array.isArray(currentDb.utilisateurs) || currentDb.utilisateurs.length === 0) {
    currentDb.utilisateurs = JSON.parse(JSON.stringify(INITIAL_DATABASE.utilisateurs || []));
    try {
      safeWriteFileSync(DB_FILE, JSON.stringify(currentDb, null, 2));
      console.log("Central database restored with full default users array.");
    } catch (err) {
      console.error("Error fixing default users:", err);
    }
  }
}

// Pool of active Server-Sent Events (SSE) connections
let sseClients: express.Response[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload memory limit to perfectly support entire database syncing without packet dropping
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes
  app.post("/api/translate", async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const translated = await translateToArabic(text);
    res.json({ translated });
  });

  app.post("/api/db/inject", (req, res) => {
    try {
      const result = runInjectionMigration();
      if (result.success && result.database) {
        currentDb = result.database;
        currentDb.lastUpdated = Date.now();
        
        // Broadcast change immediately to all active SSE subscribers
        const updatedDataString = JSON.stringify(currentDb);
        sseClients.forEach(client => {
          try {
            client.write(`data: ${updatedDataString}\n\n`);
          } catch (e) {
            console.error("Failed to stream live update of injection:", e);
          }
        });
        
        res.json({ success: true, summary: result.summary, database: currentDb });
      } else {
        res.status(500).json({ error: "Injection failed", details: result.summary });
      }
    } catch (err: any) {
      console.error("Error running injection API route:", err);
      res.status(500).json({ error: "Internal server error during injection", details: err.message });
    }
  });

  // GET the central database state
  app.get("/api/db", (req, res) => {
    if (currentDb) {
      res.json(currentDb);
    } else {
      res.status(404).json({ error: "No database stored on host server yet" });
    }
  });

  // POST to update the central database state and broadcast in real-time
  app.post("/api/db", (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid payload" });
      }

      let dbPayload: any;
      let modifiedKeys: string[] = [];

      // Check if client sent wrapped format with modifiedKeys
      if (payload.database && Array.isArray(payload.modifiedKeys)) {
        dbPayload = payload.database;
        modifiedKeys = payload.modifiedKeys;
      } else {
        dbPayload = payload;
      }

      if (!dbPayload || typeof dbPayload !== "object" || (!dbPayload.fileAttente && !dbPayload.fileAttenteIMC)) {
        return res.status(400).json({ error: "Invalid database structure or payload" });
      }

      // Smart merge: only overwrite keys that were modified by the client
      if (modifiedKeys.length > 0) {
        modifiedKeys.forEach((key: string) => {
          if (dbPayload[key] !== undefined) {
            currentDb[key] = dbPayload[key];
          }
        });

        // Safeguard/Force update: if the payload contains newer or different fileAttente/fileAttenteIMC but modifiedKeys missed it
        if (!modifiedKeys.includes("fileAttente") && dbPayload.fileAttente && JSON.stringify(dbPayload.fileAttente) !== JSON.stringify(currentDb.fileAttente)) {
          console.log("Forcing update of 'fileAttente' as it differed from current server state but was omitted in modifiedKeys.");
          currentDb.fileAttente = dbPayload.fileAttente;
        }
        if (!modifiedKeys.includes("fileAttenteIMC") && dbPayload.fileAttenteIMC && JSON.stringify(dbPayload.fileAttenteIMC) !== JSON.stringify(currentDb.fileAttenteIMC)) {
          console.log("Forcing update of 'fileAttenteIMC' as it differed from current server state but was omitted in modifiedKeys.");
          currentDb.fileAttenteIMC = dbPayload.fileAttenteIMC;
        }
      } else {
        // Fallback for older clients: merge intelligently
        currentDb = { ...currentDb, ...dbPayload };

        // Pour les tableaux, fusionner au lieu d'écraser
        const arrayKeys = ['patients', 'abonnements', 'fileAttente', 'fileAttenteIMC', 'seances', 'versements', 'rendezVous', 'transactions_caisses'];
        arrayKeys.forEach(key => {
          if (dbPayload[key] && Array.isArray(dbPayload[key])) {
            const serverMap = new Map((currentDb[key] || []).map((item: any) => {
              const id = item?.id || item?.ID_Seanc || item?.ID_RDV || item?.ID_Abn || item?.ID_File || item?.ID_Patient || item?.ID_Vers || item?.ID_Mouv_Caisse;
              return [id, item];
            }));

            dbPayload[key].forEach((item: any) => {
              const id = item?.id || item?.ID_Seanc || item?.ID_RDV || item?.ID_Abn || item?.ID_File || item?.ID_Patient || item?.ID_Vers || item?.ID_Mouv_Caisse;
              if (id !== undefined) serverMap.set(id, item);
            });

            currentDb[key] = Array.from(serverMap.values());
          }
        });
      }

      // Always stamp the change with server's actual clock time
      currentDb.lastUpdated = Date.now();

      // Persist state to local file on disk
      safeWriteFileSync(DB_FILE, JSON.stringify(currentDb, null, 2));

      // Broadcast changes immediately to all OTHER active SSE subscribers in real-time
      const updatedDataString = JSON.stringify(currentDb);
      const senderSessionUuid = req.headers["x-client-session-id"] as string || "";
      const activeClients = [...sseClients];
      activeClients.forEach(client => {
        // Skip the client who actually initiated this change to prevent double stringification / double parsing slowness
        if (senderSessionUuid && (client as any).sessionUuid === senderSessionUuid) {
          return;
        }
        try {
          client.write(`data: ${updatedDataString}\n\n`);
        } catch (e) {
          console.error("Failed to stream real-time DB broadcast update to client:", e);
        }
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating central database:", err);
      res.status(500).json({ error: "Internal server error saving database state" });
    }
  });

  // Real-time notification socket stream via SSE
  app.get("/api/db/live", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Keep connection alive with comment line immediately
    res.write(":\n\n");

    const clientUuid = req.query.sessionUuid as string || "";
    (res as any).sessionUuid = clientUuid;

    sseClients.push(res);
    console.log(`New live sync client socket [Session: ${clientUuid}]. Total connected: ${sseClients.length}`);

    // Instantly hydrate newly opened client session if state exists on server
    if (currentDb) {
      res.write(`data: ${JSON.stringify(currentDb)}\n\n`);
    }

    // Standard heartbeats to prevent proxies/browsers from dropping inactive socket streams
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(":\n\n");
      } catch (err) {
        // Safe to ignore if connection is closing
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeatInterval);
      sseClients = sseClients.filter(c => c !== res);
      console.log(`Live sync client [Session: ${clientUuid}] disconnected. Total connected: ${sseClients.length}`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:3000');
  });
}

startServer();
