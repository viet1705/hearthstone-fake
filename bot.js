var Player = require('./player.js');
var constants = require('./public/js/constants.js');

function Bot() {
    Player.call(this, null);
    this.username = 'Tutorial Bot';
    this.initialDeck = [3, 11, 11, 13, 13, 23, 23, 24, 24, 26, 26, 27, 27, 28, 28, 30, 30, 31, 31, 32, 32, 33, 33, 34, 34, 36, 36, 38, 43, 43];
}

Bot.prototype = Object.create(Player.prototype);

function hasAction(card, action) {
    if (typeof card === 'undefined' || typeof action === 'undefined') {
        throw new Error('Invalid arguments passed to hasAction!');
    }
    if (!card.actions) return false;
    return card.actions.some((x) => x[0] === action);
}

function getAction(card, action) {
    if (typeof card === 'undefined' || typeof action === 'undefined') {
        throw new Error('Invalid arguments passed to getAction!');
    }
    if (!card.actions) return null;
    return card.actions.find((x) => x[0] === action);
}

Bot.getTarget = function(game, bot, opp) {
    var sortedMinions = opp.minions.sort(function(x, y) {
        // target taunt minions first
        var xTaunt = x.hasAttribute('taunt');
        var yTaunt = y.hasAttribute('taunt');
        if (xTaunt && !yTaunt) {
            return -1;
        }
        if (yTaunt && !xTaunt) {
            return 1;
        }
        // target special minions second
        var xSpecial = x.hasAttribute('special');
        var ySpecial = y.hasAttribute('special');
        if (xSpecial && !ySpecial) {
            return -1;
        }
        if (ySpecial && !xSpecial) {
            return 1;
        }
        // target minion with least health
        var healthDiff = x.health - y.health;
        if (healthDiff != 0) {
            return healthDiff;
        }
        else {
            // target minion with highest attack
            return y.attack - x.attack;
        }
    });
    var targetObject, target, hasTaunt;
    if (sortedMinions.length > 0) {
        targetObject = sortedMinions[0];
        target = targetObject.minionInstanceId;
        hasTaunt = targetObject.hasAttribute('taunt');
    }
    else {
        targetObject = null;
        target = 'opponent';
        hasTaunt = false;
    }

    // if no taunts and can kill opponent (or get close to doing so), do so
    var maxDamage = bot.minions.map((x) => x.attack).reduce((x, y) => x + y, 0);
    if (maxDamage * 1.2 >= opp.health && !hasTaunt) {
        target = 'opponent';
        targetObject = null;
    }
    return {
        target: target,
        targetObject: targetObject,
        hasTaunt: hasTaunt
    };
};

Bot.prototype.sendMessage = function(msg) {
    if (!this.game) {
        return;
    }
    this.game.getOpponent(this).sendPacket('message', '[Tutorial Bot] ' + msg);
};

