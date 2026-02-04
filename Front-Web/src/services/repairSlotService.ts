import { ref, get, onValue, update, push, set } from 'firebase/database'
import { database } from '../firebase/config'
import { getAuth } from 'firebase/auth'

export interface RepairSlot {
  id: number
  slot_number: number
  car_id: number | null
  status: 'available' | 'occupied' | 'waiting_payment'
  created_at: string
  updated_at: string
  car?: {
    id: number
    brand: string
    model: string
    license_plate: string
    client: {
      name: string
      email: string
    }
    repairs?: Array<{
      id: number
      intervention: {
        name: string
        price: string
      }
      status: string
    }>
  }
}

export interface CarWithRepairs {
  id: string  // Firebase ID
  make?: string  // Firebase field
  brand?: string  // Alternative field
  model: string
  license_plate: string
  client_name?: string  // Firebase field
  client?: {  // Firebase nested object
    name?: string
    email?: string
  }
  repairs: Array<{
    id: string
    intervention_name: string
    intervention_price: string
    status: string
  }>
}

export interface Repair {
  id: string;
  carId: string;
  interventionId: string;
  interventionName: string;
  interventionPrice: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at?: string;
}

export class RepairSlotService {
  private database = database

  async getRepairSlots(): Promise<RepairSlot[]> {
    console.log('🔍 [DEBUG] Début getRepairSlots()');
    
    try {
      // Vérifier l'authentification
      const auth = getAuth();
      const currentUser = auth.currentUser;
      console.log('🔍 [DEBUG] Auth user:', currentUser ? { uid: currentUser.uid, email: currentUser.email } : 'NON AUTHENTIFIÉ');
      
      // Vérifier la connexion Firebase
      console.log('🔍 [DEBUG] Database app:', !!this.database.app);
      console.log('🔍 [DEBUG] Database URL:', this.database.app?.options?.databaseURL);
      
      const slotsRef = ref(this.database, 'repair_slots');
      console.log('🔍 [DEBUG] Référence créée:', slotsRef.toString());
      
      console.log('🔍 [DEBUG] Tentative de lecture depuis Firebase...');
      const snapshot = await get(slotsRef);
      console.log('🔍 [DEBUG] Snapshot reçu:', { exists: snapshot.exists(), key: snapshot.key });
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        console.log('🔍 [DEBUG] Données brutes reçues:', data);
        console.log('🔍 [DEBUG] Type de données:', typeof data);
        console.log('🔍 [DEBUG] Clés disponibles:', Object.keys(data || {}));
        
        // Convertir l'objet en tableau
        const slots: RepairSlot[] = Object.keys(data).map(key => {
          console.log('🔍 [DEBUG] Traitement slot:', key, data[key]);
          return {
            id: parseInt(key),
            ...data[key]
          };
        })
        console.log('✅ Repair slots récupérés depuis Firebase:', slots.length);
        console.log('🔍 [DEBUG] Slots transformés:', slots);
        return slots
      } else {
        console.log('📭 Aucun repair slot trouvé dans Firebase');
        console.log('🔍 [DEBUG] Snapshot existe mais aucune donnée');
        return []
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des repair slots:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('🔍 [DEBUG] Détail erreur:', {
        message: errorMessage,
        code: errorCode,
        stack: errorStack
      });
      
      // Analyse spécifique des erreurs de permission
      if (errorMessage.includes('Permission denied')) {
        console.error('🔍 [DEBUG] Erreur de permission détectée!');
        console.error('🔍 [DEBUG] Vérifier:');
        console.error('  1. Utilisateur authentifié?');
        console.error('  2. Règles Firebase correctes?');
        console.error('  3. Chemin repair_slots accessible?');
      }
      
      throw new Error('Erreur lors de la récupération des repair slots: ' + errorMessage)
    }
  }

  async getCarsWithRepairs(): Promise<CarWithRepairs[]> {
    // Pour les voitures avec réparations, on utilise l'API Laravel
    // car cette donnée est complexe et vient de jointures SQL
    try {
      const response = await fetch('http://127.0.0.1:8000/api/clients/cars-with-repairs')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('✅ Cars with repairs récupérés depuis API Laravel:', data.length)
      return data
    } catch (error) {
      console.error('❌ Erreur API Laravel cars-with-repairs:', error)
      throw new Error('Erreur lors de la récupération des voitures avec réparations: ' + error)
    }
  }

