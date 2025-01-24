import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAEuk1wol1lNcSrzEGqRu31kCuoGpD9PTQ",
  authDomain: "jeu-hasard.firebaseapp.com",
  databaseURL: "https://jeu-hasard-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jeu-hasard",
  storageBucket: "jeu-hasard.appspot.com",
  messagingSenderId: "654185101593",
  appId: "1:654185101593:web:5b95112878620ace536d88"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

// Variables pour gérer l'état du jeu
let userId = localStorage.getItem("userId");
let username = localStorage.getItem("username");
let randomNumber;
let compteur = 0;
let score = 0;

// Gestion de la connexion via cookie
if (!userId) {
  const loginDiv = document.getElementById("login");
  const gameDiv = document.getElementById("game");
  const usernameInput = document.getElementById("username");
  const loginButton = document.getElementById("loginButton");

  // Si pas de cookie, on demande un pseudo
  loginButton.addEventListener("click", async () => {
    username = usernameInput.value.trim();

    // Validation : autoriser uniquement les lettres
    const usernameRegex = /^[a-zA-Z]+$/;
    if (!usernameRegex.test(username)) {
      alert("Le pseudo ne peut contenir que des lettres (A-Z, a-z). Pas de chiffres, espaces ou caractères spéciaux.");
      return;
    }

    if (username === "") {
      alert("Veuillez entrer un pseudo !");
      return;
    }

    // Connexion avec un nouveau pseudo
    signInAnonymously(auth).then(() => {
      userId = auth.currentUser.uid;
      localStorage.setItem("userId", userId);
      localStorage.setItem("username", username);
      console.log("Utilisateur connecté anonymement !");
      loginDiv.style.display = "none";
      gameDiv.style.display = "block";
      startGame();
      afficherScores(); // Charger les scores dès la connexion
    }).catch((error) => console.error("Erreur d'authentification :", error));
  });
} else {
  // Si déjà connecté avec cookie, on charge le jeu directement
  const loginDiv = document.getElementById("login");
  const gameDiv = document.getElementById("game");
  loginDiv.style.display = "none";
  gameDiv.style.display = "block";
  username = localStorage.getItem("username");
  startGame();
  afficherScores(); // Charger les scores dès la connexion
}

// Fonction pour démarrer une nouvelle partie
function startGame() {
  randomNumber = Math.floor(Math.random() * 100) + 1;
  compteur = 0;
  score = 0;

  document.getElementById("proposition").value = '';
  document.querySelector(".resultat").textContent = '';
  document.querySelector(".tropHautTropBas").textContent = '';
  document.querySelector(".tentatives").textContent = '';
  document.getElementById("proposition").disabled = false;
  document.getElementById("envoyer").disabled = false;
}

// Fonction pour afficher les scores
function afficherScores() {
  const scoresRef = ref(db, "scores");
  onValue(scoresRef, (snapshot) => {
    const scoresData = snapshot.val();
    if (!scoresData) {
      console.log("Aucun score trouvé.");
      return;
    }

    const scoresArray = [];
    for (const key in scoresData) {
      scoresArray.push(scoresData[key]);
    }

    scoresArray.sort((a, b) => b.score - a.score); // Tri des scores par ordre décroissant

    const scoreTable = document.getElementById("scoreTable").querySelector("tbody");
    scoreTable.innerHTML = ''; // Réinitialiser le tableau avant de l'afficher

    scoresArray.forEach((data, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${data.username}</td>
        <td>${data.score}</td>
      `;
      scoreTable.appendChild(row);
    });
  });
}
