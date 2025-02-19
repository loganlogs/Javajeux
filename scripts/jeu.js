import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, update } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
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

    // Validation : autoriser uniquement les lettres (A-Z, a-z)
    const usernameRegex = /^[a-zA-Z]+$/;
    if (!usernameRegex.test(username)) {
      alert("Le pseudo ne peut contenir que des lettres (A-Z, a-z). Pas de chiffres, espaces ou caractères spéciaux.");
      usernameInput.value = ''; // On efface l'entrée utilisateur
      return;
    }

    if (username === "") {
      alert("Veuillez entrer un pseudo !");
      return;
    }

    try {
      // Vérification de l'unicité du pseudo
      const isUnique = await verifierPseudo(username);
      if (!isUnique) {
        alert("Ce pseudo est déjà pris, choisissez-en un autre.");
        return;
      }

      // Connexion avec un nouveau pseudo
      await signInAnonymously(auth);
      auth.onAuthStateChanged(user => {
        if (user) {
          console.log("Utilisateur authentifié :", user.uid);

          // L'utilisateur est authentifié, on sauvegarde son ID
          userId = user.uid;
          localStorage.setItem("userId", userId);
          localStorage.setItem("username", username);

          loginDiv.style.display = "none";
          gameDiv.style.display = "block";

          startGame();
          afficherScores(); // Charger les scores dès la connexion
        }
      });
    } catch (error) {
      console.error("Erreur lors de la vérification :", error);
      alert("Impossible de vérifier le pseudo en ce moment. Réessayez plus tard.");
    }
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
  document.getElementById("reset").style.display = "none";

  document.getElementById("proposition").focus();
}

// Vérification de la proposition
function verifier() {
  const proposition = Number(document.getElementById("proposition").value);
  if (isNaN(proposition) || proposition < 1 || proposition > 100) {
    document.querySelector(".tropHautTropBas").textContent = "Veuillez entrer un nombre valide entre 1 et 100.";
    return;
  }
  compteur++;

  if (proposition === randomNumber) {
    score = Math.max(100 - compteur * 10, 0); // Calcul du score
    document.querySelector(".resultat").textContent = `Bravo ${username || "Invité"} ! Vous avez trouvé en ${compteur} tentatives. 🎉`;
    document.querySelector(".tentatives").textContent = `Score gagné : ${score} points.`;
    sauvegarderScore(username, score);
    afficherScores(); // Met à jour le tableau des scores
    finDeJeu();
  } else if (proposition < randomNumber) {
    document.querySelector(".tropHautTropBas").textContent = "C'est plus grand !";
  } else {
    document.querySelector(".tropHautTropBas").textContent = "C'est plus petit !";
  }

  document.querySelector(".tentatives").textContent = `Tentatives : ${compteur}`;
  document.getElementById("proposition").value = '';
  document.getElementById("proposition").focus();

  if (compteur === 10 && proposition !== randomNumber) {
    document.querySelector(".resultat").textContent = `Perdu ! Le nombre était ${randomNumber}. 😢`;
    finDeJeu();
  }
}

// Désactiver les entrées de jeu et afficher "Reset"
function finDeJeu() {
  document.getElementById("envoyer").disabled = true;
  document.getElementById("proposition").disabled = true;
  document.getElementById("reset").style.display = "inline"; // Affiche le bouton Reset
}

// Sauvegarder ou ajouter des points pour un utilisateur
function sauvegarderScore(username, points) {
  const userRef = ref(db, `scores/${userId}`);
  get(userRef).then((snapshot) => {
    if (snapshot.exists()) {
      const existingData = snapshot.val();
      const newScore = existingData.score + points;
      update(userRef, { score: newScore });
    } else {
      set(userRef, { username: username, score: points });
    }
  });
}

// Afficher les scores dans le tableau
function afficherScores() {
  const scoresRef = ref(db, "scores");
  onValue(scoresRef, (snapshot) => {
    const scoresData = snapshot.val();
    if (!scoresData) return;

    const scoresArray = Object.values(scoresData).sort((a, b) => b.score - a.score);
    const scoreTable = document.getElementById("scoreTable").querySelector("tbody");
    scoreTable.innerHTML = '';

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

// Reset de la partie
document.getElementById("reset").addEventListener("click", startGame);

// Appuyer sur Enter pour envoyer la proposition
document.getElementById("proposition").addEventListener("keypress", (e) => {
  if (e.key === 'Enter') verifier();
});

// Appuyer sur "Envoyer"
document.getElementById("envoyer").addEventListener("click", verifier);

// Vérifier si le pseudo est unique avant de l'enregistrer dans la base de données
async function verifierPseudo(pseudo) {
  const scoresRef = ref(db, "scores");
  try {
    const snapshot = await get(scoresRef);
    if (snapshot.exists()) {
      const scoresData = snapshot.val();
      console.log("Données récupérées :", scoresData);
      return !Object.values(scoresData).some(data => data.username === pseudo);
    }
    return true; // Si aucune donnée, le pseudo est unique
  } catch (error) {
    if (error.code === 'PERMISSION_DENIED') {
      console.error("Permission refusée. Vérifiez les règles de sécurité Firebase.");
    } else {
      console.error("Erreur inconnue lors de la vérification du pseudo :", error);
    }
    throw error; // Laisser l'erreur remonter pour être gérée
  }
}

// Ajouter un écouteur d'événements pour chaque bouton de thème
document.getElementById('theme1').addEventListener('click', () => changeTheme('theme-cyberpunk'));
document.getElementById('theme2').addEventListener('click', () => changeTheme('theme-lux'));
document.getElementById('theme3').addEventListener('click', () => changeTheme('theme-horror'));
document.getElementById('theme4').addEventListener('click', () => changeTheme('theme-sakura'));

// Fonction pour changer de thème
function changeTheme(themeClass) {
  // Supprimer les classes de thème existantes
  document.body.classList.remove('theme-cyberpunk', 'theme-lux', 'theme-horror', 'theme-sakura');

  // Ajouter la nouvelle classe de thème
  document.body.classList.add(themeClass);
}


// Gérer le changement de thème
document.getElementById("theme1").addEventListener("click", function() {
  document.body.classList.remove("theme-lux", "theme-horror", "theme-sakura");
  document.body.classList.add("theme-cyberpunk");
});

document.getElementById("theme2").addEventListener("click", function() {
  document.body.classList.remove("theme-cyberpunk", "theme-horror", "theme-sakura");
  document.body.classList.add("theme-lux");
});

document.getElementById("theme3").addEventListener("click", function() {
  document.body.classList.remove("theme-cyberpunk", "theme-lux", "theme-sakura");
  document.body.classList.add("theme-horror");
});

document.getElementById("theme4").addEventListener("click", function() {
  document.body.classList.remove("theme-cyberpunk", "theme-lux", "theme-horror");
  document.body.classList.add("theme-sakura");
});