Bot.prototype.playMove = function() {
    // bot's turn, do actions
    const bot = this;
    const opp = this.game.getOpponent(this);
    // if game is over, don't do anything
    if (bot.health <= 0 || opp.health <= 0) {
        return;
    }
    var processActionQueue = function() {
        // game ended, stop processing
        if (!bot.game || bot.game.ended) {
            return;
        }
        // game almost ended, stop processing
        if (bot.health <= 0 || opp.health <= 0) {
            return;
        }
        var noActions = true;
        // try playing spell cards
        bot.hand.every(function(cardId) {
            var card = constants.cards[cardId];
            if (card.mana <= bot.mana) {
                if (card.type == 'spell') {
                    if (hasAction(card, 'damage_player')) {
                        // don't play card if it kills bot
                        if (getAction(card, 'damage_player')[1] >= bot.health) {
                            return true;
                        }
                    }
                    if (!card.target) {
                        if (hasAction(card, 'all_damage')) {
                            // don't play card if it kills bot
                            if (getAction(card, 'all_damage')[1] >= bot.health) {
                                return true;
                            }
                            if (opp.minions.length >= bot.minions.length + 2) {
                                bot.playCard(card.id);
                                noActions = false;
                                return false;
                            }
                        }
                        if (hasAction(card, 'all_damage_opponent') || hasAction(card, 'random_damage_opponent') || hasAction(card, 'spawn_matching_opponent')) {
                            if (opp.minions.length >= 2) {
                                bot.playCard(card.id);
                                noActions = false;
                                return false;
                            }
                        }
                        if (hasAction(card, 'draw') || hasAction(card, 'card_copy')) {
                            bot.playCard(card.id);
                            noActions = false;
                            return false;
                        }
                        if (hasAction(card, 'buff_attack_all') || hasAction(card, 'buff_health_all')) {
                            if (bot.minions.length > 3) {
                                bot.playCard(card.id);
                                noActions = false;
                                return false;
                            }
                        }
                    }
                    else {
                        if (hasAction(card, 'heal')) {
                            // only heal player if none is wasted
                            var heal = getAction(card, 'heal')[1];
                            if (bot.health <= constants.player.MAX_HEALTH - heal) {
                                bot.playCard(card.id, "player");
                                noActions = false;
                                return false;
                            }
                        }
                        if (hasAction(card, 'damage')) {
                            // if opponent low on health, attack opponent, otherwise attack minion
                            var dmg = getAction(card, 'damage')[1];
                            if (dmg >= opp.health * 1.1) {
                                bot.playCard(card.id, "opponent");
                            }
                            else {
                                bot.playCard(card.id, Bot.getTarget(bot.game, bot, opp).target);
                            }
                        }
                        if (hasAction(card, 'replace')) {
                            var replaceMinion = constants.minions[getAction(card, 'replace')[1]];
                            const target = Bot.getTarget(bot.game, bot, opp);
                            const targetObject = target.targetObject;
                            if (targetObject && targetObject.isMinion && targetObject.health >= (replaceMinion.health * 2) && targetObject.attack >= replaceMinion.attack) {
                                bot.playCard(card.id, target.target);
                            }
                        }
                        if (bot.minions.length > 0) {
                            if (hasAction(card, 'buff_attack') || hasAction(card, 'buff_health')) {
                                bot.playCard(card.id, bot.minions.reduce(function(prev, curr) {
                                    if (prev.health > curr.health) {
                                        return prev;
                                    }
                                    return curr;
                                }).minionInstanceId);
                            }
                        }
                    }
                }
            }
            return true;
        });
        if (!noActions) {
            setTimeout(processActionQueue, constants.game.BOT_DELAY);
            return;
        }

        // get target to attack
        var targetInfo = Bot.getTarget(bot.game, bot, opp);
        var target = targetInfo.target;
        var targetObject = targetInfo.targetObject;

        // try playing minion cards
        bot.hand.every(function(cardId) {
            const card = constants.cards[cardId];
            if (card.mana <= bot.mana && bot.minions.length < constants.player.MAX_MINIONS) {
                if (card.type == 'minion') {
                    if (!card.target) {
                        noActions = false;
                        bot.playCard(card.id);
                        return false;
                    }
                    else {
                        if (hasAction(card, 'damage')) {
                            noActions = false;
                            bot.playCard(card.id, target);
                            return false;
                        }
                    }
                }
            }
            return true;
        });
        if (!noActions) {
            setTimeout(processActionQueue, constants.game.BOT_DELAY);
            return;
        }

        // play less important spell cards
        bot.hand.every(function(cardId) {
            const card = constants.cards[cardId];
            if (card.mana <= bot.mana && card.type == 'spell') {
                if (hasAction(card, 'attribute')) {
                    var addedAttr = getAction(card, 'attribute')[1];
                    if (addedAttr == 'taunt') {
                        // give the highest health minion taunt
                        const targetMinion = bot.minions.filter((x) => !x.hasAttribute('taunt')).sort((x, y) => y.health - x.health);
                        if (targetMinion.length > 0) {
                            bot.playCard(card.id, targetMinion[0].minionInstanceId);
                        }
                    }
                    else if (addedAttr == 'shield') {
                        // give special minions shield, and then the highest attack minions shield
                        const targetMinion = bot.minions.filter((x) => !x.hasAttribute('shield')).sort((x, y) => {
                            if (x.hasAttribute('special') && !y.hasAttribute('special')) {
                                return -1;
                            }
                            if (!x.hasAttribute('special') && y.hasAttribute('special')) {
                                return 1;
                            }
                            return y.attack - x.attack;
                        });
                        if (targetMinion.length > 0) {
                            bot.playCard(card.id, targetMinion[0].minionInstanceId);
                        }
                    }
                }
                if (hasAction(card, 'silence')) {
                    // silence opponent minions with special attributes
                    const targetMinion = opp.minions.filter((x) => x.hasAttribute('special') || x.hasAttribute('deathrattle'));
                    if (targetMinion.length > 0) {
                        bot.playCard(card.id, targetMinion[0].minionInstanceId);
                    }
                }
                if (hasAction(card, 'damage_opponent') && !card.target) {
                    // play non-targeting cards that damage opponent
                    bot.playCard(card.id);
                }
            }
        });

        // recompute attack target
        targetInfo = Bot.getTarget(bot.game, bot, opp);
        target = targetInfo.target;
        targetObject = targetInfo.targetObject;

        // do minion attacks
        bot.minions.sort(function(x, y) {
            // have shielded minions attack first
            var xShield = x.hasAttribute('shield');
            var yShield = y.hasAttribute('shield');
            if (xShield && !yShield) {
                return -1;
            }
            if (yShield && !xShield) {
                return 1;
            }
            // highest health minions should then attack
            return y.health - x.health;
        }).every(function(minion) {
            if (minion.hasAttack) {
                if (targetObject) {
                    if (minion.health <= targetObject.attack) {
                        // don't attack if taunt and player has low health
                        if (minion.hasAttribute('taunt') && bot.health <= 8) {
                            if (!targetInfo.hasTaunt) {
                                target = 'opponent';
                                targetObject = null;
                            }
                            else {
                                return true;
                            }
                        }
                        else if (minion.attack < targetObject.health / 4) {
                            // don't attack if attack won't do much
                            if (!targetInfo.hasTaunt) {
                                target = 'opponent';
                                targetObject = null;
                            }
                            else {
                                return true;
                            }
                        }
                        else if (!targetObject.hasAttribute('taunt') && !targetObject.hasAttribute('special')) {
                            if (minion.health >= targetObject.health && minion.attack >= targetObject.attack) {
                                // don't attack if this minion is better than the opponent's minion
                                if (!targetInfo.hasTaunt) {
                                    target = 'opponent';
                                    targetObject = null;
                                }
                                else {
                                    return true;
                                }
                            }
                        }
                    }
                }
                bot.doAttack(minion.minionInstanceId, target);
                noActions = false;
                return false;
            }
            return true;
        });
        if (noActions) {
            if (bot.game) {
                bot.game.switchTurns(bot.id);
            }
        }
        else {
            setTimeout(processActionQueue, constants.game.BOT_DELAY);
        }
    };
    setTimeout(processActionQueue, 0);
};

