// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDRRwicJZ80nQ8VK8t1QIY9ZTe3SkWwWA8",
  authDomain: "tradingjurnal-80a3d.firebaseapp.com",
  projectId: "tradingjurnal-80a3d",
  storageBucket: "tradingjurnal-80a3d.firebasestorage.app",
  messagingSenderId: "195900788344",
  appId: "1:195900788344:web:621a5400ba6a26ad11678d"
};

// 🔌 Inițializare Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🎯 Referințe la elementele din UI
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");
const authSection = document.getElementById("auth-section");

// 🔐 LOGIN
loginBtn?.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    alert("Logare reușită!");
  } catch (error) {
    alert("❌ Eroare la logare: " + error.message);
  }
});

// 🆕 REGISTER
registerBtn?.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    alert("✅ Cont creat cu succes!");
  } catch (error) {
    alert("❌ Eroare la înregistrare: " + error.message);
  }
});

// 🚪 LOGOUT
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  alert("Te-ai delogat!");
});

// 👁️ UI în funcție de logare
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.style.display = "none";
    logoutBtn.style.display = "inline-block";
    console.log("✅ User logat:", user.uid);
  } else {
    authSection.style.display = "flex";
    logoutBtn.style.display = "none";
    console.log("ℹ️ User delogat");
  }
});

