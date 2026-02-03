<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/repairs"></ion-back-button>
        </ion-buttons>
        <ion-title>Détail de la réparation</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des détails...</p>
      </div>

      <div v-else-if="repair">
        <!-- Informations générales -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ getCarName(repair.carId) }}</ion-card-title>
            <ion-card-subtitle>{{ formatDate(repair.createdAt) }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-chip :color="getStatusColor(repair.status)">
              {{ getStatusText(repair.status) }}
            </ion-chip>
          </ion-card-content>
        </ion-card>

        <!-- Description -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Description de la panne</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>{{ repair.description }}</p>
          </ion-card-content>
        </ion-card>

        <!-- Photos -->
        <ion-card v-if="repair.photos && repair.photos.length > 0">
          <ion-card-header>
            <ion-card-title>Photos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col size="6" v-for="(photo, index) in repair.photos" :key="index">
                  <img 
                    :src="photo" 
                    :alt="`Photo ${index + 1}`"
                    @click="showPhoto(photo)"
                    class="repair-photo"
                  />
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Diagnostic -->
        <ion-card v-if="repair.diagnosis">
          <ion-card-header>
            <ion-card-title>Diagnostic</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>{{ repair.diagnosis }}</p>
          </ion-card-content>
        </ion-card>

        <!-- Devis -->
        <ion-card v-if="repair.quote">
          <ion-card-header>
            <ion-card-title>Devis</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p v-if="repair.estimatedCost">
              <strong>Coût estimé : {{ repair.estimatedCost }}€</strong>
            </p>
            <ion-button 
              fill="outline" 
              @click="viewQuote"
              expand="block"
            >
              <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
              Voir le devis
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Coût final -->
        <ion-card v-if="repair.finalCost">
          <ion-card-header>
            <ion-card-title>Coût final</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <h2>{{ repair.finalCost }}€</h2>
            <p v-if="repair.completedAt">
              Payé le {{ formatDate(repair.completedAt) }}
            </p>
          </ion-card-content>
        </ion-card>

        <!-- Actions -->
        <ion-card v-if="repair.status === RepairStatus.COMPLETED && !repair.finalCost">
          <ion-card-header>
            <ion-card-title>Paiement</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button 
              expand="block" 
              color="success"
              @click="processPayment"
            >
              <ion-icon :icon="cardOutline" slot="start"></ion-icon>
              Payer la réparation
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <div v-else class="ion-text-center ion-padding">
        <p>Réparation non trouvée</p>
        <ion-button fill="clear" @click="$router.push('/tabs/repairs')">
          Retour aux réparations
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonSpinner,
  toastController,
  alertController
} from '@ionic/vue'
import { 
  documentTextOutline,
  cardOutline
} from 'ionicons/icons'
import { carService, type Car } from '@/services/car.service'
import { repairService, type Repair, RepairStatus } from '@/services/repair.service'
import { authService } from '@/services/auth.service'

const route = useRoute()
const loading = ref(true)
const repair = ref<Repair | null>(null)
const cars = ref<Car[]>([])

onMounted(async () => {
  await loadRepairDetail()
})

const loadRepairDetail = async () => {
  try {
    const repairId = route.params.id as string
    const currentUser = authService.getCurrentUser()
    
    if (!currentUser) {
      repair.value = null
      return
    }
    
    // Charger la réparation
    const repairData = await repairService.getRepairById(repairId)
    if (!repairData || repairData.userId !== currentUser.uid) {
      repair.value = null
      return
    }
    
    repair.value = repairData
    
    // Charger les voitures pour afficher le nom
    cars.value = await carService.getUserCars(currentUser.uid)
    
  } catch (error: any) {
    showToast('Erreur lors du chargement des détails: ' + error.message, 'danger')
  } finally {
    loading.value = false
  }
}

const getCarName = (carId: string): string => {
  const car = cars.value.find(c => c.id === carId)
  return car ? `${car.brand} ${car.model}` : 'Voiture inconnue'
}

const getStatusColor = (status: RepairStatus): string => {
  switch (status) {
    case RepairStatus.PENDING: return 'warning'
    case RepairStatus.IN_PROGRESS: return 'primary'
    case RepairStatus.COMPLETED: return 'success'
    case RepairStatus.CANCELLED: return 'danger'
    default: return 'medium'
  }
}

const getStatusText = (status: RepairStatus): string => {
  switch (status) {
    case RepairStatus.PENDING: return 'En attente'
    case RepairStatus.IN_PROGRESS: return 'En cours'
    case RepairStatus.COMPLETED: return 'Terminée'
    case RepairStatus.CANCELLED: return 'Annulée'
    default: return 'Inconnu'
  }
}

const formatDate = (timestamp: any): string => {
  const date = timestamp.toDate()
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showPhoto = (photoUrl: string) => {
  // Ouvrir la photo dans un modal ou nouvelle fenêtre
  window.open(photoUrl, '_blank')
}

const viewQuote = () => {
  if (repair.value?.quote) {
    window.open(repair.value.quote, '_blank')
  }
}

const processPayment = async () => {
  const alert = await alertController.create({
    header: 'Confirmer le paiement',
    message: `Confirmer le paiement de ${repair.value?.estimatedCost || 0}€ ?`,
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Payer',
        handler: async () => {
          // Simuler le processus de paiement
          showToast('Paiement en cours...', 'primary')
          
          setTimeout(async () => {
            try {
              if (repair.value?.id && repair.value.estimatedCost) {
                await repairService.completeRepair(repair.value.id, repair.value.estimatedCost)
                showToast('Paiement effectué avec succès', 'success')
                await loadRepairDetail()
              }
            } catch (error: any) {
              showToast('Erreur lors du paiement: ' + error.message, 'danger')
            }
          }, 2000)
        }
      }
    ]
  })

  await alert.present()
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
.repair-photo {
  width: 100%;
  height: 160px; /* Augmenté */
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.repair-photo:hover {
  transform: scale(1.05);
}

ion-card {
  margin-bottom: 24px; /* Espacement augmenté */
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

ion-card h2 {
  margin: 0;
  color: var(--ion-color-success);
  font-size: 26px; /* Plus grand */
}

/* Animation pour loading */
.ion-text-center.ion-padding {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>