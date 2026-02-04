<template>
  <ion-page>
    <ion-header :translucent="true" class="modern-header">
      <ion-toolbar>
        <ion-title class="modern-title">Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="modern-content">
      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <CarLoadingSpinner message="Chargement des notifications..." />
      </div>

      <div v-else class="container">
        <!-- Notifications Header -->
        <div class="notifications-header">
          <h2>Mes Notifications</h2>
          <ion-button fill="clear" @click="markAllAsRead" v-if="unreadCount > 0">
            <ion-icon :icon="checkmarkOutline" />
            Tout marquer comme lu
          </ion-button>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list" v-if="notifications.length > 0">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.read }"
            @click="markAsRead(notification.id)"
          >
            <div class="notification-icon">
              <ion-icon 
                :icon="getNotificationIcon(notification.type)" 
                :color="getNotificationColor(notification.type)"
              />
            </div>
            <div class="notification-content">
              <h3>{{ notification.title }}</h3>
              <p>{{ notification.message }}</p>
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            </div>
            <div class="notification-status" v-if="!notification.read">
              <div class="unread-dot"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" v-else>
          <ion-icon :icon="notificationsOffOutline" size="large" color="medium" />
          <h3>Aucune notification</h3>
          <p>Vous n'avez pas de nouvelles notifications</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
} from '@ionic/vue';
import {
  checkmarkOutline,
  notificationsOffOutline,
  buildOutline,
  carOutline,
  cardOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
  refreshOutline,
} from 'ionicons/icons';
import CarLoadingSpinner from '@/components/CarLoadingSpinner.vue';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'repair' | 'payment' | 'car' | 'info' | 'success';
  read: boolean;
  createdAt: Date;
}

const notifications = ref<Notification[]>([]);
const unreadCount = ref(0);
const loading = ref(true);

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'repair': return buildOutline;
    case 'payment': return cardOutline;
    case 'car': return carOutline;
    case 'success': return checkmarkCircleOutline;
    default: return informationCircleOutline;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'repair': return 'primary';
    case 'payment': return 'success';
    case 'car': return 'warning';
    case 'success': return 'success';
    default: return 'medium';
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString();
};

const markAsRead = (id: string) => {
  const notification = notifications.value.find(n => n.id === id);
  if (notification && !notification.read) {
    notification.read = true;
    updateUnreadCount();
  }
};

const markAllAsRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true;
  });
  updateUnreadCount();
};

const updateUnreadCount = () => {
  unreadCount.value = notifications.value.filter(n => !n.read).length;
};

const loadNotifications = async () => {
  loading.value = true;
  try {
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simuler des notifications de démonstration
    notifications.value = [
    {
      id: '1',
      title: 'Réparation terminée',
      message: 'Votre réparation "Changement d\'huile" est maintenant terminée',
      type: 'success',
      read: false,
      createdAt: new Date(Date.now() - 300000) // 5 min ago
    },
    {
      id: '2',
      title: 'Réparation en cours',
      message: 'Votre réparation "Freinage" est à 50% de progression',
      type: 'repair',
      read: false,
      createdAt: new Date(Date.now() - 900000) // 15 min ago
    },
    {
      id: '3',
      title: 'Paiement requis',
      message: 'Le paiement pour votre dernière réparation est en attente',
      type: 'payment',
      read: true,
      createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    }
  ];
  updateUnreadCount();
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  loadNotifications();
};

onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.container {
  padding: 16px;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.notifications-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: var(--ion-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.notification-item:hover {
  background: var(--ion-color-light-tint);
  transform: translateY(-2px);
}

.notification-item.unread {
  background: linear-gradient(135deg, var(--ion-color-light), var(--ion-color-primary-tint));
  border-left: 4px solid var(--ion-color-primary);
}

.notification-icon {
  margin-right: 12px;
  padding: 8px;
  background: var(--ion-color-light-shade);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-content {
  flex: 1;
}

.notification-content h3 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
}

.notification-content p {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.notification-time {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.notification-status {
  margin-left: 8px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: var(--ion-color-primary);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state h3 {
  margin: 16px 0 8px 0;
  font-size: 1.1rem;
  color: var(--ion-color-medium);
}

.empty-state p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

/* Styles modernes */
.modern-header {
  --background: linear-gradient(135deg, #167b7e, #1a5f7a);
  --color: #ffffff;
}

.modern-title {
  color: #ffffff;
  font-weight: 600;
}

.modern-content {
  --background: #f8fafc;
}

/* Container pour le chargement */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}
</style>
