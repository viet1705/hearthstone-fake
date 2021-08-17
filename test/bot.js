var assert = require('assert');
var sinon = require('sinon');

var constants = require('../public/js/constants.js');
var Game = require('../game.js');
var Bot = require('../bot.js');

describe('Bot', function() {
    var oldBotDelay;
    var timeout;

    before(function() {
        oldBotDelay = constants.game.BOT_DELAY;
        constants.game.BOT_DELAY = 0;
        sinon.stub(Bot.prototype, 'handleError').callsFake(function(data) {
            assert.fail(`Bot encountered error: ${data}`);
        });
    });

    after(function() {
        constants.game.BOT_DELAY = oldBotDelay;
        Bot.prototype.handleError.restore();
    });

    this.timeout(0);

    var game, bot1, bot2;
    beforeEach(function() {
        bot1 = new Bot();
        bot2 = new Bot();
        game = new Game(bot1, bot2);

        timeout = setTimeout(() => {
            Game.prototype.end.restore();
            throw new Error(`Timeout exceeded! bot1 hand: ${bot1.hand}, bot1 deck: ${bot1.deck}, bot2 hand: ${bot2.hand}, bot2 deck: ${bot2.deck}`);
        }, 5 * 1000);
    });

    afterEach(function() {
        clearTimeout(timeout);
    });

    it('plays 10 turns', function(done) {
        var originalSwitchTurns = game.switchTurns.bind(game);
        var stub = sinon.stub(Game.prototype, 'switchTurns').callsFake(function(playerId) {
            if (game.turnCounter >= 10) {
                stub.restore();
                game.end(bot1.id);
                done();
            }
            else {
                originalSwitchTurns(playerId);
            }
        });

        game.init();
    });

    it('handles sudden interrupts', function(done) {
        var originalSwitchTurns = game.switchTurns.bind(game);
        var stub = sinon.stub(Game.prototype, 'switchTurns').callsFake(function(playerId) {
            if (game.turnCounter >= 10) {
                stub.restore();
                game.end(bot1.id);
                assert.ok(!game.switchTurns(playerId));
                done();
            }
            else {
                originalSwitchTurns(playerId);
            }
        });

        game.init();
    });

    it('plays against self correctly (first 30 cards)', function(done) {
        var cardStub = sinon.stub(Bot.prototype, 'getDeck').callsFake(function() {
            var deck = [];
            for (var i = 0; i < constants.player.DECK_SIZE; i++) {
                deck.push(i);
            }
            return deck;
        });

        sinon.stub(Game.prototype, 'end').callsFake(function() {
            assert.ok(game.turnCounter >= 3, game.turnCounter);
            assert.ok(bot1.health <= 0 || bot2.health <= 0, `Bot1 Health: ${bot1.health}, Bot2 Health: ${bot2.health}`);
            Game.prototype.end.restore();
            cardStub.restore();
            game.end(bot1.id);
            done();
        });

        game.init();
    });

    it('plays against self correctly (normal behavior)', function(done) {
        sinon.stub(Game.prototype, 'end').callsFake(function() {
            assert.ok(game.turnCounter >= 3, game.turnCounter);
            assert.ok(bot1.health <= 0 || bot2.health <= 0, `Bot1 Health: ${bot1.health}, Bot2 Health: ${bot2.health}`);
            Game.prototype.end.restore();
            game.end(bot1.id);
            done();
        });

        game.init();
    });

    it('plays against self correctly (randomized deck)', function(done) {
        sinon.stub(Bot.prototype, 'getDeck').callsFake(function() {
            return bot1.getRandomizedDeck();
        });

        sinon.stub(Game.prototype, 'end').callsFake(function() {
            assert.ok(game.turnCounter >= 3, game.turnCounter);
            assert.ok(bot1.health <= 0 || bot2.health <= 0, `Bot1 Health: ${bot1.health}, Bot2 Health: ${bot2.health}`);
            Game.prototype.end.restore();
            game.end(bot1.id);
            Bot.prototype.getDeck.restore();
            done();
        });

        game.init();
    });

    it('handles no cards to play correctly', function(done) {
        sinon.stub(Bot.prototype, 'getDeck').callsFake(function() {
            return [];
        });

        sinon.stub(Game.prototype, 'end').callsFake(function(gameEnd) {
            Game.prototype.end.restore();
            game.end(gameEnd);
            done();
        });

        game.init();
    });
});
