import { messaging } from '@/firebase/config-simple'
import { 
  getToken,
  onMessage,
  deleteToken
} from 'firebase/messaging'

export interface NotificationData {
  title: string
  body: string
  icon?: string
  click_action?: string
  data?: Record<string, string>
}

export class NotificationService {
  private vapidKey = 'votre-cle-vapid' // Remplacez avec votre clé VAPID

  // Demander la permission et obtenir le token
  async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      if (!('Notification' in window)) {
        console.warn('Ce navigateur ne supporte pas les notifications desktop')
        return null
      }

      // Demander la permission
      const permission = await Notification.requestPermission()
      
      if (permission !== 'granted') {
        console.warn('Permission de notification refusée')
        return null
      }

      // Obtenir le token FCM
      const token = await this.getFCMToken()
      return token
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error)
      return null
    }
  }

  // Obtenir le token FCM
  private async getFCMToken(): Promise<string | null> {
    try {
      if (!messaging) {
        console.warn('Firebase Messaging n\'est pas disponible')
        return null
      }

      const currentToken = await getToken(messaging, {
        vapidKey: this.vapidKey
      })

      if (currentToken) {
        console.log('Token FCM obtenu:', currentToken)
        return currentToken
      } else {
        console.warn('Aucun token FCM disponible')
        return null
      }
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token FCM:', error)
      return null
    }
  }

  // Écouter les messages en premier plan
  listenToMessages(callback: (payload: any) => void): () => void {
    if (!messaging) {
      console.warn('Firebase Messaging n\'est pas disponible')
      return () => {}
    }

    return onMessage(messaging, (payload) => {
      console.log('Message reçu en premier plan:', payload)
      callback(payload)
      
      // Afficher une notification desktop si le navigateur le supporte
      if ('Notification' in window && Notification.permission === 'granted') {
        this.showDesktopNotification(payload)
      }
    })
  }

  // Afficher une notification desktop
  private showDesktopNotification(payload: any): void {
    const notificationTitle = payload.notification?.title || 'Nouvelle notification'
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: payload.notification?.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: payload.data?.tag || 'default',
      data: payload.data || {},
      requireInteraction: payload.data?.requireInteraction === 'true'
    }

    const notification = new Notification(notificationTitle, notificationOptions)

    // Gérer le clic sur la notification
    notification.onclick = (event) => {
      event.preventDefault()
      
      // Rediriger vers la page appropriée
      if (payload.data?.click_action) {
        window.open(payload.data.click_action, '_blank')
      } else {
        window.focus()
      }
      
      notification.close()
    }

    // Fermer automatiquement après 5 secondes sauf si requireInteraction est true
    if (!notificationOptions.requireInteraction) {
      setTimeout(() => {
        notification.close()
      }, 5000)
    }
  }

  // Supprimer le token FCM (pour la déconnexion)
  async deleteToken(): Promise<boolean> {
    try {
      if (!messaging) {
        return false
      }

      await deleteToken(messaging)
      console.log('Token FCM supprimé')
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du token:', error)
      return false
    }
  }

  // Vérifier si les notifications sont supportées
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  }

  // Vérifier la permission actuelle
  getPermissionStatus(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission
    }
    return 'denied'
  }

  // Envoyer une notification de test (pour le développement)
  async sendTestNotification(): Promise<void> {
    if (this.getPermissionStatus() === 'granted') {
      const notification = new Notification('Test de notification', {
        body: 'Ceci est une notification de test depuis votre application',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
      })

      setTimeout(() => {
        notification.close()
      }, 3000)
    } else {
      console.warn('Permission de notification non accordée')
    }
  }

  // Types de notifications pour l'application
  static NotificationTypes = {
    REPAIR_STARTED: 'repair_started',
    REPAIR_COMPLETED: 'repair_completed',
    QUOTE_READY: 'quote_ready',
    PAYMENT_CONFIRMED: 'payment_confirmed',
    CAR_REMINDER: 'car_reminder'
  } as const

  // Créer les données de notification pour chaque type
  createNotificationData(type: keyof typeof NotificationService.NotificationTypes, data: any): NotificationData {
    switch (type) {
      case 'REPAIR_STARTED':
        return {
          title: 'Réparation démarrée',
          body: `La réparation de votre véhicule a commencé`,
          data: { repairId: data.repairId, type: 'repair_started' }
        }
      
      case 'REPAIR_COMPLETED':
        return {
          title: 'Réparation terminée',
          body: `La réparation de votre véhicule est terminée`,
          data: { repairId: data.repairId, type: 'repair_completed' }
        }
      
      case 'QUOTE_READY':
        return {
          title: 'Devis disponible',
          body: `Le devis pour votre réparation est prêt`,
          data: { repairId: data.repairId, type: 'quote_ready' }
        }
      
      case 'PAYMENT_CONFIRMED':
        return {
          title: 'Paiement confirmé',
          body: `Votre paiement de ${data.amount} a été confirmé`,
          data: { paymentId: data.paymentId, type: 'payment_confirmed' }
        }
      
      default:
        return {
          title: 'Notification',
          body: 'Vous avez une nouvelle notification',
          data: { type: 'general' }
        }
    }
  }
}

export const notificationService = new NotificationService()
