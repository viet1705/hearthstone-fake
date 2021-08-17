var constants = {
    player: {
        INITIAL_HEALTH: 30,
        MAX_HEALTH: 30,
        DECK_SIZE: 30,
        MAX_DUPLICATES: 2,
        HAND_SIZE: 3,
        INITIAL_MANA: 1,
        COIN_ID: 14,
        MAX_MANA: 10,
        MAX_MINIONS: 8,
        MAX_CARDS: 10,
        NO_MOVE_DELAY: 500
    },
    game: {
        LAST_CARD_DELAY: 3000,
        BOT_DELAY: 1000,
        TURN_TIME: 120,
        MULLIGAN_TIME: 60,
        TURN_TIME_CHECK: 10000,
        MESSAGE_FADE_SPEED: 3000,
        PING_TIME: 30000,
        TIPS: ["Can't find an opponent? Open a new tab and play against yourself!", "New to the game? Play against the tutorial bot!"],
        INTRO: [
            "Hi! I'm tutorial bot!",
            "I'll be teaching you how to play this game.",
            "Cards that you can currently play are outlined in green.",
            "To play a card, drag and drop it onto the playing area (grey area).",
            "To end your turn, press the End Turn button on the right.",
            "Your minions are the bottom circles in the playing area (grey area).",
            "The minions that you can use to attack are highlighted in green.",
            "You can attack my minions by dragging your minions onto mine.",
            "You can also attack me by dragging your minions onto my portrait (yellow box at top).",
            "Some cards require a target to be played on.",
            "In that case, start dragging at the card and let go of your mouse at the target you want to play your card on.",
            "Good luck, and enjoy the game!"
        ],
        TUTORIAL_DEFEAT_HELP: 'Trouble defeating the tutorial bot? Try customizing your deck in the "Your Cards" menu!'
    },
    cardcollection: {
        CARDS_PER_ROW: 5,
        CARDS_PER_COL: 3
    },
    cards: {
        '0': {
            mana: 3,
            type: 'minion',
            spawn: [0, 0, 0],
            name: 'Tiny Army',
            description: 'Spawn a few soldiers. Not a very special card.',
            image: 'army.png'
        },
        '1': {
            mana: 5,
            type: 'minion',
            spawn: [0, 0, 0, 0, 0],
            name: 'Medium Army',
            description: 'Spawn a few more soldiers.',
            image: 'medium_army.png'
        },
        '2': {
            mana: 2,
            type: 'minion',
            spawn: [1],
            name: 'Dummy',
            description: 'Spawn a distraction.',
            image: 'dummy.png'
        },
        '3': {
            mana: 3,
            type: 'spell',
            name: 'Card Search',
            description: 'Draw two cards.',
            actions: [['draw', 2]],
            image: 'card_search.png'
        },
        '4': {
            mana: 1,
            type: 'spell',
            name: 'Fireburst',
            description: 'Do two damage to some target.',
            actions: [['damage', 2]],
            target: true,
            image: 'fireburst.png'
        },
        '5': {
            mana: 2,
            type: 'minion',
            name: 'Charger',
            description: 'Gets an early chance to attack.',
            spawn: [2],
            image: 'charge.png'
        },
        '6': {
            mana: 10,
            type: 'spell',
            name: 'Nuke',
            description: 'Do 10 damage to some target.',
            actions: [['damage', 10]],
            target: true,
            image: 'nuke.png'
        },
        '7': {
            mana: 4,
            type: 'minion',
            name: 'Tank',
            description: 'A pretty average unit.',
            spawn: [3],
            image: 'tank.png'
        },
        '8': {
            mana: 3,
            type: 'minion',
            name: 'Knight',
            description: 'A 2/1 knight and his 1/1 squire.',
            spawn: [4, 5],
            image: 'knight.png'
        },
        '9': {
            mana: 5,
            type: 'spell',
            name: 'Explosion',
            description: 'Do 3 damage to everything.',
            actions: [['all_damage', 3]],
            image: 'explosion.png'
        },
        '10': {
            mana: 6,
            type: 'minion',
            name: 'Red Panda',
            description: 'Very tanky unit.',
            spawn: [6],
            image: 'red_panda.png'
        },
        '11': {
            mana: 3,
            type: 'minion',
            name: 'The Bunny',
            description: 'Good for quick attacks.',
            spawn: [7],
            image: 'bunny.png'
        },
        '12': {
            mana: 3,
            type: 'minion',
            name: 'The Wombat',
            description: 'Good as a temporary shield.',
            spawn: [8],
            image: 'wombat.png'
        },
        '13': {
            mana: 3,
            type: 'minion',
            name: 'The Field Mouse',
            description: 'Spawns two 1/1 allies on death.',
            spawn: [9],
            image: 'mouse.png'
        },
        '14': {
            mana: 0,
            type: 'spell',
            name: 'The Coin',
            description: 'Gives you one extra mana this turn.',
            obtainable: false,
            actions: [['mana', 1]],
            image: 'coin.png'
        },
        '15': {
            mana: 6,
            type: 'spell',
            name: 'Fireball',
            description: 'Do 4 damage to some target.',
            actions: [['damage', 4]],
            target: true,
            image: 'fireball.png'
        },
        '16': {
            mana: 5,
            type: 'spell',
            name: 'Morale Boost',
            description: 'Give all of your minions +2 attack.',
            actions: [['buff_attack_all', 2]],
            image: 'morale_boost.png'
        },
        '17': {
            mana: 5,
            type: 'spell',
            name: 'Medical Aid',
            description: 'Give all of your minions +2 health.',
            actions: [['buff_health_all', 2]],
            image: 'medical_aid.png'
        },
        '18': {
            mana: 5,
            type: 'minion',
            name: 'Ninja',
            description: 'Do 2 damage to the opponent.',
            actions: [['damage_opponent', 2]],
            spawn: [11],
            image: 'ninja.png'
        },
        '19': {
            mana: 1,
            type: 'minion',
            name: 'Lesser Demon',
            description: 'Battlecry: Discard a random card.',
            actions: [['discard', 1]],
            spawn: [12],
            image: 'lesser_demon.png'
        },
        '20': {
            mana: 6,
            type: 'spell',
            name: 'Mass Heal',
            description: 'Heal a unit for 10 health.',
            actions: [['heal', 10]],
            target: true,
            image: 'heal.png'
        },
        '21': {
            mana: 2,
            type: 'spell',
            name: 'Shield',
            description: 'Give a minion a shield.',
            actions: [['attribute', 'shield']],
            target: true,
            image: 'shield.png'
        },
        '22': {
            mana: 2,
            type: 'spell',
            name: 'Taunt',
            description: 'Give a minion taunt status.',
            actions: [['attribute', 'taunt']],
            target: true,
            image: 'taunt.png'
        },
        '23': {
            mana: 4,
            type: 'minion',
            name: 'Fallen Swordsman',
            description: 'Any time a minion takes damage, this unit gains one attack.',
            spawn: [13],
            image: 'swordsman.png'
        },
        '24': {
            mana: 1,
            type: 'spell',
            name: 'Soul Sacrifice',
            description: 'Lose two health, gain two cards.',
            actions: [['damage_player', 2], ['draw', 2]],
            image: 'soul_sacrifice.png'
        },
        '25': {
            mana: 4,
            type: 'minion',
            name: 'The Giant',
            description: 'Gains +1 health at the start of every turn.',
            spawn: [14],
            image: 'giant.png'
        },
        '26': {
            mana: 2,
            type: 'minion',
            name: 'Annoy-o-matic',
            description: 'Has taunt and shield.',
            spawn: [15],
            image: 'annoy.png'
        },
        '27': {
            mana: 8,
            type: 'minion',
            name: 'Dr. Boom',
            description: 'Also spawns 2 explode bots.',
            spawn: [17, 16, 17],
            image: 'boom.png'
        },
        '28': {
            mana: 3,
            type: 'minion',
            name: 'Imp Master',
            description: 'When this minion is damaged, summon a 1/1 imp.',
            spawn: [18],
            image: 'imp_master.png'
        },
        '29': {
            mana: 3,
            type: 'minion',
            name: 'Shredder',
            description: 'When this minion is damaged, discard a card from your hand.',
            spawn: [20],
            image: 'shredder.png'
        },
        '30': {
            mana: 1,
            type: 'spell',
            name: 'Magic Missile',
            description: 'Do 3 damage randomly split among enemies.',
            actions: [['random_damage_opponent', 1], ['random_damage_opponent', 1], ['random_damage_opponent', 1]],
            image: 'magic_missile.png'
        },
        '31': {
            mana: 5,
            type: 'spell',
            name: 'Powerful Buff',
            description: 'Give a minion +4/+4.',
            target: true,
            actions: [['buff_health', 4], ['buff_attack', 4]],
            image: 'buff.png'
        },
        '32': {
            mana: 2,
            type: 'minion',
            name: 'Knife Thrower',
            description: 'Deal 1 damage to a random enemy when a minion is spawned.',
            spawn: [21],
            image: 'knife_thrower.png'
        },
        '33': {
            mana: 2,
            type: 'minion',
            name: 'Gravedigger',
            description: 'Draw a card when this minion dies.',
            spawn: [22],
            image: 'gravedigger.png'
        },
        '34': {
            mana: 5,
            type: 'spell',
            name: 'Earthquake',
            description: 'Do 2 damage to all enemies.',
            actions: [['all_damage_opponent', 2]],
            image: 'earthquake.png'
        },
        '35': {
            mana: 1,
            type: 'minion',
            name: 'Archer',
            description: 'Battlecry: Deal one damage.',
            target: true,
            spawn: [23],
            actions: [['damage', 1]],
            image: 'archer.png'
        },
        '36': {
            mana: 2,
            type: 'spell',
            name: 'Mind Read',
            description: "Copy 2 cards from opponent's hand.",
            actions: [['card_copy', 2]],
            image: 'mind_read.png'
        },
        '37': {
            mana: 2,
            type: 'spell',
            name: 'Life Drain',
            description: "Steal 2 health from the opponent.",
            actions: [['damage_opponent', 2], ['damage_player', -2]],
            image: 'life_drain.png'
        },
        '38': {
            mana: 10,
            type: 'minion',
            name: 'Big Boss',
            description: 'Throw away all cards in hand.',
            spawn: [24],
            actions: [['discard', 10]],
            image: 'big_boss.png'
        },
        '39': {
            mana: 4,
            type: 'minion',
            name: 'Shieldmaster',
            description: 'Taunt',
            spawn: [25],
            image: 'shieldmaster.png'
        },
        '40': {
            mana: 7,
            type: 'spell',
            name: 'Destruction',
            description: 'Destroy a minion.',
            target: true,
            actions: [['destroy']],
            image: 'destruction.png'
        },
        '41': {
            mana: 3,
            type: 'spell',
            name: 'Lumpify',
            description: 'Replace a minion with a 0/1 lump with taunt.',
            target: true,
            actions: [['replace', 26]],
            image: 'lump.png'
        },
        '42': {
            mana: 6,
            type: 'minion',
            name: 'Fire Golem',
            description: 'Battlecry: Do 3 damage to some object.',
            target: true,
            spawn: [27],
            actions: [['damage', 3]],
            image: 'fire_golem.png'
        },
        '43': {
            mana: 9,
            type: 'minion',
            name: 'The Magician',
            description: 'Whenever you play a card, summon a 2/2 rabbit.',
            spawn: [28],
            image: 'magician.png'
        },
        '44': {
            mana: 8,
            type: 'minion',
            name: 'The Magistrate',
            description: 'Whenever you play a card, gain +2 attack.',
            spawn: [30],
            image: 'magistrate.png'
        },
        '45': {
            mana: 4,
            type: 'minion',
            name: 'The Acolyte',
            description: 'Whenever another friendly minion dies, draw a card.',
            spawn: [31],
            image: 'acolyte.png'
        },
        '46': {
            mana: 4,
            type: 'spell',
            name: 'Low Destruction',
            description: 'Destroy a minion with 3 or less health.',
            actions: [['if', (target) => target && target.isMinion && target.health <= 3, [['destroy']]]],
            target: true,
            image: 'low_destruction.png'
        },
        '47': {
            mana: 4,
            type: 'spell',
            name: 'High Destruction',
            description: 'Destroy a minion with 5 or more health.',
            actions: [['if', (target) => target && target.isMinion && target.health >= 5, [['destroy']]]],
            target: true,
            image: 'high_destruction.png'
        },
        '48': {
            mana: 2,
            type: 'spell',
            name: 'Silence',
            description: 'Remove all special effects from a minion.',
            target: true,
            actions: [['silence']],
            image: 'silence.png'
        },
        '49': {
            mana: 2,
            type: 'minion',
            name: 'Dinosaur',
            description: 'Nothing special.',
            spawn: [32],
            image: 'dinosaur.png'
        },
        '50': {
            mana: 1,
            type: 'spell',
            name: "Nature's Blessing",
            description: 'Give a beast +2/+2.',
            actions: [['if', (target) => target && target.isMinion && target.type === 'beast', [['buff_health', 2], ['buff_attack', 2]]]],
            image: 'nature_blessing.png',
            target: true
        },
        '51': {
            mana: 2,
            type: 'minion',
            name: 'Bat',
            description: 'Nothing special.',
            spawn: [33],
            image: 'bat.png'
        },
        '52': {
            mana: 3,
            type: 'spell',
            name: 'Wolf Army',
            description: 'For each opponent minion, summon a 1/1 wolf with charge.',
            actions: [['spawn_matching_opponent', 34]],
            image: 'wolf_army.png'
        },
        '53': {
            mana: 3,
            type: 'spell',
            name: 'The Hunt',
            description: 'Destroy a beast.',
            actions: [['if', (target) => target && target.isMinion && target.type == 'beast', [['destroy']]]],
            image: 'hunt.png',
            target: true
        }
    },
    minions: {
        '0': {
            health: 1,
            attack: 1,
            name: 'Tiny Soldier'
        },
        '1': {
            health: 3,
            attack: 0,
            name: 'Dummy',
            attributes: ['taunt']
        },
        '2': {
            health: 1,
            attack: 1,
            name: 'Charger',
            attributes: ['charge']
        },
        '3': {
            health: 4,
            attack: 3,
            name: 'Tank'
        },
        '4': {
            health: 1,
            attack: 2,
            name: 'Knight',
            attributes: ['shield']
        },
        '5': {
            health: 1,
            attack: 1,
            name: 'Squire'
        },
        '6': {
            health: 7,
            attack: 6,
            name: 'Red Panda',
            type: 'beast'
        },
        '7': {
            health: 2,
            attack: 4,
            name: 'The Bunny',
            attributes: ['charge'],
            type: 'beast'
        },
        '8': {
            health: 3,
            attack: 3,
            name: 'The Wombat',
            attributes: ['taunt'],
            type: 'beast'
        },
        '9': {
            health: 2,
            attack: 1,
            name: 'The Field Mouse',
            events: {
                death: [['spawn', [10, 10]]]
            },
            type: 'beast'
        },
        '10': {
            health: 1,
            attack: 1,
            name: 'Lesser Field Mice',
            type: 'beast'
        },
        '11': {
            health: 4,
            attack: 4,
            name: 'Ninja'
        },
        '12': {
            health: 3,
            attack: 2,
            name: 'Lesser Demon'
        },
        '13': {
            health: 4,
            attack: 2,
            name: 'Fallen Swordsman',
            events: {
                minion_damage: [['buff_attack', 1]]
            }
        },
        '14': {
            health: 3,
            attack: 1,
            name: 'The Giant',
            events: {
                turn_start: [['buff_health', 1]]
            }
        },
        '15': {
            health: 1,
            attack: 1,
            name: 'Annoy-o-matic',
            attributes: ['taunt', 'shield']
        },
        '16': {
            health: 7,
            attack: 7,
            name: 'Dr. Boom'
        },
        '17': {
            health: 1,
            attack: 1,
            name: 'Explode Bot',
            events: {
                death: [['random_damage', 2], ['random_damage', 2]]
            }
        },
        '18': {
            health: 4,
            attack: 2,
            name: 'Imp Master',
            events: {
                self_damage: [['spawn', [19]]]
            }
        },
        '19': {
            health: 1,
            attack: 1,
            name: 'Imp'
        },
        '20': {
            health: 6,
            attack: 4,
            name: 'Shredder',
            events: {
                self_damage: [['discard', 1]]
            }
        },
        '21': {
            health: 2,
            attack: 2,
            name: 'Knife Thrower',
            events: {
                minion_spawn: [['random_damage_opponent', 1]]
            }
        },
        '22': {
            name: 'Gravedigger',
            health: 1,
            attack: 1,
            events: {
                death: [['draw', 1]]
            }
        },
        '23': {
            name: 'Archer',
            health: 1,
            attack: 1
        },
        '24': {
            name: 'Big Boss',
            health: 12,
            attack: 12
        },
        '25': {
            name: 'Shieldmaster',
            health: 5,
            attack: 3,
            attributes: ['taunt']
        },
        '26': {
            name: 'Lump',
            health: 1,
            attack: 0,
            attributes: ['taunt']
        },
        '27': {
            name: 'Fire Golem',
            health: 3,
            attack: 6
        },
        '28': {
            name: 'The Magician',
            health: 5,
            attack: 4,
            events: {
                friendly_play_card: [['spawn', [29]]]
            }
        },
        '29': {
            name: 'Rabbit',
            health: 2,
            attack: 2,
            type: 'beast'
        },
        '30': {
            name: 'The Magistrate',
            health: 5,
            attack: 4,
            events: {
                friendly_play_card: [['buff_attack', 2]]
            }
        },
        '31': {
            name: 'The Acolyte',
            health: 2,
            attack: 4,
            events: {
                friendly_death: [['draw', 1]]
            }
        },
        '32': {
            name: 'Dinosaur',
            health: 2,
            attack: 3,
            type: 'beast'
        },
        '33': {
            name: 'Bat',
            health: 3,
            attack: 2,
            type: 'beast'
        },
        '34': {
            name: 'Wolf',
            health: 1,
            attack: 1,
            attributes: ['charge'],
            type: 'beast'
        }
    }
};

Object.keys(constants.cards).forEach(function(id) {
    constants.cards[id].id = parseInt(id);
});

Object.keys(constants.minions).forEach(function(id) {
    constants.minions[id].id = parseInt(id);
});

Object.values(constants.minions).forEach(function(x) {
    if (x.events) {
        if (!x.attributes) {
            x.attributes = [];
        }
        if (x.events.death && Object.keys(x.events).length < 2) {
            x.attributes.push('deathrattle');
        }
        else {
            x.attributes.push('special');
        }
    }
});

if (typeof module !== 'undefined') {
    module.exports = constants;
}
