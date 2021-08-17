var assert = require('assert');
var sinon = require('sinon');
var deepcopy = require('deepcopy');

var Game = require('../game.js');
var Player = require('../player.js');
var constants = require('../public/js/constants.js');

describe('Game', function() {
    var player1, player2;
    var game;
    var oldMinions;
    var clock;

    before(function() {
        clock = sinon.useFakeTimers();
        sinon.stub(Player.prototype, 'sendPacket');
        oldMinions = constants.minions;
        constants.minions = {
            '0': {
                id: 0,
                name: 'Test Minion',
                health: 5,
                attack: 5
            },
            '1': {
                id: 1,
                name: 'Minion with Events',
                health: 5,
                attack: 5,
                events: {
                    turn_start: [['buff_attack', 2]],
                    turn_end: [['buff_health', 2]]
                }
            },
            '2': {
                id: 2,
                name: 'No Attack Minion',
                health: 1,
                attack: 0
            },
            '3': {
                id: 3,
                name: 'Play Card Event Minion',
                health: 1,
                attack: 1,
                events: {
                    friendly_play_card: [['buff_attack', 2]]
                }
            }
        };
    });

    after(function() {
        Player.prototype.sendPacket.restore();
        constants.minions = oldMinions;
        clock.restore();
    });

    beforeEach(function() {
        player1 = new Player();
        player2 = new Player();
        game = new Game(player1, player2);
        game.init();
        game.initTurn();
    });

    afterEach(function() {
        game.end(player1);
    });

    it('should reject invalid constructor', function() {
        assert.throws(() => {
            new Game();
        });
    });

    it('should initialize correctly', function() {
        assert.ok(game);

        assert.equal(player1.sendPacket.getCall(0).args[0], 'gameInit');
        assert.equal(player2.sendPacket.getCall(0).args[0], 'gameInit');
    });

    it('#getOpponent(player)', function() {
        assert.equal(game.getOpponent(player1), player2);
        assert.equal(game.getOpponent(player2), player1);
    });

    it('#getPlayerById(playerId)', function() {
        assert.equal(game.getPlayerById(player1.id), player1);
    });

    describe('#doMulligan(cards)', function() {
        beforeEach(function() {
            game.end(game.turn);
            game = new Game(player1, player2);
            game.init();
        });

        afterEach(function() {
            game.end(player1);
        });

        it('replaces cards', function() {
            player1.hand = [0, 0, 0];
            player1.deck = [1, 1, 1];

            var oldHand = player1.hand.splice();
            player1.doMulligan([true, true, true]);
            assert.notEqual(oldHand, player1.hand);
        });

        it('keeps cards if none to replace', function() {
            var oldHand = player1.hand;
            player1.doMulligan([false, false, false]);
            assert.deepEqual(oldHand, player1.hand);
        });

        it('starts the game', function() {
            player1.doMulligan([false, false, false]);
            player2.doMulligan([false, false, false]);
            assert.notEqual(game.turn, -1);
            assert.equal(player1.sendPacket.lastCall.args[0], 'nextTurn');
            assert.equal(player2.sendPacket.lastCall.args[0], 'nextTurn');
        });

        it('cannot be done twice', function() {
            player1.doMulligan([true, true, true]);
            assert.ok(!player1.doMulligan([true, true, true]));
        });
    });

    describe('#doTimer(...)', function() {
        it('notifies player', function() {
            game.doTimer();
            assert.equal(player1.sendPacket.lastCall.args[0], 'gameTimer');
        });
        it('switches turns', function() {
            sinon.stub(Game.prototype, 'switchTurns');
            game.turnTimer = -5;
            game.doTimer();
            assert.ok(game.switchTurns.called);
            Game.prototype.switchTurns.restore();
        });
    });

    describe('#switchTurns(playerId)', function() {
        it('valid switch', function() {
            var oldTurn = game.turn;

            game.switchTurns(game.turn);

            assert.notEqual(game.turn, oldTurn);

            assert.equal(player1.sendPacket.lastCall.args[0], 'nextTurn');
            assert.equal(player2.sendPacket.lastCall.args[0], 'nextTurn');
        });

        it('invalid switch', function() {
            game.switchTurns(game.getOpponent(game.getPlayerById(game.turn)).id);
        });

        it('increases mana', function() {
            var plr = game.getPlayerById(game.turn);
            var oldMana = plr.mana;

            game.switchTurns(game.turn);

            assert.equal(plr.mana, oldMana + 1);
        });

        it('triggers events', function() {
            var first = game.getPlayerById(game.turn);
            var second = game.getOpponent(first);

            player1.spawnMinion(1);
            player2.spawnMinion(1);

            assert.equal(game.turn, first.id);

            game.switchTurns(game.turn);

            assert.equal(game.turn, second.id);

            assert.equal(first.minions[0].attack, 5);
            assert.equal(first.minions[0].health, 7);

            assert.equal(second.minions[0].health, 5);
            assert.equal(second.minions[0].attack, 7);
        });

        it('sets attack flag', function() {
            var first = game.getPlayerById(game.turn);
            var second = game.getOpponent(first);

            second.spawnMinion(0);
            second.spawnMinion(2);

            game.switchTurns(game.turn);

            second.minions.forEach(function(minion) {
                if (minion.attack > 0) {
                    assert.ok(minion.hasAttack);
                }
                else {
                    assert.ok(!minion.hasAttack);
                }
            });
        });
    });

    describe('minion events', function() {
        var saved;
        var cardSaved;

        beforeEach(function() {
            cardSaved = constants.cards;
            constants.cards = {
                '0': {
                    id: 0,
                    mana: 0,
                    name: 'Dummy Card',
                    description: 'This is a dummy card.',
                    type: 'spell',
                    actions: []
                }
            };
            saved = deepcopy(constants.minions[0]);
        });

        afterEach(function() {
            constants.minions[0] = saved;
            constants.cards = cardSaved;
        });

        it('death triggers', function() {
            constants.minions[0].events = {
                death: [['draw', 1]]
            };

            var spy = sinon.spy(player1, 'drawCard');

            player1.spawnMinion(0);
            player1.minions[0].health = -1;

            assert.ok(spy.called);
        });

        it('friendly_death triggers', function() {
            constants.minions[0].events = {
                friendly_death: [['draw', 1]]
            };

            var spy = sinon.spy(player1, 'drawCard');

            player1.spawnMinion(0);
            player1.spawnMinion(1);

            player1.minions.find((x) => x.id == 1).health = -1;

            assert.ok(spy.called);
        });

        it('opponent_death triggers', function() {
            constants.minions[0].events = {
                opponent_death: [['draw', 1]]
            };

            var spy = sinon.spy(player1, 'drawCard');

            player1.spawnMinion(0);
            player2.spawnMinion(1);

            player2.minions[0].health = -1;

            assert.ok(spy.called);
        });

        it('minion_damage triggers on damage', function() {
            constants.minions[0].events = {
                minion_damage: [['draw', 1]]
            };

            var spy = sinon.spy(player1, 'drawCard');

            player1.spawnMinion(0);
            player1.spawnMinion(1);

            player1.minions.find((x) => x.id == 1).health -= 1;

            assert.ok(spy.called);
        });

        it('minion_damage triggers on death', function() {
            constants.minions[0].events = {
                minion_damage: [['draw', 1]]
            };

            var spy = sinon.spy(player1, 'drawCard');

            player1.spawnMinion(0);
            player1.spawnMinion(1);

            player1.minions.find((x) => x.id == 1).health = -1;

            assert.ok(spy.called);
        });

        it('turn_start triggers', function() {
            constants.minions[0].events = {
                turn_start: [['draw', 1]]
            };

            var plr = game.getOpponent(game.getPlayerById(game.turn));
            var spy = sinon.spy(plr, 'drawCard');

            plr.spawnMinion(0);

            game.switchTurns(game.turn);

            assert.ok(spy.called);
        });

        it('turn_end triggers', function() {
            constants.minions[0].events = {
                turn_end: [['draw', 1]]
            };

            var plr = game.getPlayerById(game.turn);
            var spy = sinon.spy(plr, 'drawCard');

            plr.spawnMinion(0);

            game.switchTurns(game.turn);

            assert.ok(spy.called);
        });

        it('self_damage triggers', function() {
            constants.minions[0].events = {
                self_damage: [['draw', 1]]
            };

            var spy = sinon.spy(player1, 'drawCard');

            player1.spawnMinion(0);

            player1.minions[0].health -= 1;

            assert.ok(spy.called);
        });

        it('minion_spawn triggers', function() {
            constants.minions[0].events = {
                minion_spawn: [['draw', 1]]
            };

            var spy = sinon.spy(player1, 'drawCard');

            player1.spawnMinion(0);
            player1.spawnMinion(1);

            assert.ok(spy.called);
        });

        it('friendly_play_card triggers', function() {
            constants.minions[0].events = {
                friendly_play_card: [['draw', 1]]
            };

            var plr = game.getPlayerById(game.turn);
            var spy = sinon.spy(plr, 'drawCard');

            plr.spawnMinion(0);

            plr.hand = [0];
            plr.playCard(0);

            assert.ok(spy.called);
        });

        it('opponent_play_card triggers', function() {
            constants.minions[0].events = {
                opponent_play_card: [['draw', 1]]
            };

            var plr = game.getPlayerById(game.turn);
            var opp = game.getOpponent(plr);
            var spy = sinon.spy(opp, 'drawCard');

            opp.spawnMinion(0);

            plr.hand = [0];
            plr.playCard(0);

            assert.ok(spy.called);
        });

        it('does not trigger with silence', function() {
            constants.minions[0].events = {
                opponent_play_card: [['draw', 1]]
            };

            var plr = game.getPlayerById(game.turn);
            var opp = game.getOpponent(plr);
            var spy = sinon.spy(opp, 'drawCard');

            opp.spawnMinion(0);

            plr.processActions([['silence']], opp.minions[0].minionInstanceId).forEach((x) => x());

            plr.hand = [0];
            plr.playCard(0);

            assert.ok(!spy.called);
        });
    });

    describe('Player', function() {

        describe('#doAttack(from, to)', function() {
            var plr, opp;

            beforeEach(function() {
                plr = game.getPlayerById(game.turn);
                opp = game.getOpponent(plr);
                player1.spawnMinion(0);
                player2.spawnMinion(0);
            });

            it('works', function() {
                plr.minions[0].hasAttack = true;
                plr.doAttack(plr.minions[0].minionInstanceId, opp.minions[0].minionInstanceId);

                assert.equal(plr.minions.length, 0);
                assert.equal(opp.minions.length, 0);
            });

            it('does not work if no attack', function() {
                plr.minions[0].hasAttack = false;
                assert.ok(!plr.doAttack(plr.minions[0].minionInstanceId, opp.minions[0].minionInstanceId));
            });
        });

        describe('player-minion interactions', function() {

            beforeEach(function() {
                player1.spawnMinion(0);
            });

            it('spawns minions in the correct spot', function() {
                player1.spawnMinion(1, null, 0);
                assert.equal(player1.minions.length, 2);
                assert.equal(player1.minions[0].id, 1);
            });

            it('can spawn minions in the middle', function() {
                player1.spawnMinion(0);
                player1.spawnMinion(1, null, 1);
                assert.equal(player1.minions[1].id, 1);
            });

            it('spawns minions correctly', function() {
                assert.equal(player1.minions.length, 1);
                assert.equal(player1.minions[0].id, 0);
                assert.equal(player1.sendPacket.lastCall.args[0], 'addMinion');
                assert.equal(player2.sendPacket.lastCall.args[0], 'addMinion');
            });

            it('kills minions correctly', function() {
                player1.minions[0].health -= 999;

                assert.equal(player1.minions.length, 0);
                assert.equal(player1.sendPacket.lastCall.args[0], 'removeMinion');
                assert.equal(player2.sendPacket.lastCall.args[0], 'removeMinion');
            });

            it('damages minions correctly', function() {
                player1.minions[0].health -= 1;

                assert.equal(player1.minions.length, 1);
                assert.equal(player1.sendPacket.lastCall.args[0], 'updateMinion');
                assert.equal(player2.sendPacket.lastCall.args[0], 'updateMinion');
            });

            it('#findMinion(...)', function() {
                player2.spawnMinion(0);

                assert.equal(game.findMinion(player2.minions[0].minionInstanceId), player2.minions[0]);
            });

            describe('#processActions(...)', function() {
                it('damage correct', function() {
                    player1.processActions([['damage', 3]], player1.minions[0].minionInstanceId).forEach((x) => x());

                    assert.equal(player1.minions[0].health, 2);
                });

                it('all_damage correct', function() {
                    for (var i = 0; i < 5; i++) {
                        player1.spawnMinion(0);
                        player2.spawnMinion(0);
                    }

                    player1.processActions([['all_damage', 5]]).forEach((x) => x());

                    assert.equal(player1.minions.length, 0);
                    assert.equal(player2.minions.length, 0);
                });

                it('heal correct', function() {
                    player1.minions[0].health -= 1;

                    player1.processActions([['heal', 3]], player1.minions[0].minionInstanceId).forEach((x) => x());

                    assert.equal(player1.minions[0].health, 5);
                });

                it('heal player correct', function() {
                    player1.damage(-10);

                    assert.equal(player1.health, constants.player.MAX_HEALTH);
                });

                it('heal player through action correct', function() {
                    var oldHealth = player1.health;

                    player1.damage(10);

                    player1.processActions([['heal', 10]], "player").forEach((x) => x());

                    assert.equal(player1.health, oldHealth);
                });

                it('draw correct', function() {
                    var numCards = player1.hand.length;

                    player1.processActions([['draw', 3]]).forEach((x) => x());

                    assert.equal(player1.hand.length, numCards + 3);
                });

                it('opponent_draw correct', function() {
                    var numCards = player2.hand.length;

                    player1.processActions([['opponent_draw', 3]]).forEach((x) => x());

                    assert.equal(player2.hand.length, numCards + 3);
                });

                it('discard correct', function() {
                    player1.processActions([['discard', 10]]).forEach((x) => x());

                    assert.equal(player1.hand.length, 0);
                });

                it('attribute correct', function() {
                    player1.processActions([['attribute', 'shield']], player1.minions[0].minionInstanceId).forEach((x) => x());

                    assert.ok(player1.minions[0].hasAttribute('shield'));
                });

                it('card_copy correct', function() {
                    var numCards = player1.hand.length;
                    var numCardsOpp = player2.hand.length;

                    player1.processActions([['card_copy', 3]]).forEach((x) => x());

                    assert.equal(player1.hand.length, numCards + 3);
                    assert.equal(player2.hand.length, numCardsOpp);
                });

                it('card_copy correct with no opponent cards', function() {
                    var numCards = player1.hand.length;
                    player2.hand = [];

                    player1.processActions([['card_copy', 3]]).forEach((x) => x());

                    assert.equal(player1.hand.length, numCards);
                });

                it('card_copy correct with partial opponent cards', function() {
                    var numCards = player1.hand.length;
                    player2.hand = [player2.deck[0]];

                    player1.processActions([['card_copy', 3]]).forEach((x) => x());

                    assert.equal(player1.hand.length, numCards + 1);
                });

                it('damage_opponent correct', function() {
                    var oldHealth = player2.health;

                    player1.processActions([['damage_opponent', 5]]).forEach((x) => x());

                    assert.equal(player2.health, oldHealth - 5);
                });

                it('mana correct', function() {
                    var oldMana = player1.mana;

                    player1.processActions([['mana', 3]]).forEach((x) => x());

                    assert.equal(player1.mana, oldMana + 3);
                });

                it('replace correct', function() {
                    player1.processActions([['replace', 2]], player1.minions[0].minionInstanceId).forEach((x) => x());

                    assert.equal(player1.minions.length, 1);
                    assert.equal(player1.minions[0].id, 2);
                });

                it('destroy correct', function() {
                    player1.processActions([['destroy']], player1.minions[0].minionInstanceId).forEach((x) => x());

                    assert.equal(player1.minions.length, 0);
                });

                it('spawn_opponent correct', function() {
                    player1.processActions([['spawn_opponent', [0]]]).forEach((x) => x());

                    assert.equal(player2.minions.length, 1);
                });

                it('spawn_matching_opponent correct', function() {
                    assert.equal(player2.minions.length, 0);

                    player2.processActions([['spawn_matching_opponent', 0]]).forEach((x) => x());

                    assert.equal(player2.minions.length, player1.minions.length);
                });
            });
        });

        it('::get(playerId)', function() {
            assert.equal(Player.get(player2.id), player2);
        });

        it('#getId()', function() {
            assert.equal(player2.getId(), player2.id);
        });

        it('#setGameState(gameState)', function() {
            player2.setGameState('lobby');
            assert.equal(player2.sendPacket.lastCall.args[0], 'gameState');
        });

        describe('#playCard(cardId)', function() {
            var oldCards;
            var plr;

            before(function() {
                sinon.stub(console, 'warn');
                oldCards = constants.cards;
                constants.cards = {
                    '0': {
                        id: 0,
                        name: 'Test Minion Card',
                        description: 'Summons a test minion.',
                        mana: 0,
                        type: 'minion',
                        spawn: [0]
                    },
                    '1': {
                        id: 1,
                        name: 'High Mana Card',
                        description: 'Requires high mana to play.',
                        mana: 10,
                        type: 'spell',
                        actions: [['damage_all', 1000]]
                    },
                    '2': {
                        id: 2,
                        mana: 0,
                        name: 'Dummy Card',
                        description: 'A dummy card.',
                        type: 'spell',
                        actions: []
                    }
                };
            });

            after(function() {
                constants.cards = oldCards;
                console.warn.restore();
            });

            beforeEach(function() {
                plr = game.getPlayerById(game.turn);
            });

            it('does not work if player does not have card', function() {
                plr.hand = [];

                assert.ok(!plr.playCard(0));
            });

            it('does not work for invalid cards', function() {
                assert.ok(!plr.playCard(-3));
            });

            it('does not work if not your turn', function() {
                var opp = game.getOpponent(plr);
                opp.hand = [0];
                assert.ok(!opp.playCard(0));
            });

            it('does not work if not enough mana', function() {
                plr.hand = [1];
                assert.ok(!plr.playCard(1));
            });

            it('does not work if too many minions', function() {
                var i;
                plr.hand = [];
                for (i = 0; i < constants.player.MAX_MINIONS + 1; i++) {
                    plr.hand.push(0);
                }
                for (i = 0; i < constants.player.MAX_MINIONS; i++) {
                    assert.ok(plr.playCard(0));
                }
                assert.ok(!plr.playCard(0));
                assert.deepEqual(plr.hand, [0]);
            });

            it('summons minions', function() {
                plr.hand = [0];

                assert.ok(plr.playCard(0));
                assert.equal(plr.minions.length, 1);
            });

            it('minions without charge cannot attack', function() {
                plr.hand = [0];
                assert.ok(plr.playCard(0));
                assert.ok(!plr.minions[0].hasAttack);
            });

            it('triggers events', function() {
                plr.hand = [0];

                assert.ok(plr.spawnMinion(3));
                assert.ok(plr.playCard(0));

                assert.equal(plr.minions.find((x) => x.id == 3).attack, 3);
            });

            it('evaluates if true', function() {
                plr.hand = [2];
                constants.cards[2].actions = [['if', (target) => true, [['draw', 2]]]];
                assert.ok(plr.playCard(2));
                assert.notDeepEqual(plr.hand, [2]);
            });

            it('evaluates if false', function() {
                plr.hand = [2];
                constants.cards[2].actions = [['if', (target) => false, [['draw', 2]]]];
                assert.ok(!plr.playCard(2));
                assert.deepEqual(plr.hand, [2]);
            });

            it('evaluates if with target', function() {
                plr.health = 2;
                plr.hand = [2];
                constants.cards[2].actions = [['if', (target) => target.isPlayer, [['heal', 2]]]];
                assert.ok(plr.playCard(2, "player"));
                assert.deepEqual(plr.health, 4);
            });

            it('evaluates if without necessary target', function() {
                plr.hand = [2];
                constants.cards[2].actions = [['if', (target) => true, [['destroy']]]];
                assert.ok(!plr.playCard(2));
            });
        });

        describe('#addToQueue()', function() {
            it('fails when in game', function() {
                assert.throws(() => player1.addToQueue());
                assert.throws(() => player2.addToQueue());
            });
            it('works not in game', function() {
                game.end(player1.id);
                player1.addToQueue();

                assert.ok(player1.isInQueue());
            });
            it('works with multiple players', function() {
                game.end(player1.id);
                player1.addToQueue();
                player2.addToQueue();

                for (var i = 0; i < 10; i++) {
                    new Player().addToQueue();
                }
            });
        });

        describe('#drawCard()', function() {
            it('discards card when max reached', function() {
                player1.hand = [];
                for (var i = 0; i < constants.player.MAX_CARDS; i++) {
                    player1.hand.push(0);
                }

                player1.drawCard();

                assert.equal(player1.hand.length, constants.player.MAX_CARDS);
            });

            it('does not draw when deck is gone', function() {
                player1.hand = [];
                player1.deck = [];

                player1.drawCard();

                assert.deepEqual(player1.hand, []);
            });
        });

        describe('#authenticate(username)', function() {
            it('rejects empty usernames', function() {
                assert.ok(!player1.authenticate(''));
            });
        });

        describe('#removeFromQueue()', function() {
            it('is in queue', function() {
                game.end(player1.id);
                player1.addToQueue();
                player1.removeFromQueue();
                assert.ok(!player1.isInQueue());
            });

            it('is not in queue', function() {
                game.end(player1.id);
                assert.ok(!player1.removeFromQueue());
                assert.ok(!player1.isInQueue());
            });
        });

        it('#disconnect() removes player from queue', function() {
            game.end(player1.id);
            player1.addToQueue();
            player1.disconnect();
            assert.ok(!player1.isInQueue());
        });

        describe('handles sudden game interrupts well', function() {
            beforeEach(function() {
                player1.game = null;
                player2.game = null;
            });

            it('#drawCard()', function() {
                assert.ok(!player1.drawCard());
            });

            it('#addCard()', function() {
                assert.ok(!player1.addCard());
            });

            it('#doMulligan()', function() {
                assert.ok(!player1.doMulligan());
            });

            it('#spawnMinion()', function() {
                assert.ok(!player1.spawnMinion());
            });

            it('#doAttack()', function() {
                assert.ok(!player1.doAttack());
            });

            it('#processActions()', function() {
                assert.deepEqual(player1.processActions(), []);
            });

            it('#playCard()', function() {
                assert.ok(!player1.playCard());
            });
        });
    });
});
