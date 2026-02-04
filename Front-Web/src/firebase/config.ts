import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// Configuration Firebase - même configuration que le mobile
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

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
console.log('Firebase initialisé avec succès pour le front-web')

// Initialiser Realtime Database
const database = getDatabase(app)

export default app
export { database }
