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
              <span>{{ waitingSlots.length }}</span>
            </div>
          </div>
        </div>

        <!-- Pending Payments -->
        <div class="pending-payments">
          <h3>Réparations en attente de paiement</h3>
          <div class="payments-list" v-if="waitingSlots.length > 0">
            <div 
              v-for="slot in waitingSlots" 
              :key="slot.id"
              class="payment-item"
              @click="selectWaitingSlotForPayment(slot)"
            >
              <div class="repair-info">
                <h4>Voiture: {{ slot.carId }}</h4>
                <p>{{ slot.interventions.length }} intervention(s)</p>
                <span class="repair-date">{{ formatDate(slot.createdAt) }}</span>
                <div class="interventions-list">
                  <div v-for="intervention in slot.interventions" :key="intervention.id" class="intervention-item">
                    <span>• {{ intervention.name }}</span>
                    <span>{{ intervention.price }}€</span>
                  </div>
                </div>
              </div>
              <div class="repair-amount">
                <span class="amount">{{ slot.totalPrice }}€</span>
                <ion-badge color="warning">En attente</ion-badge>
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
        <div class="payment-methods" v-if="selectedWaitingSlot">
          <h3>Méthodes de paiement pour {{ selectedWaitingSlot.totalPrice }}€</h3>
          <div class="payment-options">
            <div 
              v-for="method in paymentMethods" 
              :key="method.id"
              :class="['payment-option', { 'selected': selectedMethod?.id === method.id }]"
              @click="selectPaymentMethod(method)"
            >
              <div class="payment-option-radio">
                <div class="radio-circle">
                  <div class="radio-dot"></div>
                </div>
              </div>
              <div class="payment-option-content">
                <div class="method-icon">
                  <ion-icon :icon="method.icon"></ion-icon>
                </div>
                <div class="method-info">
                  <h4>{{ method.name }}</h4>
                  <p>{{ method.description }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="payment-actions">
            <ion-button 
              expand="block" 
              color="success" 
              @click="processPayment"
              :disabled="!selectedMethod || processing"
              class="pay-button"
            >
              <ion-icon :icon="processing ? cardOutline : cardSharp" :class="processing ? 'saving-car' : ''" slot="start" />
              {{ processing ? 'Traitement...' : `Payer ${selectedWaitingSlot.totalPrice}€` }}
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
  toastController,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonList,
  IonRadio,
  IonRadioGroup
} from '@ionic/vue'
import { 
  refreshOutline,
  cardSharp,
  walletOutline,
  cashOutline,
  businessOutline,
  checkmarkCircleOutline,
  cardOutline
} from 'ionicons/icons'
import { getDatabase, ref as dbRef, get, onValue, remove, update, set } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import CarLoadingSpinner from '@/components/CarLoadingSpinner.vue'

interface WaitingSlot {
  id: string;
  carId: string;
  clientId: string;
  interventions: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  totalPrice: number;
  createdAt: string;
  status: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const waitingSlots = ref<WaitingSlot[]>([]);
const selectedWaitingSlot = ref<WaitingSlot | null>(null);
const selectedMethod = ref<PaymentMethod | null>(null);
const processing = ref(false);
const loading = ref(true);
const currentUserId = ref<string>('');

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
  return waitingSlots.value.reduce((total: number, slot: WaitingSlot) => total + slot.totalPrice, 0);
});

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));
};

const selectWaitingSlotForPayment = (slot: WaitingSlot) => {
  selectedWaitingSlot.value = slot;
  selectedMethod.value = null;
};

const selectPaymentMethod = (method: PaymentMethod) => {
  selectedMethod.value = method;
};

