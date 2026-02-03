<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Test Ajout Voiture</ion-title>
        <ion-buttons slot="start">
          <ion-button @click="$router.back()">
            <ion-icon :icon="arrowBackOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div class="test-section">
        <h2>🚗 Test d'ajout de voiture</h2>
        
        <!-- Afficher l'utilisateur connecté -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Utilisateur connecté</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p><strong>ID:</strong> {{ user?.uid || user?.id }}</p>
            <p><strong>Email:</strong> {{ user?.email }}</p>
            <p><strong>Nom:</strong> {{ user?.displayName || 'Non défini' }}</p>
          </ion-card-content>
        </ion-card>

        <!-- Formulaire d'ajout rapide -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Ajouter une voiture de test</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <form @submit.prevent="addTestCar">
              <ion-item>
                <ion-label position="floating">Marque</ion-label>
                <ion-input 
                  v-model="testForm.brand" 
                  required
                  placeholder="Ex: Renault"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="floating">Modèle</ion-label>
                <ion-input 
                  v-model="testForm.model" 
                  required
                  placeholder="Ex: Clio"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="floating">Plaque d'immatriculation</ion-label>
                <ion-input 
                  v-model="testForm.licensePlate" 
                  required
                  placeholder="Ex: AB-123-CD"
                ></ion-input>
              </ion-item>

              <div class="ion-margin-top">
                <ion-button 
                  type="submit" 
                  expand="block" 
                  :disabled="loading"
                >
                  <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                  <span v-else>Ajouter la voiture de test</span>
                </ion-button>
              </div>
            </form>
          </ion-card-content>
        </ion-card>

        <!-- Liste des voitures existantes -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Vos voitures ({{ cars.length }})</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="loading" class="ion-text-center">
              <ion-spinner name="crescent"></ion-spinner>
              <p>Chargement...</p>
            </div>
            
            <div v-else-if="cars.length === 0" class="ion-text-center">
              <p>Aucune voiture trouvée</p>
            </div>
            
            <ion-list v-else>
              <ion-item v-for="car in cars" :key="car.id">
                <ion-label>
                  <h2>{{ car.brand }} {{ car.model }}</h2>
                  <p>{{ car.licensePlate }}</p>
                  <p v-if="car.year">{{ car.year }} • {{ car.color || 'Non spécifiée' }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Actions rapides -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Actions rapides</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button 
              fill="outline" 
              expand="block" 
              @click="addSampleCar"
              :disabled="loading"
            >
              Ajouter une voiture exemple
            </ion-button>
            
            <ion-button 
              fill="clear" 
              expand="block" 
              @click="$router.push('/tabs/cars')"
            >
              Voir la page complète des voitures
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonSpinner,
  toastController
} from '@ionic/vue'
import { arrowBackOutline } from 'ionicons/icons'
import { carService, type Car } from '@/services/car.service'

const loading = ref(false)
const user = ref<any>(null)
const cars = ref<Car[]>([])

const testForm = reactive({
  brand: 'Renault',
  model: 'Clio',
  licensePlate: 'TEST-123'
})

onMounted(async () => {
  await loadUser()
  await loadCars()
})

const loadUser = () => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (error) {
      console.error('Erreur parsing user from localStorage:', error)
    }
  }
}

const loadCars = async () => {
  if (!user.value) return
  
  loading.value = true
  try {
    cars.value = await carService.getUserCars(user.value.uid || user.value.id)
  } catch (error: any) {
    showToast('Erreur chargement voitures: ' + error.message, 'danger')
  } finally {
    loading.value = false
  }
}

const addTestCar = async () => {
  if (!user.value) {
    showToast('Utilisateur non connecté', 'danger')
    return
  }

  loading.value = true
  try {
    const carData = {
      userId: user.value.uid || user.value.id,
      brand: testForm.brand.trim(),
      model: testForm.model.trim(),
      licensePlate: testForm.licensePlate.trim().toUpperCase(),
      year: 2022,
      color: 'Bleu'
    }

    await carService.addCar(carData)
    showToast('Voiture de test ajoutée avec succès!', 'success')
    
    // Réinitialiser le formulaire
    testForm.licensePlate = 'TEST-' + Math.floor(Math.random() * 1000)
    
    // Recharger la liste
    await loadCars()
  } catch (error: any) {
    showToast(error.message, 'danger')
  } finally {
    loading.value = false
  }
}

const addSampleCar = async () => {
  if (!user.value) {
    showToast('Utilisateur non connecté', 'danger')
    return
  }

  loading.value = true
  try {
    const sampleCars = [
      { brand: 'Peugeot', model: '208', licensePlate: 'PEU-001', year: 2021, color: 'Blanc' },
      { brand: 'Citroën', model: 'C3', licensePlate: 'CIT-002', year: 2022, color: 'Gris' },
      { brand: 'Toyota', model: 'Yaris', licensePlate: 'TOY-003', year: 2023, color: 'Rouge' }
    ]
    
    const randomCar = sampleCars[Math.floor(Math.random() * sampleCars.length)]
    
    const carData = {
      userId: user.value.uid || user.value.id,
      ...randomCar,
      licensePlate: randomCar.licensePlate + '-' + Math.floor(Math.random() * 100)
    }

    await carService.addCar(carData)
    showToast(`${randomCar.brand} ${randomCar.model} ajoutée avec succès!`, 'success')
    
    await loadCars()
  } catch (error: any) {
    showToast(error.message, 'danger')
  } finally {
    loading.value = false
  }
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
.test-section {
  max-width: 650px;
  margin: 0 auto;
  padding: 24px; /* Augmenté */
}

.test-section h2 {
  text-align: center;
  margin-bottom: 24px;
  color: var(--ion-color-primary);
}

ion-card {
  margin-bottom: 24px;
}

ion-item {
  margin-bottom: 12px; /* Augmenté */
}

/* Animation pour loading */
.ion-margin-top {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
