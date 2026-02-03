# Architecture Firebase-First - Garage Backend

## 🎯 Concept

Laravel est utilisé **uniquement comme un backend de synchronisation** qui pousse les données vers Firebase. Les applications (Mobile/Web/Jeu) consomment directement depuis Firebase.

## 🔄 Flux de données

```
[Mobile/Web/Jeu] → [Firebase] ← [Laravel Backend]
     ↑ Lecture        ↑ Source     ↑ Écriture
  Temps réel       de vérité    Synchronisation
```

## 📡 API Laravel (Firebase Push Service)

### Endpoints disponibles

#### 🚗 Gestion des réparations
```
POST /api/repairs/start
{
  "car_id": 1,
  "intervention_id": 2,
  "slot_number": 1
}

POST /api/repairs/{id}/complete
```

#### 🔧 Gestion des interventions
```
GET /api/interventions
```

#### 🎯 Gestion des slots
```
POST /api/slots/assign
{
  "slot_number": 1,
  "car_id": 1
}

POST /api/slots/release
{
  "slot_number": 1
}

GET /api/slots/status
```

## 🔥 Structure Firebase

### Collections principales

```
/interventions/
  - id, name, price, duration_seconds, description

/slots/
  /1/
    - slot_number, car_id, status, car{...}, client{...}
  /2/
    - slot_number, car_id, status, car{...}, client{...}

/repairs/
  /{repair_id}/
    - id, car_id, intervention_id, status, started_at, completed_at
    - intervention{...}, action, timestamp

/cars/
  /{car_id}/
    - id, client_id, make, model, license_plate, status
    - client{...}

/notifications/
  /{client_id}/
    - title, body, data{...}, timestamp
```

## 📱 Applications clientes

### Mobile (React Native/Ionic)
- Écoute `slots/{slot_number}` pour voir les voitures
- Écoute `repairs/{repair_id}` pour le suivi
- Écoute `notifications/{user_id}` pour les alertes

### Web (Vue.js)
- Dashboard admin avec données Firebase
- Frontoffice public sans login

### Jeu (Godot/HTML)
- Écoute les slots en temps réel
- Envoie les actions de réparation via API Laravel

## 🏗️ Architecture technique

### Laravel Backend
- **Rôle** : API REST + Synchronisation Firebase
- **Base SQL** : Source de vérité (MySQL)
- **Actions** : Validation métier → Enregistrement SQL → Push Firebase

### Firebase
- **Rôle** : Base de données temps réel
- **Utilisation** : Lecture seule pour les clients
- **Synchronisation** : Notifications temps réel

### Sécurité
- Firebase en lecture seule pour les clients
- Seul Laravel peut écrire dans Firebase
- Authentification via Firebase Auth

## 🎮 Cas d'usage - Jeu HTML

1. **Jeu charge les slots** depuis Firebase
2. **Joueur place voiture** → Appel API Laravel
3. **Laravel valide** → Enregistre SQL → Push Firebase
4. **Firebase notifie** tous les clients en temps réel
5. **Jeu met à jour** l'interface automatiquement

## 📊 Avantages

- **Temps réel** : Firebase gère la synchronisation
- **Scalabilité** : Les applications lisent directement Firebase
- **Offline** : Firebase cache les données localement
- **Simplicité** : Laravel ne fait que pousser, pas gérer l'affichage

## 🔧 Configuration

### Variables d'environnement
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_KEY_FILE=storage/app/firebase_credentials.json
FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
```

### Règles Firebase (exemple)
```json
{
  "rules": {
    ".read": "true",
    ".write": "false",
    "interventions": { ".read": "true" },
    "slots": { ".read": "true" },
    "repairs": { ".read": "true" },
    "cars": { ".read": "true" },
    "notifications": { ".read": "true" }
  }
}
```

Cette architecture permet une séparation claire : Laravel gère la logique métier, Firebase gère la distribution en temps réel.
