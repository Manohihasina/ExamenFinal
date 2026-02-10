<template>
  <ion-page>
    <ion-header :translucent="true" class="modern-header">
      <ion-toolbar>
        <ion-title class="modern-title">Profil</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="modern-content">
      <!-- Profile Header -->
      <div class="profile-container">
        <div class="profile-header">
          <div class="profile-avatar-container">
            <div class="profile-avatar">
              <img :src="userPhoto" :alt="user?.displayName || 'Utilisateur'" />
              <div class="avatar-badge">
                <ion-icon :icon="personCircleOutline"></ion-icon>
              </div>
            </div>
          </div>
          <div class="profile-info">
            <h1>{{ user?.displayName || 'Utilisateur' }}</h1>
            <p class="profile-email">{{ user?.email }}</p>
            <p class="profile-member">Membre depuis {{ formatDate(user?.metadata.creationTime) }}</p>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-container">
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="stat-icon">
              <ion-icon :icon="carOutline"></ion-icon>
            </div>
            <div class="stat-content">
              <h2>{{ cars.length }}</h2>
              <p>Voitures</p>
            </div>
          </div>
          <div class="stat-card secondary">
            <div class="stat-icon">
              <ion-icon :icon="buildOutline"></ion-icon>
            </div>
            <div class="stat-content">
              <h2>{{ totalRepairs }}</h2>
              <p>Réparations</p>
            </div>
          </div>
          <div class="stat-card tertiary">
            <div class="stat-icon">
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
            </div>
            <div class="stat-content">
              <h2>{{ completedRepairs }}</h2>
              <p>Terminées</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Information -->
      <div class="section-container">
        <div class="section-header">
          <h3>Informations du compte</h3>
          <ion-icon :icon="personOutline"></ion-icon>
        </div>
        <div class="info-cards">
          <div class="info-card">
            <div class="info-icon">
              <ion-icon :icon="mailOutline"></ion-icon>
            </div>
            <div class="info-content">
              <h4>Email</h4>
              <p>{{ user?.email }}</p>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">
              <ion-icon :icon="personOutline"></ion-icon>
            </div>
            <div class="info-content">
              <h4>Nom</h4>
              <p>{{ user?.displayName || 'Non défini' }}</p>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">
              <ion-icon :icon="calendarOutline"></ion-icon>
            </div>
            <div class="info-content">
              <h4>Date d'inscription</h4>
              <p>{{ formatDate(user?.metadata.creationTime) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div class="section-container">
        <div class="section-header">
          <h3>Paramètres</h3>
          <ion-icon :icon="settingsOutline"></ion-icon>
        </div>
        <div class="settings-cards">
          <div class="setting-card" @click="toggleNotifications">
            <div class="setting-icon">
              <ion-icon :icon="notificationsOutline"></ion-icon>
            </div>
            <div class="setting-content">
              <h4>Notifications push</h4>
              <p>Recevoir des alertes sur vos réparations</p>
            </div>
            <div class="setting-toggle">
              <ion-toggle 
                :checked="notificationsEnabled" 
                @ionChange="handleNotificationToggle"
              ></ion-toggle>
            </div>
          </div>
          
          <div class="setting-card" @click="testNotification">
            <div class="setting-icon">
              <ion-icon :icon="notificationsOutline"></ion-icon>
            </div>
            <div class="setting-content">
              <h4>Tester les notifications</h4>
              <p>Envoyer une notification de test</p>
            </div>
            <div class="setting-arrow">
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </div>
          </div>
          
          <div class="setting-card" @click="resetPassword">
            <div class="setting-icon">
              <ion-icon :icon="keyOutline"></ion-icon>
            </div>
            <div class="setting-content">
              <h4>Changer le mot de passe</h4>
              <p>Réinitialiser votre mot de passe par email</p>
            </div>
            <div class="setting-arrow">
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Logout Button -->
      <div class="logout-container">
        <ion-button 
          expand="block" 
          fill="outline" 
          class="logout-button"
          @click="logout"
          :disabled="loggingOut"
        >
          <ion-spinner v-if="loggingOut" name="crescent"></ion-spinner>
          <span v-else>
            <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
            Se déconnecter
          </span>
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonToggle,
  toastController,
  alertController
} from '@ionic/vue'
import { 
  logOutOutline,
  notificationsOutline,
  keyOutline,
  refreshOutline,
  personCircleOutline,
  personOutline,
  carOutline,
  buildOutline,
  checkmarkCircleOutline,
  mailOutline,
  calendarOutline,
  settingsOutline,
  chevronForwardOutline
} from 'ionicons/icons'
import { authService } from '@/services/auth.service'
import { carService, type Car } from '@/services/car.service'
import { repairService, type Repair, RepairStatus } from '@/services/repair.service'
import { notificationService } from '@/services/notification.service'

const router = useRouter()
const loggingOut = ref(false)
const notificationsEnabled = ref(false)
const user = ref(authService.getCurrentUser())
const cars = ref<Car[]>([])
const repairs = ref<Repair[]>([])

const totalRepairs = ref(0)
const completedRepairs = ref(0)

const userPhoto = ref(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.value?.displayName || 'User')}&background=3b82f6&color=fff`)

onMounted(async () => {
  await loadUserData()
  await checkNotificationStatus()
})

const refreshData = async () => {
  await loadUserData()
  showToast('Données actualisées', 'success')
}

const loadUserData = async () => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) return

    // Charger les données utilisateur en parallèle
    const [carsData, repairsData] = await Promise.all([
      carService.getUserCars(currentUser.uid),
      repairService.getUserRepairs(currentUser.uid)
    ])

    cars.value = carsData
    repairs.value = repairsData

    // Calculer les statistiques
    totalRepairs.value = repairsData.length
    completedRepairs.value = repairsData.filter(r => r.status === RepairStatus.COMPLETED).length

  } catch (error: any) {
    showToast('Erreur lors du chargement des données: ' + error.message, 'danger')
  }
}

const checkNotificationStatus = async () => {
  try {
    const permission = notificationService.getPermissionStatus()
    notificationsEnabled.value = permission === 'granted'
  } catch (error) {
    console.warn('Erreur lors de la vérification des notifications:', error)
    notificationsEnabled.value = false
  }
}

const toggleNotifications = async () => {
  try {
    if (notificationsEnabled.value) {
      // Désactiver les notifications
      await notificationService.deleteToken()
      notificationsEnabled.value = false
      showToast('Notifications désactivées', 'success')
    } else {
      // Activer les notifications
      const token = await notificationService.requestPermissionAndGetToken()
      if (token) {
        notificationsEnabled.value = true
        showToast('Notifications activées', 'success')
      } else {
        showToast('Impossible d\'activer les notifications', 'warning')
      }
    }
  } catch (error: any) {
    showToast('Erreur: ' + error.message, 'danger')
  }
}

const handleNotificationToggle = (event: any) => {
  notificationsEnabled.value = event.detail.checked
  toggleNotifications()
}

const testNotification = async () => {
  try {
    await notificationService.sendTestNotification()
    showToast('Notification de test envoyée', 'success')
  } catch (error: any) {
    showToast('Erreur lors de l\'envoi de la notification: ' + error.message, 'danger')
  }
}

const resetPassword = async () => {
  const alert = await alertController.create({
    header: 'Réinitialiser le mot de passe',
    message: 'Un email de réinitialisation sera envoyé à votre adresse email',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Envoyer',
        handler: async () => {
          try {
            if (user.value?.email) {
              await authService.resetPassword(user.value.email)
              showToast('Email de réinitialisation envoyé', 'success')
            }
          } catch (error: any) {
            showToast(error.message, 'danger')
          }
        }
      }
    ]
  })

  await alert.present()
}

const logout = async () => {
  const alert = await alertController.create({
    header: 'Confirmer la déconnexion',
    message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Se déconnecter',
        role: 'destructive',
        handler: async () => {
          loggingOut.value = true
          try {
            await authService.logout()
            
            // Nettoyer le localStorage
            localStorage.removeItem('user')
            
            // Supprimer le token de notification
            await notificationService.deleteToken()
            
            showToast('Déconnexion réussie', 'success')
            
            // Rediriger vers la page de connexion
            setTimeout(() => {
              router.replace('/login')
            }, 1000)
            
          } catch (error: any) {
            showToast('Erreur lors de la déconnexion: ' + error.message, 'danger')
          } finally {
            loggingOut.value = false
          }
        }
      }
    ]
  })

  await alert.present()
}

const formatDate = (timestamp?: string): string => {
  if (!timestamp) return 'Inconnue'
  
  const date = new Date(timestamp)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'bottom'
  })
  await toast.present()
}
</script>

<style scoped>
@import '@/theme/layout.css';
@import '@/theme/components.css';
/* Header Modern */
.modern-header {
  --background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
  --border-color: transparent;
}

.modern-title {
  color: var(--car-wash-primary);
  font-weight: 600;
  font-size: 1.3rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Content Modern */
.modern-content {
  --background: linear-gradient(to bottom, #f8fafc, #ffffff);
  padding: 0;
}

/* Profile Container */
.profile-container {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(185, 28, 28, 0.8) 100%);
  padding: 40px 20px 60px;
  margin-bottom: 30px;
  position: relative;
}

.profile-container::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
  border-radius: 50%;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: white;
}

.profile-avatar-container {
  position: relative;
  margin-bottom: 20px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
}

.avatar-badge ion-icon {
  font-size: 1.2rem;
}

.profile-info h1 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
}

.profile-email {
  margin: 0 0 4px 0;
  font-size: 1rem;
  opacity: 0.9;
  color: white;
}

.profile-member {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
  color: white;
}

/* Stats Container */
.stats-container {
  padding: 0 20px;
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 24px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.stat-card.primary::before {
  background: linear-gradient(90deg, #DC2626, #B91C1C);
}

.stat-card.secondary::before {
  background: linear-gradient(90deg, #10b981, #06b6d4);
}

.stat-card.tertiary::before {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.stat-card.primary .stat-icon {
  background: linear-gradient(135deg, #DC2626, #B91C1C);
  color: white;
}

.stat-card.secondary .stat-icon {
  background: linear-gradient(135deg, #10b981, #06b6d4);
  color: white;
}

.stat-card.tertiary .stat-icon {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: white;
}

.stat-icon ion-icon {
  font-size: 1.5rem;
}

.stat-content h2 {
  margin: 0 0 4px 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

/* Section Container */
.section-container {
  padding: 0 20px;
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
}

.section-header ion-icon {
  font-size: 1.4rem;
  color: #94a3b8;
}

/* Info Cards */
.info-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.info-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #DC2626, #B91C1C);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon ion-icon {
  font-size: 1.3rem;
}

.info-content {
  flex: 1;
}

.info-content h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.info-content p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

/* Settings Cards */
.settings-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.setting-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.setting-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.setting-icon ion-icon {
  font-size: 1.3rem;
}

.setting-content {
  flex: 1;
}

.setting-content h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.setting-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.setting-toggle {
  flex-shrink: 0;
}

.setting-arrow {
  flex-shrink: 0;
}

.setting-arrow ion-icon {
  font-size: 1.2rem;
  color: #94a3b8;
  transition: transform 0.3s ease;
}

.setting-card:hover .setting-arrow ion-icon {
  transform: translateX(4px);
}

/* Logout Container */
.logout-container {
  padding: 0 20px 40px;
}

.logout-button {
  --border-color: #ef4444;
  --color: #ef4444;
  --border-radius: 16px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.logout-button:hover {
  --background: rgba(239, 68, 68, 0.1);
}

/* Animations */
.profile-container {
  animation: slideInDown 0.6s ease-out;
}

.stats-container {
  animation: slideInUp 0.6s ease-out 0.1s both;
}

.section-container:nth-child(2) {
  animation: slideInUp 0.6s ease-out 0.2s both;
}

.section-container:nth-child(3) {
  animation: slideInUp 0.6s ease-out 0.3s both;
}

.logout-container {
  animation: slideInUp 0.6s ease-out 0.4s both;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-container {
    padding: 30px 20px 50px;
  }
  
  .stats-grid {
    gap: 12px;
  }
  
  .stat-card {
    padding: 20px 12px;
  }
  
  .stat-content h2 {
    font-size: 1.5rem;
  }
  
  .info-card, .setting-card {
    padding: 16px;
  }
  
  .profile-avatar {
    width: 100px;
    height: 100px;
  }
  
  .profile-info h1 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stat-card {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
    padding: 16px;
  }
  
  .stat-icon {
    margin-bottom: 0;
    margin-right: 12px;
  }
}
</style>