  // Écouter les changements en temps réel depuis Firebase
  onRepairSlotsChange(callback: (slots: RepairSlot[]) => void) {
    const slotsRef = ref(this.database, 'repair_slots')
    
    return onValue(slotsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const slots: RepairSlot[] = Object.keys(data).map(key => ({
          id: parseInt(key),
          ...data[key]
        }))
        callback(slots)
      } else {
        callback([])
      }
    }, (error) => {
      console.error('Erreur écoute Firebase slots:', error)
      callback([])
    })
  }

  // Occuper un slot (mettre à jour Firebase et API)
  async occupySlot(slotId: number, carId: string): Promise<RepairSlot> {
    console.log('🔍 [DEBUG] occupySlot appelé avec:', { slotId, carId });
    
    try {
      // Mettre à jour via API Laravel (qui synchronisera avec Firebase)
      const requestBody = { car_id: carId };
      console.log('🔍 [DEBUG] Body envoyé:', requestBody);
      
      const response = await fetch(`http://127.0.0.1:8000/api/slots/${slotId}/occupy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('🔍 [DEBUG] Response status:', response.status);
      console.log('🔍 [DEBUG] Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 [DEBUG] Response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ Slot occupé via API Laravel:', data)
      return data.slot || data;
    } catch (error) {
      console.error('❌ Erreur occupation slot:', error)
      throw new Error('Erreur lors de l\'occupation du slot: ' + error)
    }
  }

  // Récupérer les réparations d'une voiture depuis Firebase
  async getCarRepairs(carId: string): Promise<Repair[]> {
    console.log('🔍 [DEBUG] Récupération réparations pour voiture:', carId);
    
    try {
      const repairsRef = ref(this.database, 'repairs');
      const snapshot = await get(repairsRef);
      
      if (snapshot.exists()) {
        const allRepairs = snapshot.val();
        const carRepairs = Object.keys(allRepairs)
          .filter(repairId => allRepairs[repairId].carId === carId)
          .map(repairId => ({
            id: repairId,
            ...allRepairs[repairId]
          }));
        
        console.log('Réparations trouvées:', carRepairs.length);
        return carRepairs;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur récupération réparations:', error);
      return [];
    }
  }

  async freeSlot(slotId: number): Promise<RepairSlot> {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/slots/${slotId}/free`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Slot libéré via API Laravel:', data)
      return data.slot || data;
    } catch (error) {
      console.error('❌ Erreur libération slot:', error)
      throw new Error('Erreur lors de la libération du slot: ' + error)
    }
  }

  // Démarrer une réparation
  async startRepair(repairId: string, interventionId: number, duration: number): Promise<void> {
    try {
      // Mettre à jour directement dans Firebase Realtime Database
      const repairRef = ref(database, `repairs/${repairId}`);
      const updateData = {
        status: 'in_progress',
        startedAt: Date.now(),
        halfwayNotified: false,
        completedNotified: false,
        updatedAt: new Date().toISOString(),
        interventionDuration: duration,
        interventionId: interventionId
      };
      
      await update(repairRef, updateData);
      console.log('✅ Réparation démarrée:', repairId);
    } catch (error) {
      console.error('❌ Erreur démarrage réparation:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'une réparation
  async updateRepairStatus(repairId: string, updateData: Record<string, unknown>): Promise<void> {
    try {
      const repairRef = ref(database, `repairs/${repairId}`);
      const updates = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      await update(repairRef, updates);
      console.log('✅ Statut réparation mis à jour:', repairId, updates);
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      throw error;
    }
  }

  async addToWaitingSlots(data: {
    carId: string;
    clientId: string;
    interventions: Array<{ id: string; name: string; price: number }>;
    totalPrice: number;
    createdAt: string;
    status: string;
  }) {
    try {
      const waitingSlotsRef = ref(database, 'waiting_slots');
      const newWaitingSlotRef = push(waitingSlotsRef);
      
      await set(newWaitingSlotRef, {
        id: newWaitingSlotRef.key,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Voiture ajoutée aux waiting_slots:', data.carId);
    } catch (error) {
      console.error('❌ Erreur ajout waiting slots:', error);
      throw error;
    }
  }

  async updateSlotStatus(slotId: number, status: string) {
    try {
      console.log('🔍 [DEBUG] Mise à jour du slot:', slotId, 'nouveau statut:', status);
      const slotRef = ref(database, `repair_slots/${slotId}`); // Corrigé: repair_slots au lieu de slots
      
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };
      
      if (status === 'available') {
        updateData.car_id = null; // Libérer la voiture
        console.log('🔍 [DEBUG] Libération de la voiture du slot');
      }
      
      console.log('🔍 [DEBUG] Données de mise à jour:', updateData);
      await update(slotRef, updateData);
      
      console.log('✅ Statut slot mis à jour:', slotId, status);
    } catch (error) {
      console.error('❌ Erreur mise à jour slot:', error);
      throw error;
    }
  }
}

export const repairSlotService = new RepairSlotService()
