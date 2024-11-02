// websocket-server.js
const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Define a valid API key
const VALID_API_KEY = "your_secure_api_key"; // Replace with an actual secure key

const PORT = 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server with API key authentication is running\n');
});

// Initialize WebSocket servers for different paths
const wssGrandstand = new WebSocket.Server({ noServer: true });
const wssStadium = new WebSocket.Server({ noServer: true });

// Placeholder data for grandstand and stadium
let grandstandData = {
  player1: "E. MORGAN",
  player2: "R. BIRIA",
  score1: [0, 0, 0],
  score2: [0, 0, 0],
  currentGamePoints1: 0,
  currentGamePoints2: 0,
  servingPlayer: "player1",
};

let stadiumData = {
  player1: "J. DOE",
  player2: "A. SMITH",
  score1: [0, 0, 0],
  score2: [0, 0, 0],
  currentGamePoints1: 0,
  currentGamePoints2: 0,
  servingPlayer: "player2",
};

// Function to broadcast data to all authenticated clients
const broadcast = (wss, data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.authenticated) {
      client.send(JSON.stringify(data));
    }
  });
};

// Validate API key
const isValidApiKey = (key) => key === VALID_API_KEY;

// Handle WebSocket connections with API key authentication
function handleConnection(ws, apiKey, dataStore, wss) {
  if (!isValidApiKey(apiKey)) {
    ws.close(1008, "Invalid API Key"); // 1008 indicates policy violation
    return;
  }

  ws.authenticated = true; // Mark client as authenticated
  ws.send(JSON.stringify(dataStore)); // Send initial data on successful connection

  // Handle incoming messages for authenticated clients
  ws.on('message', (message) => {
    if (ws.authenticated) {
      try {
        const updatedData = JSON.parse(message);
        Object.assign(dataStore, updatedData); // Update data store with incoming valid scores
        broadcast(wss, dataStore); // Broadcast to all clients on this path
      } catch (error) {
        console.error("Error processing message:", error);
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
}

// Upgrade event to route clients based on URL path and API key
server.on('upgrade', (req, socket, head) => {
  const { pathname, query } = url.parse(req.url, true);
  const apiKey = query.apiKey;

  if (pathname === '/tennis/grandstand') {
    wssGrandstand.handleUpgrade(req, socket, head, (ws) => {
      handleConnection(ws, apiKey, grandstandData, wssGrandstand);
    });
  } else if (pathname === '/tennis/stadium') {
    wssStadium.handleUpgrade(req, socket, head, (ws) => {
      handleConnection(ws, apiKey, stadiumData, wssStadium);
    });
  } else {
    socket.destroy();
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`WebSocket server is running:
- ws://localhost:${PORT}/tennis/grandstand
- ws://localhost:${PORT}/tennis/stadium`);
});
