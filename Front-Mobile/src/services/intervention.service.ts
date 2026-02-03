import { getDatabase, ref, get, onValue } from 'firebase/database'
import { initializeApp, FirebaseApp } from 'firebase/app'
import { firebaseConfig } from '../firebase/config-simple'

const firebaseApp = initializeApp(firebaseConfig, 'intervention-service')

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
  private database = getDatabase(firebaseApp)
  private baseUrl = 'http://localhost:8000/api' // Gardé comme fallback

  async getInterventions(): Promise<Intervention[]> {
    try {
      // Essayer d'abord depuis Firebase Realtime Database
      const interventionsRef = ref(this.database, 'interventions')
      const snapshot = await get(interventionsRef)
      
      if (snapshot.exists()) {
        const data = snapshot.val()
        // Convertir l'objet en tableau
        const interventions: Intervention[] = Object.keys(data).map(key => ({
          id: parseInt(key),
          ...data[key]
        }))
        console.log('✅ Interventions récupérées depuis Firebase:', interventions.length)
        return interventions
      } else {
        console.log('📭 Aucune intervention trouvée dans Firebase, fallback vers API Laravel')
        return this.getInterventionsFromAPI()
      }
    } catch (error) {
      console.warn('⚠️ Erreur Firebase, fallback vers API Laravel:', error)
      return this.getInterventionsFromAPI()
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

  // Méthode fallback vers API Laravel
  private async getInterventionsFromAPI(): Promise<Intervention[]> {
    try {
      const response = await fetch(`${this.baseUrl}/interventions`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Interventions récupérées depuis API Laravel:', data.length)
      return data
    } catch (error) {
      console.error('❌ Erreur API Laravel:', error)
      throw new Error('Erreur lors de la récupération des interventions: ' + error)
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
      // En cas d'erreur, essayer l'API Laravel
      this.getInterventionsFromAPI().then(callback).catch(console.error)
    })
  }

  // Créer une intervention (si besoin depuis le mobile)
  async createIntervention(intervention: Omit<Intervention, 'id' | 'created_at' | 'updated_at'>): Promise<Intervention> {
    try {
      // Créer via API Laravel (qui synchronisera avec Firebase)
      const response = await fetch(`${this.baseUrl}/interventions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intervention)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Intervention créée via API Laravel:', data.intervention)
      return data.intervention
    } catch (error) {
      console.error('❌ Erreur création intervention:', error)
      throw new Error('Erreur lors de la création de l\'intervention: ' + error)
    }
  }
}

export const interventionService = new InterventionService()
