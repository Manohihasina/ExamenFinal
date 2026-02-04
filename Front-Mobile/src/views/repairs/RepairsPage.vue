<template>
  <ion-page>
    <ion-header :translucent="true" class="modern-header">
      <ion-toolbar>
        <ion-title class="modern-title">Mes réparations</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="refreshData">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
          <ion-button fill="clear" @click="createRepair">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="modern-content">
      <!-- Filter tabs -->
      <div class="filter-container">
        <ion-segment v-model="selectedStatus" @ionChange="filterRepairs" class="modern-segment">
          <ion-segment-button value="all">
            <ion-label>Toutes</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pending">
            <ion-label>En attente</ion-label>
          </ion-segment-button>
          <ion-segment-button value="in_progress">
            <ion-label>En cours</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Terminées</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <CarLoadingSpinner message="Chargement des réparations..." />
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredRepairs.length === 0" class="empty-state">
        <div class="empty-icon">
          <ion-icon :icon="buildOutline"></ion-icon>
        </div>
        <h3>Aucune réparation</h3>
        <p v-if="selectedStatus === 'all'">Aucune réparation trouvée</p>
        <p v-else>Aucune réparation {{ getStatusText(selectedStatus) }}</p>
        <ion-button fill="solid" @click="createRepair">
          <ion-icon :icon="addOutline" slot="start"></ion-icon>
          Nouvelle demande
        </ion-button>
      </div>

      <!-- Repairs list -->
      <div v-else class="repairs-container">
        <div class="repairs-grid">
          <div 
            v-for="repair in filteredRepairs" 
            :key="repair.id"
            class="repair-card"
            @click="viewRepair(repair)"
          >
            <div class="repair-header">
              <div class="repair-icon">
                <ion-icon :icon="buildOutline"></ion-icon>
              </div>
              <div class="repair-actions">
                <ion-button fill="clear" size="small" @click.stop="startRepair(repair.id!)">
                  <ion-icon :icon="playOutline"></ion-icon>
                </ion-button>
              </div>
            </div>
            <div class="repair-content">
              <h3>{{ getCarName(repair.carId) }}</h3>
              <p class="repair-description">{{ repair.interventionName }}</p>
              <div class="repair-meta">
                <span class="repair-status" :class="repair.status">
                  {{ getStatusText(repair.status) }}
                </span>
                <span class="repair-date">{{ formatDate(repair.startedAt) }}</span>
                <span class="repair-intervention" v-if="repair.interventionName">
                  {{ repair.interventionName }}
                </span>
              </div>
              <div class="repair-cost" v-if="repair.interventionPrice">
                <ion-icon :icon="cashOutline"></ion-icon>
                Prix: {{ repair.interventionPrice }}€
              </div>
              <div class="repair-duration" v-if="repair.interventionDuration">
                <ion-icon :icon="buildOutline"></ion-icon>
                Durée: {{ Math.round(repair.interventionDuration / 60) }} minutes
              </div>
            </div>
            <div class="repair-footer">
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Repair Modal -->
      <ion-modal :is-open="isCreateModalOpen" @will-dismiss="closeCreateModal" class="modern-modal">
        <ion-header class="modern-header">
          <ion-toolbar>
            <ion-title class="modern-title">Nouvelle demande de réparation</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="closeCreateModal">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content class="modern-content">
          <div class="form-container">
            <form @submit.prevent="submitRepair">
              <div class="form-group">
                <ion-label class="form-label">Voiture</ion-label>
                <ion-select v-model="repairForm.carId" placeholder="Sélectionnez une voiture" required class="modern-select">
                  <ion-select-option 
                    v-for="car in cars" 
                    :key="car.id" 
                    :value="car.id"
                  >
                    {{ car.brand }} {{ car.model }} ({{ car.licensePlate }})
                  </ion-select-option>
                </ion-select>
              </div>

              <div class="form-group">
                <ion-label class="form-label">Type d'intervention</ion-label>
                <ion-select v-model="repairForm.interventionId" placeholder="Choisir une intervention" required class="modern-select">
                  <ion-select-option 
                    v-for="intervention in interventions" 
                    :key="intervention.id" 
                    :value="intervention.id"
                  >
                    {{ intervention.name }} - {{ intervention.price }}€
                  </ion-select-option>
                </ion-select>
              </div>

              <div class="form-group">
                <ion-label class="form-label">Description du problème</ion-label>
                <ion-textarea 
                  v-model="repairForm.description" 
                  placeholder="Décrivez en détail le problème rencontré..."
                  required
                  class="modern-textarea"
                  :rows="4"
                ></ion-textarea>
              </div>

              <div class="form-group">
                <ion-label class="form-label">Photos (optionnel)</ion-label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  @change="handlePhotoUpload"
                  ref="fileInput"
                  class="modern-input"
                />
              </div>

              <!-- Photo preview -->
              <div v-if="photoPreviews.length > 0" class="photo-preview">
                <div class="photo-grid">
                  <div 
                    v-for="(photo, index) in photoPreviews" 
                    :key="index"
                    class="photo-item"
                  >
                    <img :src="photo" :alt="`Photo ${index + 1}`" />
                    <ion-button 
                      fill="clear" 
                      size="small" 
                      class="remove-photo"
                      @click="removePhoto(index)"
                    >
                      <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <ion-button fill="outline" @click="closeCreateModal">
                  Annuler
                </ion-button>
                <ion-button fill="solid" type="submit" :disabled="submitting">
                  <ion-icon v-if="submitting" :icon="carOutline" class="saving-car"></ion-icon>
                  <span v-else>Envoyer la demande</span>
                </ion-button>
              </div>
            </form>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  toastController
} from '@ionic/vue'
import { 
  addOutline,
  closeOutline,
  chevronForwardOutline, 
  buildOutline,
  carOutline,
  cashOutline,
  refreshOutline,
  playOutline
} from 'ionicons/icons'
import { authService } from '@/services/auth.service'
import { carService, type Car } from '@/services/car.service'
import { RealtimeService, type RealtimeRepair } from '@/services/realtime.service'
import { interventionService, type Intervention } from '@/services/intervention.service'
import { repairService, RepairStatus } from '@/services/repair.service'
import CarLoadingSpinner from '@/components/CarLoadingSpinner.vue'


