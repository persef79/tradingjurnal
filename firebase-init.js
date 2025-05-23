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
const authSection = document.getElementById("auth-section");
const mainContent = document.getElementById("main-content");

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    alert("Logare reușită!");
  } catch (e) {
    alert("Eroare la logare: " + e.message);
  }
});

registerBtn.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    alert("Cont creat cu succes!");
  } catch (e) {
    alert("Eroare la înregistrare: " + e.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("Te-ai delogat!");
  } catch (e) {
    alert("Eroare la delogare: " + e.message);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.style.display = "none";
    logoutBtn.style.display = "inline-block";
    mainContent.style.display = "block";
  } else {
    authSection.style.display = "flex";
    logoutBtn.style.display = "none";
    mainContent.style.display = "none";
  }
});
