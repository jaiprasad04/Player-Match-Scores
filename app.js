const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () => {
      console.log("Server Running at http://localhost:3002/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const ans = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    totalScore: dbObject.score,
    totalFours: dbObject.fours,
    totalSixes: dbObject.sixes,
  };
};

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT 
      *
    FROM 
      player_details`;

  const playersArray = await db.all(getAllPlayersQuery);
  response.send(playersArray.map((eachPlayer) => ans(eachPlayer)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      *
    FROM
      player_details
    WHERE 
      player_id = ${playerId};`;

  const player = await db.get(getPlayerQuery);
  response.send(ans(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE 
      player_details
    SET 
      player_name = '${playerName}'
    WHERE 
      player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      *
    FROM 
      match_details
    WHERE 
      match_id = ${matchId};`;

  const match = await db.get(getMatchQuery);
  response.send(ans(match));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchesQuery = `
    SELECT
      match_id,
      match,
      year
    FROM 
      player_match_score NATURAL JOIN match_details
    WHERE 
      player_id = ${playerId};`;

  const matchArray = await db.all(getAllMatchesQuery);
  response.send(matchArray.map((eachMatch) => ans(eachMatch)));
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getAllPlayerQuery = `
    SELECT 
      player_id,
      player_name
    FROM 
      player_match_score NATURAL JOIN player_details
    WHERE 
      match_id = ${matchId};`;

  const playerArray = await db.all(getAllPlayerQuery);
  response.send(playerArray.map((eachPlayer) => ans(eachPlayer)));
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getScoresQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM 
      player_match_score NATURAL JOIN player_details
    WHERE 
      player_id = ${playerId};`;

  const stats = await db.get(getScoresQuery);
  response.send(stats);
});

module.exports = app;