const processPayment = async () => {
  if (!selectedWaitingSlot.value || !selectedMethod.value) return;

  processing.value = true;

  try {
    // Simuler le traitement du paiement
    await new Promise(resolve => setTimeout(resolve, 2000));

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    // Récupérer les informations du client
    const clientName = user.displayName || 'Client inconnu';
    const clientId = selectedWaitingSlot.value.clientId;
    const paymentData = {
      waiting_slot_id: selectedWaitingSlot.value.id,
      client_id: clientId,
      client_name: clientName,
      car_id: selectedWaitingSlot.value.carId,
      interventions: selectedWaitingSlot.value.interventions,
      total_price: selectedWaitingSlot.value.totalPrice,
      payment_method: selectedMethod.value.name,
      payment_date: new Date().toISOString(),
      status: 'paid'
    };

    console.log('🔍 [DEBUG] Création des enregistrements de paiement:', paymentData);

    // 1. Créer l'enregistrement dans Firestore
    const firestore = getFirestore();
    const paymentsCollection = collection(firestore, 'payments');
    const firestoreDoc = await addDoc(paymentsCollection, {
      ...paymentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ [DEBUG] Enregistrement Firestore créé:', firestoreDoc.id);

    // 2. Créer l'enregistrement dans Realtime Database
    const database = getDatabase();
    const realtimePaymentsRef = dbRef(database, `payments/${firestoreDoc.id}`);
    await set(realtimePaymentsRef, {
      ...paymentData,
      firestoreId: firestoreDoc.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ [DEBUG] Enregistrement Realtime Database créé');

    // 3. Créer l'enregistrement dans la base de données relationnelle (Laravel)
    // try {
    //   const response = await fetch('http://localhost:8000/api/payments', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Accept': 'application/json'
    //     },
    //     body: JSON.stringify({
    //       ...paymentData,
    //       firestore_id: firestoreDoc.id
    //     })
    //   });

    //   if (!response.ok) {
    //     const errorData = await response.json();
    //     console.warn('[DEBUG] Erreur API Laravel:', errorData);
    //     // On continue quand même si l'API Laravel échoue
    //   } else {
    //     const result = await response.json();
    //     console.log('✅ [DEBUG] Enregistrement Laravel créé:', result);
    //   }
    // } catch (apiError) {
    //   console.warn('[DEBUG] Erreur réseau API Laravel:', apiError);
    //   // On continue quand même si l'API Laravel n'est pas accessible
    // }

    // 4. Supprimer le waiting slot de la base de données
    await remove(dbRef(database, `waiting_slots/${selectedWaitingSlot.value.id}`));
    console.log('✅ [DEBUG] Waiting slot supprimé');
    
    // 5. Retirer de la liste locale
    waitingSlots.value = waitingSlots.value.filter(s => s.id !== selectedWaitingSlot.value?.id);
    
    // 6. Réinitialiser la sélection
    selectedWaitingSlot.value = null;
    selectedMethod.value = null;

    // 7. Afficher le succès
    const toast = await toastController.create({
      message: `Paiement de ${paymentData.total_price}€ effectué avec succès!`,
      duration: 3000,
      color: 'success',
      icon: checkmarkCircleOutline,
      position: 'top'
    });
    await toast.present();

    console.log('🎉 [DEBUG] Paiement traité avec succès pour:', paymentData);

  } catch (error) {
    console.error('❌ [DEBUG] Erreur lors du paiement:', error);
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
  loadWaitingSlots();
};

const loadWaitingSlots = async () => {
  loading.value = true;
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error('Utilisateur non connecté');
      return;
    }
    
    currentUserId.value = user.uid;
    console.log('🔍 [DEBUG] Chargement waiting slots pour utilisateur:', currentUserId.value);
    
    const database = getDatabase();
    const waitingSlotsRef = dbRef(database, 'waiting_slots');
    
    // Écouter les changements en temps réel
    onValue(waitingSlotsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const slotsArray: WaitingSlot[] = [];
        
        Object.keys(data).forEach(key => {
          const slot = data[key];
          // Filtrer pour n'afficher que les slots du client connecté
          if (slot.clientId === currentUserId.value && slot.status === 'waiting_payment') {
            slotsArray.push({
              id: key,
              ...slot
            });
          }
        });
        
        // Trier par date de création (plus récent en premier)
        slotsArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        waitingSlots.value = slotsArray;
        console.log('✅ [DEBUG] Waiting slots chargés:', slotsArray.length);
      } else {
        waitingSlots.value = [];
        console.log('🔍 [DEBUG] Aucun waiting slot trouvé');
      }
      loading.value = false;
    });
    
  } catch (error) {
    console.error('Erreur chargement waiting slots:', error);
    loading.value = false;
  }
};

onMounted(() => {
  loadWaitingSlots();
});
</script>

<style scoped>
.interventions-list {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.intervention-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 0.9rem;
}

.intervention-item span:first-child {
  color: #666;
}

.intervention-item span:last-child {
  font-weight: bold;
  color: #2563eb;
}

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
  margin: 0 0 20px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-option {
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.payment-option::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.payment-option:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
}

.payment-option:hover::before {
  opacity: 1;
}

.payment-option.selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
}

.payment-option.selected::before {
  opacity: 1;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
}

.payment-option-radio {
  margin-right: 16px;
  flex-shrink: 0;
}

.radio-circle {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.payment-option.selected .radio-circle {
  border-color: #3b82f6;
  background: #3b82f6;
}

.radio-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.payment-option.selected .radio-dot {
  opacity: 1;
  transform: scale(1);
}

.payment-option-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.method-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.payment-option:nth-child(2) .method-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
}

.payment-option:nth-child(3) .method-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.payment-option:nth-child(4) .method-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);
}

.method-info {
  flex: 1;
  min-width: 0;
}

.method-info h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.method-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.3;
}

.payment-actions {
  margin-top: 24px;
}

.pay-button {
  --background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  --border-radius: 12px;
  --box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  font-weight: 600;
  font-size: 1rem;
  height: 56px;
  transition: all 0.3s ease;
}

.pay-button:hover:not(:disabled) {
  --box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.pay-button:disabled {
  --background: #9ca3af;
  --box-shadow: none;
  transform: none;
}

.saving-car {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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
