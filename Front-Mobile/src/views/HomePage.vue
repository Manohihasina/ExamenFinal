<template>
  <ion-page>
    <ion-header :translucent="true" class="modern-header">
      <ion-toolbar>
        <ion-title class="modern-title">Accueil</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="router.push('/tabs/notifications')" class="notification-button">
            <ion-icon :icon="notificationsOutline"></ion-icon>
            <ion-badge color="danger" v-if="unreadCount > 0">{{ unreadCount }}</ion-badge>
          </ion-button>
          <ion-button fill="clear" @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="modern-content">
      <!-- Welcome Section -->
      <div class="welcome-container">
        <div class="welcome-card">
          <div class="welcome-avatar">
            <ion-icon :icon="personCircleOutline"></ion-icon>
          </div>
          <div class="welcome-text">
            <h1>Bonjour, {{ user?.displayName || 'Utilisateur' }} 👋</h1>
            <p>Gérez votre garage en toute simplicité</p>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
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
              <h2>{{ pendingRepairs.length }}</h2>
              <p>Réparations en cours</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="actions-container">
        <h3 class="section-title">Actions rapides</h3>
        <div class="actions-grid">
          <div class="action-card" @click="router.push('/tabs/cars')">
            <div class="action-icon primary">
              <ion-icon :icon="carOutline"></ion-icon>
            </div>
            <div class="action-content">
              <h4>Ajouter une voiture</h4>
              <p>Nouveau véhicule</p>
            </div>
            <div class="action-arrow">
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </div>
          </div>
          <div class="action-card" @click="router.push('/tabs/repairs/new')">
            <div class="action-icon secondary">
              <ion-icon :icon="buildOutline"></ion-icon>
            </div>
            <div class="action-content">
              <h4>Nouvelle réparation</h4>
              <p>Demande de service</p>
            </div>
            <div class="action-arrow">
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </div>
          </div>
          <div class="action-card" @click="router.push('/tabs/repairs')">
            <div class="action-icon tertiary">
              <ion-icon :icon="listOutline"></ion-icon>
            </div>
            <div class="action-content">
              <h4>Mes réparations</h4>
              <p>Historique complet</p>
            </div>
            <div class="action-arrow">
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Repairs -->
      <div class="recent-container" v-if="recentRepairs.length > 0">
        <div class="section-header">
          <h3 class="section-title">Réparations récentes</h3>
          <ion-button fill="clear" size="small" @click="router.push('/tabs/repairs')">
            Voir tout
          </ion-button>
        </div>
        <div class="repairs-list">
          <div 
            v-for="repair in recentRepairs" 
            :key="repair.id"
            class="repair-item"
            @click="viewRepair(repair)"
          >
            <div class="repair-icon">
              <ion-icon :icon="buildOutline"></ion-icon>
            </div>
            <div class="repair-content">
              <h4>{{ getCarName(repair.carId) }}</h4>
              <p>{{ repair.description.substring(0, 60) }}...</p>
              <div class="repair-meta">
                <span class="repair-status" :class="repair.status">
                  {{ getStatusText(repair.status) }}
                </span>
                <span class="repair-date">{{ formatDate(repair.createdAt) }}</span>
              </div>
            </div>
            <div class="repair-arrow">
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" v-else>
        <div class="empty-icon">
          <ion-icon :icon="buildOutline"></ion-icon>
        </div>
        <h3>Aucune réparation</h3>
        <p>Commencez par créer votre première demande de réparation</p>
        <ion-button fill="solid" @click="router.push('/tabs/repairs/new')">
          <ion-icon :icon="addOutline" slot="start"></ion-icon>
          Créer une demande
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
  IonBadge,
  toastController
} from '@ionic/vue'
import { 
  carOutline, 
  buildOutline, 
  listOutline,
  personCircleOutline,
  chevronForwardOutline,
  refreshOutline,
  addOutline,
  notificationsOutline
} from 'ionicons/icons'
import { authService } from '@/services/auth.service'
import { carService, type Car } from '@/services/car.service'
import { repairService, type Repair, RepairStatus } from '@/services/repair.service'
import { handleFirestoreConnection } from '@/firebase/config'

const router = useRouter()
const user = ref<any>(null)
const cars = ref<Car[]>([])
const repairs = ref<Repair[]>([])
const unreadCount = ref(2) // Simuler 2 notifications non lues

// Charger l'utilisateur depuis le localStorage au démarrage
const loadUserFromStorage = () => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (error) {
      console.error('Erreur parsing user from localStorage:', error)
    }
  }
}

const pendingRepairs = computed(() => {
  return repairs.value.filter(
    repair => repair.status === RepairStatus.PENDING || repair.status === RepairStatus.IN_PROGRESS
  )
})

