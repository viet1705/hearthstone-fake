var assert = require('assert');
var constants = require('../public/js/constants.js');
var fs = require('fs');

describe('Constants', function() {
    function assertValidActions(actions) {
        assert.ok(Array.isArray(actions));
        actions.forEach(function(action) {
            assert.ok(Array.isArray(action));
            if (action[0] == 'if') {
                // make sure no errors with null
                action[1](null);

                assertValidActions(action[2]);
            }
        });
    }

    describe('cards', function() {
        it('should have correct names, mana, description, and ids for all cards', function() {
            Object.keys(constants.cards).forEach(function(cardId) {
                var card = constants.cards[cardId];
                assert.equal(typeof card.id, 'number');
                assert.equal(typeof card.name, 'string');
                assert.equal(typeof card.description, 'string');
                assert.equal(typeof card.mana, 'number');
                assert.ok(card.mana >= 0);
                assert.equal(card.id, cardId);

                // make sure image exists if set
                if (typeof card.image !== 'undefined') {
                    assert.ok(fs.existsSync('./public/img/cards/' + card.image), card.image);
                }
            });
        });
        it('should have valid minion ids', function() {
            Object.keys(constants.cards).forEach(function(cardId) {
                var card = constants.cards[cardId];
                if (card.type == 'minion') {
                    assert.notStrictEqual(card.spawn, undefined);
                    assert.ok(Array.isArray(card.spawn));
                    card.spawn.forEach((x) => assert.notStrictEqual(constants.minions[x], undefined));
                }
                else {
                    assert.strictEqual(card.spawn, undefined);
                }
            });
        });
        it('should have valid spell actions', function() {
            Object.keys(constants.cards).forEach(function(cardId) {
                var card = constants.cards[cardId];
                if (card.type == 'spell') {
                    assert.notStrictEqual(card.actions, undefined);
                    assert.ok(Array.isArray(card.actions));
                    assertValidActions(card.actions);
                }
            });
        });
        it('should have matching minions for minion cards', function() {
            Object.keys(constants.cards).forEach(function(cardId) {
                var card = constants.cards[cardId];
                if (card.type == 'minion') {
                    var minionNames = card.spawn.map((x) => constants.minions[x].name);
                    if (minionNames.length == 1) {
                        assert.equal(minionNames[0], card.name);
                    }
                }
            });
        });
    });
    describe('minions', function() {
        it('should have names, health, and attack', function() {
            Object.keys(constants.minions).forEach(function(minionId) {
                var minion = constants.minions[minionId];
                assert.strictEqual(typeof minion.name, 'string');
                assert.strictEqual(typeof minion.health, 'number');
                assert.strictEqual(typeof minion.attack, 'number');
                if (typeof minion.attributes !== 'undefined') {
                    assert.ok(Array.isArray(minion.attributes));
                }
            });
        });
        it('should have valid events', function() {
            Object.keys(constants.minions).forEach(function(minionId) {
                var minion = constants.minions[minionId];
                if (typeof minion.events !== 'undefined') {
                    Object.values(minion.events).forEach(function(handler) {
                        assertValidActions(handler);
                    });
                }
            });
        });
    });
});
