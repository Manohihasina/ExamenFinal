# 🧪 Guide de Test Firebase - Garage Backend

## 🚀 Étapes pour tester Firebase

### 1. 📋 Configuration requise

#### Créer le projet Firebase
1. Allez sur [Console Firebase](https://console.firebase.google.com/)
2. Créez un nouveau projet : `garage-s5-test`
3. Activez **Firestore Database** (mode test)
4. Activez **Realtime Database** (mode test)
5. Allez dans **Paramètres > Comptes de service**
6. Cliquez sur **Générer une nouvelle clé privée**
7. Téléchargez le fichier JSON

#### Configurer Laravel
```bash
# 1. Placez le fichier JSON
mv votre-fichier.json storage/app/firebase_credentials.json

# 2. Configurez .env (déjà fait avec .env.docker)
FIREBASE_PROJECT_ID=garage-s5-test
FIREBASE_DATABASE_URL=https://garage-s5-test-default-rtdb.firebaseio.com/
FIREBASE_KEY_FILE=storage/app/firebase_credentials.json
```

### 2. 🧪 Tests de base

#### Test 1: Vérifier les données SQL
```bash
curl http://localhost:8000/api/test/data
```

**Réponse attendue :**
```json
{
  "message": "Current data in Laravel",
  "interventions": [
    {
      "id": 1,
      "name": "Frein",
      "price": "150.00",
      "duration_seconds": 1800,
      ...
    }
  ],
  "database_info": {
    "connection": "mysql",
    "host": "mysql",
    "database": "laravel"
  }
}
```

#### Test 2: Tester la connexion Firebase
```bash
curl http://localhost:8000/api/test/firebase
```

**Réponse attendue (succès) :**
```json
{
  "success": true,
  "message": "Firebase test completed successfully",
  "data_pushed": {
    "message": "Firebase test successful!",
    "timestamp": "2025-01-15T11:45:00.000000Z",
    "interventions_count": 8,
    "laravel_version": "12.0.0",
    "php_version": "8.2.15"
  }
}
```

**Réponse attendue (erreur) :**
```json
{
  "success": false,
  "message": "Firebase test failed",
  "error": "Could not connect to Firebase: Invalid credentials",
  "trace": "..."
}
```

### 3. 🔥 Vérifier dans Firebase Console

#### Dans Realtime Database
Allez dans votre projet Firebase > Realtime Database > Données

Vous devriez voir :
```
test/
├── connection/
│   ├── message: "Firebase test successful!"
│   ├── timestamp: "2025-01-15T11:45:00.000000Z"
│   └── interventions_count: 8
└── interventions/
    ├── 0: {id: 1, name: "Frein", price: "150.00", ...}
    ├── 1: {id: 2, name: "Vidange", price: "80.00", ...}
    └── ...
```

### 4. 📡 Tests des endpoints API

#### Test 3: Lister les interventions (avec push Firebase)
```bash
curl http://localhost:8000/api/interventions
```

#### Test 4: Vérifier le statut des slots
```bash
curl http://localhost:8000/api/slots/status
```

### 5. 🚗 Test complet de réparation

#### Créer un client et une voiture (test)
```bash
# Créer un client
curl -X POST http://localhost:8000/api/test/create-client \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Client", "email": "test@example.com"}'

# Créer une voiture
curl -X POST http://localhost:8000/api/test/create-car \
  -H "Content-Type: application/json" \
  -d '{"client_id": 1, "make": "Peugeot", "model": "208", "license_plate": "TEST-123"}'
```

#### Démarrer une réparation
```bash
curl -X POST http://localhost:8000/api/repairs/start \
  -H "Content-Type: application/json" \
  -d '{
    "car_id": 1,
    "intervention_id": 1,
    "slot_number": 1
  }'
```

**Vérifiez dans Firebase :**
```
slots/
└── 1/
    ├── slot_number: 1
    ├── car_id: 1
    ├── status: "occupied"
    └── car: {make: "Peugeot", model: "208", ...}

repairs/
└── 1/
    ├── id: 1
    ├── car_id: 1
    ├── intervention_id: 1
    ├── status: "in_progress"
    └── action: "started"
```

### 6. 🐛 Dépannage

#### Erreur commune : "Invalid credentials"
- Vérifiez que le fichier JSON est bien dans `storage/app/`
- Vérifiez que le nom du fichier correspond à `FIREBASE_KEY_FILE`
- Vérifiez que `FIREBASE_PROJECT_ID` est correct

#### Erreur commune : "Connection refused"
- Vérifiez que les conteneurs Docker sont lancés
- Vérifiez que `DB_HOST=mysql` dans `.env`

#### Erreur commune : "Permission denied"
- Vérifiez les permissions du fichier JSON
- `chmod 644 storage/app/firebase_credentials.json`

### 7. 📊 Monitoring

#### Logs Laravel
```bash
docker-compose logs -f app
```

#### Vérifier les données en temps réel
Dans Firebase Console, vous pouvez voir les données apparaître en temps réel quand vous appelez les API.

### 8. ✅ Checklist de validation

- [ ] Projet Firebase créé
- [ ] Fichier credentials placé
- [ ] Variables .env configurées
- [ ] Test `/api/test/data` fonctionne
- [ ] Test `/api/test/firebase` fonctionne
- [ ] Données visibles dans Firebase Console
- [ ] API interventions fonctionne
- [ ] API slots fonctionne

## 🎯 Prochaines étapes

1. **Créer le front React** qui consomme ces API
2. **Tester le temps réel** avec Firebase listeners
3. **Implémenter les notifications** push
4. **Créer le jeu HTML** qui utilise les slots

Une fois ces tests validés, ton backend Firebase-first sera prêt pour toutes les applications !
