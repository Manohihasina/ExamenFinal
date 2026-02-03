import { ref, onMounted } from 'vue'
import { authService } from '@/services/auth.service'

export function useAuth() {
  const user = ref<any>(null)
  const loading = ref(true)

  // Initialiser l'état d'authentification
  const initAuth = () => {
    // Vérifier le localStorage au démarrage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('Erreur parsing user from localStorage:', error)
        localStorage.removeItem('user')
      }
    }

    // Écouter les changements d'état Firebase
    authService.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        }
        // Synchroniser avec localStorage
        localStorage.setItem('user', JSON.stringify(user.value))
      } else {
        user.value = null
        // Nettoyer localStorage
        localStorage.removeItem('user')
      }
      loading.value = false
    })
  }

  // Déconnexion
  const logout = async () => {
    try {
      await authService.logout()
      user.value = null
      localStorage.removeItem('user')
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    }
  }

  onMounted(() => {
    initAuth()
  })

  return {
    user,
    loading,
    logout
  }
}
