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
    } catch (error: any) {
      console.error('❌ [REALTIME] Erreur createRepair:', error);
      console.error('❌ [REALTIME] Détails erreur:', {
        message: error.message,
        code: error.code,
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

  // Créer une voiture dans Realtime Database
  static async createCar(carData: {
    id: string
    userId: string
    brand: string
    model: string
    licensePlate: string
    year?: number
    color?: string
    createdAt: number
    updatedAt: number
  }): Promise<void> {
    try {
      console.log('🔍 [REALTIME] createCar appelé avec:', carData);
      
      const carRef = ref(database, `cars/${carData.id}`)
      console.log('🔍 [REALTIME] Référence voiture créée:', carRef.toString());
      
      await set(carRef, carData)
      console.log('✅ [REALTIME] Voiture créée avec succès:', carData.id)
    } catch (error: any) {
      console.error('❌ [REALTIME] Erreur createCar:', error);
      console.error('❌ [REALTIME] Détails erreur:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error
    }
  }

  // Mettre à jour une voiture dans Realtime Database
  static async updateCar(carId: string, updateData: {
    brand?: string
    model?: string
    licensePlate?: string
    year?: number
    color?: string
  }): Promise<void> {
    try {
      const carRef = ref(database, `cars/${carId}`)
      await update(carRef, updateData)
      console.log('✅ [REALTIME] Voiture mise à jour avec succès:', carId)
    } catch (error) {
      console.error('❌ [REALTIME] Erreur updateCar:', error);
      throw error
    }
  }

  // Supprimer une voiture de Realtime Database
  static async deleteCar(carId: string): Promise<void> {
    try {
      const carRef = ref(database, `cars/${carId}`)
      await remove(carRef)
      console.log('✅ [REALTIME] Voiture supprimée avec succès:', carId)
    } catch (error) {
      console.error('❌ [REALTIME] Erreur deleteCar:', error);
      throw error
    }
  }

  // Écouter les voitures d'un utilisateur en temps réel
  static listenToUserCars(userId: string, callback: (cars: any[]) => void) {
    const carsRef = ref(database, 'cars')
    
    return onValue(carsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const userCars = Object.values(data).filter((car: any) => car.userId === userId)
        callback(userCars)
      }
    })
  }

  // Synchroniser toutes les voitures d'un utilisateur vers Realtime Database
  static async syncUserCarsToRealtime(userId: string, cars: any[]): Promise<void> {
    try {
      console.log(`🔄 [REALTIME] Synchronisation de ${cars.length} voitures vers Realtime Database`)
      
      for (const car of cars) {
        const carData = {
          id: car.id,
          userId: car.userId,
          brand: car.brand,
          model: car.model,
          licensePlate: car.licensePlate,
          year: car.year,
          color: car.color,
          createdAt: car.createdAt?.toMillis() || Date.now(),
          updatedAt: car.updatedAt?.toMillis() || Date.now()
        }
        
        const carRef = ref(database, `cars/${car.id}`)
        await set(carRef, carData)
      }
      
      console.log('✅ [REALTIME] Synchronisation des voitures terminée')
    } catch (error) {
      console.error('❌ [REALTIME] Erreur synchronisation voitures:', error)
      throw error
    }
  }

  // Récupérer une réparation par son ID
  static async getRepairById(repairId: string): Promise<RealtimeRepair | null> {
    try {
      const repairRef = ref(database, `repairs/${repairId}`)
      const snapshot = await get(repairRef)
      
      if (snapshot.exists()) {
        const repair = snapshot.val()
        return {
          id: repairId,
          ...repair
        } as RealtimeRepair
      }
      
      return null
    } catch (error) {
      console.error('Erreur getRepairById:', error)
      throw error
    }
  }

  // Mettre à jour le prix d'une réparation
  static async updateRepairPrice(repairId: string, newPrice: number): Promise<void> {
    try {
      const repairRef = ref(database, `repairs/${repairId}`)
      await update(repairRef, {
        interventionPrice: newPrice,
        updatedAt: new Date().toISOString()
      })
      console.log('✅ Prix de la réparation mis à jour:', repairId, newPrice)
    } catch (error) {
      console.error('Erreur updateRepairPrice:', error)
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
