import { getDatabase, ref, set, onValue, update, get } from 'firebase/database'
import { initializeApp } from 'firebase/app'
import { firebaseConfig } from '@/firebase/config-simple'

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
  startedAt?: number
  halfwayNotified: boolean
  completedNotified: boolean
  estimatedCompletion?: number
}

export class RealtimeService {
  
  // Obtenir toutes les réparations d'un utilisateur depuis Realtime Database
  static async getUserRepairs(userId: string): Promise<RealtimeRepair[]> {
    try {
      const repairsRef = ref(database, 'repairs')
      const snapshot = await get(repairsRef)
      
      if (!snapshot.exists()) {
        return []
      }
      
      const repairsData = snapshot.val()
      const userRepairs: RealtimeRepair[] = []
      
      for (const repairId in repairsData) {
        const repair = repairsData[repairId]
        if (repair.userId === userId) {
          userRepairs.push({
            ...repair,
            id: repairId
          })
        }
      }
      
      // Trier par startedAt (plus récent en premier) ou par ID si pas de startedAt
      return userRepairs.sort((a, b) => {
        if (a.startedAt && b.startedAt) {
          return b.startedAt - a.startedAt
        }
        return b.id.localeCompare(a.id)
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations:', error)
      throw new Error('Erreur lors de la récupération des réparations: ' + error)
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
  }): Promise<void> {
    const repairRef = ref(database, `repairs/${repairData.id}`)
    
    const realtimeRepair: RealtimeRepair = {
      id: repairData.id,
      userId: repairData.userId,
      carId: repairData.carId,
      interventionId: repairData.interventionId,
      interventionName: repairData.interventionName,
      interventionDuration: repairData.interventionDuration,
      interventionPrice: repairData.interventionPrice,
      status: 'pending',
      halfwayNotified: false,
      completedNotified: false
    }
    
    await set(repairRef, realtimeRepair)
  }

  // Démarrer une réparation
  static async startRepair(repairId: string): Promise<void> {
    const repairRef = ref(database, `repairs/${repairId}`)
    const startedAt = Date.now()
    
    await update(repairRef, {
      status: 'in_progress',
      startedAt: startedAt
    })
  }

  // Écouter les changements d'une réparation
  static listenToRepair(repairId: string, callback: (repair: RealtimeRepair) => void) {
    const repairRef = ref(database, `repairs/${repairId}`)
    
    return onValue(repairRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        callback(data)
      }
    })
  }

  // Écouter toutes les réparations d'un utilisateur
  static listenToUserRepairs(userId: string, callback: (repairs: RealtimeRepair[]) => void) {
    const repairsRef = ref(database, `repairs`)
    
    return onValue(repairsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const userRepairs = Object.values(data).filter((repair: any) => repair.userId === userId) as RealtimeRepair[]
        callback(userRepairs)
      }
    })
  }

  // Mettre à jour le statut d'une réparation
  static async updateRepairStatus(repairId: string, status: RealtimeRepair['status']): Promise<void> {
    const repairRef = ref(database, `repairs/${repairId}`)
    
    const updates: Partial<RealtimeRepair> = { status }
    
    if (status === 'halfway') {
      updates.halfwayNotified = true
    } else if (status === 'completed') {
      updates.completedNotified = true
    }
    
    await update(repairRef, updates)
  }

  // Mettre à jour le prix d'une intervention
  static async updateRepairPrice(repairId: string, price: number): Promise<void> {
    const repairRef = ref(database, `repairs/${repairId}`)
    
    await update(repairRef, {
      interventionPrice: price
    })
  }

  // Mettre à jour plusieurs informations d'une réparation
  static async updateRepairInfo(repairId: string, updates: Partial<RealtimeRepair>): Promise<void> {
    const repairRef = ref(database, `repairs/${repairId}`)
    
    await update(repairRef, updates)
  }

  // Vérifier si une réparation doit être notifiée (pour le background processing)
  static async checkRepairNotifications(repairId: string): Promise<void> {
    const repairRef = ref(database, `repairs/${repairId}`)
    
    return new Promise((resolve, reject) => {
      onValue(repairRef, async (snapshot) => {
        const repair = snapshot.val() as RealtimeRepair
        if (!repair || !repair.startedAt) return

        const now = Date.now()
        const elapsed = now - repair.startedAt
        const halfwayTime = repair.interventionDuration * 500 // moitié de la durée en ms
        const fullTime = repair.interventionDuration * 1000 // durée complète en ms

        try {
          // Notification à mi-parcours
          if (elapsed >= halfwayTime && !repair.halfwayNotified && repair.status === 'in_progress') {
            await this.updateRepairStatus(repairId, 'halfway')
            this.showNotification(
              'Réparation à mi-parcours', 
              `Votre ${repair.interventionName} est à 50% - Prix: ${repair.interventionPrice.toFixed(2)}€`
            )
          }

          // Notification de fin
          if (elapsed >= fullTime && !repair.completedNotified && repair.status !== 'completed') {
            await this.updateRepairStatus(repairId, 'completed')
            this.showNotification(
              'Réparation terminée', 
              `Votre ${repair.interventionName} est terminée ! Prix total: ${repair.interventionPrice.toFixed(2)}€`
            )
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  // Afficher une notification (à adapter selon le système de notification)
  private static showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/icon.png'
      })
    }
  }

  // Demander la permission pour les notifications
  static async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }
}