const recentRepairs = computed(() => {
  return repairs.value.slice(0, 3)
})

onMounted(async () => {
  // Initialiser la gestion de connexion Firestore
  handleFirestoreConnection()
  
  loadUserFromStorage()
  await loadData()
})

const loadData = async () => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) return

    // Charger les voitures et les réparations en parallèle
    const [carsData, repairsData] = await Promise.all([
      carService.getUserCars(currentUser.uid),
      repairService.getUserRepairs(currentUser.uid)
    ])

    cars.value = carsData
    repairs.value = repairsData

  } catch (error: any) {
    showToast('Erreur lors du chargement des données: ' + error.message, 'danger')
  }
}

const refreshData = async () => {
  await loadData()
  showToast('Données actualisées', 'success')
}

const getCarName = (carId: string): string => {
  const car = cars.value.find(c => c.id === carId)
  return car ? `${car.brand} ${car.model}` : 'Voiture inconnue'
}

const viewRepair = (repair: Repair) => {
  router.push(`/tabs/repairs/${repair.id}`)
}

const getStatusText = (status: RepairStatus): string => {
  switch (status) {
    case RepairStatus.PENDING: return 'En attente'
    case RepairStatus.IN_PROGRESS: return 'En cours'
    case RepairStatus.COMPLETED: return 'Terminée'
    case RepairStatus.CANCELLED: return 'Annulée'
    default: return 'Inconnue'
  }
}

const formatDate = (timestamp: any): string => {
  const date = timestamp.toDate()
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
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
/* Header Modern */
.modern-header {
  --background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  --border-color: transparent;
}

.modern-title {
  color: white;
  font-weight: 600;
  font-size: 1.3rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Notification Button */
.notification-button {
  position: relative;
  color: white;
}

.notification-button ion-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 0.7rem;
  min-width: 16px;
  height: 16px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Content Modern */
.modern-content {
  --background: linear-gradient(to bottom, #f8fafc, #ffffff);
  padding: 0;
}

/* Welcome Section */
.welcome-container {
  padding: 24px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  margin-bottom: 20px;
}

.welcome-card {
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.welcome-avatar ion-icon {
  font-size: 3.5rem;
  opacity: 0.9;
}

.welcome-text h1 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
}

.welcome-text p {
  margin: 0;
  opacity: 0.9;
  font-size: 1rem;
}

/* Stats Section */
.stats-container {
  padding: 0 20px;
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-card.primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
}

.stat-card.secondary {
  background: linear-gradient(135deg, #10b981, #06b6d4);
  color: white;
}

.stat-icon ion-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  opacity: 0.9;
}

.stat-content h2 {
  margin: 0 0 4px 0;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-content p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 500;
}

/* Actions Section */
.actions-container {
  padding: 0 20px;
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-card {
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

.action-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon.primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
}

.action-icon.secondary {
  background: linear-gradient(135deg, #10b981, #06b6d4);
  color: white;
}

.action-icon.tertiary {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: white;
}

.action-icon ion-icon {
  font-size: 1.5rem;
}

.action-content {
  flex: 1;
}

.action-content h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.action-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.action-arrow ion-icon {
  font-size: 1.2rem;
  color: #94a3b8;
  transition: transform 0.3s ease;
}

.action-card:hover .action-arrow ion-icon {
  transform: translateX(4px);
}

/* Recent Repairs Section */
.recent-container {
  padding: 0 20px;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.repairs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.repair-item {
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

.repair-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.repair-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.repair-icon ion-icon {
  font-size: 1.2rem;
}

.repair-content {
  flex: 1;
}

.repair-content h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.repair-content p {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.repair-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.repair-status {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.repair-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.repair-status.in_progress {
  background: #dbeafe;
  color: #1e40af;
}

.repair-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.repair-date {
  font-size: 0.75rem;
  color: #64748b;
}

.repair-arrow ion-icon {
  font-size: 1.2rem;
  color: #94a3b8;
}

/* Empty State */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  background: white;
  margin: 0 20px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon ion-icon {
  font-size: 4rem;
  color: #94a3b8;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
}

/* Animations */
.welcome-container {
  animation: slideInDown 0.6s ease-out;
}

.stats-container {
  animation: slideInUp 0.6s ease-out 0.1s both;
}

.actions-container {
  animation: slideInUp 0.6s ease-out 0.2s both;
}

.recent-container {
  animation: slideInUp 0.6s ease-out 0.3s both;
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
  .welcome-text h1 {
    font-size: 1.3rem;
  }
  
  .stats-grid {
    gap: 12px;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .action-card {
    padding: 16px;
  }
  
  .repair-item {
    padding: 16px;
  }
}
</style>