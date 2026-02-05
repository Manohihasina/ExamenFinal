import { ref, get, onValue, getDatabase, set, push } from 'firebase/database'
import { auth } from '../firebase/config-simple'

const database = getDatabase()

export interface Intervention {
  id: number
  name: string
  price: string
  duration_seconds: number
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export class InterventionService {
  private database = database

  async getInterventions(): Promise<Intervention[]> {
    try {
      // Vérifier l'authentification
      const currentUser = auth.currentUser
      console.log('🔐 Utilisateur actuel:', currentUser?.uid || 'Non connecté')
      
      if (!currentUser) {
        console.error('❌ Utilisateur non authentifié')
        throw new Error('Utilisateur non authentifié')
      }
      
      const interventionsRef = ref(this.database, 'interventions')
      console.log('📡 Tentative de lecture de la référence:', interventionsRef.toString())
      
      const snapshot = await get(interventionsRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        console.log('📊 Données brutes reçues:', data)
        
        // Convertir l'objet en tableau
        const interventions: Intervention[] = Object.keys(data).map(key => ({
          id: parseInt(key),
          ...data[key]
        }))
        console.log('✅ Interventions récupérées depuis Firebase:', interventions.length)
        return interventions
      } else {
        console.log('📭 Aucune intervention trouvée dans Firebase')
        return []
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des interventions:', error)
      throw new Error('Erreur lors de la récupération des interventions: ' + error)
    }
  }

  async getActiveInterventions(): Promise<Intervention[]> {
    try {
      // Récupérer toutes les interventions puis filtrer
      const allInterventions = await this.getInterventions()
      return allInterventions.filter(intervention => intervention.is_active)
    } catch (error) {
      console.error('Erreur lors de la récupération des interventions actives:', error)
      throw new Error('Erreur lors de la récupération des interventions actives: ' + error)
    }
  }

  // Créer une nouvelle intervention
  async createIntervention(interventionData: {
    name: string
    price: string
    duration_seconds: number
    description: string
    is_active?: boolean
  }): Promise<Intervention> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié')
      }

      const interventionsRef = ref(this.database, 'interventions')
      const newInterventionRef = push(interventionsRef)
      
      const intervention: Intervention = {
        id: parseInt(newInterventionRef.key || '0'),
        name: interventionData.name,
        price: interventionData.price,
        duration_seconds: interventionData.duration_seconds,
        description: interventionData.description,
        is_active: interventionData.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await set(newInterventionRef, intervention)
      console.log('✅ Intervention créée avec succès:', intervention)
      return intervention
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'intervention:', error)
      throw new Error('Erreur lors de la création de l\'intervention: ' + error)
    }
  }

  // Écouter les changements en temps réel depuis Firebase
  onInterventionsChange(callback: (interventions: Intervention[]) => void) {
    const interventionsRef = ref(this.database, 'interventions')
    
    return onValue(interventionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const interventions: Intervention[] = Object.keys(data).map(key => ({
          id: parseInt(key),
          ...data[key]
        }))
        callback(interventions)
      } else {
        callback([])
      }
    }, (error) => {
      console.error('Erreur écoute Firebase:', error)
      callback([])
    })
  }

}

export const interventionService = new InterventionService()