const loading = ref(true)
const submitting = ref(false)
const isCreateModalOpen = ref(false)
const selectedStatus = ref('all')
const repairs = ref<RealtimeRepair[]>([])
const cars = ref<Car[]>([])
const interventions = ref<Intervention[]>([])
const fileInput = ref<HTMLInputElement>()
const photoFiles = ref<File[]>([])
const photoPreviews = ref<string[]>([])

const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'bottom'
  })
  await toast.present()
}

const formatDate = (timestamp: any): string => {
  // Pour Realtime Database, le timestamp peut être un nombre ou null
  if (!timestamp) {
    return 'Date inconnue'
  }
  
  const date = new Date(timestamp)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    day: 'numeric',
    month: 'numeric'
  })
}

const repairForm = reactive({
  carId: '',
  description: '',
  interventionId: null as number | null
})

const filteredRepairs = computed(() => {
  if (selectedStatus.value === 'all') {
    return repairs.value
  }
  return repairs.value.filter(repair => repair.status === selectedStatus.value)
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) return

    // Charger les voitures, les réparations depuis Realtime DB et les interventions en parallèle
    const [carsData, repairsData, interventionsData] = await Promise.all([
      carService.getUserCars(currentUser.uid),
      RealtimeService.getUserRepairs(currentUser.uid), // Utiliser Realtime DB
      interventionService.getActiveInterventions()
    ])

    cars.value = carsData
    repairs.value = repairsData
    interventions.value = interventionsData

    console.log('Réparations chargées depuis Realtime DB:', repairsData.length)

  } catch (error: any) {
    showToast('Erreur lors du chargement des données: ' + error.message, 'danger')
    console.error('Erreur détaillée:', error)
  } finally {
    loading.value = false
  }
}

