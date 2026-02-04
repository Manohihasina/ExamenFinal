import { db } from '@/firebase/config-simple'
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore'
import { RealtimeService } from './realtime.service'

export interface Car {
  id?: string
  userId: string
  brand: string
  model: string
  licensePlate: string
  year?: number
  color?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export class CarService {
  private carsCollection = collection(db, 'garage')

  // Ajouter une voiture
  async addCar(carData: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const car: Omit<Car, 'id'> = {
        ...carData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(this.carsCollection, car)
      
      // Synchroniser avec Realtime Database via RealtimeService
      const fullCar: Car = { ...car, id: docRef.id }
      await RealtimeService.createCar({
        id: fullCar.id!,
        userId: fullCar.userId,
        brand: fullCar.brand,
        model: fullCar.model,
        licensePlate: fullCar.licensePlate,
        year: fullCar.year,
        color: fullCar.color,
        createdAt: fullCar.createdAt.toMillis(),
        updatedAt: fullCar.updatedAt.toMillis()
      })
      
      return docRef.id
    } catch (error) {
      throw new Error('Erreur lors de l\'ajout de la voiture: ' + error)
    }
  }

  // Obtenir toutes les voitures d'un utilisateur
  async getUserCars(userId: string): Promise<Car[]> {
    try {
      console.log('🔗 carService.getUserCars appelé avec userId:', userId)
      
      // Essayer d'abord avec la requête optimisée
      try {
        const q = query(
          this.carsCollection,
          where('userId', '==', userId)
        )

        const querySnapshot = await getDocs(q)
        const cars: Car[] = []

        querySnapshot.forEach((doc) => {
          cars.push({ id: doc.id, ...doc.data() } as Car)
        })

        console.log('✅ Voitures trouvées avec requête optimisée:', cars.length)
        return cars.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0
          const timeB = b.createdAt?.seconds || 0
          return timeB - timeA
        })
      } catch (indexError: any) {
        console.warn('⚠️ Index Firestore manquant, utilisation de la méthode alternative pour les voitures')
        
        // Méthode alternative : récupérer toutes les voitures puis filtrer côté client
        const allCarsQuery = query(this.carsCollection)
        const querySnapshot = await getDocs(allCarsQuery)
        const allCars: Car[] = []

        querySnapshot.forEach((doc) => {
          const car = { id: doc.id, ...doc.data() } as Car
          // Filtrer côté client
          if (car.userId === userId) {
            allCars.push(car)
          }
        })

        console.log('✅ Voitures trouvées avec méthode alternative:', allCars.length)
        console.log('🔍 Détail des voitures trouvées:', allCars)
        
        return allCars.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0
          const timeB = b.createdAt?.seconds || 0
          return timeB - timeA
        })
      }
    } catch (error) {
      console.error('❌ Erreur complète dans getUserCars:', error)
      throw new Error('Erreur lors de la récupération des voitures: ' + error)
    }
  }

  // Obtenir une voiture par son ID
  async getCarById(carId: string): Promise<Car | null> {
    try {
      const carDoc = doc(db, 'garage', carId)
      const carSnapshot = await getDoc(carDoc)

      if (carSnapshot.exists()) {
        return { id: carSnapshot.id, ...carSnapshot.data() } as Car
      }

      return null
    } catch (error) {
      throw new Error('Erreur lors de la récupération de la voiture: ' + error)
    }
  }

  // Mettre à jour une voiture
  async updateCar(carId: string, carData: Partial<Car>): Promise<void> {
    try {
      const carDoc = doc(db, 'garage', carId)
      const updatedCar = {
        ...carData,
        updatedAt: Timestamp.now()
      }
      await updateDoc(carDoc, updatedCar)
      
      // Synchroniser avec Realtime Database via RealtimeService
      await RealtimeService.updateCar(carId, {
        brand: carData.brand,
        model: carData.model,
        licensePlate: carData.licensePlate,
        year: carData.year,
        color: carData.color
      })
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour de la voiture: ' + error)
    }
  }

  // Supprimer une voiture
  async deleteCar(carId: string): Promise<void> {
    try {
      const carDoc = doc(db, 'garage', carId)
      await deleteDoc(carDoc)
      
      // Supprimer de Realtime Database via RealtimeService
      await RealtimeService.deleteCar(carId)
    } catch (error) {
      throw new Error('Erreur lors de la suppression de la voiture: ' + error)
    }
  }

  // Vérifier si une plaque d'immatriculation existe déjà pour un utilisateur
  async checkLicensePlateExists(userId: string, licensePlate: string, excludeCarId?: string): Promise<boolean> {
    try {
      const q = query(
        this.carsCollection,
        where('userId', '==', userId),
        where('licensePlate', '==', licensePlate.toUpperCase())
      )

      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return false
      }

      // Si on exclut une voiture spécifique (pour la modification)
      if (excludeCarId) {
        return !querySnapshot.docs.every(doc => doc.id === excludeCarId)
      }

      return true
    } catch (error) {
      throw new Error('Erreur lors de la vérification de la plaque d\'immatriculation: ' + error)
    }
  }

  // Écouter les changements des voitures d'un utilisateur depuis Realtime Database
  listenToUserCars(userId: string, callback: (cars: any[]) => void) {
    return RealtimeService.listenToUserCars(userId, callback)
  }

  // Synchroniser toutes les voitures d'un utilisateur vers Realtime Database
  async syncUserCarsToRealtime(userId: string): Promise<void> {
    try {
      const cars = await this.getUserCars(userId)
      console.log(`🔄 Synchronisation de ${cars.length} voitures vers Realtime Database`)
      
      await RealtimeService.syncUserCarsToRealtime(userId, cars)
      
      console.log('✅ Synchronisation terminée')
    } catch (error) {
      console.error('❌ Erreur synchronisation批量:', error)
      throw error
    }
  }
}

export const carService = new CarService()
