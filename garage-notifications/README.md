# Garage Notifications API

API de notifications push FCM pour le projet Garage S5 avec Firebase Realtime Database.

## 🚀 Installation

1. Copier le fichier `.env.example` en `.env`
2. Configurer les variables d'environnement Firebase:
   ```
   FIREBASE_PROJECT_ID=garage-s5-projet
   FIREBASE_CLIENT_EMAIL=votre-email@service-account.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
   ```

## 📱 Endpoints

### POST /notify
Envoie une notification push personnalisée.

**Body:**
```json
{
  "userId": "ID_utilisateur_Firebase",
  "title": "Titre de la notification",
  "body": "Message de la notification"
}
```

### POST /notify-repair-status
Notifie le changement de statut d'une réparation.

**Body:**
```json
{
  "repairId": "ID_réparation",
  "status": "in_progress|completed",
  "userId": "ID_utilisateur"
}
```

### POST /save-fcm-token
Sauvegarde le token FCM d'un utilisateur.

**Body:**
```json
{
  "userId": "ID_utilisateur_Firebase", 
  "fcmToken": "token_fcm_device"
}
```

### GET /user/:userId/repairs
Récupère toutes les réparations d'un utilisateur.

### GET /waiting-slots
Récupère les voitures en attente de paiement.

## 🔥 Collections Firebase Realtime Database

L'API utilise les collections suivantes:
- `users/{userId}` - Informations utilisateur + token FCM
- `repairs/{repairId}` - Réparations en cours
- `waiting_slots/{slotId}` - Voitures en attente de paiement

## 📝 Usage depuis Godot

Mettre à jour l'URL dans `ApiService.gd`:
```gdscript
const VERCEL_API = "https://votre-app-vercel.vercel.app/api/notify"
```

## 🚀 Déploiement Vercel

1. Connecter le repository à Vercel
2. Configurer les variables d'environnement dans Vercel
3. Déployer automatiquement

## 🐛 Debug

Les logs détaillés sont inclus pour le debugging:
- 📱 Notification requests
- 🔥 Firebase operations  
- ✅ Success responses
- ❌ Error details
