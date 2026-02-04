<template>
  <ion-page>
    <ion-header :translucent="true" class="modern-header">
      <ion-toolbar>
        <ion-title class="modern-title">Mes voitures</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="addCar">
            <ion-icon :icon="addOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="modern-content">
      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loading-card">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Chargement de vos voitures...</p>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="cars.length === 0" class="empty-state">
        <div class="empty-icon">
          <ion-icon :icon="carOutline"></ion-icon>
        </div>
        <h3>Aucune voiture</h3>
        <p>Ajoutez votre première voiture pour commencer à gérer votre garage</p>
        <ion-button fill="solid" @click="addCar">
          <ion-icon :icon="addOutline" slot="start"></ion-icon>
          Ajouter une voiture
        </ion-button>
      </div>

      <!-- Cars list -->
      <div v-else class="cars-container">
        <div class="cars-grid">
          <div 
            v-for="car in cars" 
            :key="car.id"
            class="car-card"
            @click="editCar(car)"
          >
            <div class="car-header">
              <div class="car-icon">
                <ion-icon :icon="carOutline"></ion-icon>
              </div>
              <div class="car-actions">
                <ion-button fill="clear" size="small" @click.stop="deleteCar(car.id)">
                  <ion-icon :icon="trashOutline"></ion-icon>
                </ion-button>
              </div>
            </div>
            <div class="car-content">
              <h3>{{ car.brand }} {{ car.model }}</h3>
              <p class="license-plate">{{ car.licensePlate }}</p>
              <div class="car-meta">
                <span class="car-year" v-if="car.year">{{ car.year }}</span>
                <span class="car-color" v-if="car.color">{{ car.color }}</span>
              </div>
            </div>
            <div class="car-footer">
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Car Modal -->
      <ion-modal :is-open="isModalOpen" @will-dismiss="closeModal" class="modern-modal">
        <ion-header class="modern-header">
          <ion-toolbar>
            <ion-title class="modern-title">{{ editingCar ? 'Modifier' : 'Ajouter' }} une voiture</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" @click="closeModal">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content class="modern-content">
          <div class="form-container">
            <form @submit.prevent="saveCar">
              <div class="form-group">
                <ion-label class="form-label">Marque</ion-label>
                <ion-input 
                  v-model="carForm.brand" 
                  required
                  placeholder="Ex: Renault"
                  class="modern-input"
                ></ion-input>
              </div>

              <div class="form-group">
                <ion-label class="form-label">Modèle</ion-label>
                <ion-input 
                  v-model="carForm.model" 
                  required
                  placeholder="Ex: Clio"
                  class="modern-input"
                ></ion-input>
              </div>

              <div class="form-group">
                <ion-label class="form-label">Plaque d'immatriculation</ion-label>
                <ion-input 
                  v-model="carForm.licensePlate" 
                  required
                  placeholder="Ex: AB-123-CD"
                  class="modern-input"
                ></ion-input>
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <ion-label class="form-label">Année</ion-label>
                  <ion-input 
                    v-model="carForm.year" 
                    type="number"
                    placeholder="2024"
                    class="modern-input"
                  ></ion-input>
                </div>

                <div class="form-group half">
                  <ion-label class="form-label">Couleur</ion-label>
                  <ion-input 
                    v-model="carForm.color" 
                    placeholder="Noir"
                    class="modern-input"
                  ></ion-input>
                </div>
              </div>

              <div class="form-actions">
                <ion-button fill="outline" @click="closeModal">
                  Annuler
                </ion-button>
                <ion-button fill="solid" type="submit" :disabled="saving">
                  <ion-spinner v-if="saving" name="crescent" size="small"></ion-spinner>
                  <span v-else>{{ editingCar ? 'Modifier' : 'Ajouter' }}</span>
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
import { ref, reactive, onMounted } from 'vue'
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonLabel,
  IonInput,
  IonSpinner,
  IonModal,
  toastController,
  alertController
} from '@ionic/vue'
import { 
  addOutline, 
  closeOutline,
  carOutline,
  trashOutline,
  chevronForwardOutline
} from 'ionicons/icons'
import { authService } from '@/services/auth.service'
import { carService, type Car } from '@/services/car.service'
import { RealtimeService } from '@/services/realtime.service'

