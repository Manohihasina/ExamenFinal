<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Nouvelle Réparation</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Test simple pour voir si la page se charge -->
      <div style="background: yellow; padding: 20px; margin: 10px;">
        <h2>🧪 TEST - La page se charge bien !</h2>
        <p>userCars.length: {{ userCars.length }}</p>
        <p>loadingCars: {{ loadingCars }}</p>
        <p>selectedCarId: {{ selectedCarId }}</p>
      </div>

      <form @submit.prevent="submitRepair">
        <!-- Sélection de la voiture -->
        <ion-item>
          <ion-label position="stacked">Voiture à réparer</ion-label>
          <ion-select 
            v-model="selectedCarId" 
            placeholder="Choisir une voiture"
            :disabled="loadingCars"
          >
            <ion-select-option 
              v-for="car in userCars" 
              :key="car.id" 
              :value="car.id"
            >
              {{ car.brand }} {{ car.model }} - {{ car.licensePlate }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Sélection de l'intervention -->
        <ion-item>
          <ion-label position="stacked">Type d'intervention</ion-label>
          <ion-select 
            v-model="selectedInterventionId" 
            placeholder="Choisir une intervention"
            :disabled="loadingInterventions"
          >
            <ion-select-option 
              v-for="intervention in interventions" 
              :key="intervention.id" 
              :value="intervention.id"
            >
              {{ intervention.name }} - {{ intervention.price }}€
            </ion-select-option>
          </ion-select>
        </ion-item>

        <!-- Description du problème -->
        <ion-item>
          <ion-label position="stacked">Description du problème</ion-label>
          <ion-textarea 
            v-model="description"
            placeholder="Décrivez le problème rencontré..."
            :auto-grow="true"
          ></ion-textarea>
        </ion-item>

        <!-- Affichage des détails de l'intervention sélectionnée -->
        <div v-if="selectedIntervention" class="intervention-details">
          <ion-card>
            <ion-card-header>
              <ion-card-title>{{ selectedIntervention.name }}</ion-card-title>
              <ion-card-subtitle>{{ selectedIntervention.price }}€</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <p>{{ selectedIntervention.description }}</p>
              <p><strong>Durée estimée:</strong> {{ formatDuration(selectedIntervention.duration_seconds) }}</p>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Bouton de soumission -->
        <ion-button 
          type="submit" 
          expand="block" 
          :disabled="!canSubmit || submitting"
          class="ion-margin-top"
        >
          <ion-spinner v-if="submitting" name="crescent"></ion-spinner>
          <span v-else>Créer la demande de réparation</span>
        </ion-button>
      </form>

      <!-- Messages d'erreur -->
      <ion-toast
        :is-open="showErrorToast"
        :message="errorMessage"
        :duration="3000"
        @didDismiss="showErrorToast = false"
        color="danger"
      ></ion-toast>

      <!-- Message de succès -->
      <ion-toast
        :is-open="showSuccessToast"
        message="Demande de réparation créée avec succès!"
        :duration="3000"
        @didDismiss="showSuccessToast = false"
        color="success"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSpinner,
  IonToast,
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { carService, type Car } from '@/services/car.service'
import { interventionService, type Intervention } from '@/services/intervention.service'
import { repairService, RepairStatus } from '@/services/repair.service'
import { authService } from '@/services/auth.service'
import { 
  collection,
  query,
  getDocs
} from 'firebase/firestore'
import { db } from '@/firebase/config-simple'

const router = useRouter()

// État du formulaire
const selectedCarId = ref<string>('')
const selectedInterventionId = ref<number | null>(null)
const description = ref<string>('')

// États de chargement
const loadingCars = ref(true)
const loadingInterventions = ref(true)
const submitting = ref(false)

// Données
const userCars = ref<Car[]>([])
const interventions = ref<Intervention[]>([])

// Messages
const showErrorToast = ref(false)
const showSuccessToast = ref(false)
const errorMessage = ref('')

// Computed properties
const selectedCar = computed(() => 
  userCars.value.find(car => car.id === selectedCarId.value)
)

const selectedIntervention = computed(() => 
  interventions.value.find(intervention => intervention.id === selectedInterventionId.value) || null
)

const canSubmit = computed(() => {
  return selectedCarId.value && 
         selectedInterventionId.value && 
         description.value.trim() &&
         !submitting.value
})

// Méthodes
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ' ' + minutes + 'min' : ''}`
  }
  return `${minutes} min`
}

// Test temporaire - vérifier toutes les voitures dans Firestore
// const testAllCars = async () => {
//   try {
//     console.log('🧪 Test de toutes les voitures dans Firestore...')
//     const allCarsQuery = query(collection(db, 'garage'))
//     const querySnapshot = await getDocs(allCarsQuery)
//     const allCars: any[] = []
    
//     querySnapshot.forEach((doc) => {
//       allCars.push({ id: doc.id, ...doc.data() })
//     })
    
//     console.log('🧪 Toutes les voitures dans Firestore:', allCars)
//     console.log('🧪 Nombre total de voitures:', allCars.length)
//   } catch (error) {
//     console.error('🧪 Erreur lors du test de toutes les voitures:', error)
//   }
// }

const loadUserCars = async () => {
  try {
    loadingCars.value = true
    console.log('🔍 Début chargement des voitures...')
    
    // Test simple : est-ce qu'on peut accéder à Firestore ?
    try {
      const testQuery = query(collection(db, 'garage'))
      const testSnapshot = await getDocs(testQuery)
      console.log('🧪 Test Firestore OK - nombre de documents:', testSnapshot.size)
      
      if (testSnapshot.size === 0) {
        console.warn('⚠️ La collection garage est vide!')
        userCars.value = []
        return
      }
    } catch (firestoreError) {
      console.error('❌ Erreur accès Firestore:', firestoreError)
      throw new Error('Impossible d\'accéder à la base de données')
    }
    
    // Récupérer toutes les voitures
    const allCarsQuery = query(collection(db, 'garage'))
    const allQuerySnapshot = await getDocs(allCarsQuery)
    const allCars: any[] = []
    
    allQuerySnapshot.forEach((doc) => {
      allCars.push({ id: doc.id, ...doc.data() })
    })
    
    console.log('🧪 Toutes les voitures trouvées:', allCars.length)
    console.log('🧪 Détail:', allCars)
    
    // Pour le test : utiliser la première voiture si aucune n'est trouvée pour l'utilisateur
    if (allCars.length > 0) {
      console.log('✅ Utilisation de la première voiture disponible pour le test')
      userCars.value = [allCars[0]]
      
      // Pré-sélectionner cette voiture
      selectedCarId.value = allCars[0].id
      console.log('🚗 Voiture pré-sélectionnée:', allCars[0])
    } else {
      console.warn('⚠️ Aucune voiture trouvée du tout')
      userCars.value = []
    }
    
  } catch (error) {
    console.error('❌ Erreur complète:', error)
    errorMessage.value = 'Erreur: ' + (error as Error).message
    showErrorToast.value = true
  } finally {
    loadingCars.value = false
  }
}

const loadInterventions = async () => {
  try {
    loadingInterventions.value = true
    console.log('🔧 Début chargement des interventions...')
    
    interventions.value = await interventionService.getActiveInterventions()
    console.log('✅ Interventions chargées:', interventions.value.length)
  } catch (error) {
    console.error('❌ Erreur lors du chargement des interventions:', error)
    console.warn('⚠️ Continuation sans interventions - utilisation d\'un fallback')
    
    // Ne pas afficher d'erreur bloquante, juste un warning
    interventions.value = []
    
    // Optionnel : afficher un toast non bloquant
    // errorMessage.value = 'Impossible de charger les interventions disponibles'
    // showErrorToast.value = true
  } finally {
    loadingInterventions.value = false
  }
}

const submitRepair = async () => {
  if (!canSubmit.value) return
  
  try {
    submitting.value = true
    
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
      throw new Error('Utilisateur non connecté')
    }
    
    if (!selectedCar.value || !selectedIntervention.value) {
      throw new Error('Veuillez sélectionner une voiture et une intervention')
    }
    
    // Créer la demande de réparation
    const repairData = {
      userId: currentUser.uid || currentUser.id,
      carId: selectedCarId.value,
      description: description.value.trim(),
      photos: [],
      status: RepairStatus.PENDING,
      estimatedCost: selectedIntervention.value ? parseFloat(selectedIntervention.value.price) : 0,
      // Ajouter les champs pour l'API Laravel
      interventionId: selectedInterventionId.value || undefined,
      interventionName: selectedIntervention.value?.name || '',
      interventionPrice: selectedIntervention.value?.price || '0',
      interventionDuration: selectedIntervention.value?.duration_seconds || 0
    }
    
    const repairId = await repairService.createRepair(repairData)
    
    // Afficher le message de succès
    showSuccessToast.value = true
    
    // Rediriger vers la page de détails de la réparation
    setTimeout(() => {
      router.push(`/tabs/repairs/${repairId}`)
    }, 1000)
    
  } catch (error) {
    console.error('Erreur lors de la création de la réparation:', error)
    errorMessage.value = 'Erreur lors de la création de la demande de réparation'
    showErrorToast.value = true
  } finally {
    submitting.value = false
  }
}

    // Cycle de vie
onMounted(async () => {
  console.log('🚀 AddRepairPage montée - début du chargement')
  try {
    // Charger les voitures d'abord (essentiel)
    await loadUserCars()
    console.log('✅ Voitures chargées')
    
    // Puis charger les interventions (non bloquant)
    await loadInterventions()
    console.log('✅ Interventions chargées')
    
    console.log('✅ AddRepairPage - chargement terminé')
  } catch (error) {
    console.error('❌ AddRepairPage - erreur lors du chargement:', error)
  }
})
</script>

<style scoped>
.intervention-details {
  margin-top: 20px;
}

ion-card {
  margin: 10px 0;
}

ion-textarea {
  min-height: 100px;
}
</style>
