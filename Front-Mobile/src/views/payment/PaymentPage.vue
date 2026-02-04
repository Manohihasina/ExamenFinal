<template>
  <ion-page>
    <ion-header :translucent="true" class="modern-header">
      <ion-toolbar>
        <ion-title class="modern-title">Paiements</ion-title>
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
        <CarLoadingSpinner message="Chargement des paiements..." />
      </div>

      <div v-else class="container">
        <!-- Payment Summary -->
        <div class="payment-summary">
          <h2>Résumé du Paiement</h2>
          <div class="summary-card">
            <div class="summary-item">
              <span>Total à payer:</span>
              <span class="total-amount">{{ totalAmount }}€</span>
            </div>
            <div class="summary-item">
              <span>Réparations en attente:</span>
              <span>{{ pendingRepairs.length }}</span>
            </div>
          </div>
        </div>

        <!-- Pending Payments -->
        <div class="pending-payments">
          <h3>Réparations en attente de paiement</h3>
          <div class="payments-list" v-if="pendingRepairs.length > 0">
            <div 
              v-for="repair in pendingRepairs" 
              :key="repair.id"
              class="payment-item"
            >
              <div class="repair-info">
                <h4>{{ repair.interventionName }}</h4>
                <p>{{ repair.carName }} • {{ repair.carModel }}</p>
                <span class="repair-date">{{ formatDate(repair.completedAt) }}</span>
              </div>
              <div class="repair-amount">
                <span class="amount">{{ repair.interventionPrice }}€</span>
                <ion-button 
                  fill="clear" 
                  size="small"
                  @click="selectRepairForPayment(repair)"
                >
                  Payer
                </ion-button>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div class="empty-state" v-else>
            <ion-icon :icon="cardOutline" size="large" color="medium" />
            <h4>Aucun paiement en attente</h4>
            <p>Toutes vos réparations ont été payées</p>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="payment-methods" v-if="selectedRepair">
          <h3>Méthode de paiement</h3>
          <div class="methods-list">
            <div 
              v-for="method in paymentMethods" 
              :key="method.id"
              class="method-item"
              :class="{ 'selected': selectedMethod?.id === method.id }"
              @click="selectPaymentMethod(method)"
            >
              <div class="method-icon">
                <ion-icon :icon="method.icon" />
              </div>
              <div class="method-info">
                <h4>{{ method.name }}</h4>
                <p>{{ method.description }}</p>
              </div>
              <div class="method-radio">
                <ion-radio 
                  :value="method.id" 
                  :checked="selectedMethod?.id === method.id"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Action -->
        <div class="payment-action" v-if="selectedRepair && selectedMethod">
          <ion-button 
            expand="block" 
            size="large"
            @click="processPayment"
            :disabled="processing"
          >
            <ion-icon :icon="processing ? carOutline : cardOutline" :class="processing ? 'saving-car' : ''" slot="start" />
            {{ processing ? 'Traitement...' : `Payer ${selectedRepair.interventionPrice}€` }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonRadio,
  IonButtons,
} from '@ionic/vue';
import {
  cardOutline,
  cardSharp,
  walletOutline,
  cashOutline,
  businessOutline,
  checkmarkCircleOutline,
  refreshOutline,
  carOutline,
} from 'ionicons/icons';
import { toastController } from '@ionic/vue';
import CarLoadingSpinner from '@/components/CarLoadingSpinner.vue';

interface Repair {
  id: string;
  interventionName: string;
  interventionPrice: number;
  carName: string;
  carModel: string;
  completedAt: Date;
  status: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const pendingRepairs = ref<Repair[]>([]);
const selectedRepair = ref<Repair | null>(null);
const selectedMethod = ref<PaymentMethod | null>(null);
const processing = ref(false);
const loading = ref(true);

const paymentMethods: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Carte bancaire',
    description: 'Payer avec votre carte Visa/Mastercard',
    icon: cardSharp
  },
  {
    id: 'wallet',
    name: 'Portefeuille',
    description: 'Utiliser votre solde disponible',
    icon: walletOutline
  },
  {
    id: 'cash',
    name: 'Espèces',
    description: 'Payer en espèces au garage',
    icon: cashOutline
  },
  {
    id: 'insurance',
    name: 'Assurance',
    description: 'Payer via votre assurance auto',
    icon: businessOutline
  }
];

