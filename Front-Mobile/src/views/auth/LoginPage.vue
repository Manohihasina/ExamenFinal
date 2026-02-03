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
                  Pas encore de compte ? S'inscrire
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
    
    // Rediriger vers la page principale
    setTimeout(() => {
      router.replace('/tabs/home')
    }, 1000)

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
/* Content Modern */
.modern-content {
  --background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  --overflow: hidden;
}

/* Background Pattern */
.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.background-pattern {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 40% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
}

/* Login Container */
.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

/* Welcome Section */
.welcome-section {
  text-align: center;
  margin-bottom: 40px;
  animation: slideInDown 0.8s ease-out;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.logo-icon ion-icon {
  font-size: 2.5rem;
  color: white;
}

.logo-container h1 {
  margin: 0 0 8px 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.logo-container p {
  margin: 0;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
}

/* Form Container */
.form-container {
  width: 100%;
  max-width: 400px;
  animation: slideInUp 0.8s ease-out 0.2s both;
}

.form-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
}

.form-header p {
  margin: 0;
  font-size: 1rem;
  color: #64748b;
}

/* Form Styles */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  font-size: 1.2rem;
  color: #64748b;
  z-index: 1;
}

.modern-input {
  --background: white;
  --border-color: rgba(0, 0, 0, 0.1);
  --border-radius: 12px;
  --padding-start: 48px;
  --padding-end: 16px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  --highlight-color-focused: #3b82f6;
  --color: #1e293b;
  --placeholder-color: #94a3b8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.modern-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Buttons */
.login-button {
  --background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  --border-radius: 12px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  font-weight: 600;
  font-size: 1rem;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.reset-button, .register-button {
  --color: #64748b;
  --border-color: transparent;
  --background: transparent;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.reset-button:hover, .register-button:hover {
  --color: #3b82f6;
  --background: rgba(59, 130, 246, 0.05);
}

/* Footer */
.footer {
  margin-top: 40px;
  text-align: center;
  animation: slideInUp 0.8s ease-out 0.4s both;
}

.footer p {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
}

/* Animations */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    padding: 16px;
  }
  
  .form-card {
    padding: 30px 20px;
  }
  
  .logo-icon {
    width: 60px;
    height: 60px;
  }
  
  .logo-icon ion-icon {
    font-size: 2rem;
  }
  
  .logo-container h1 {
    font-size: 2rem;
  }
  
  .form-header h2 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .form-card {
    padding: 24px 16px;
  }
  
  .logo-container h1 {
    font-size: 1.8rem;
  }
  
  .form-header h2 {
    font-size: 1.3rem;
  }
  
  .modern-input {
    --padding-top: 14px;
    --padding-bottom: 14px;
  }
  
  .login-button {
    --padding-top: 14px;
    --padding-bottom: 14px;
  }
}
</style>