const filterRepairs = () => {
  // Le filtrage est géré par la computed property
}

const createRepair = () => {
  if (cars.value.length === 0) {
    showToast('Veuillez d\'abord ajouter une voiture', 'warning')
    return
  }
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
  resetForm()
}

const resetForm = () => {
  repairForm.carId = ''
  repairForm.description = ''
  repairForm.interventionId = null
  photoFiles.value = []
  photoPreviews.value = []
}

const handlePhotoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      photoFiles.value.push(file)
      
      // Créer un aperçu
      const reader = new FileReader()
      reader.onload = (e) => {
        photoPreviews.value.push(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  })
}

const removePhoto = (index: number) => {
  photoFiles.value.splice(index, 1)
  photoPreviews.value.splice(index, 1)
}

const refreshData = async () => {
  await loadData()
  showToast('Données actualisées', 'success')
}

const startRepair = async (repairId: string) => {
  try {
    await RealtimeService.startRepair(repairId) // Utiliser RealtimeService
    showToast('Réparation démarrée', 'success')
    await loadData()
  } catch (error: any) {
    showToast('Erreur lors du démarrage: ' + error.message, 'danger')
  }
}

const submitRepair = async () => {
  if (!validateForm()) return

  submitting.value = true

  try {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) throw new Error('Utilisateur non connecté')

    // Trouver l'intervention sélectionnée
    const selectedIntervention = interventions.value.find(i => i.id === repairForm.interventionId)
    
    // Créer la réparation avec les champs pour Laravel API
    const repairId = await repairService.createRepair({
      userId: currentUser.uid,
      carId: repairForm.carId,
      description: repairForm.description.trim(),
      photos: [],
      status: RepairStatus.PENDING,
      estimatedCost: selectedIntervention ? parseFloat(selectedIntervention.price) : 0,
      // Champs pour l'API Laravel
      interventionId: repairForm.interventionId || undefined,
      interventionName: selectedIntervention?.name || '',
      interventionPrice: selectedIntervention?.price || '0',
      interventionDuration: selectedIntervention?.duration_seconds || 0
    })

    // Uploader les photos si présentes
    if (photoFiles.value.length > 0) {
      const photoUrls = await repairService.uploadPhotos(repairId, photoFiles.value)
      
      // Mettre à jour la réparation avec les URLs des photos
      await repairService.updateRepairStatus(repairId, RepairStatus.PENDING, {
        photos: photoUrls
      })
    }

    showToast('Demande de réparation envoyée avec succès', 'success')
    await loadData()
    closeCreateModal()

  } catch (error: any) {
    showToast(error.message, 'danger')
  } finally {
    submitting.value = false
  }
}

const validateForm = (): boolean => {
  if (!repairForm.carId) {
    showToast('Veuillez sélectionner une voiture', 'danger')
    return false
  }

  if (!repairForm.interventionId) {
    showToast('Veuillez sélectionner une intervention', 'danger')
    return false
  }

  if (!repairForm.description.trim()) {
    showToast('Veuillez décrire la panne', 'danger')
    return false
  }

  return true
}

const viewRepair = (repair: RealtimeRepair) => {
  // TODO: Naviguer vers la page de détail de la réparation
  // this.$router.push(`/tabs/repairs/${repair.id}`)
  console.log('View repair:', repair.id)
}

const showPhoto = (photo: string) => {
  window.open(photo, '_blank')
}

const getCarName = (carId: string): string => {
  const car = cars.value.find(c => c.id === carId)
  return car ? `${car.brand} ${car.model}` : 'Voiture inconnue'
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'warning'
    case 'in_progress': return 'primary'
    case 'completed': return 'success'
    case 'cancelled': return 'danger'
    case 'halfway': return 'secondary'
    default: return 'medium'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return 'en attente'
    case 'in_progress': return 'en cours'
    case 'completed': return 'terminée'
    case 'cancelled': return 'annulée'
    case 'halfway': return 'mi-parcours'
    default: return 'inconnue'
  }
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

