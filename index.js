#!/usr/bin/env nodejs

const express = require('express');
const ws = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new ws.Server({ server });

const Player = require('./player.js');
const Bot = require('./bot.js');
const Game = require('./game.js');
const constants = require('./public/js/constants.js');

wss.on('connection', function(ws) {
    var player;
    ws.on('message', function(message) {
        var data = JSON.parse(message);
        switch (data.type) {
            case 'auth':
                var username = data.data;
                player = new Player(ws);
                if (player.authenticate(username)) {
                    console.log(`Player connected: ${username} (${ws._socket.remoteAddress})`);
                    player.setGameState("lobby");
                }
                else {
                    player.disconnect("Authentication failed!");
                }
                break;
            case 'queue':
                player.setGameState("queued");
                player.addToQueue();
                break;
            case 'playBot':
                var game = new Game(player, new Bot());
                game.init(true);
                break;
            case 'dequeue':
                player.removeFromQueue();
                player.setGameState("lobby");
                break;
            case 'endTurn':
                player.game.switchTurns(player.id);
                break;
            case 'surrender':
                player.game.end(player.game.getOpponent(player));
                break;
            case 'playCard':
                player.playCard(data.data.card, data.data.target, data.data.position);
                break;
            case 'doMulligan':
                player.doMulligan(data.data);
                break;
            case 'doAttack':
                player.doAttack(data.data.from, data.data.to);
                break;
            case 'loadCards':
                player.sendPacket("loadCards", {
                    deck: player.initialDeck,
                    cards: player.getCards().sort((x, y) => {
                        const manaDiff = constants.cards[x].mana - constants.cards[y].mana;
                        if (manaDiff != 0) return manaDiff;
                        return constants.cards[x].name.localeCompare(constants.cards[y].name);
                    })
                });
                break;
            case 'saveCards':
                var deck = data.data.deck;
                var cardCount = {};
                deck.forEach((x) => cardCount[x] = (cardCount[x] || 0) + 1);
                if (deck.length != constants.player.DECK_SIZE) {
                    player.sendError("Your deck is not the correct size! Must be " + constants.player.DECK_SIZE + " cards.");
                }
                else if (deck.some((x) => constants.cards[x].obtainable == false)) {
                    player.sendError("Invalid cards are included in your deck!");
                }
                else if (Object.values(cardCount).some((x) => x > constants.player.MAX_DUPLICATES)) {
                    player.sendError("You have too many duplicates of a card!");
                }
                else {
                    player.initialDeck = deck;
                    player.setGameState("lobby");
                }
                break;
            case 'ping':
                break;
            default:
                console.log(`Unknown Packet: ${JSON.stringify(data)}`);
                break;
        }
    });
    ws.on('close', () => {
        if (player) {
            player.disconnect();
        }
    });
});

app.use(express.static('public'));

server.listen(process.env.PORT || 5000, () => {
    console.log(`Server started on port ${server.address().port}...`);
});
