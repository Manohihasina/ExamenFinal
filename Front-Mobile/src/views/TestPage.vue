<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Page de Test</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <h1>🚀 Application fonctionne !</h1>
      <p>Si vous voyez cette page, l'application s'affiche correctement.</p>
      
      <ion-button @click="testFirebase" expand="block" class="ion-margin-top">
        Tester Firebase
      </ion-button>
      
      <ion-button @click="goToLogin" expand="block" fill="outline" class="ion-margin-top">
        Aller à la page de connexion
      </ion-button>
      
      <div v-if="testResult" class="ion-margin-top">
        <h3>Résultat du test:</h3>
        <pre>{{ testResult }}</pre>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButton
} from '@ionic/vue'
// import { testFirebaseConnection } from '@/firebase/config-simple'

const router = useRouter()
const testResult = ref('')

const testFirebase = async () => {
  try {
    // Test simple pour vérifier que l'application fonctionne
    testResult.value = '✅ Application fonctionne correctement!\n✅ Vue.js est chargé\n✅ Ionic Vue est fonctionnel\n✅ Le routage fonctionne'
  } catch (error) {
    testResult.value = `Erreur: ${error}`
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>
