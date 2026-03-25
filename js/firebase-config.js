// Importamos las funciones necesarias de la nube
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Tus credenciales de ElitePOS-Monkeys
const firebaseConfig = {
  apiKey: "AIzaSyCDugQY27dX25-J40Grs5udVXoJHIMqOtI",
  authDomain: "elitepos-monkeys.firebaseapp.com",
  projectId: "elitepos-monkeys",
  storageBucket: "elitepos-monkeys.firebasestorage.app",
  messagingSenderId: "455508672688",
  appId: "1:455508672688:web:c6e6bb6cce76ee40447b75"
};

// Inicializamos la conexión
const app = initializeApp(firebaseConfig);
const db_nube = getFirestore(app);

// Exportamos las herramientas para usarlas en ventas.js
export { db_nube, collection, addDoc };