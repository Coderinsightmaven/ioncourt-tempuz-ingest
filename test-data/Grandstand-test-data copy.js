// test-data-sender.js
const WebSocket = require('ws');

// Define the API key and WebSocket URL with the path and API key as query parameter
const API_KEY = "your_secure_api_key"; // Replace with your actual API key
const ws = new WebSocket(`ws://localhost:8080/tennis/grandstand?apiKey=${API_KEY}`);

// Define initial scoreboard data
let scoreboardData = {
  player1: "E. MORGAN",
  player2: "R. BIRIA",
  score1: [0, 0, 0], // Sets won by player 1
  score2: [0, 0, 0], // Sets won by player 2
  currentGamePoints1: 0, // Points in the current game for player 1
  currentGamePoints2: 0, // Points in the current game for player 2
  servingPlayer: "player1",
};

const pointValues = [0, 15, 30, 40, "AD"]; // Tennis point progression, including Advantage (AD)

// Function to update the current game points based on tennis rules
function updateGamePoints() {
  const { currentGamePoints1, currentGamePoints2 } = scoreboardData;

  if (currentGamePoints1 === 40 && currentGamePoints2 === 40) {
    // Both players are at deuce (40-40)
    if (scoreboardData.currentGamePoints1 === "AD") {
      // Player 1 wins the game from Advantage
      incrementSetScore("player1");
    } else if (scoreboardData.currentGamePoints2 === "AD") {
      // Player 2 wins the game from Advantage
      incrementSetScore("player2");
    } else {
      // Move to Advantage for one player
      if (Math.random() > 0.5) {
        scoreboardData.currentGamePoints1 = "AD";
      } else {
        scoreboardData.currentGamePoints2 = "AD";
      }
    }
  } else if (currentGamePoints1 === "AD" || currentGamePoints2 === "AD") {
    // Advantage scenario
    if (scoreboardData.currentGamePoints1 === "AD") {
      incrementSetScore("player1"); // Player 1 wins the game
    } else if (scoreboardData.currentGamePoints2 === "AD") {
      incrementSetScore("player2"); // Player 2 wins the game
    }
  } else {
    // Normal point progression for either player
    const scoringPlayer = Math.random() > 0.5 ? "player1" : "player2";
    if (scoringPlayer === "player1") {
      scoreboardData.currentGamePoints1 = getNextPoint(scoreboardData.currentGamePoints1);
      if (scoreboardData.currentGamePoints1 === "AD") incrementSetScore("player1");
    } else {
      scoreboardData.currentGamePoints2 = getNextPoint(scoreboardData.currentGamePoints2);
      if (scoreboardData.currentGamePoints2 === "AD") incrementSetScore("player2");
    }
  }
}

// Get the next point in tennis scoring
function getNextPoint(currentPoints) {
  const currentIndex = pointValues.indexOf(currentPoints);
  return currentIndex >= 0 && currentIndex < pointValues.length - 2
    ? pointValues[currentIndex + 1]
    : "AD"; // Move to Advantage after 40, if not already there
}

// Increment the set score if a player wins a game
function incrementSetScore(winningPlayer) {
  const scoreKey = winningPlayer === "player1" ? "score1" : "score2";
  const currentSetIndex = scoreboardData[scoreKey].findIndex(score => score < 6);
  scoreboardData[scoreKey][currentSetIndex]++;

  // Reset current game points for the next game
  scoreboardData.currentGamePoints1 = 0;
  scoreboardData.currentGamePoints2 = 0;

  // Toggle serving player
  scoreboardData.servingPlayer = winningPlayer === "player1" ? "player2" : "player1";
}

// Send updates at regular intervals
ws.on('open', () => {
  console.log('Connected to WebSocket server at /tennis/grandstand');
  setInterval(() => {
    updateGamePoints();
    ws.send(JSON.stringify(scoreboardData));
    console.log('Sent update:', scoreboardData);
  }, 5000); // Send data every 5 seconds
});

ws.on('close', () => {
  console.log('Disconnected from WebSocket server');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
