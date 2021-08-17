#!/usr/bin/env nodejs

var path = require('path');
var sinon = require('sinon');

var constants = require('./public/js/constants.js');
var Player = require('./player.js');
var Game = require('./game.js');

if (process.argv.length < 4) {
    console.log(`Usage: ${process.argv[0]} ${process.argv[1]} <bot 1 script> <bot 2 script>`);
    process.exit();
}

var Bot1 = require(path.resolve(process.argv[2]));
var Bot2 = require(path.resolve(process.argv[3]));

constants.game.BOT_DELAY = 0;

var iters = 10000;
var botOneWins = 0;
var botTwoWins = 0;
var count = 0;
var turns = 0;
var start;

function done() {
    console.log();
    console.log('=== Simulation Finished ===');
    console.log(`Total Games: ${iters.toLocaleString()}`);
    console.log(`Bot 1 Wins: ${botOneWins.toLocaleString()} (${(botOneWins/iters*100).toFixed(2)}%)`);
    console.log(`Bot 2 Wins: ${botTwoWins.toLocaleString()} (${(botTwoWins/iters*100).toFixed(2)}%)`);
    console.log(`Average Turns per Game: ${(turns/iters).toFixed(2)}`);
    var end = Date.now();
    console.log(`Time Taken: ${((end-start)/1000).toFixed(2)} sec`);

    Game.prototype.end.restore();
    Game.prototype.switchTurns.restore();
}

var originalEnd = Game.prototype.end;
sinon.stub(Game.prototype, 'end').callsFake(function(winner) {
    if (winner.isBotOne) {
        botOneWins++;
    }
    else {
        botTwoWins++;
    }
    count++;
    if (count % (iters / 10) == 0) {
        console.log(`${count.toLocaleString()} games done!`);
    }
    if (count >= iters) {
        done();
    }
    turns += winner.game.turnCounter;
    originalEnd.call(winner.game, winner);
});

sinon.stub(Bot1.prototype, 'handleError').callsFake(function(msg) {
    throw new Error(msg);
});

if (Bot1 !== Bot2) {
    sinon.stub(Bot2.prototype, 'handleError').callsFake(function(msg) {
        throw new Error(msg);
    });
}

var originalSwitchTurns = Game.prototype.switchTurns;
sinon.stub(Game.prototype, 'switchTurns').callsFake(function(playerId) {
    const game = Player.get(playerId).game;
    if (game.turnCounter >= 100) {
        console.log('Warning: Game has gone on for more than 100 turns!');

        [[1, game.p1], [2, game.p2]].forEach(function(val) {
            const num = val[0];
            const plr = val[1];

            console.log();
            console.log(`Bot ${num} Deck: [${plr.getDeck()}]`);
            console.log(`Bot ${num} Remaining Deck: [${plr.deck}] -> [${plr.deck.map((x) => constants.cards[x].name)}]`);
            console.log(`Bot ${num} Health: ${plr.health}, Bot 1 Hand: [${plr.hand}] -> [${plr.hand.map((x) => constants.cards[x].name)}]`);
            console.log(`Bot ${num} Minions: [${plr.minions.map((x) => x.name)}]`);
        });

        console.log();
        console.log('Terminating game...');
        originalEnd.call(game, Player.get(playerId));
        count++;
        if (count >= iters) {
            done();
        }
    }
    else {
        originalSwitchTurns.call(game, playerId);
    }
});

function playGame() {
    var bot1 = new Bot1();
    bot1.isBotOne = true;
    var bot2 = new Bot2();
    bot2.isBotOne = false;

    var game = new Game(bot1, bot2);
    game.init();
}

console.log("=== Simulation Started ===");

start = Date.now();

for (var i = 0; i < iters; i++) {
    playGame();
}
