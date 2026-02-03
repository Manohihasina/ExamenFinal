# 🚗 Guide de Création de Voitures - Application Garage

## 📋 Vue d'ensemble

Votre application mobile est maintenant configurée pour créer des voitures et les sauvegarder dans votre base de données **Firestore** dans la collection `/garage`.

## ✅ Configuration actuelle

### 1. **Collection Firestore**
- **Nom de la collection** : `garage`
- **Chemin** : `/garage`
- **Structure des documents** :

```typescript
{
  id: string,              // Généré automatiquement par Firestore
  userId: string,          // ID de l'utilisateur propriétaire
  brand: string,           // Marque (ex: "Renault")
  model: string,           // Modèle (ex: "Clio")
  licensePlate: string,    // Plaque d'immatriculation (ex: "AB-123-CD")
  year?: number,           // Année (optionnel)
  color?: string,          // Couleur (optionnel)
  createdAt: Timestamp,    // Date de création
  updatedAt: Timestamp     // Date de dernière modification
}
```

### 2. **Fichiers importants**

#### Service de gestion des voitures
📁 `src/services/car.service.ts`
- Gère toutes les opérations CRUD (Create, Read, Update, Delete)
- Connecté à la collection `/garage` dans Firestore
- Fonctions disponibles :
  - `addCar()` - Ajouter une voiture
  - `getUserCars()` - Récupérer les voitures d'un utilisateur
  - `getCarById()` - Récupérer une voiture par son ID
  - `updateCar()` - Modifier une voiture
  - `deleteCar()` - Supprimer une voiture
  - `checkLicensePlateExists()` - Vérifier si une plaque existe déjà

#### Configuration Firebase
📁 `src/firebase/config-simple.ts`
- Configuration de connexion à Firebase
- Initialisation de Firestore, Auth, Storage, Messaging

## 🚀 Comment utiliser l'application

### Option 1 : Page de test rapide (Recommandé pour débuter)

1. **Accéder à la page de test** :
   - URL : `/test-add-car`
   - Cette page permet de tester rapidement l'ajout de voitures

2. **Fonctionnalités disponibles** :
   - Voir l'utilisateur connecté
   - Formulaire simple pour ajouter une voiture
   - Liste de toutes vos voitures
   - Bouton pour ajouter une voiture exemple

3. **Utilisation** :
   ```
   1. Connectez-vous d'abord via /login
   2. Allez sur /test-add-car
   3. Remplissez le formulaire (Marque, Modèle, Plaque)
   4. Cliquez sur "Ajouter la voiture de test"
   5. La voiture sera créée dans Firestore /garage
   ```

### Option 2 : Page complète de gestion des voitures

1. **Accéder à la page** :
   - URL : `/tabs/cars`
   - Interface complète avec toutes les fonctionnalités

2. **Fonctionnalités** :
   - ➕ Ajouter une voiture (bouton + en haut à droite)
   - 📝 Modifier une voiture (cliquer sur une voiture)
   - 🗑️ Supprimer une voiture
   - 📋 Voir toutes vos voitures

## 📱 Tester l'application

### Étape 1 : Démarrer l'application

```bash
# Dans le terminal, depuis le dossier Front-Mobile
npm run dev
```

### Étape 2 : Se connecter

1. Ouvrez votre navigateur à l'adresse affichée (généralement `http://localhost:5173`)
2. Allez sur `/login`
3. Connectez-vous avec vos identifiants

### Étape 3 : Créer une voiture

**Option A - Test rapide** :
```
1. Allez sur http://localhost:5173/test-add-car
2. Remplissez le formulaire
3. Cliquez sur "Ajouter la voiture de test"
```

**Option B - Interface complète** :
```
1. Allez sur http://localhost:5173/tabs/cars
2. Cliquez sur le bouton + en haut à droite
3. Remplissez le formulaire dans le modal
4. Cliquez sur "Ajouter"
```

### Étape 4 : Vérifier dans Firestore

1. Ouvrez la console Firebase : https://console.firebase.google.com
2. Sélectionnez votre projet : `garage-s5-projet`
3. Allez dans **Firestore Database**
4. Vous devriez voir la collection **garage** avec vos voitures

## 🔍 Exemple de code

### Ajouter une voiture manuellement

```typescript
import { carService } from '@/services/car.service'

// Données de la voiture
const carData = {
  userId: 'user-id-here',      // ID de l'utilisateur connecté
  brand: 'Renault',
  model: 'Clio',
  licensePlate: 'AB-123-CD',
  year: 2022,                   // Optionnel
  color: 'Bleu'                 // Optionnel
}

// Ajouter la voiture
try {
  const carId = await carService.addCar(carData)
  console.log('Voiture créée avec l\'ID:', carId)
} catch (error) {
  console.error('Erreur:', error)
}
```

### Récupérer les voitures d'un utilisateur

```typescript
import { carService } from '@/services/car.service'

try {
  const cars = await carService.getUserCars('user-id-here')
  console.log('Voitures:', cars)
} catch (error) {
  console.error('Erreur:', error)
}
```

## 🛠️ Dépannage

### Problème : "Utilisateur non connecté"
**Solution** : Assurez-vous d'être connecté via `/login` avant d'ajouter une voiture

### Problème : "Cette plaque d'immatriculation existe déjà"
**Solution** : Chaque utilisateur ne peut avoir qu'une seule voiture avec une plaque donnée. Utilisez une plaque différente.

### Problème : Les voitures n'apparaissent pas dans Firestore
**Solutions** :
1. Vérifiez que vous êtes connecté à Internet
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que les règles Firestore autorisent l'écriture

### Règles Firestore recommandées

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collection garage
    match /garage/{carId} {
      // Permettre la lecture si l'utilisateur est authentifié
      allow read: if request.auth != null;
      
      // Permettre l'écriture si l'utilisateur est le propriétaire
      allow create: if request.auth != null && 
                      request.resource.data.userId == request.auth.uid;
      
      allow update, delete: if request.auth != null && 
                              resource.data.userId == request.auth.uid;
    }
  }
}
```

## 📊 Structure du projet

```
Front-Mobile/
├── src/
│   ├── firebase/
│   │   ├── config.ts              # Configuration Firebase complète
│   │   └── config-simple.ts       # Configuration Firebase simplifiée
│   ├── services/
│   │   └── car.service.ts         # Service de gestion des voitures ✅
│   ├── views/
│   │   └── cars/
│   │       ├── AddCarTest.vue     # Page de test d'ajout ✅
│   │       └── CarsPage.vue       # Page complète de gestion ✅
│   └── components/
│       └── CarItem.vue            # Composant d'affichage d'une voiture
```

## 🎯 Prochaines étapes

1. ✅ **Créer des voitures** - Fonctionnel !
2. 📝 **Modifier des voitures** - Déjà implémenté
3. 🗑️ **Supprimer des voitures** - Déjà implémenté
4. 🔧 **Gérer les réparations** - À développer
5. 📊 **Tableau de bord** - À développer

## 💡 Conseils

- Utilisez `/test-add-car` pour tester rapidement
- Utilisez `/tabs/cars` pour l'interface complète
- Vérifiez toujours la console du navigateur en cas d'erreur
- Les données sont sauvegardées en temps réel dans Firestore

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur (F12)
2. Vérifiez la console Firebase
3. Vérifiez que vous êtes bien connecté
4. Vérifiez les règles de sécurité Firestore

---

**Dernière mise à jour** : 26 janvier 2026
**Collection Firestore** : `/garage`
**Status** : ✅ Opérationnel
