import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Storage } from '@ionic/storage';

export class FCMService {
  private static instance: FCMService;
  private token: string | null = null;

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  async initialize(): Promise<string | null> {
    try {
      // Vérifier si on est sur le web
      const isWeb = Capacitor.getPlatform() === 'web';
      
      if (isWeb) {
        console.log('🌐 Mode web détecté - FCM non disponible, utilisation de token simulé');
        const mockToken = 'web_mock_token_' + Math.random().toString(36).substr(2, 9);
        this.token = mockToken;
        await this.saveTokenLocally(mockToken);
        return mockToken;
      }

      // Demander la permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive !== 'granted') {
        console.warn('Permission de notification refusée');
        return null;
      }

      // S'inscrire pour recevoir les notifications
      await PushNotifications.register();

      // Écouter l'événement d'enregistrement pour obtenir le token
      return new Promise((resolve) => {
        PushNotifications.addListener('registration', (token) => {
          console.log('FCM Token reçu:', token.value);
          this.token = token.value;
          this.saveTokenLocally(token.value);
          this.sendTokenToBackend(token.value);
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Erreur FCM:', error.error);
          resolve(null);
        });
      });
    } catch (error) {
      console.error('Erreur initialisation FCM:', error);
      return null;
    }
  }

  async saveTokenLocally(token: string): Promise<void> {
    try {
      const storage = new Storage();
      await storage.create();
      await storage.set('fcm_token', token);
    } catch (error) {
      console.error('Erreur sauvegarde token local:', error);
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      const storage = new Storage();
      await storage.create();
      return await storage.get('fcm_token');
    } catch (error) {
      console.error('Erreur récupération token stocké:', error);
      return null;
    }
  }

  async sendTokenToBackend(token: string): Promise<void> {
    try {
      // Récupérer le token d'authentification depuis le stockage
      const storage = new Storage();
      await storage.create();
      const authToken = await storage.get('auth_token');

      if (!authToken) {
        console.warn('Pas de token d\'authentification trouvé');
        return;
      }

      const response = await fetch('https://votre-backend.com/api/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: token,
          device: 'android'
        })
      });

      if (response.ok) {
        console.log('Token FCM envoyé avec succès au backend');
      } else {
        console.error('Erreur envoi token au backend:', response.status);
      }
    } catch (error) {
      console.error('Erreur envoi token au backend:', error);
    }
  }

  async setupNotificationListeners(): Promise<void> {
    // Vérifier si on est sur le web
    const isWeb = Capacitor.getPlatform() === 'web';
    
    if (isWeb) {
      console.log('🌐 Mode web - setup des écouteurs simulés');
      return;
    }

    // Écouter les notifications reçues quand l'app est en premier plan
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Notification reçue en premier plan:', notification);
      this.handleForegroundNotification(notification);
    });

    // Écouter les notifications quand l'utilisateur clique dessus
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Notification cliquée:', notification);
      this.handleNotificationAction(notification);
    });
  }

  private handleForegroundNotification(notification: any): void {
    // Afficher une notification locale ou gérer la logique métier
    const { title, body } = notification.notification;
    
    // Vous pouvez utiliser un toast ou une autre méthode pour afficher
    console.log(`Notification: ${title} - ${body}`);
    
    // Émettre un événement global que les composants peuvent écouter
    window.dispatchEvent(new CustomEvent('fcmNotification', {
      detail: {
        title,
        body,
        data: notification.data
      }
    }));
  }

  private handleNotificationAction(notification: any): void {
    // Gérer la navigation quand l'utilisateur clique sur une notification
    const data = notification.notification.data;
    
    if (data?.type === 'intervention') {
      // Naviguer vers la page des interventions
      window.location.href = '/interventions';
    } else if (data?.type === 'repair_completed') {
      // Naviguer vers la page des réparations
      window.location.href = '/repairs';
    }
  }

  async getCurrentToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }
    
    // Essayer de récupérer depuis le stockage local
    const storedToken = await this.getStoredToken();
    if (storedToken) {
      this.token = storedToken;
      return storedToken;
    }
    
    // Si pas de token, initialiser FCM
    return await this.initialize();
  }

  async removeToken(): Promise<void> {
    try {
      const storage = new Storage();
      await storage.create();
      await storage.remove('fcm_token');
      this.token = null;
      
      // Notifier le backend de supprimer le token
      const authToken = await storage.get('auth_token');
      if (authToken && this.token) {
        await fetch('https://votre-backend.com/api/fcm-token', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            token: this.token
          })
        });
      }
    } catch (error) {
      console.error('Erreur suppression token:', error);
    }
  }

  // Fonctions de test pour simuler les notifications
  async testNotification(type: 'intervention' | 'repair_completed'): Promise<void> {
    const testData = {
      intervention: {
        notification: {
          title: 'Nouvelle Intervention',
          body: 'Une nouvelle intervention a été assignée',
          data: {
            type: 'intervention',
            id: '123',
            priority: 'high'
          }
        }
      },
      repair_completed: {
        notification: {
          title: 'Réparation Terminée',
          body: 'Votre réparation a été complétée avec succès',
          data: {
            type: 'repair_completed',
            id: '456',
            technician: 'Jean Dupont'
          }
        }
      }
    };

    const mockNotification = testData[type];
    
    // Simuler une notification reçue en premier plan
    console.log('🧪 Test notification:', mockNotification);
    this.handleForegroundNotification(mockNotification);
    
    // Simuler une notification cliquée après 2 secondes
    setTimeout(() => {
      console.log('🧪 Test notification action:', mockNotification);
      this.handleNotificationAction(mockNotification);
    }, 2000);
  }

  // Test complet du flux FCM
  async testFCMFlow(): Promise<void> {
    console.log('🧪 Début du test FCM...');
    
    // 1. Tester l'initialisation
    const token = await this.initialize();
    console.log('🧪 Token FCM:', token);
    
    // 2. Tester la sauvegarde locale
    if (token) {
      await this.saveTokenLocally(token);
      console.log('🧪 Token sauvegardé localement');
    }
    
    // 3. Tester la récupération du token
    const storedToken = await this.getStoredToken();
    console.log('🧪 Token récupéré:', storedToken);
    
    // 4. Tester les notifications
    await this.testNotification('intervention');
    
    setTimeout(async () => {
      await this.testNotification('repair_completed');
    }, 5000);
  }
}
