// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8XeeQlZnjpYm8zwOcGDabnqcU9DSc6uo",
  authDomain: "garage-s5-projet.firebaseapp.com",
  databaseURL: "https://garage-s5-projet-default-rtdb.firebaseio.com",
  projectId: "garage-s5-projet",
  storageBucket: "garage-s5-projet.firebasestorage.app",
  messagingSenderId: "1020636271173",
  appId: "1:1020636271173:web:3a06d9373f3a44663cc92c",
  measurementId: "G-ZJXPVKHNEG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);