import { interventionService, Intervention } from '../services/intervention.service'

// Exemple d'utilisation du service d'intervention avec Firebase

export class InterventionExample {
  
  // Exemple 1: Récupérer toutes les interventions
  async loadAllInterventions() {
    try {
      const interventions = await interventionService.getInterventions()
      console.log('Interventions chargées:', interventions)
      return interventions
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Exemple 2: Récupérer uniquement les interventions actives
  async loadActiveInterventions() {
    try {
      const activeInterventions = await interventionService.getActiveInterventions()
      console.log('Interventions actives:', activeInterventions)
      return activeInterventions
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Exemple 3: Écouter les changements en temps réel
  setupRealtimeListener() {
    const unsubscribe = interventionService.onInterventionsChange((interventions) => {
      console.log('🔄 Changement détecté dans les interventions:', interventions)
      // Mettre à jour votre UI ici
      this.updateUI(interventions)
    })

    // Pour arrêter d'écouter:
    // unsubscribe()
    
    return unsubscribe
  }

  // Exemple 4: Créer une nouvelle intervention
  async createNewIntervention() {
    try {
      const newIntervention = await interventionService.createIntervention({
        name: 'Nouvelle intervention',
        price: '150.00',
        duration_seconds: 3600,
        description: 'Description de la nouvelle intervention',
        is_active: true
      })
      console.log('Intervention créée:', newIntervention)
      return newIntervention
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Méthode pour mettre à jour l'interface utilisateur
  private updateUI(interventions: Intervention[]) {
    // Implémentez ici la logique pour mettre à jour votre UI
    // Par exemple, mettre à jour un state React/Angular/Vue
    console.log('UI mise à jour avec', interventions.length, 'interventions')
  }
}

// Utilisation dans un composant (exemple React)
/*
import React, { useEffect, useState } from 'react'

export default function InterventionList() {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const example = new InterventionExample()

  useEffect(() => {
    // Charger les interventions initiales
    example.loadAllInterventions().then(data => {
      if (data) {
        setInterventions(data)
        setLoading(false)
      }
    })

    // Configurer l'écoute en temps réel
    const unsubscribe = example.setupRealtimeListener()

    // Nettoyer l'écouteur quand le composant est démonté
    return () => {
      unsubscribe()
    }
  }, [])

  if (loading) return <div>Chargement...</div>

  return (
    <div>
      <h2>Liste des interventions ({interventions.length})</h2>
      {interventions.map(intervention => (
        <div key={intervention.id}>
          <h3>{intervention.name}</h3>
          <p>Prix: {intervention.price}€</p>
          <p>Durée: {intervention.duration_seconds} secondes</p>
          <p>Actif: {intervention.is_active ? 'Oui' : 'Non'}</p>
        </div>
      ))}
    </div>
  )
}
*/

export default InterventionExample
