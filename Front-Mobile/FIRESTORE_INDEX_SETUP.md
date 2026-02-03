# Configuration des Index Firestore

## Problème
L'application nécessite des index composites pour fonctionner correctement avec les requêtes Firestore.

## Index requis

### 1. Index pour getUserRepairs()
- **Collection**: `repairs`
- **Champs**:
  - `userId` (Ascending)
  - `createdAt` (Descending)

### 2. Index pour getRepairsByStatus()
- **Collection**: `repairs`
- **Champs**:
  - `userId` (Ascending)
  - `status` (Ascending)
  - `createdAt` (Descending)

## Comment créer les index

### Méthode 1: Via la console Firebase
1. Allez sur: https://console.firebase.google.com
2. Sélectionnez votre projet: `garage-s5-projet`
3. Allez dans: Firestore Database > Indexes
4. Cliquez sur "Add Index"
5. Configurez chaque index comme décrit ci-dessus

### Méthode 2: Via le lien direct (recommandé)
Cliquez sur ce lien pour créer automatiquement le premier index:
https://console.firebase.google.com/v1/r/project/garage-s5-projet/firestore/indexes?create_composite=ClBwcm9qZWN0cy9nYXJhZ2UtczUtcHJvamV0L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9yZXBhaXJzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI

## Solution temporaire implémentée
L'application inclut maintenant une gestion d'erreur qui bascule automatiquement vers une méthode alternative si les index ne sont pas encore créés:

- ✅ Essai de la requête optimisée avec index
- ⚠️ Si erreur d'index, utilisation de la méthode alternative
- 🔄 Tri côté client pour maintenir l'ordre chronologique

## Vérification
Après avoir créé les index, l'application utilisera automatiquement les requêtes optimisées pour de meilleures performances.
