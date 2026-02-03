# Configuration du Projet Laravel + Docker + Firebase

## Architecture

Le projet utilise une architecture hybride :
- **MySQL** : Base de données principale (source de vérité)
- **Firebase** : Synchronisation temps réel et notifications
- **Laravel** : Backend central qui gère toute la logique métier

## Configuration Docker

### 1. Démarrer les conteneurs

```bash
docker-compose up -d --build
```

### 2. Installer les dépendances

```bash
docker-compose exec app composer install
```

### 3. Générer la clé Laravel

```bash
docker-compose exec app php artisan key:generate
```

### 4. Lancer les migrations

```bash
docker-compose exec app php artisan migrate
```

## Configuration Firebase

### 1. Créer un projet Firebase

1. Allez sur [Console Firebase](https://console.firebase.google.com/)
2. Créez un nouveau projet
3. Activez Firestore Database et Realtime Database
4. Activez Cloud Messaging

### 2. Télécharger les credentials

1. Dans `Paramètres du projet > Comptes de service`
2. Cliquez sur `Générer une nouvelle clé privée`
3. Renommez le fichier en `firebase_credentials.json`
4. Placez-le dans `storage/app/`

### 3. Configurer les variables d'environnement

Copiez `.env.example` vers `.env` et configurez :

```env
# Configuration Firebase
FIREBASE_PROJECT_ID=votre_projet_id
FIREBASE_KEY_FILE=storage/app/firebase_credentials.json
FIREBASE_DATABASE_URL=https://votre_projet_id.firebaseio.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Configuration base de données (garder les mêmes mots de passe)
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=secret
```

## API Endpoints

### Gestion des réparations

#### Démarrer une réparation
```
POST /api/repairs/start
Content-Type: application/json

{
  "car_id": 1,
  "type": "frein",
  "description": "Changement des plaquettes de frein",
  "estimated_cost": 150.00,
  "estimated_duration_minutes": 60
}
```

#### Terminer une réparation
```
POST /api/repairs/{id}/complete
Content-Type: application/json

{
  "final_cost": 145.50
}
```

## Flux de données

1. **Action utilisateur** → Appel API Laravel
2. **Laravel** → Vérifie la logique métier
3. **Laravel** → Enregistre dans MySQL (source de vérité)
4. **Laravel** → Synchronise vers Firebase (temps réel)
5. **Firebase** → Notifie les clients connectés

## Sécurité

- Firebase en lecture seule pour le frontend
- Seul Laravel peut écrire dans Firebase
- Authentification via Firebase Auth + validation backend

## Développement

### Accéder au conteneur

```bash
docker-compose exec app bash
```

### Voir les logs

```bash
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f mysql
```

### Base de données

- Host: localhost:3306
- Database: laravel
- Username: laravel
- Password: secret

### Application web

- URL: http://localhost:8000

## Structure des fichiers

```
├── app/
│   ├── Models/
│   │   ├── Client.php
│   │   ├── Car.php
│   │   └── Repair.php
│   ├── Services/
│   │   └── FirebaseService.php
│   └── Http/Controllers/Api/
│       └── RepairController.php
├── config/
│   └── firebase.php
├── database/migrations/
│   ├── create_clients_table.php
│   ├── create_cars_table.php
│   └── create_repairs_table.php
├── docker/
│   └── nginx/
│       └── default.conf
├── docker-compose.yml
├── Dockerfile
└── storage/app/
    └── firebase_credentials.json
```

## Prochaines étapes

1. Créer les modèles Client et Car
2. Implémenter l'authentification Firebase
3. Créer le frontend Vue.js
4. Ajouter les tests unitaires
5. Configurer CI/CD
