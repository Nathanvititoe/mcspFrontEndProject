var player1 = {
  cards: [],
  score: 0,
  wallet: 100,
  bet: 0,
};
var dealer = {
  cards: [],
  score: 0,
};
var phrases = {
  win: [
    `you got lucky and won, good job`,
    `god damn miracle you won`,
    `I know you havent been practicing how did you win`,
  ],
  lose: [
    `god you're terrible and lost, try again`,
    `let your girlfriend play, you suck loser`,
    `go practice go fish and come back you loser`,
  ],
  busted: [
    `you know how to count buddy? busted and lost`,
    `YOU WENT OVER and lost asshole`,
    `busted like OJ dummy`,
  ],
  blackjack: [
    `you got blackjack somehow`,
    `I guess you were gonna get blackjack eventually... statistically...`,
    `...luck got you blackjack`,
  ],
  dealerBust: [
    `amazing the luck you got son... dealer busted`,
    `imagine winning with skill..dealer busted`,
    `dealer sucks too apparently, busted`,
  ],
};
var activeGame = false;
setupPage();

//sets up the page
function setupPage() {
  startGame();
  hitMe();
  stayButton();
  resetWallet();
}

//set value of aces in dealers hand
function calculateDealerAce() {
  if (dealer.cards.includes(1)) {
    var aceAsEleven = dealer.score + 10;
    if (aceAsEleven <= 21) {
      return 11;
    }
  }
  return 1;
}

//prompt user for how they want ace to be valued
function promptAceValue() {
  var input = prompt("Choose the value for the Ace: 1 or 11");
  var value = parseInt(input);

  // Validate the user input
  while (value !== 1 && value !== 11) {
    input = prompt("Invalid input! Please choose 1 or 11");
    value = parseInt(input);
  }
  return value;
}

//API request to draw cards from deck for player
function drawPlayersCards(cardCount) {
  if (!activeGame) {
    return;
  }
  $.get(
    `https://deckofcardsapi.com/api/deck/new/draw/?count=${cardCount}`,
    async function (cards) {
      var drawnCards = cards.cards;
      for (var i = 0; i < drawnCards.length; i++) {
        var playerDeck = document.querySelector(".playerCards");
        var cardImg = document.createElement("img");
        cardImg.setAttribute("id", "playerImg");
        cardImg.setAttribute("src", drawnCards[i].image);
         playerDeck.appendChild(cardImg);
        var value = drawnCards[i].value;
        if (value === "JACK" || value === "QUEEN" || value === "KING") {
          value = 10;
        } else if (value === "ACE") {
          value = promptAceValue();
        }
        player1.cards.push(parseInt(value));
        player1.score += parseInt(value);
        busted();
      }
    }
  );
}

//API request to draw cards from deck for dealer
function drawDealersCards(cardCount) {
  return new Promise((resolve) => {
    $.get(
      `https://deckofcardsapi.com/api/deck/new/draw/?count=${cardCount}`,
      async function (cards) {
        var drawnCards = cards.cards;
        for (var i = 0; i < drawnCards.length; i++) {
          var dealerDeck = document.querySelector(".dealerCards");
          var cardImg = document.createElement("img");
          cardImg.setAttribute("id", "dealerImg");
          cardImg.setAttribute("src", drawnCards[i].image);
          dealerDeck.appendChild(cardImg);

          var value = drawnCards[i].value;
          if (value === "JACK" || value === "QUEEN" || value === "KING") {
            value = 10;
          } else if (value === "ACE") {
            value = calculateDealerAce();
          }
          dealer.cards.push(parseInt(value));
          dealer.score += parseInt(value);
        }
        resolve(drawnCards); // Resolve the promise with the drawn cards
      }
    );
  });
}

//creates Begin game btn and adds function to it
 function startGame() {
  var beginBtn = document.querySelector("#beginBtn");
  beginBtn.addEventListener("click",  function () {
     bettingModal();
  });
}

//adds functionality to hitme btn and ensures you didnt bust
function hitMe() {
  var hitBtn = document.querySelector("#hitMe");
  hitBtn.addEventListener("click", async function () {
    await drawPlayersCards(1);
  });
}

//adds functionality to stay btn and pulls final dealer card
function stayButton() {
  var stayBtn = document.querySelector("#stay");
  stayBtn.addEventListener("click", async function () {
    setTimeout(async function () {
      var cardback = document.querySelector("#cardback");
      cardback.style.display = "none";
      hitMeDisable();
      let drawnCards = await drawDealersCards(1);
      while (dealer.score < player1.score && dealer.score < 17) {
        drawnCards = await drawDealersCards(1);
      }
      setTimeout(compareScores, 500);
    }, 1000);
  });
}

//checks if the player or dealer is closer to 21
function compareScores() {
  var player1Difference = 21 - player1.score;
  var dealerDifference = 21 - dealer.score;
  setTimeout(function () {
    if (dealer.score > 21) {
      showModal(`${dealerBustPhrases()}`);
      wonBet();
      resetTable();
    } else if (dealer.score === 21) {
      showModal(`${lossPhrases()}`);
    } else if (player1Difference > dealerDifference) {
      showModal(`${lossPhrases()}`);
      resetTable();
    } else if (player1Difference === dealerDifference) {
      tieBreaker();
    } else {
      showModal(`${winPhrases()}`);
      wonBet();
      resetTable();
    }
  }, 500);
}

//If dealer at 16 and ties
async function tieBreaker() {
  var player1Difference = 21 - player1.score;
  var dealerDifference = 21 - dealer.score;
  await drawDealersCards(1);
  setTimeout(function () {
    if (dealer.score > 21) {
      showModal(`${dealerBustPhrases()}`);
      wonBet();
      resetTable();
    } else if (player1Difference === dealerDifference) {
      showModal(`${lossPhrases()}`);
    } else {
      showModal(`${winPhrases()}`);
      wonBet();
      resetTable();
    }
  }, 500);
}

