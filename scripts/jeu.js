import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update, child } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAEuk1wol1lNcSrzEGqRu31kCuoGpD9PTQ",
  authDomain: "jeu-hasard.firebaseapp.com",
  databaseURL: "https://jeu-hasard-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jeu-hasard",
  storageBucket: "jeu-hasard.appspot.com",
  messagingSenderId: "654185101593",
  appId: "1:654185101593:web:5b95112878620ace536d88"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

// Récupérer ou créer un cookie pour l'utilisateur
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000)); // Durée de vie du cookie
  const expires = `expires=${d.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

// Variables utilisateur
let userId = getCookie("userId");
let username = null;
let score = 0;  // Le score global

// Initialiser Firebase Auth et vérifier l'authentification
function initAuth() {
  if (userId) {
    // Si le cookie existe, utiliser l'ID utilisateur du cookie
    console.log("Utilisateur récupéré depuis le cookie :", userId);
    chargerScore();
  } else {
    // Si aucun cookie, connecter anonymement l'utilisateur
    signInAnonymously(auth)
      .then(() => {
        userId = auth.currentUser.uid;
        setCookie("userId", userId, 30);  // Créer un cookie qui dure 30 jours
        console.log("Utilisateur connecté anonymement :", userId);
        chargerScore();
      })
      .catch((error) => console.error("Erreur d'authentification :", error));
  }
}

// Charger le score depuis la base de données
async function chargerScore() {
  const scoreRef = ref(db, `scores/${userId}`);
  const snapshot = await get(scoreRef);
  if (snapshot.exists()) {
    score = snapshot.val().score;  // Charger le score existant
    console.log("Score chargé depuis la base de données :", score);
  } else {
    console.log("Aucun score trouvé, création d'un score initial.");
    score = 0;  // Score initial si l'utilisateur n'a pas de score
  }
}

// Sauvegarder ou mettre à jour le score dans la base de données
function sauvegarderScore(username, points) {
  const userRef = ref(db, `scores/${userId}`);
  set(userRef, { username, score: points })
    .then(() => {
      console.log("Score mis à jour avec succès !");
      afficherScores();
    })
    .catch((error) => {
      console.error("Erreur lors de l'enregistrement du score :", error);
    });
}

// Vérifier si le pseudo est déjà pris
function verifierPseudoDispo(username) {
  const usernameRef = ref(db, 'scores');
  return get(usernameRef).then(snapshot => {
    const users = snapshot.val();
    if (users) {
      for (const key in users) {
        if (users[key].username === username) {
          return false;  // Le pseudo est déjà pris
        }
      }
    }
    return true;  // Le pseudo est disponible
  });
}

// Afficher les scores dans le tableau HTML
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

    scoresArray.sort((a, b) => b.score - a.score); // Trier par score décroissant

    const scoreTable = document.getElementById("scoreTable").querySelector("tbody");
    scoreTable.innerHTML = ''; // Vider le tableau avant de le remplir

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

// Gestion du jeu
(() => {
  let randomNumber;
  let compteur = 0;

  const loginDiv = document.getElementById("login");
  const gameDiv = document.getElementById("game");
  const usernameInput = document.getElementById("username");
  const loginButton = document.getElementById("loginButton");

  const input = document.getElementById("proposition");
  const envoyer = document.getElementById("envoyer");
  const reset = document.getElementById("reset");
  const resultat = document.querySelector(".resultat");
  const tropHautTropBas = document.querySelector(".tropHautTropBas");
  const tentatives = document.querySelector(".tentatives");

  // Si le cookie existe déjà, récupérer le pseudo
  if (userId) {
    username = getCookie("username") || "Invité";  // Si le cookie existe, on récupère le pseudo
  }

  // Connexion ou mode invité
  loginButton.addEventListener("click", async () => {
    username = usernameInput.value.trim() || "Invité"; // Si pas de nom, utilisateur reste "Invité"
    
    // Vérifier si le pseudo est déjà pris
    const pseudoDispo = await verifierPseudoDispo(username);
    if (!pseudoDispo) {
      alert("Ce pseudo est déjà pris. Veuillez en choisir un autre.");
      return;
    }

    setCookie("username", username, 30); // Créer un cookie pour le pseudo
    loginDiv.style.display = "none";
    gameDiv.style.display = "block";
    startGame();
    
    // Désactiver l'input du pseudo après la connexion
    usernameInput.disabled = true; // Désactiver le champ du pseudo une fois qu'il est défini
  });

  // Démarrer un nouveau jeu
  function startGame() {
    randomNumber = Math.floor(Math.random() * 100) + 1;
    compteur = 0;

    input.value = "";
    resultat.textContent = "";
    tropHautTropBas.textContent = "";
    tentatives.textContent = "";
    input.disabled = false;
    envoyer.disabled = false;

    input.focus();
  }

  // Vérification de la proposition
  function verifier() {
    const proposition = Number(input.value);
    if (isNaN(proposition) || proposition < 1 || proposition > 100) {
      tropHautTropBas.textContent = "Veuillez entrer un nombre valide entre 1 et 100.";
      return;
    }
    compteur++;

    if (proposition === randomNumber) {
      const pointsGagnes = Math.max(100 - compteur * 10, 0); // Calcul du score
      score += pointsGagnes; // Ajouter les points au score actuel
      resultat.textContent = `Bravo ${username} ! Vous avez trouvé en ${compteur} tentatives. 🎉`;
      tentatives.textContent = `Score gagné : ${pointsGagnes} points.`;

      // Sauvegarder le score dans la base de données
      sauvegarderScore(username, score);
      finDeJeu();
    } else if (proposition < randomNumber) {
      tropHautTropBas.textContent = "C'est plus grand !";
    } else {
      tropHautTropBas.textContent = "C'est plus petit !";
    }

    tentatives.textContent = `Tentatives : ${compteur}`;
    input.value = "";
    input.focus();

    if (compteur === 10 && proposition !== randomNumber) {
      resultat.textContent = `Perdu ! Le nombre était ${randomNumber}. 😢`;
      finDeJeu();
    }
  }

  // Désactiver le jeu
  function finDeJeu() {
    envoyer.disabled = true;
    input.disabled = true;
  }

  // Reset du jeu
  reset.addEventListener("click", startGame);

  // Appui sur Enter
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") verifier();
  });

  envoyer.addEventListener("click", verifier);

  // Initialisation de l'authentification et récupération des scores
  initAuth();
})();