Bot.prototype.cleanup = function() {
    if (this.timeoutIds) {
        this.timeoutIds.forEach((x) => clearTimeout(x));
    }
};

Bot.prototype.doIntroduction = function() {
    const bot = this;
    var i = 0;
    bot.timeoutIds = [];
    constants.game.INTRO.forEach(function(msg) {
        var timeoutId = setTimeout(function() {
            bot.sendMessage(msg);
        }, (constants.game.MESSAGE_FADE_SPEED + 500) * i);
        bot.timeoutIds.push(timeoutId);
        i++;
    });
};

Bot.prototype.handleError = function(data) {
    console.warn(`Bot (error): ${data}`);
};

Bot.prototype.sendPacket = function(msg, data) {
    switch(msg) {
        case 'gameInit':
            // do mulligan, remove all 5+ cards
            this.doMulligan(this.hand.map((x) => constants.cards[x].mana >= 5));
            break;
        case 'gameTimer':
            break;
        case 'addCard':
            break;
        case 'discardCard':
            break;
        case 'updatePlayer':
            break;
        case 'updateMinion':
            break;
        case 'playCard':
            break;
        case 'addMinion':
            break;
        case 'removeMinion':
            break;
        case 'gameEnd':
            break;
        case 'message':
            break;
        case 'nextTurn':
            // not in a game, don't do anything
            const game = this.game;
            if (!game) {
                break;
            }
            // surrender if no more cards/minions
            if (this.hand.length <= 0 && this.deck.length <= 0 && this.minions.length <= 0) {
                game.end(game.getOpponent(this.id));
            }
            // first time tutorial text
            const opp = game.getOpponent(this);
            if (data.turn == opp.id) {
                if (!this.firstTurn) {
                    this.doIntroduction();
                    this.firstTurn = true;
                }
            }
            // process AI moves
            if (data.turn == this.id) {
                this.playMove();
            }
            break;
        case 'error':
            this.handleError(data);
            break;
        default:
            console.warn(`Bot (unhandled): ${msg} -> ${JSON.stringify(data)}`);
    }
};

Bot.prototype.constructor = Bot;
module.exports = Bot;
