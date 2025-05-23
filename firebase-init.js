import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDRRwicJZ80nQ8VK8t1QIY9ZTe3SkWwWA8",
  authDomain: "tradingjurnal-80a3d.firebaseapp.com",
  projectId: "tradingjurnal-80a3d",
  storageBucket: "tradingjurnal-80a3d.firebasestorage.app",
  messagingSenderId: "195900788344",
  appId: "1:195900788344:web:621a5400ba6a26ad11678d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (e) {
    console.error("Login error:", e.message);
  }
});

registerBtn.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (e) {
    console.error("Register error:", e.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Logout error:", e.message);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Ascunde câmpurile de login și arată doar logout
    emailInput.style.display = "none";
    passwordInput.style.display = "none";
    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    // Arată câmpurile de login și ascunde logout
    emailInput.style.display = "inline-block";
    passwordInput.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
    registerBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
});