/* Content Modern */
.modern-content {
  --background: linear-gradient(to bottom, #f8fafc, #ffffff);
  padding: 0;
}

/* Filter Container */
.filter-container {
  padding: 20px;
  background: white;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.modern-segment {
  --background: rgba(59, 130, 246, 0.08);
  --border-radius: 12px;
}

.modern-segment ion-segment-button {
  --color: #64748b;
  --color-checked: #3b82f6;
  --background: transparent;
  --background-checked: rgba(59, 130, 246, 0.1);
  --border-radius: 8px;
  font-weight: 500;
}

/* Loading State */
.loading-container {
  padding: 60px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.loading-card ion-spinner {
  margin-bottom: 20px;
  color: #3b82f6;
}

.loading-card p {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
}

/* Empty State */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  background: white;
  margin: 20px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
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

/* Repairs Container */
.repairs-container {
  padding: 0 20px 20px;
}

.repairs-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.repair-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.repair-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.repair-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
}

.repair-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.repair-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.repair-icon ion-icon {
  font-size: 1.5rem;
}

.repair-actions ion-button {
  --color: #10b981;
}

.repair-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
}

.repair-description {
  margin: 0 0 12px 0;
  color: #64748b;
  line-height: 1.4;
}

.repair-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
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

.repair-status.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.repair-date, .repair-intervention {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 8px;
}

.repair-cost {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #10b981;
  margin-bottom: 8px;
}

.repair-duration {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #3b82f6;
}

.repair-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.repair-footer ion-icon {
  font-size: 1.2rem;
  color: #94a3b8;
  transition: transform 0.3s ease;
}

.repair-card:hover .repair-footer ion-icon {
  transform: translateX(4px);
}

/* Modal Modern */
.modern-modal {
  --background: rgba(0, 0, 0, 0.5);
}

.form-container {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.modern-input, .modern-select, .modern-textarea {
  --background: rgb(116, 215, 232);
  --border-color: rgba(179, 76, 76, 0.1);
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  --highlight-color-focused: #3b82f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.modern-input:focus, .modern-select:focus, .modern-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.form-actions ion-button {
  flex: 1;
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 500;
}

.form-actions ion-button[fill="solid"] {
  --background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}

.form-actions ion-button[fill="outline"] {
  --border-color: #3b82f6;
  --color: #3b82f6;
}

/* Photo Preview */
.photo-preview {
  margin-top: 20px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.photo-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f1f5f9;
  aspect-ratio: 1;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo {
  position: absolute;
  top: 4px;
  right: 4px;
  --color: #ef4444;
  --background: rgba(255, 255, 255, 0.9);
  --border-radius: 50%;
  width: 24px;
  height: 24px;
}

/* Animations */
.loading-container {
  animation: fadeIn 0.6s ease-out;
}

.empty-state {
  animation: slideInUp 0.6s ease-out;
}

.repair-card {
  animation: slideInUp 0.6s ease-out;
}

.repair-card:nth-child(1) { animation-delay: 0.1s; }
.repair-card:nth-child(2) { animation-delay: 0.2s; }
.repair-card:nth-child(3) { animation-delay: 0.3s; }
.repair-card:nth-child(4) { animation-delay: 0.4s; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
  .filter-container {
    padding: 16px;
  }
  
  .repairs-container {
    padding: 0 16px 16px;
  }
  
  .repair-card {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .empty-state {
    margin: 16px;
    padding: 40px 20px;
  }
}

@media (min-width: 768px) {
  .repairs-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

/* Animation pour la voiture dans le bouton de soumission */
.saving-car {
  animation: driveCar 1s ease-in-out infinite;
  color: var(--ion-color-primary-contrast);
}

@keyframes driveCar {
  0%, 100% {
    transform: translateX(0) scale(1);
  }
  25% {
    transform: translateX(2px) scale(1.05);
  }
  50% {
    transform: translateX(-1px) scale(0.95);
  }
  75% {
    transform: translateX(1px) scale(1.02);
  }
}
</style>
