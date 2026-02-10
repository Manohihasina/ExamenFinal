import express, { json } from "express";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getDatabase, ref, get, set, update, remove } from "firebase-admin/database";
import 'dotenv/config';

// =======================
// EXPRESS APP
// =======================
const app = express();
app.use(json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// =======================
// FIREBASE ADMIN
// =======================
const rawKey = process.env.FIREBASE_PRIVATE_KEY;
const serviceAccount = {
  type: "service_account",
  project_id: String(process.env.FIREBASE_PROJECT_ID || ""),
  client_email: String(process.env.FIREBASE_CLIENT_EMAIL || ""),
  private_key: rawKey ? rawKey.replace(/\\n/g, "\n") : "",
};

if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
  throw new Error("⚠️ Firebase service account environment variables are missing or invalid!");
}
if (!getApps().length) {
  initializeApp({ 
    credential: cert(serviceAccount),
    databaseURL: "https://garage-s5-projet-default-rtdb.firebaseio.com"
  });
}

const db = getDatabase();
const messaging = getMessaging();

// =======================
// ROUTES
// =======================

// Test route
app.get("/test", (req, res) => res.json({ ok: "Notifications API ready" }));

// -------------------------------------------------------
// POST /notify
// ✅ Envoie une notification push FCM
// Body: { userId: string, title: string, body: string }
// -------------------------------------------------------
app.post("/notify", async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    
    if (!userId || !title || !body) {
      return res.status(400).json({ 
        error: "userId, title et body sont requis" 
      });
    }

    console.log(`📱 [DEBUG] Notification demandée pour user: ${userId}`);
    console.log(`📝 [DEBUG] Titre: ${title}`);
    console.log(`📄 [DEBUG] Message: ${body}`);

    // Récupérer le token FCM depuis Realtime Database
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      console.log(`❌ [DEBUG] User ${userId} non trouvé`);
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const userData = userSnapshot.val();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      console.log(`⚠️ [DEBUG] Pas de token FCM pour user ${userId}`);
      return res.status(200).json({ 
        message: "Pas de token FCM pour cet utilisateur" 
      });
    }

    // Préparer le message FCM
    const message = {
      notification: {
        title: title,
        body: body,
        icon: "https://votre-domaine.com/logo192.png",
        requireInteraction: true,
      },
      webpush: {
        notification: {
          title: title,
          body: body,
          icon: "https://votre-domaine.com/logo192.png",
          requireInteraction: true,
        },
        fcmOptions: { 
          link: "https://votre-app.com/dashboard" 
        },
      },
      token: fcmToken,
    };

    console.log(`📦 [DEBUG] Envoi message FCM...`);
    const response = await messaging.send(message);
    
    console.log(`✅ [DEBUG] Notification envoyée avec succès! ID: ${response}`);
    
    res.status(200).json({ 
      success: true, 
      messageId: response,
      message: "Notification envoyée avec succès" 
    });

  } catch (error) {
    console.error("❌ [DEBUG] Erreur envoi notification:", error);
    res.status(500).json({ 
      error: "Erreur lors de l'envoi de la notification",
      details: error.message 
    });
  }
});

