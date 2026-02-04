import { getDatabase, ref, set, onValue, update, get, remove } from 'firebase/database'
import { initializeApp } from 'firebase/app'
import { firebaseConfig } from '@/firebase/config-simple'
import { Timestamp } from 'firebase/firestore'

// Importer les types depuis repair.service
import { Repair, RepairStatus } from './repair.service'

// Initialiser Firebase Realtime Database
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

export interface RealtimeRepair {
  id: string
  userId: string
  carId: string
  interventionId: number
  interventionName: string
  interventionDuration: number // en secondes
  interventionPrice: number // prix de l'intervention
  status: 'pending' | 'in_progress' | 'halfway' | 'completed'
  description: string // Champ requis
  photos: string[] // Champ requis
  createdAt: string // Champ requis
  updatedAt: string // Champ requis
  startedAt?: number
  halfwayNotified: boolean
  completedNotified: boolean
  estimatedCompletion?: number
}

export class RealtimeService {
  
  // Convertir RealtimeRepair vers Repair
  static convertToRepair(realtimeRepair: RealtimeRepair): Repair {
    return {
      id: realtimeRepair.id,
      userId: realtimeRepair.userId,
      carId: realtimeRepair.carId,
      interventionId: realtimeRepair.interventionId,
      interventionName: realtimeRepair.interventionName,
      interventionPrice: realtimeRepair.interventionPrice.toString(),
      interventionDuration: realtimeRepair.interventionDuration,
      status: realtimeRepair.status as RepairStatus,
      description: realtimeRepair.description,
      photos: realtimeRepair.photos,
      createdAt: { toDate: () => new Date(realtimeRepair.createdAt) } as Timestamp,
      updatedAt: { toDate: () => new Date(realtimeRepair.updatedAt) } as Timestamp,
      completedAt: realtimeRepair.startedAt ? { toDate: () => new Date(realtimeRepair.startedAt!) } as Timestamp : undefined
    }
  }
  
  // Récupérer toutes les réparations d'un utilisateur depuis Realtime Database
  static async getUserRepairs(userId: string): Promise<RealtimeRepair[]> {
    try {
      const repairsRef = ref(database, 'repairs')
      const snapshot = await get(repairsRef)
      
      if (!snapshot.exists()) {
        return []
      }
      
      const allRepairs = snapshot.val()
      const userRepairs: RealtimeRepair[] = []
      
      Object.keys(allRepairs).forEach(repairId => {
        const repair = allRepairs[repairId]
        if (repair.userId === userId) {
          userRepairs.push({ 
            id: repairId, 
            ...repair,
            description: repair.description || '',
            photos: repair.photos || [],
            createdAt: repair.createdAt || new Date().toISOString(),
            updatedAt: repair.updatedAt || new Date().toISOString()
          })
        }
      })
      
      return userRepairs.sort((a, b) => b.id.localeCompare(a.id))
    } catch (error) {
      console.error('Erreur getUserRepairs:', error)
      throw error
    }
  }

  // Créer une réparation dans Realtime Database
  static async createRepair(repairData: {
    id: string
    userId: string
    carId: string
    interventionId: number
    interventionName: string
    interventionDuration: number
    interventionPrice: number
    description?: string
    photos?: string[]
  }): Promise<void> {
    try {
      console.log('🔍 [REALTIME] createRepair appelé avec:', repairData);
      
      const repairRef = ref(database, `repairs/${repairData.id}`)
      console.log('🔍 [REALTIME] Référence créée:', repairRef.toString());
      
      const realtimeRepair: RealtimeRepair = {
        id: repairData.id,
        userId: repairData.userId,
        carId: repairData.carId,
        interventionId: repairData.interventionId,
        interventionName: repairData.interventionName,
        interventionDuration: repairData.interventionDuration,
        interventionPrice: repairData.interventionPrice,
        status: 'pending',
        description: repairData.description || '',
        photos: repairData.photos || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        halfwayNotified: false,
        completedNotified: false
      }
      
      console.log('🔍 [REALTIME] Données à écrire:', realtimeRepair);
      
      await set(repairRef, realtimeRepair)
      console.log('✅ [REALTIME] Réparation créée avec succès:', repairData.id)
    } catch (error) {
      console.error('❌ [REALTIME] Erreur createRepair:', error);
      console.error('❌ [REALTIME] Détails erreur:', {
        message: error.message,
        code: (error as any).code,
        stack: error.stack
      });
      throw error
    }
  }

  // Mettre à jour le statut d'une réparation
  static async updateRepairStatus(repairId: string, updateData: any): Promise<void> {
    try {
      const repairRef = ref(database, `repairs/${repairId}`)
      await update(repairRef, updateData)
    } catch (error) {
      console.error('Erreur updateRepairStatus:', error)
      throw error
    }
  }

  // Écouter les réparations d'un utilisateur en temps réel
  static listenToUserRepairs(userId: string, callback: (repairs: RealtimeRepair[]) => void) {
    const repairsRef = ref(database, 'repairs')
    
    return onValue(repairsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const userRepairs = Object.values(data).filter((repair: any) => repair.userId === userId) as RealtimeRepair[]
        callback(userRepairs)
      }
    })
  }

  // Démarrer une réparation
  static async startRepair(repairId: string): Promise<void> {
    try {
      const repairRef = ref(database, `repairs/${repairId}`)
      await update(repairRef, {
        status: 'in_progress',
        startedAt: Date.now()
      })
    } catch (error) {
      console.error('Erreur startRepair:', error)
      throw error
    }
  }

  // Demander la permission de notification
  static async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }
}
