import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
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
let maxTentatives = 10; // Par défaut, 10 tentatives

// Gestion de la connexion via cookie ou nouvel utilisateur
if (!userId) {
  setupLogin();
} else {
  setupGame();
  startGame();
  afficherScores();
}

/** 
 * Configuration de la partie pour les nouveaux utilisateurs
 */
function setupLogin() {
  const loginDiv = document.getElementById("login");
  const gameDiv = document.getElementById("game");
  const usernameInput = document.getElementById("username");
  const loginButton = document.getElementById("loginButton");

  // Ajouter l'événement "Entrée" pour la validation du pseudo
  usernameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      loginButton.click(); // Simuler un clic sur le bouton de connexion
    }
  });

  loginButton.addEventListener("click", async () => {
    username = usernameInput.value.trim();

    // Validation du pseudo (uniquement lettres)
    if (!/^[a-zA-Z]+$/.test(username)) {
      alert("Le pseudo doit contenir uniquement des lettres (A-Z, a-z).");
      usernameInput.value = '';
      return;
    }

    if (!username) {
      alert("Veuillez entrer un pseudo !");
      return;
    }

    // Connexion anonyme Firebase
    try {
      await signInAnonymously(auth);
      userId = auth.currentUser.uid;
      localStorage.setItem("userId", userId);
      localStorage.setItem("username", username);

      loginDiv.style.display = "none";
      gameDiv.style.display = "block";

      startGame();
      afficherScores();
    } catch (error) {
      console.error("Erreur d'authentification :", error);
    }
  });
}

/** 
 * Configuration de la partie pour les utilisateurs déjà connectés
 */
function setupGame() {
  document.getElementById("login").style.display = "none";
  document.getElementById("game").style.display = "block";
  username = localStorage.getItem("username");

  // Vérification si l'élément "difficulty" existe avant d'y accéder
  const difficultyElement = document.getElementById("difficulty");

  if (difficultyElement) {
    const difficulty = difficultyElement.value;
    maxTentatives = difficulty === "facile" ? 15 : difficulty === "moyen" ? 10 : 5; // Difficulté en fonction du choix
    console.log("Difficulté sélectionnée : " + difficulty);
  } else {
    // Si l'élément "difficulty" n'existe pas, tu peux gérer cette situation
    // Par exemple, définir une valeur par défaut
    maxTentatives = 10;
    console.log("Aucune difficulté définie. Utilisation de la difficulté par défaut.");
  }
}

/** 
 * Démarrer une nouvelle partie
 */
function startGame() {
  randomNumber = Math.floor(Math.random() * 100) + 1;
  compteur = 0;
  score = 0;

  // Réinitialiser les champs
  document.getElementById("proposition").value = '';
  document.querySelector(".resultat").textContent = '';
  document.querySelector(".tropHautTropBas").textContent = '';
  document.querySelector(".tentatives").textContent = '';
  document.getElementById("proposition").disabled = false;
  document.getElementById("envoyer").disabled = false;
  document.getElementById("reset").style.display = "none";

  document.getElementById("proposition").focus();
}

/** 
 * Vérification de la proposition utilisateur
 */
function verifier() {
  const proposition = Number(document.getElementById("proposition").value);

  if (isNaN(proposition) || proposition < 1 || proposition > 100) {
    document.querySelector(".tropHautTropBas").textContent = "Veuillez entrer un nombre valide entre 1 et 100.";
    return;
  }

  compteur++;

  if (proposition === randomNumber) {
    handleWin();
  } else if (proposition < randomNumber) {
    document.querySelector(".tropHautTropBas").textContent = "C'est plus grand !";
  } else {
    document.querySelector(".tropHautTropBas").textContent = "C'est plus petit !";
  }

  document.querySelector(".tentatives").textContent = `Tentatives : ${compteur}`;
  document.getElementById("proposition").value = '';
  document.getElementById("proposition").focus();

  if (compteur === maxTentatives && proposition !== randomNumber) {
    handleLoss();
  }
}

/** 
 * Gérer une victoire
 */
function handleWin() {
  score = Math.max(100 - compteur * 10, 0); // Calcul du score
  document.querySelector(".resultat").textContent = `Bravo ${username || "Invité"} ! Vous avez trouvé en ${compteur} tentatives. 🎉`;
  document.querySelector(".tentatives").textContent = `Score gagné : ${score} points.`;
  sauvegarderScore(username, score);
  afficherScores();
  finDeJeu();
}

/** 
 * Gérer une défaite
 */
function handleLoss() {
  document.querySelector(".resultat").textContent = `Perdu ! Le nombre était ${randomNumber}. 😢`;
  finDeJeu();
}

/** 
 * Fin de la partie
 */
function finDeJeu() {
  document.getElementById("envoyer").disabled = true;
  document.getElementById("proposition").disabled = true;
  document.getElementById("reset").style.display = "inline";
}

/** 
 * Sauvegarder le score d'un utilisateur
 */
function sauvegarderScore(username, points) {
  const userRef = ref(db, `scores/${userId}`);

  get(userRef).then((snapshot) => {
    const newScore = snapshot.exists() ? snapshot.val().score + points : points;

    set(userRef, {
      username: username,
      score: newScore
    }).then(() => console.log("Score mis à jour !"))
      .catch((error) => console.error("Erreur enregistrement :", error));
  }).catch((error) => console.error("Erreur récupération score :", error));
}

/** 
 * Afficher les scores dans le tableau
 */
function afficherScores() {
  const scoresRef = ref(db, "scores");

  onValue(scoresRef, (snapshot) => {
    const scoresData = snapshot.val();
    if (!scoresData) return;

    const scoresArray = Object.values(scoresData).sort((a, b) => b.score - a.score);
    const scoreTable = document.querySelector("#scoreTable tbody");
    scoreTable.innerHTML = '';

    scoresArray.forEach((data, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${index + 1}</td><td>${data.username}</td><td>${data.score}</td>`;
      scoreTable.appendChild(row);
    });
  });
}

// Écouter l'événement sur le bouton envoyer
document.getElementById("envoyer").addEventListener("click", verifier);

// Écouter l'événement sur le bouton reset pour recommencer le jeu
document.getElementById("reset").addEventListener("click", startGame);

// Menu déroulant
document.getElementById("difficulty").addEventListener("change", setupGame);
