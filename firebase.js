
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Configurações do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCWLhoLodhrfJlp3tQKXrF5BBz0tuprSNM",
  authDomain: "aspen-c82b6.firebaseapp.com",
  projectId: "aspen-c82b6",
  storageBucket: "aspen-c82b6.firebasestorage.app",
  messagingSenderId: "947316976885",
  appId: "1:947316976885:web:0f21a7b617d13a918b29bc",
  measurementId: "G-MM7R031X5P"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Disponibiliza a autenticação
export const auth = getAuth(app);

// Disponibiliza o banco de dados Firestore
export const db = getFirestore(app);
