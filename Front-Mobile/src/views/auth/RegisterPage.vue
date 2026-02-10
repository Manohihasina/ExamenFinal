<template>
  <ion-page>
    <ion-content :fullscreen="true" class="modern-content">
      <!-- Background Gradient -->
      <div class="register-background">
        <div class="background-pattern"></div>
      </div>

      <!-- Register Container -->
      <div class="register-container">
        <!-- Logo and Welcome Section -->
        <div class="welcome-section">
          <div class="logo-container">
            <div class="logo-icon">
              <ion-icon :icon="carOutline"></ion-icon>
            </div>
            <h1>MrRojo</h1>
            <p>Créez votre compte pour commencer</p>
          </div>
        </div>

        <!-- Register Form -->
        <div class="form-container">
          <div class="form-card">
            <div class="form-header">
              <h2>Créer un compte</h2>
              <p>Gérez vos réparations automobiles</p>
            </div>
            
            <form @submit.prevent="handleRegister" class="register-form">
              <div class="form-group">
                <label class="form-label">Email</label>
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
                <label class="form-label">Nom complet</label>
                <div class="input-container">
                  <ion-icon :icon="personOutline" class="input-icon"></ion-icon>
                  <ion-input 
                    v-model="form.displayName" 
                    type="text" 
                    placeholder="Jean Dupont"
                    class="modern-input"
                  ></ion-input>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Mot de passe</label>
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

              <div class="form-group">
                <label class="form-label">Confirmer le mot de passe</label>
                <div class="input-container">
                  <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
                  <ion-input 
                    v-model="form.confirmPassword" 
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
                class="register-button"
              >
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                <span v-else>S'inscrire</span>
              </ion-button>

              <div class="form-actions">
                <ion-button 
                  fill="clear" 
                  expand="block" 
                  @click="$router.push('/login')"
                  class="login-link"
                >
                  <ion-icon :icon="logInOutline" slot="start"></ion-icon>
                  Déjà un compte ? Se connecter
                </ion-button>
              </div>
            </form>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>&copy; 2024 MrRojo - Tous droits réservés</p>
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
  toastController
} from '@ionic/vue'
import { 
  carOutline,
  mailOutline,
  personOutline,
  lockClosedOutline,
  logInOutline
} from 'ionicons/icons'
import { authService } from '@/services/auth.service'

const router = useRouter()
const loading = ref(false)

const form = reactive({
  email: '',
  displayName: '',
  password: '',
  confirmPassword: ''
})

const validateForm = (): boolean => {
  if (form.password !== form.confirmPassword) {
    showToast('Les mots de passe ne correspondent pas', 'danger')
    return false
  }

  if (form.password.length < 6) {
    showToast('Le mot de passe doit contenir au moins 6 caractères', 'danger')
    return false
  }

  if (!form.email.includes('@')) {
    showToast('Veuillez entrer un email valide', 'danger')
    return false
  }

  return true
}

const handleRegister = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    await authService.register(form.email, form.password, form.displayName)
    
    showToast('Compte créé avec succès !', 'success')
    
    // Rediriger vers la page principale
    setTimeout(() => {
      router.replace('/tabs/home')
    }, 1500)

  } catch (error: any) {
    showToast(error.message, 'danger')
  } finally {
    loading.value = false
  }
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