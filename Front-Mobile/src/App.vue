<template>
  <ion-app>
    <ion-router-outlet />
    
    <!-- Interface de test pour les notifications -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="toggleTestMenu">
        <ion-icon :icon="notificationsOutline"></ion-icon>
      </ion-fab-button>
      <ion-fab-list side="top">
        <ion-fab-button @click="testFCMFlow" color="primary">
          <ion-icon :icon="playOutline"></ion-icon>
        </ion-fab-button>
        <ion-fab-button @click="testIntervention" color="secondary">
          <ion-icon :icon="buildOutline"></ion-icon>
        </ion-fab-button>
        <ion-fab-button @click="testRepair" color="tertiary">
          <ion-icon :icon="checkmarkOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab-list>
    </ion-fab>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonFab, IonFabButton, IonFabList, IonIcon } from '@ionic/vue';
import { onMounted, onUnmounted, ref } from 'vue';
// import { FCMService } from './services/fcm';
import { 
  notificationsOutline, 
  playOutline, 
  buildOutline, 
  checkmarkOutline 
} from 'ionicons/icons';

// let fcmService: FCMService;
const showTestMenu = ref(false);

onMounted(async () => {
  try {
    console.log('🚀 Démarrage de l\'application...');
    
    // Désactiver temporairement FCM pour éviter les crashes
    // fcmService = FCMService.getInstance();
    // await fcmService.initialize();
    // await fcmService.setupNotificationListeners();
    
    console.log('⚠️ FCM désactivé temporairement pour éviter les crashes');
    
    // Écouter les événements de notification personnalisés
    window.addEventListener('fcmNotification', handleCustomNotification);
    
    console.log('✅ Application initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    // Ne pas crasher l'app si FCM échoue
  }
});

onUnmounted(() => {
  window.removeEventListener('fcmNotification', handleCustomNotification);
});

function handleCustomNotification(event: any) {
  const { title, body, data } = event.detail;
  console.log('Notification personnalisée reçue:', { title, body, data });
  
  // Ici vous pouvez afficher un toast, une alerte, ou naviguer
  // Par exemple avec un toast Ionic:
  // showToast(`${title}: ${body}`);
}

// Fonctions de test
function toggleTestMenu() {
  showTestMenu.value = !showTestMenu.value;
}

async function testFCMFlow() {
  console.log('🧪 FCM désactivé - impossible de lancer le test');
}

async function testIntervention() {
  console.log('🧪 FCM désactivé - impossible de tester la notification');
}

async function testRepair() {
  console.log('🧪 FCM désactivé - impossible de tester la notification');
}
</script>
