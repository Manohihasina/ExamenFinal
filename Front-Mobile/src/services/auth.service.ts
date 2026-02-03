import { auth } from '@/firebase/config'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth'

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  phoneNumber?: string
  createdAt: Date
}

export class AuthService {
  
  // Inscription d'un nouvel utilisateur
  async register(email: string, password: string, displayName?: string): Promise<UserCredential> {
    if (!auth) {
      throw new Error('Firebase Auth n\'est pas initialisé')
    }
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Mettre à jour le profil si displayName est fourni
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName })
      }
      
      return result
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Connexion d'un utilisateur
  async login(email: string, password: string): Promise<UserCredential> {
    if (!auth) {
      throw new Error('Firebase Auth n\'est pas initialisé')
    }
    
    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth n\'est pas initialisé')
    }
    
    try {
      await signOut(auth)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    return auth ? auth.currentUser : null
  }

  // Observer les changements d'état d'authentification
  onAuthStateChanged(callback: (user: User | null) => void) {
    if (!auth) {
      // Retourner une fonction vide si auth n'est pas initialisé
      return () => {}
    }
    return auth.onAuthStateChanged(callback)
  }

  // Réinitialiser le mot de passe
  async resetPassword(email: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth n\'est pas initialisé')
    }
    
    try {
      // Cette fonction nécessite l'importation de sendPasswordResetEmail
      const { sendPasswordResetEmail } = await import('firebase/auth')
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Gestion des erreurs
  private handleError(error: any): Error {
    let message = 'Une erreur est survenue'
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Utilisateur non trouvé'
        break
      case 'auth/wrong-password':
        message = 'Mot de passe incorrect'
        break
      case 'auth/email-already-in-use':
        message = 'Cet email est déjà utilisé'
        break
      case 'auth/weak-password':
        message = 'Le mot de passe est trop faible'
        break
      case 'auth/invalid-email':
        message = 'Email invalide'
        break
      default:
        message = error.message || message
    }
    
    return new Error(message)
  }
}

export const authService = new AuthService()
