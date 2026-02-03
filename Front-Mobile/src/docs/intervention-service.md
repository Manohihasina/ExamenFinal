# Intervention Service - Firebase Integration

## 🎯 Objectif

Le service `InterventionService` a été modifié pour récupérer les interventions depuis **Firebase Realtime Database** au lieu de l'API Laravel, avec un système de fallback automatique.

## 📋 Fonctionnalités

### 1. Récupération depuis Firebase (Priorité)
- ✅ Lecture directe depuis Firebase Realtime Database
- ✅ Données en temps réel
- ✅ Conversion automatique des données

### 2. Fallback vers API Laravel
- ✅ Si Firebase échoue, bascule automatiquement vers l'API Laravel
- ✅ Garantit toujours des données disponibles
- ✅ Logs détaillés pour le debugging

### 3. Écoute en temps réel
- ✅ `onInterventionsChange()` pour les mises à jour live
- ✅ Callback automatique lors des changements
- ✅ Gestion des erreurs avec fallback

## 🚀 Utilisation

### Installation
```typescript
import { interventionService, Intervention } from '../services/intervention.service'
```

### Récupérer les interventions
```typescript
// Toutes les interventions (Firebase en priorité)
const interventions = await interventionService.getInterventions()

// Uniquement les interventions actives
const activeInterventions = await interventionService.getActiveInterventions()
```

### Écoute en temps réel
```typescript
const unsubscribe = interventionService.onInterventionsChange((interventions) => {
  console.log('Nouvelles interventions:', interventions)
  // Mettre à jour votre UI ici
})

// Arrêter l'écoute
unsubscribe()
```

### Créer une intervention
```typescript
const newIntervention = await interventionService.createIntervention({
  name: 'Vidange',
  price: '80.00',
  duration_seconds: 900,
  description: 'Vidange moteur',
  is_active: true
})
```

## 🔧 Configuration Firebase

Le service utilise la configuration Firebase existante dans `src/firebase/config.ts`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyA8XeeQlZnjpYm8zwOcGDabnqcU9DSc6uo",
  authDomain: "garage-s5-projet.firebaseapp.com",
  databaseURL: "https://garage-s5-projet-default-rtdb.firebaseio.com",
  projectId: "garage-s5-projet",
  // ...
}
```

## 📊 Structure des données

### Interface Intervention
```typescript
interface Intervention {
  id: number
  name: string
  price: string
  duration_seconds: number
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### Structure dans Firebase Realtime Database
```
interventions/
├── 1/
│   ├── id: 1
│   ├── name: "Freinage"
│   ├── price: "150.00"
│   ├── duration_seconds: 1800
│   ├── description: "Changement des plaquettes"
│   ├── is_active: true
│   ├── created_at: "2026-01-26T18:26:43.000000Z"
│   └── updated_at: "2026-01-26T18:26:43.000000Z"
├── 2/
│   └── ...
```

## 🔄 Flux de données

1. **Appel `getInterventions()`**
2. **Tentative Firebase** → Lecture depuis `interventions/` 
3. **Succès Firebase** → Retourne les données Firebase
4. **Échec Firebase** → Fallback vers API Laravel
5. **Retour des données** → Interface utilisateur mise à jour

## 🛠️ Debugging

Le service inclut des logs détaillés:
- ✅ `✅ Interventions récupérées depuis Firebase: X`
- 📭 `📭 Aucune intervention trouvée dans Firebase, fallback vers API Laravel`
- ⚠️ `⚠️ Erreur Firebase, fallback vers API Laravel`
- ❌ `❌ Erreur API Laravel`

## 📱 Exemple complet

Voir `src/examples/intervention-example.ts` pour un exemple complet d'utilisation dans une application mobile.

## 🔐 Permissions Firebase

Assurez-vous que les règles Firebase Realtime Database permettent la lecture:

```json
{
  "rules": {
    "interventions": {
      ".read": true,
      ".write": true
    }
  }
}
```