// -------------------------------------------------------
// POST /notify-repair-status
// ✅ Notifie le changement de statut d'une réparation
// Body: { repairId: string, status: string, userId: string }
// -------------------------------------------------------
app.post("/notify-repair-status", async (req, res) => {
  try {
    const { repairId, status, userId } = req.body;
    
    if (!repairId || !status || !userId) {
      return res.status(400).json({ 
        error: "repairId, status et userId sont requis" 
      });
    }

    // Récupérer les détails de la réparation
    const repairRef = ref(db, `repairs/${repairId}`);
    const repairSnapshot = await get(repairRef);
    
    if (!repairSnapshot.exists()) {
      return res.status(404).json({ error: "Réparation non trouvée" });
    }

    const repairData = repairSnapshot.val();
    const interventionName = repairData.interventionName || "Intervention";
    
    // Messages selon le statut
    let title, body;
    switch (status) {
      case "in_progress":
        title = "Réparation en cours";
        body = `Votre intervention "${interventionName}" a commencé 🚗🔧`;
        break;
      case "completed":
        title = "Réparation terminée";
        body = `Votre intervention "${interventionName}" est terminée 🎉`;
        break;
      default:
        title = "Mise à jour réparation";
        body = `Votre intervention "${interventionName}" a été mise à jour`;
    }

    // Mettre à jour le statut dans Firebase
    await update(repairRef, {
      status: status,
      updatedAt: new Date().toISOString()
    });

    // Envoyer la notification
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      const fcmToken = userData.fcmToken;
      
      if (fcmToken) {
        const message = {
          notification: {
            title: title,
            body: body,
            icon: "https://votre-domaine.com/logo192.png",
            requireInteraction: true,
          },
          webpush: {
            notification: {
              title: title,
              body: body,
              icon: "https://votre-domaine.com/logo192.png",
              requireInteraction: true,
            },
            fcmOptions: { 
              link: "https://votre-app.com/dashboard" 
            },
          },
          token: fcmToken,
        };

        await messaging.send(message);
        console.log(`✅ [DEBUG] Notification statut réparation envoyée à ${userId}`);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: "Notification de statut envoyée" 
    });

  } catch (error) {
    console.error("❌ [DEBUG] Erreur notification statut:", error);
    res.status(500).json({ 
      error: "Erreur lors de l'envoi de la notification",
      details: error.message 
    });
  }
});

// -------------------------------------------------------
// POST /save-fcm-token
// ✅ Sauvegarde le token FCM d'un utilisateur
// Body: { userId: string, fcmToken: string }
// -------------------------------------------------------
app.post("/save-fcm-token", async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;
    
    if (!userId || !fcmToken) {
      return res.status(400).json({ 
        error: "userId et fcmToken sont requis" 
      });
    }

    // Sauvegarder le token dans Realtime Database
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
      fcmToken: fcmToken,
      tokenUpdatedAt: new Date().toISOString()
    });

    console.log(`✅ [DEBUG] Token FCM sauvegardé pour user ${userId}`);
    
    res.status(200).json({ 
      success: true, 
      message: "Token FCM sauvegardé" 
    });

  } catch (error) {
    console.error("❌ [DEBUG] Erreur sauvegarde token:", error);
    res.status(500).json({ 
      error: "Erreur lors de la sauvegarde du token",
      details: error.message 
    });
  }
});

// -------------------------------------------------------
// GET /user/:userId/repairs
// ✅ Récupère les réparations d'un utilisateur
// -------------------------------------------------------
app.get("/user/:userId/repairs", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const repairsRef = ref(db, `repairs`);
    const repairsSnapshot = await get(repairsRef);
    
    if (!repairsSnapshot.exists()) {
      return res.json([]);
    }

    const allRepairs = repairsSnapshot.val();
    const userRepairs = Object.keys(allRepairs)
      .filter(key => allRepairs[key].userId === userId)
      .map(key => ({
        id: key,
        ...allRepairs[key]
      }));

    res.json(userRepairs);

  } catch (error) {
    console.error("❌ [DEBUG] Erreur récupération réparations:", error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des réparations",
      details: error.message 
    });
  }
});

// -------------------------------------------------------
// GET /waiting-slots
// ✅ Récupère les voitures en attente de paiement
// -------------------------------------------------------
app.get("/waiting-slots", async (req, res) => {
  try {
    const waitingSlotsRef = ref(db, `waiting_slots`);
    const waitingSlotsSnapshot = await get(waitingSlotsRef);
    
    if (!waitingSlotsSnapshot.exists()) {
      return res.json([]);
    }

    const waitingSlots = waitingSlotsSnapshot.val();
    const slotsArray = Object.keys(waitingSlots).map(key => ({
      id: key,
      ...waitingSlots[key]
    }));

    res.json(slotsArray);

  } catch (error) {
    console.error("❌ [DEBUG] Erreur récupération waiting slots:", error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des waiting slots",
      details: error.message 
    });
  }
});

// =======================
// EXPORT POUR VERCEL
// =======================
export default app;
