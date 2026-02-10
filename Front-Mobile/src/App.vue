<template>
  <ion-app>
    <ion-router-outlet />
    
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, onUnmounted } from 'vue';
// import { FCMService } from './services/fcm';


// let fcmService: FCMService;


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

</script>
