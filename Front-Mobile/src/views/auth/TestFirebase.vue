<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Test Firebase</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="test-container">
        <h2>Test de Connexion Firebase</h2>
        
        <!-- Test d'inscription -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Inscription Test</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input v-model="registerEmail" type="email" placeholder="test@example.com"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Mot de passe</ion-label>
              <ion-input v-model="registerPassword" type="password" placeholder="••••••"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Nom</ion-label>
              <ion-input v-model="registerName" placeholder="Test User"></ion-input>
            </ion-item>
            <ion-button expand="block" @click="testRegister" :disabled="loading">
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              S'inscrire
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Test de connexion -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Connexion Test</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input v-model="loginEmail" type="email" placeholder="test@example.com"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Mot de passe</ion-label>
              <ion-input v-model="loginPassword" type="password" placeholder="••••••"></ion-input>
            </ion-item>
            <ion-button expand="block" @click="testLogin" :disabled="loading">
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              Se connecter
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Statut de l'utilisateur -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Statut Utilisateur</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="currentUser">
              <p><strong>Connecté:</strong> {{ currentUser.email }}</p>
              <p><strong>UID:</strong> {{ currentUser.uid }}</p>
              <p><strong>Nom:</strong> {{ currentUser.displayName || 'Non défini' }}</p>
              <ion-button expand="block" color="danger" @click="testLogout">
                Déconnexion
              </ion-button>
            </div>
            <div v-else>
              <p>Aucun utilisateur connecté</p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Messages de test -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Messages de Test</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-for="(message, index) in testMessages" :key="index" 
                 :class="['test-message', message.type]">
              <p>{{ message.text }}</p>
              <small>{{ new Date(message.timestamp).toLocaleTimeString() }}</small>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Test de notifications -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Notifications Push</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button expand="block" @click="testFCMToken">
              Obtenir Token FCM
            </ion-button>
            <div v-if="fcmToken">
              <p><strong>FCM Token:</strong></p>
              <ion-textarea readonly :value="fcmToken" :rows="3"></ion-textarea>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonTextarea
} from '@ionic/vue'
import { authService } from '@/services/auth.service'
import { getFCMToken } from '@/firebase/config-simple'
import type { User } from 'firebase/auth'

// États réactifs
const loading = ref(false)
const currentUser = ref<User | null>(null)
const testMessages = ref<Array<{text: string, type: 'success' | 'error' | 'info', timestamp: number}>>([])
const fcmToken = ref<string>('')

// Formulaires
const registerEmail = ref('test@example.com')
const registerPassword = ref('password123')
const registerName = ref('Test User')
const loginEmail = ref('test@example.com')
const loginPassword = ref('password123')

// Ajouter un message de test
const addMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
  testMessages.value.unshift({
    text,
    type,
    timestamp: Date.now()
  })
  
  // Limiter à 10 messages
  if (testMessages.value.length > 10) {
    testMessages.value = testMessages.value.slice(0, 10)
  }
}

// Test d'inscription
const testRegister = async () => {
  loading.value = true
  try {
    const result = await authService.register(
      registerEmail.value, 
      registerPassword.value, 
      registerName.value
    )
    addMessage(`✅ Inscription réussie: ${result.user.email}`, 'success')
    currentUser.value = result.user
  } catch (error: any) {
    addMessage(`❌ Erreur inscription: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// Test de connexion
const testLogin = async () => {
  loading.value = true
  try {
    const result = await authService.login(loginEmail.value, loginPassword.value)
    addMessage(`✅ Connexion réussie: ${result.user.email}`, 'success')
    currentUser.value = result.user
  } catch (error: any) {
    addMessage(`❌ Erreur connexion: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// Test de déconnexion
const testLogout = async () => {
  loading.value = true
  try {
    await authService.logout()
    addMessage(`✅ Déconnexion réussie`, 'success')
    currentUser.value = null
  } catch (error: any) {
    addMessage(`❌ Erreur déconnexion: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// Test du token FCM
const testFCMToken = async () => {
  try {
    const token = await getFCMToken()
    if (token) {
      fcmToken.value = token
      addMessage(`✅ Token FCM obtenu: ${token.substring(0, 20)}...`, 'success')
    } else {
      addMessage(`⚠️ Permission de notification refusée`, 'error')
    }
  } catch (error: any) {
    addMessage(`❌ Erreur FCM: ${error.message}`, 'error')
  }
}

// Observer les changements d'état
onMounted(() => {
  authService.onAuthStateChanged((user) => {
    currentUser.value = user
    if (user) {
      addMessage(`🔄 Utilisateur connecté: ${user.email}`, 'info')
    } else {
      addMessage(`🔄 Utilisateur déconnecté`, 'info')
    }
  })
  
  addMessage(`🚀 Page de test Firebase chargée`, 'success')
})
</script>

<style scoped>
.test-container {
  max-width: 600px;
  margin: 0 auto;
}

.test-message {
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
  border-left: 4px solid;
}

.test-message.success {
  background-color: #d4edda;
  border-left-color: #28a745;
  color: #155724;
}

.test-message.error {
  background-color: #f8d7da;
  border-left-color: #dc3545;
  color: #721c24;
}

.test-message.info {
  background-color: #d1ecf1;
  border-left-color: #17a2b8;
  color: #0c5460;
}

.test-message small {
  display: block;
  opacity: 0.7;
  margin-top: 4px;
}
</style>