const loading = ref(true)
const saving = ref(false)
const isModalOpen = ref(false)
const cars = ref<Car[]>([])
const editingCar = ref<Car | null>(null)

const carForm = reactive({
  brand: '',
  model: '',
  licensePlate: '',
  year: '',
  color: ''
})

onMounted(async () => {
  await loadCars()
  
  // Synchroniser les voitures existantes avec Realtime Database
  try {
    const storedUser = localStorage.getItem('user')
    let currentUser = null
    
    if (storedUser) {
      currentUser = JSON.parse(storedUser)
    } else {
      currentUser = authService.getCurrentUser()
    }
    
    if (currentUser) {
      await carService.syncUserCarsToRealtime(currentUser.uid || currentUser.id)
    }
  } catch (error) {
    console.warn('⚠️ Erreur synchronisation Realtime Database:', error)
  }
})

const loadCars = async () => {
  try {
    // Récupérer l'utilisateur depuis localStorage d'abord
    const storedUser = localStorage.getItem('user')
    let currentUser = null
    
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser)
      } catch (error) {
        console.error('Erreur parsing user from localStorage:', error)
      }
    }
    
    // Fallback vers Firebase Auth si localStorage est vide
    if (!currentUser) {
      currentUser = authService.getCurrentUser()
    }
    
    if (!currentUser) {
      showToast('Veuillez vous connecter pour voir vos voitures', 'warning')
      return
    }

    cars.value = await carService.getUserCars(currentUser.uid || currentUser.id)
  } catch (error: any) {
    showToast('Erreur lors du chargement des voitures: ' + error.message, 'danger')
  } finally {
    loading.value = false
  }
}

const addCar = () => {
  editingCar.value = null
  resetForm()
  isModalOpen.value = true
}

const editCar = (car: Car) => {
  editingCar.value = car
  carForm.brand = car.brand
  carForm.model = car.model
  carForm.licensePlate = car.licensePlate
  carForm.year = car.year?.toString() || ''
  carForm.color = car.color || ''
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  resetForm()
}

const resetForm = () => {
  carForm.brand = ''
  carForm.model = ''
  carForm.licensePlate = ''
  carForm.year = ''
  carForm.color = ''
}

const saveCar = async () => {
  if (!validateForm()) return

  saving.value = true

  try {
    // Récupérer l'utilisateur depuis localStorage d'abord
    const storedUser = localStorage.getItem('user')
    let currentUser = null
    
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser)
      } catch (error) {
        console.error('Erreur parsing user from localStorage:', error)
      }
    }
    
    // Fallback vers Firebase Auth si localStorage est vide
    if (!currentUser) {
      currentUser = authService.getCurrentUser()
    }
    
    if (!currentUser) {
      showToast('Utilisateur non connecté', 'danger')
      return
    }

    // Vérifier si la plaque d'immatriculation existe déjà
    const licensePlateExists = await carService.checkLicensePlateExists(
      currentUser.uid || currentUser.id, 
      carForm.licensePlate.trim().toUpperCase(),
      editingCar.value?.id
    )
    
    if (licensePlateExists) {
      showToast('Cette plaque d\'immatriculation existe déjà', 'danger')
      return
    }

    const carData = {
      userId: currentUser.uid || currentUser.id,
      brand: carForm.brand.trim(),
      model: carForm.model.trim(),
      licensePlate: carForm.licensePlate.trim().toUpperCase(),
      year: carForm.year ? parseInt(carForm.year) : undefined,
      color: carForm.color.trim() || undefined
    }

    if (editingCar.value) {
      // Modifier la voiture existante
      await carService.updateCar(editingCar.value.id!, carData)
      showToast('Voiture modifiée avec succès', 'success')
    } else {
      // Ajouter une nouvelle voiture
      await carService.addCar(carData)
      showToast('Voiture ajoutée avec succès', 'success')
    }

    await loadCars()
    closeModal()

  } catch (error: any) {
    showToast(error.message, 'danger')
  } finally {
    saving.value = false
  }
}

