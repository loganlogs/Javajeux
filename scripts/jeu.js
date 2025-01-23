

(() => {
  let randomNumber;
  let compteur = 0;
  let username = null;
  let score = 0;
  const scores = {}; // Tableau des scores pour chaque utilisateur

  // Sélection des éléments HTML
  const loginDiv = document.getElementById('login');
  const gameDiv = document.getElementById('game');
  const usernameInput = document.getElementById('username');
  const loginButton = document.getElementById('loginButton');

  const input = document.getElementById('proposition');
  const envoyer = document.getElementById('envoyer');
  const reset = document.getElementById('reset');
  const resultat = document.querySelector('.resultat');
  const tropHautTropBas = document.querySelector('.tropHautTropBas');
  const tentatives = document.querySelector('.tentatives');
  const scoreTable = document.getElementById('scoreTable').querySelector('tbody');

  // Connexion utilisateur ou mode invité
  loginButton.addEventListener('click', () => {
    username = usernameInput.value.trim() || null; // Si pas de nom, utilisateur reste null
    loginDiv.style.display = 'none';
    gameDiv.style.display = 'block';
    startGame();
  });

  // Démarrer un nouveau jeu
  function startGame() {
    randomNumber = Math.floor(Math.random() * 100) + 1;
    compteur = 0;
    score = 0;

    input.value = '';
    resultat.textContent = '';
    tropHautTropBas.textContent = '';
    tentatives.textContent = '';
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
      score = Math.max(100 - compteur * 10, 0); // Calcul du score
      resultat.textContent = `Bravo ${username || "Invité"} ! Vous avez trouvé en ${compteur} tentatives. 🎉`;
      tentatives.textContent = `Score gagné : ${score} points.`;
      if (username) {
        sauvegarderScore(username, score);
        afficherScores();
      }
      finDeJeu();
    } else if (proposition < randomNumber) {
      tropHautTropBas.textContent = "C'est plus grand !";
    } else {
      tropHautTropBas.textContent = "C'est plus petit !";
    }

    tentatives.textContent = `Tentatives : ${compteur}`;
    input.value = '';
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
  reset.addEventListener('click', startGame);

  // Appui sur Enter
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifier();
  });

  envoyer.addEventListener('click', verifier);

  // Sauvegarder le score d'un utilisateur
  function sauvegarderScore(username, points) {
    if (!scores[username]) {
      scores[username] = 0; // Nouveau joueur
    }
    scores[username] += points; // Ajout des points au total
  }

  // Afficher les scores dans le tableau
  function afficherScores() {
    // Vider le tableau
    scoreTable.innerHTML = '';

    // Transformer l'objet en tableau, trier par score décroissant
    const classement = Object.entries(scores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

    // Ajouter les scores au tableau HTML
    classement.forEach(([user, totalScore], index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${user}</td>
        <td>${totalScore}</td>
      `;
      scoreTable.appendChild(row);
    });
  }
})();
