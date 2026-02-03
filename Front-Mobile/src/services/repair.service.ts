import { db, storage } from '@/firebase/config-simple'
import { 
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc
} from 'firebase/firestore'
import { 
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { RealtimeService } from './realtime.service'

export enum RepairStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Repair {
  id?: string
  userId: string
  carId: string
  description: string
  photos: string[]
  status: RepairStatus
  estimatedCost?: number
  finalCost?: number
  quote?: string
  diagnosis?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
  // Champs pour l'API Laravel
  interventionId?: number
  interventionName?: string
  interventionPrice?: string
  interventionDuration?: number
}

export class RepairService {
  private repairsCollection = collection(db, 'repairs')

  // Créer une nouvelle demande de réparation
  async createRepair(repairData: Omit<Repair, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const repair: Omit<Repair, 'id'> = {
        ...repairData,
        status: RepairStatus.PENDING,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
      
      const docRef = await addDoc(this.repairsCollection, repair)
      const repairId = docRef.id
      
      // Créer aussi dans Realtime Database pour le suivi en temps réel
      if (repairData.interventionId && repairData.interventionDuration) {
        await RealtimeService.createRepair({
          id: repairId,
          userId: repairData.userId,
          carId: repairData.carId,
          interventionId: repairData.interventionId,
          interventionName: repairData.interventionName || '',
          interventionDuration: repairData.interventionDuration,
          interventionPrice: repairData.interventionPrice ? parseFloat(repairData.interventionPrice) : 0
        })
      }
      
      return repairId
    } catch (error) {
      throw new Error('Erreur lors de la création de la demande de réparation: ' + error)
    }
  }

  // Uploader des photos pour une réparation
  async uploadPhotos(repairId: string, photos: File[]): Promise<string[]> {
    try {
      const photoUrls: string[] = []
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const photoRef = ref(storage, `repairs/${repairId}/photo_${i}_${Date.now()}`)
        
        await uploadBytes(photoRef, photo)
        const downloadUrl = await getDownloadURL(photoRef)
        photoUrls.push(downloadUrl)
      }
      
      return photoUrls
    } catch (error) {
      throw new Error('Erreur lors de l\'upload des photos: ' + error)
    }
  }

  // Obtenir toutes les réparations d'un utilisateur
  async getUserRepairs(userId: string): Promise<Repair[]> {
    try {
      // Essayer d'abord avec la requête optimisée (nécessite un index)
      try {
        const q = query(
          this.repairsCollection,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
        
        const querySnapshot = await getDocs(q)
        const repairs: Repair[] = []
        
        querySnapshot.forEach((doc) => {
          repairs.push({ id: doc.id, ...doc.data() } as Repair)
        })
        
        return repairs
      } catch (indexError: any) {
        // Si l'index n'existe pas, utiliser une approche alternative
        if (indexError.message.includes('failed-precondition') || indexError.message.includes('index')) {
          console.warn('⚠️ Index Firestore manquant, utilisation de la méthode alternative')
          
          // Récupérer sans ordre puis trier côté client
          const q = query(
            this.repairsCollection,
            where('userId', '==', userId)
          )
          
          const querySnapshot = await getDocs(q)
          const repairs: Repair[] = []
          
          querySnapshot.forEach((doc) => {
            repairs.push({ id: doc.id, ...doc.data() } as Repair)
          })
          
          // Trier côté client par createdAt (plus récent en premier)
          return repairs.sort((a, b) => {
            const timeA = a.createdAt.toMillis()
            const timeB = b.createdAt.toMillis()
            return timeB - timeA
          })
        }
        
        throw indexError
      }
    } catch (error) {
      throw new Error('Erreur lors de la récupération des réparations: ' + error)
    }
  }

  // Obtenir une réparation par son ID
  async getRepairById(repairId: string): Promise<Repair | null> {
    try {
      const repairDoc = doc(db, 'repairs', repairId)
      const repairSnapshot = await getDoc(repairDoc)
      
      if (repairSnapshot.exists()) {
        return { id: repairSnapshot.id, ...repairSnapshot.data() } as Repair
      }
      
      return null
    } catch (error) {
      throw new Error('Erreur lors de la récupération de la réparation: ' + error)
    }
  }

  // Mettre à jour le statut d'une réparation
  async updateRepairStatus(repairId: string, status: RepairStatus, additionalData?: Partial<Repair>): Promise<void> {
    try {
      const repairDoc = doc(db, 'repairs', repairId)
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      }
      
      // Ajouter la date de complétion si le statut est terminé
      if (status === RepairStatus.COMPLETED) {
        updateData.completedAt = Timestamp.now()
      }
      
      // Ajouter les données additionnelles si fournies
      if (additionalData) {
        Object.assign(updateData, additionalData)
      }
      
      await updateDoc(repairDoc, updateData)
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour du statut: ' + error)
    }
  }

  // Mettre à jour le prix d'une intervention
  async updateRepairPrice(repairId: string, price: number): Promise<void> {
    try {
      const repairDoc = doc(db, 'repairs', repairId)
      
      // Mettre à jour dans Firestore
      await updateDoc(repairDoc, {
        interventionPrice: price.toString(),
        updatedAt: Timestamp.now()
      })
      
      // Mettre à jour dans Realtime Database
      await RealtimeService.updateRepairPrice(repairId, price)
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour du prix: ' + error)
    }
  }

  // Ajouter un devis à une réparation
  async addQuote(repairId: string, quoteUrl: string, estimatedCost: number): Promise<void> {
    try {
      const repairDoc = doc(db, 'repairs', repairId)
      await updateDoc(repairDoc, {
        quote: quoteUrl,
        estimatedCost,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      throw new Error('Erreur lors de l\'ajout du devis: ' + error)
    }
  }

  // Ajouter un diagnostic
  async addDiagnosis(repairId: string, diagnosis: string): Promise<void> {
    try {
      const repairDoc = doc(db, 'repairs', repairId)
      await updateDoc(repairDoc, {
        diagnosis,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      throw new Error('Erreur lors de l\'ajout du diagnostic: ' + error)
    }
  }

  // Finaliser une réparation avec le coût final
  async completeRepair(repairId: string, finalCost: number): Promise<void> {
    try {
      const repairDoc = doc(db, 'repairs', repairId)
      await updateDoc(repairDoc, {
        status: RepairStatus.COMPLETED,
        finalCost,
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      throw new Error('Erreur lors de la finalisation de la réparation: ' + error)
    }
  }

  // Supprimer une réparation et ses photos
  async deleteRepair(repairId: string): Promise<void> {
    try {
      // Supprimer d'abord les photos du storage
      const repair = await this.getRepairById(repairId)
      if (repair?.photos) {
        for (const photoUrl of repair.photos) {
          try {
            const photoRef = ref(storage, photoUrl)
            await deleteObject(photoRef)
          } catch (error) {
            console.warn('Erreur lors de la suppression d\'une photo:', error)
          }
        }
      }
      
      // Supprimer le document de la réparation
      const repairDoc = doc(db, 'repairs', repairId)
      await deleteDoc(repairDoc)
    } catch (error) {
      throw new Error('Erreur lors de la suppression de la réparation: ' + error)
    }
  }

  // Démarrer une réparation (déclenche le suivi en temps réel)
  async startRepair(repairId: string): Promise<void> {
    try {
      // Mettre à jour dans Firestore
      await this.updateRepairStatus(repairId, RepairStatus.IN_PROGRESS)
      
      // Démarrer dans Realtime Database
      await RealtimeService.startRepair(repairId)
    } catch (error) {
      throw new Error('Erreur lors du démarrage de la réparation: ' + error)
    }
  }

  // Écouter les notifications de réparation en temps réel
  listenToRepairNotifications(userId: string, onHalfway: (repair: any) => void, onCompleted: (repair: any) => void) {
    return RealtimeService.listenToUserRepairs(userId, (repairs) => {
      repairs.forEach(repair => {
        if (repair.status === 'halfway' && !repair.halfwayNotified) {
          onHalfway(repair)
        } else if (repair.status === 'completed' && !repair.completedNotified) {
          onCompleted(repair)
        }
      })
    })
  }

  // Demander la permission pour les notifications
  async requestNotificationPermission(): Promise<boolean> {
    return await RealtimeService.requestNotificationPermission()
  }

  // Obtenir les réparations par statut
  async getRepairsByStatus(userId: string, status: RepairStatus): Promise<Repair[]> {
    try {
      // Essayer d'abord avec la requête optimisée (nécessite un index composite)
      try {
        const q = query(
          this.repairsCollection,
          where('userId', '==', userId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        )
        
        const querySnapshot = await getDocs(q)
        const repairs: Repair[] = []
        
        querySnapshot.forEach((doc) => {
          repairs.push({ id: doc.id, ...doc.data() } as Repair)
        })
        
        return repairs
      } catch (indexError: any) {
        // Si l'index n'existe pas, utiliser une approche alternative
        if (indexError.message.includes('failed-precondition') || indexError.message.includes('index')) {
          console.warn('⚠️ Index Firestore manquant, utilisation de la méthode alternative pour getRepairsByStatus')
          
          // Récupérer sans ordre puis trier côté client
          const q = query(
            this.repairsCollection,
            where('userId', '==', userId),
            where('status', '==', status)
          )
          
          const querySnapshot = await getDocs(q)
          const repairs: Repair[] = []
          
          querySnapshot.forEach((doc) => {
            repairs.push({ id: doc.id, ...doc.data() } as Repair)
          })
          
          // Trier côté client par createdAt (plus récent en premier)
          return repairs.sort((a, b) => {
            const timeA = a.createdAt.toMillis()
            const timeB = b.createdAt.toMillis()
            return timeB - timeA
          })
        }
        
        throw indexError
      }
    } catch (error) {
      throw new Error('Erreur lors de la récupération des réparations par statut: ' + error)
    }
  }
}

export const repairService = new RepairService()