const totalAmount = computed(() => {
  return pendingRepairs.value.reduce((total, repair) => total + repair.interventionPrice, 0);
});

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const selectRepairForPayment = (repair: Repair) => {
  selectedRepair.value = repair;
  selectedMethod.value = null; // Reset payment method
};

const selectPaymentMethod = (method: PaymentMethod) => {
  selectedMethod.value = method;
};

const processPayment = async () => {
  if (!selectedRepair.value || !selectedMethod.value) return;

  processing.value = true;

  try {
    // Simuler le traitement du paiement
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Afficher le succès
    const toast = await toastController.create({
      message: `Paiement de ${selectedRepair.value.interventionPrice}€ effectué avec succès!`,
      duration: 3000,
      color: 'success',
      icon: checkmarkCircleOutline,
      position: 'top'
    });
    await toast.present();

    // Retirer la réparation de la liste
    pendingRepairs.value = pendingRepairs.value.filter(r => r.id !== selectedRepair.value?.id);
    
    // Réinitialiser la sélection
    selectedRepair.value = null;
    selectedMethod.value = null;

  } catch (error) {
    const toast = await toastController.create({
      message: 'Erreur lors du traitement du paiement',
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  } finally {
    processing.value = false;
  }
};

const refreshData = () => {
  loadPendingRepairs();
};

const loadPendingRepairs = async () => {
  loading.value = true;
  try {
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simuler des réparations en attente de paiement
    pendingRepairs.value = [
    {
      id: '1',
      interventionName: 'Changement d\'huile',
      interventionPrice: 45,
      carName: 'Peugeot',
      carModel: '208',
      completedAt: new Date(Date.now() - 86400000), // 1 day ago
      status: 'completed'
    },
    {
      id: '2',
      interventionName: 'Freinage avant',
      interventionPrice: 120,
      carName: 'Renault',
      carModel: 'Clio',
      completedAt: new Date(Date.now() - 172800000), // 2 days ago
      status: 'completed'
    },
    {
      id: '3',
      interventionName: 'Diagnostic électronique',
      interventionPrice: 80,
      carName: 'Peugeot',
      carModel: '208',
      completedAt: new Date(Date.now() - 259200000), // 3 days ago
      status: 'completed'
    }
  ];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPendingRepairs();
});
</script>

<style scoped>
.container {
  padding: 16px;
}

.payment-summary {
  margin-bottom: 24px;
}

.payment-summary h2 {
  margin: 0 0 16px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.summary-card {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
  color: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: 700;
}

.pending-payments {
  margin-bottom: 24px;
}

.pending-payments h3 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.payments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--ion-color-light);
  border-radius: 12px;
  border-left: 4px solid var(--ion-color-warning);
}

.repair-info h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
}

.repair-info p {
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.repair-date {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.repair-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-primary);
}

.payment-methods {
  margin-bottom: 24px;
}

.payment-methods h3 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.methods-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--ion-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.method-item:hover {
  background: var(--ion-color-light-tint);
}

.method-item.selected {
  background: var(--ion-color-primary-tint);
  border: 2px solid var(--ion-color-primary);
}

.method-icon {
  margin-right: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-light-shade);
  border-radius: 50%;
}

.method-info {
  flex: 1;
}

.method-info h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
}

.method-info p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.payment-action {
  margin-top: 32px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-state h4 {
  margin: 16px 0 8px 0;
  font-size: 1rem;
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

/* Animation pour la voiture dans le bouton de traitement */
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

/* Container pour le chargement */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}
</style>
