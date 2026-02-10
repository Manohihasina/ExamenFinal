<template>
  <ion-page>
    <ion-header :translucent="true" class="modern-header">
      <ion-toolbar>
        <div class="header-greeting">
          <h2 class="greeting-text">Bonjour, {{ user?.displayName || 'Utilisateur' }} !</h2>
          <p class="greeting-subtitle">Good Morning</p>
        </div>
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
      <!-- Stats Grid -->
            <div class="welcome-section">
        <div class="welcome-card">
          <div class="welcome-content">
            <h3 class="welcome-title">Welcome!</h3>
            <p class="welcome-subtitle">Let's schedule your projects</p>
            <div class="welcome-illustration">
              <ion-icon :icon="calendarOutline"></ion-icon>
            </div>
          </div>
        </div>
      </div>

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
              <p>Réparations en attente</p>
            </div>
          </div>
        </div>
      </div>

        <!-- Welcome Section -->


      <!-- Ongoing Projects Section -->
      <div class="projects-section">
        <div class="section-header">
          <h3 class="section-title">Réparations terminées</h3>
          <ion-button fill="clear" class="view-all-button" @click="router.push('/tabs/repairs')">
            <span>view all</span>
            <ion-icon :icon="chevronForwardOutline"></ion-icon>
          </ion-button>
        </div>
        <div class="projects-grid">
          <div class="project-card" v-for="(project, index) in completedRepairs.slice(0, 4)" :key="index">
            <div class="project-date">{{ formatDate(project.createdAt) }}</div>
            <h4 class="project-title">{{ getCarName(project.carId) }}</h4>
            <div class="project-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getProgressPercentage(project.status) + '%' }"></div>
              </div>
              <span class="progress-text">{{ getProgressPercentage(project.status) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Repairs -->
      <div class="recent-container" v-if="recentRepairs.length > 0" style="margin-top: var(--spacing-xl);">
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
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge,
  toastController
} from '@ionic/vue'
import { 
  buildOutline, 
  chevronForwardOutline,
  refreshOutline,
  addOutline,
  notificationsOutline,
  calendarOutline,
  carOutline
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

const completedRepairs = computed(() => {
  return repairs.value.filter(repair => repair.status === RepairStatus.COMPLETED)
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

const getProgressPercentage = (status: RepairStatus): number => {
  switch (status) {
    case RepairStatus.PENDING: return 25
    case RepairStatus.IN_PROGRESS: return 60
    case RepairStatus.COMPLETED: return 100
    default: return 0
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
@import '@/theme/layout.css';
@import '@/theme/components.css';

/* Header Styles */
.modern-header {
  --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
  --border-color: transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  min-height: 60px;
}

.header-greeting {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--spacing-md) var(--spacing-lg);
}

.greeting-text {
  color: var(--car-wash-primary);
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
  text-shadow: 0 1px 2px rgba(220, 38, 38, 0.1);
}

.greeting-subtitle {
  color: rgba(220, 38, 38, 0.8);
  font-size: 0.9rem;
  margin: var(--spacing-xs) 0 0;
}

/* Notification Button */
.notification-button {
  position: relative;
  color: var(--car-wash-primary);
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
  background: var(--car-wash-primary);
  color: var(--car-wash-white);
}

/* Welcome Section */
.welcome-section {
  padding: var(--spacing-lg);
  background: var(--car-wash-white);
  margin-bottom: var(--spacing-lg);
}

.welcome-card {
  background: var(--gradient-card);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--ion-card-border-color);
}

.welcome-content {
  text-align: center;
}

.welcome-title {
  color: var(--car-wash-dark);
  font-size: 1.8rem;
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-md) 0;
}

.welcome-subtitle {
  color: var(--ion-color-medium);
  font-size: 1rem;
  margin: 0 0 var(--spacing-xl) 0;
  line-height: 1.5;
}

.welcome-illustration {
  display: flex;
  justify-content: center;
  margin: var(--spacing-lg) 0;
}

.welcome-illustration ion-icon {
  font-size: 4rem;
  color: var(--car-wash-primary);
  opacity: 0.8;
}

/* Projects Section */
.projects-section {
  padding: 0 var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-title {
  color: var(--car-wash-dark);
  font-size: 1.3rem;
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.view-all-button {
  --color: var(--car-wash-primary);
  --background: transparent;
  font-size: 0.9rem;
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.projects-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.project-card {
  background: var(--car-wash-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--ion-card-border-color);
  transition: all var(--transition-normal);
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.project-date {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

.project-title {
  color: var(--car-wash-dark);
  font-size: 1.1rem;
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-sm) 0;
}

.project-progress {
  margin-top: var(--spacing-md);
}

.progress-bar {
  background: var(--car-wash-light);
  height: 8px;
  border-radius: var(--border-radius-full);
  overflow: hidden;
  margin-bottom: var(--spacing-xs);
}

.progress-fill {
  background: var(--gradient-primary);
  height: 100%;
  transition: width var(--transition-normal);
}

.progress-text {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: var(--font-weight-medium);
}

/* Stats Section */
.stats-container {
  padding: 0 var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.stat-card {
  background: var(--car-wash-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all var(--transition-normal);
  border: 1px solid var(--ion-card-border-color);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-card.primary {
  background: var(--gradient-primary);
  color: var(--car-wash-white);
}

.stat-card.secondary {
  background: var(--gradient-secondary);
  color: var(--car-wash-white);
}

.stat-icon {
  margin-bottom: var(--spacing-sm);
}

.stat-icon ion-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.stat-content h2 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

.stat-content p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: var(--font-weight-medium);
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
  background: var(--car-wash-primary);
  color: var(--car-wash-white);
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