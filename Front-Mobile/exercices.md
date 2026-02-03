Voici une série d'exercices progressifs pour renforcer vos compétences avec Ionic, TypeScript et Vue.js basés sur votre code existant :

## 📚 **Exercices de Renforcement Ionic + Vue.js**

### **Niveau 1 : Modifications Basiques**

#### **Exercice 1.1 : Corriger le titre du Tab1**
**Objectif** : Apprendre à modifier les composants Ionic de base.
- Dans `Tab1Page.vue`, changez le titre "Tab beee" pour "Accueil" (dans le premier `<ion-title>`)
- Ajoutez un bouton dans la toolbar avec l'icône `search`
- Bonus : Ajoutez un événement click sur le bouton qui affiche un `console.log`

#### **Exercice 1.2 : Personnaliser les couleurs**
**Objectif** : Comprendre le theming Ionic.
- Dans `variables.css`, ajoutez une couleur personnalisée :
```css
:root {
  --ion-color-primary: #3880ff;
  --ion-color-primary-rgb: 56, 128, 255;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #3171e0;
  --ion-color-primary-tint: #4c8dff;
}
```
- Appliquez cette couleur aux headers des pages Tab1, Tab2, Tab3

### **Niveau 2 : Composants et Interactivité**

#### **Exercice 2.1 : Créer un composant réutilisable**
**Objectif** : Créer et utiliser des composants Vue.js.
- Créez un nouveau composant `CardComponent.vue` dans `/components/`
- Ce composant doit afficher :
  - Un titre (prop)
  - Une description (prop)
  - Un bouton avec un événement personnalisé
- Utilisez ce composant dans `Tab2Page.vue` 3 fois avec des données différentes

#### **Exercice 2.2 : Ajouter un formulaire**
**Objectif** : Utiliser les formulaires Ionic avec TypeScript.
- Dans `Tab3Page.vue`, ajoutez un formulaire avec :
  - Un champ texte (`ion-input`) pour le nom
  - Un champ email avec validation
  - Un toggle (`ion-toggle`)
  - Un bouton de soumission
- Créez une interface TypeScript pour les données du formulaire
- Implémentez la validation et affichez les erreurs

### **Niveau 3 : State et Navigation**

#### **Exercice 3.1 : Gérer un état global simple**
**Objectif** : Comprendre la gestion d'état avec Composition API.
- Créez un store simple dans `/composables/useCounter.ts` :
```typescript
import { ref } from 'vue';

export function useCounter() {
  const count = ref(0);
  
  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => count.value = 0;
  
  return { count, increment, decrement, reset };
}
```
- Utilisez ce store dans `Tab1Page.vue` pour afficher et modifier le compteur

#### **Exercice 3.2 : Navigation avec paramètres**
**Objectif** : Maîtriser la navigation Ionic.
- Modifiez le routeur pour ajouter une nouvelle page `DetailPage.vue`
- Dans `Tab2Page.vue`, créez une liste d'items avec `ion-list`
- Chaque item doit naviguer vers `DetailPage` avec un paramètre ID
- Dans `DetailPage`, récupérez le paramètre et affichez-le

### **Niveau 4 : Fonctionnalités Avancées**

#### **Exercice 4.1 : Ajouter des animations**
**Objectif** : Utiliser les animations Ionic.
- Dans `Tab1Page.vue`, animez l'accordéon pour qu'il se déplie avec une animation
- Ajoutez un bouton qui fait apparaître un modal avec animation
- Utilisez `ion-animation` ou les utilitaires CSS d'Ionic

#### **Exercice 4.2 : Intégrer une API**
**Objectif** : Gérer les appels API avec TypeScript.
- Créez un service `api.ts` dans `/services/`
- Utilisez fetch ou axios pour appeler une API publique (ex: JSONPlaceholder)
- Affichez les données dans `Tab3Page.vue` avec `ion-skeleton-text` pendant le chargement
- Gère les erreurs avec `ion-toast`

### **Niveau 5 : Projet Complet**

#### **Exercice 5.1 : Application Météo**
**Objectif** : Créer une mini-application complète.
1. **Page 1 (Tab1)** : Formulaire pour sélectionner une ville
2. **Page 2 (Tab2)** : Affichage de la météo actuelle avec :
   - `ion-card` pour les informations principales
   - `ion-grid` pour les détails (humidité, vent, etc.)
   - Icônes dynamiques selon la météo
3. **Page 3 (Tab3)** : Prévisions sur 5 jours avec `ion-segment` pour switcher entre jours
4. **Bonus** :
   - Sauvegarder les villes favorites avec `localStorage`
   - Mode sombre/clair avec le système Ionic
   - Pull-to-refresh avec `ion-refresher`

#### **Exercice 5.2 : Gestion de tâches**
**Objectif** : Application CRUD complète.
1. **Architecture** :
   - Store Pinia pour la gestion d'état
   - Persistance avec `@ionic/storage`
   - Types TypeScript stricts
2. **Fonctionnalités** :
   - Ajouter/supprimer/modifier des tâches
   - Catégories avec badges (`ion-badge`)
   - Filtres par statut (todo, en cours, terminé)
   - Recherche avec `ion-searchbar`
   - Notifications locales avec `LocalNotifications`

### **Exercices Bonus :**

#### **Bonus 1 : Internationalisation**
- Ajouter le support multi-langues (français/anglais)
- Utiliser `vue-i18n` ou un système maison
- Changer la langue via les paramètres

#### **Bonus 2 : PWA Features**
- Ajouter un service worker
- Mettre en cache les données
- Ajouter un splash screen personnalisé
- Gérer les mises à jour en ligne/hors ligne

#### **Bonus 3 : Tests**
- Écrire des tests unitaires pour les composants
- Tests e2e avec Cypress
- Tests des stores et services

### **Conseils pour la pratique :**

1. **Commencez simple** : Faites les exercices dans l'ordre
2. **Documentation** : Gardez la [doc Ionic](https://ionicframework.com/docs) ouverte
3. **TypeScript** : Utilisez des interfaces/types pour toutes vos données
4. **Composition API** : Privilégiez `<script setup>` et les composables
5. **Debug** : Utilisez les outils dev Vue et les logs console
6. **Responsive** : Testez sur différentes tailles d'écran avec les outils dev

Chaque exercice peut être réalisé indépendamment. Commencez par ceux qui correspondent à votre niveau actuel et progressez graduellement. Bon courage ! 🚀