const deleteCar = async (carId?: string) => {
  const carToDelete = carId ? cars.value.find(c => c.id === carId) : editingCar.value
  if (!carToDelete) return

  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: `Êtes-vous sûr de vouloir supprimer ${carToDelete.brand} ${carToDelete.model} ?`,
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Supprimer',
        role: 'destructive',
        handler: async () => {
          try {
            await carService.deleteCar(carToDelete.id!)
            showToast('Voiture supprimée avec succès', 'success')
            await loadCars()
            if (!carId) closeModal()
          } catch (error: any) {
            showToast(error.message, 'danger')
          }
        }
      }
    ]
  })

  await alert.present()
}

const validateForm = (): boolean => {
  if (!carForm.brand.trim()) {
    showToast('Veuillez entrer une marque', 'danger')
    return false
  }

  if (!carForm.model.trim()) {
    showToast('Veuillez entrer un modèle', 'danger')
    return false
  }

  if (!carForm.licensePlate.trim()) {
    showToast('Veuillez entrer une plaque d\'immatriculation', 'danger')
    return false
  }

  return true
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
  --background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%);
  --border-color: transparent;
}

.modern-title {
  color: white;
  font-weight: 600;
  font-size: 1.3rem;
}

/* Content Modern */
.modern-content {
  --background: linear-gradient(to bottom, #f8f9fa, #c9d8de);
  padding: 0;
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
  color: var(--ion-color-primary);
}

.loading-card p {
  margin: 0;
  color: var(--ion-color-medium);
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
  color: var(--ion-color-medium);
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.empty-state p {
  margin: 0 0 24px 0;
  color: var(--ion-color-medium);
  font-size: 1rem;
  line-height: 1.5;
}

/* Cars Container */
.cars-container {
  padding: 0 20px 20px;
}

.cars-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.car-card {
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

.car-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.car-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--ion-color-primary), var(--ion-color-secondary));
}

.car-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.car-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.car-icon ion-icon {
  font-size: 1.5rem;
}

.car-actions ion-button {
  --color: var(--ion-color-danger);
}

.car-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.license-plate {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--ion-color-primary);
  background: rgba(102, 126, 234, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-block;
}

.car-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.car-year, .car-color {
  font-size: 0.85rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
  background: var(--ion-color-light);
  color: var(--ion-color-medium);
}

.car-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.car-footer ion-icon {
  font-size: 1.2rem;
  color: var(--ion-color-medium);
  transition: transform 0.3s ease;
}

.car-card:hover .car-footer ion-icon {
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
  color: rgb(17, 91, 93);
  font-size: 0.9rem;
}

.modern-input {
  --background: rgb(17, 91, 93);
  --border-color: rgba(0, 0, 0, 0.1);
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  --highlight-color-focused: var(--ion-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.modern-input:focus {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group.half {
  margin-bottom: 0;
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

/* Animations */
.loading-container {
  animation: fadeIn 0.6s ease-out;
}

.empty-state {
  animation: slideInUp 0.6s ease-out;
}

.car-card {
  animation: slideInUp 0.6s ease-out;
}

.car-card:nth-child(1) { animation-delay: 0.1s; }
.car-card:nth-child(2) { animation-delay: 0.2s; }
.car-card:nth-child(3) { animation-delay: 0.3s; }
.car-card:nth-child(4) { animation-delay: 0.4s; }

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
  .cars-container {
    padding: 0 16px 16px;
  }
  
  .car-card {
    padding: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .form-group.half {
    margin-bottom: 20px;
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
  .cars-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

.empty-state {
  margin: 16px;
  padding: 40px 20px;
}

@media (min-width: 768px) {
  .cars-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

.empty-state {
  margin: 16px;
  padding: 40px 20px;
}

@media (min-width: 768px) {
  .cars-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
</style>