//alerts that player went over 21 and resets table when acknowledged
function busted() {
  if (player1.score === 21) {
    setTimeout(function () {
      showModal(`${blackjackPhrases()}`);
      wonBet();
      resetTable();
      hitMeDisable();
    }, 500);
  } else if (player1.score > 21) {
    setTimeout(function () {
      showModal(`${bustPhrases()}`);
      resetTable();
      hitMeDisable();
    }, 500);
  }
}

//resets blackjack table
function resetTable() {
  player1.cards = [];
  dealer.cards = [];

  player1.score = 0;
  dealer.score = 0;

  var playerDeck = document.querySelector(".playerCards");
  var dealerDeck = document.querySelector(".dealerCards");
  playerDeck.innerHTML = "";
  dealerDeck.innerHTML = "";

  activeGame = false;
}

//enables hitme btn
function hitMeEnable() {
  var hitMeBtn = document.querySelector("#hitMe");
  hitMeBtn.disabled = false;
}

//disables hitme btn
function hitMeDisable() {
  var hitMeBtn = document.querySelector("#hitMe");
  hitMeBtn.disabled = true;
}

//picks a random phrase to display when user wins
function winPhrases() {
  return phrases.win[getRandomNumber(0, 2)];
}

//picks a random phrase to display when user loses
function lossPhrases() {
  return phrases.lose[getRandomNumber(0, 2)];
}

//picks a random phrase to display when user busts
function bustPhrases() {
  return phrases.busted[getRandomNumber(0, 2)];
}

//picks a random phrase to display when user gets blackjack
function blackjackPhrases() {
  return phrases.blackjack[getRandomNumber(0, 2)];
}

//picks a random phrase to display when dealer busts
function dealerBustPhrases() {
  return phrases.dealerBust[getRandomNumber(0, 2)];
}

//get random Number
function getRandomNumber(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//dealer covered card
function dealerHiddenCard() {
  setTimeout(function () {
    var dealerDeck = document.querySelector(".dealerCards");
    var hiddenCard = document.createElement("img");
    hiddenCard.setAttribute("src", "/images/backofcard.png");
    hiddenCard.setAttribute("id", "cardback");
    dealerDeck.appendChild(hiddenCard);
  }, 500);
}

//creates pop up to display win/lose message
function modalTextChange(text) {
  var modal = document.querySelector(".testModal");

  modal.innerText = text;
  var linebreak = document.createElement('br');
  modal.appendChild(linebreak);
  var playAgainModal = document.createElement("button");
  playAgainModal.setAttribute("class", "endGameBtns");
  playAgainModal.innerText = "Play Again";
  modal.appendChild(playAgainModal);
  playAgainModal.addEventListener("click", function () {
    bettingModal();
    modal.close();
  });
  var cancelModal = document.createElement("button");
  cancelModal.setAttribute("class", "endGameBtns");
  cancelModal.innerText = "Cancel";
  modal.appendChild(cancelModal);
  cancelModal.addEventListener("click", function () {
    modal.close();
  });
}

//displays modal to browser
function showModal(text) {
  var modal = document.querySelector(".testModal");
  modalTextChange(text);
  modal.showModal();
}

//creates modal w text input for betting
function bettingModal() {
  var modal = document.querySelector(".bettingModal");
  player1.wallet = localStorage.getItem('wallet');
  if(player1.wallet === null || player1.wallet === NaN || player1.wallet === 0) {
    player1.wallet = 100;
  } else {
    player1.wallet = parseInt(localStorage.getItem('wallet'));
  }  
  modal.innerText = `You have $${player1.wallet}, Place your bet : `;

  var input = document.createElement("input");
  input.setAttribute("type", "text");
  input.setAttribute("id", "inputBar");
  modal.appendChild(input);

  var closeModal = document.createElement("button");
  closeModal.setAttribute("id", "okBtn");
  closeModal.innerText = "OK";
  var linebreak = document.createElement('br');
  modal.appendChild(linebreak);
  modal.appendChild(closeModal);
  closeModal.addEventListener("click", function () {
    if(input.value > player1.wallet) {
      alert('you don\'t have the money for that broke boy')
      return;
    } else if (input.value <= 0) {
      alert('invalid bet, can\'t bet negative money dummy')
      return;
    } else if (isNaN(input.value)) {
      alert('THAT"S NOT A NUMBER, GO BACK TO SCHOOL')
      return;
    }
    player1.bet = parseInt(input.value);
    player1.wallet -= player1.bet;
    localStorage.setItem('wallet', player1.wallet.toString())
    modal.close();
    displayWallet();
    resetTable();
    activeGame = true;
    hitMeEnable();
    drawPlayersCards(2);
    drawDealersCards(1);
    dealerHiddenCard();
  });
  modal.showModal();
}

//displays wallet value to browser
function displayWallet() {
  var walletNums = document.querySelector('.walletValue')
  walletNums.textContent = `Betting Money : $${player1.wallet}`;
}

//increases wallet value and local storage after winning
function wonBet () {
  player1.wallet += (player1.bet * 2)
  localStorage.setItem('wallet', player1.wallet.toString());
  displayWallet()
}

//reset wallet local storage 
function resetWallet () {
  var reset = document.querySelector('#resetWallet');

  reset.addEventListener('click', function () {
    player1.wallet = 0;
    localStorage.clear();
    displayWallet();
  });
}

function playAgain () {
  bettingModal()
}