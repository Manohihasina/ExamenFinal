<template>
  <ion-page>
    <ion-content :fullscreen="true" class="modern-content">
      <!-- Background Gradient -->
      <div class="login-background">
        <div class="background-pattern"></div>
      </div>

      <!-- Login Container -->
      <div class="login-container">
        <!-- Logo and Welcome Section -->
        <div class="welcome-section">
          <div class="logo-container">
            <div class="logo-icon">
              <ion-icon :icon="carOutline"></ion-icon>
            </div>
            <h1>IT SUITS-G</h1>
            <p>Gérez votre garage en toute simplicité</p>
          </div>
        </div>

        <!-- Login Form -->
        <div class="form-container">
          <div class="form-card">
            <div class="form-header">
              <h2>Bon retour !</h2>
              <p>Connectez-vous à votre compte</p>
            </div>
            
            <form @submit.prevent="handleLogin" class="login-form">
              <div class="form-group">
                <label class="form-label">
                  <ion-icon :icon="mailOutline" class="label-icon"></ion-icon>
                  Email
                </label>
                <div class="input-container">
                  <ion-icon :icon="mailOutline" class="input-icon"></ion-icon>
                  <ion-input 
                    v-model="form.email" 
                    type="email" 
                    required
                    placeholder="votre@email.com"
                    class="modern-input"
                  ></ion-input>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <ion-icon :icon="lockClosedOutline" class="label-icon"></ion-icon>
                  Mot de passe
                </label>
                <div class="input-container">
                  <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
                  <ion-input 
                    v-model="form.password" 
                    type="password" 
                    required
                    placeholder="••••••••"
                    class="modern-input"
                  ></ion-input>
                </div>
              </div>

              <ion-button 
                type="submit" 
                expand="block" 
                :disabled="loading"
                class="login-button"
              >
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                <span v-else>Se connecter</span>
              </ion-button>

              <div class="form-actions">
                <ion-button 
                  fill="clear" 
                  expand="block" 
                  @click="handleResetPassword"
                  class="reset-button"
                >
                  <ion-icon :icon="keyOutline" slot="start"></ion-icon>
                  Mot de passe oublié ?
                </ion-button>

                <ion-button 
                  fill="clear" 
                  expand="block" 
                  @click="$router.push('/register')"
                  class="register-button"
                >
                  <ion-icon :icon="personAddOutline" slot="start"></ion-icon>
                  <span style="color: white;">Pas encore de compte ? S'inscrire</span>
                </ion-button>
              </div>
            </form>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>&copy; 2024 IT-SUITSG - Tous droits réservés</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { 
  IonPage, 
  IonContent,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
  toastController,
  alertController
} from '@ionic/vue'
import { 
  carOutline,
  mailOutline,
  lockClosedOutline,
  keyOutline,
  personAddOutline
} from 'ionicons/icons'
import { authService } from '@/services/auth.service'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  email: '',
  password: ''
})

const validateForm = (): boolean => {
  if (!form.email.includes('@')) {
    showToast('Veuillez entrer un email valide', 'danger')
    return false
  }

  if (form.password.length < 1) {
    showToast('Veuillez entrer votre mot de passe', 'danger')
    return false
  }

  return true
}

const handleLogin = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const result = await authService.login(form.email, form.password)
    
    // Sauvegarder l'utilisateur dans le localStorage pour le navigation guard
    if (result.user) {
      localStorage.setItem('user', JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      }))
    }
    
    showToast('Connexion réussie !', 'success')
    
    // Redirection immédiate sans timeout
    router.replace('/tabs/home')

  } catch (error: any) {
    showToast(error.message, 'danger')
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async () => {
  const alert = await alertController.create({
    header: 'Réinitialiser le mot de passe',
    message: 'Entrez votre adresse email pour recevoir un lien de réinitialisation',
    inputs: [
      {
        name: 'email',
        type: 'email',
        placeholder: 'votre@email.com'
      }
    ],
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Envoyer',
        handler: async (data) => {
          if (!data.email || !data.email.includes('@')) {
            showToast('Veuillez entrer un email valide', 'danger')
            return false
          }

          try {
            await authService.resetPassword(data.email)
            showToast('Email de réinitialisation envoyé !', 'success')
          } catch (error: any) {
            showToast(error.message, 'danger')
          }
        }
      }
    ]
  })

  await alert.present()
}

const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'bottom'
  })
  await toast.present()
}
</script>
<style scoped>
@import '@/theme/auth.css';
</style>