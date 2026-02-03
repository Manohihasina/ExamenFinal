import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, doc, getDoc, enableNetwork, disableNetwork } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyA8XeeQlZnjpYm8zwOcGDabnqcU9DSc6uo",
  authDomain: "garage-s5-projet.firebaseapp.com",
  databaseURL: "https://garage-s5-projet-default-rtdb.firebaseio.com",
  projectId: "garage-s5-projet",
  storageBucket: "garage-s5-projet.firebasestorage.app",
  messagingSenderId: "1020636271173",
  appId: "1:1020636271173:web:3a06d9373f3a44663cc92c",
  measurementId: "G-ZJXPVKHNEG"
}

// Initialiser Firebase avec gestion d'erreur
let app
try {
  app = initializeApp(firebaseConfig)
  console.log('Firebase initialisé avec succès')
} catch (error) {
  console.error('Erreur d\'initialisation Firebase:', error)
  throw error
}

// 🔥 SERVICES
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const messaging = getMessaging(app)

// Gestion de la connexion Firestore pour éviter les NS_BINDING_ABORTED
let networkEnabled = true

export const enableFirestoreNetwork = async () => {
  try {
    if (!networkEnabled) {
      await enableNetwork(db)
      networkEnabled = true
      console.log('✅ Firestore réseau activé')
    }
  } catch (error) {
    console.error('❌ Erreur activation réseau Firestore:', error)
  }
}

export const disableFirestoreNetwork = async () => {
  try {
    if (networkEnabled) {
      await disableNetwork(db)
      networkEnabled = false
      console.log('🔌 Firestore réseau désactivé')
    }
  } catch (error) {
    console.error('❌ Erreur désactivation réseau Firestore:', error)
  }
}

// Gérer la perte de connexion
export const handleFirestoreConnection = () => {
  // Activer le réseau au démarrage
  enableFirestoreNetwork()
  
  // Gérer les changements de connectivité
  window.addEventListener('online', () => {
    console.log('🌐 Connexion rétablie')
    enableFirestoreNetwork()
  })
  
  window.addEventListener('offline', () => {
    console.log('📵 Connexion perdue')
    disableFirestoreNetwork()
  })
}

// Test de connexion
export const testFirebaseConnection = async () => {
  try {
    // Test Firestore
    const testDoc = await getDoc(doc(db, 'test', 'connection'))
    if (testDoc.exists()) {
      console.log('✅ Firestore connecté - document de test trouvé')
    } else {
      console.log('✅ Firestore connecté - document de test non trouvé (normal)')
    }
    
    // Test Auth
    const currentUser = auth.currentUser
    console.log('✅ Auth initialisé', currentUser ? 'utilisateur connecté' : 'aucun utilisateur')
    
    return { success: true, message: 'Firebase connecté' }
  } catch (error) {
    console.error('❌ Erreur de connexion Firebase:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, error: errorMessage }
  }
}

// Fonction pour obtenir le token FCM pour les notifications push
export const getFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'votre-vapid-key-pour-notifications-push'
      })
      console.log('FCM Token:', token)
      return token
    } else {
      console.log('Notification permission denied')
      return null
    }
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Fonction pour écouter les messages en premier plan
export const onMessageListener = () => {
  return onMessage(messaging, (payload: any) => {
    console.log('Foreground message received:', payload)
    // Afficher une notification dans l'application
    if (payload.notification) {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icon.png'
      })
    }
  })
}

export default app
export { firebaseConfig }
