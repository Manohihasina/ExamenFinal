# Garage Notifications API

## 🚀 Installation Rapide

### Windows
```bash
./install.bat
```

### Linux/Mac
```bash
chmod +x install.sh
./install.sh
```

### Manuel
```bash
npm install
npm run dev
```

## 📱 Configuration

1. Copier `.env.example` → `.env`
2. Configurer vos variables Firebase:
   - FIREBASE_PROJECT_ID
   - FIREBASE_CLIENT_EMAIL  
   - FIREBASE_PRIVATE_KEY

## 🔥 Collections Firebase

L'API utilise ces collections:
- `users/{userId}` - Tokens FCM
- `repairs/{repairId}` - Statuts réparations
- `waiting_slots/{slotId}` - Attente paiement

## 🚀 Déploiement Vercel

1. Pousser le code sur GitHub
2. Connecter à Vercel
3. Configurer les variables d'environnement
4. Déployer automatiquement

## 📝 Endpoints

- `POST /notify` - Notification push
- `POST /notify-repair-status` - Statut réparation
- `POST /save-fcm-token` - Sauvegarder token
- `GET /user/:userId/repairs` - Réparations utilisateur
- `GET /waiting-slots` - Voitures attente

## 🔧 Intégration Godot

Mettre à jour `ApiService.gd`:
```gdscript
const VERCEL_API = "https://votre-app.vercel.app/api/notify"
```
