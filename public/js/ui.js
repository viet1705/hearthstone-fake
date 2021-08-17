function createButton(text, callback) {
    var button = new PIXI.Text(text, new PIXI.TextStyle({
        fontFamily: 'Pangolin',
        fill: '#ffffff',
        fontSize: 36
    }));
    button.on('mouseover', function() {
        button.style.fill = '#aaaaaa';
    });
    button.on('mouseout', function() {
        button.style.fill = '#ffffff';
    });
    button.interactive = true;
    button.buttonMode = true;
    button.on('pointerdown', callback);
    button.anchor.set(0.5);
    return button;
}

function createMinion(minionInfo, minionId) {
    var minion = new PIXI.Container();
    minion.type = minionInfo.type;
    minion.id = minionInfo.id;
    minion._health = minionInfo.health;
    minion._attack = minionInfo.attack;
    minion._attributes = minionInfo.attributes || [];
    minion.minionInstanceId = minionId;
    minion.attackData = minionId;
    Object.defineProperty(minion, 'health', {
        set: function(x) {
            if (this._health > x) {
                createDamageEffect(minion, 40, 40);
            }
            this._health = x;
            this.healthText.text = x;
        },
        get: function() { return this._health; }
    });
    Object.defineProperty(minion, 'attack', {
        set: function(x) { this._attack = x; this.attackText.text = x; },
        get: function() { return this._attack; }
    });
    Object.defineProperty(minion, 'attributes', {
        set: function(x) { this._attributes = x; this.regenAttributes(); },
        get: function() { return this._attributes; }
    });
    var background = PIXI.Sprite.fromImage(minion.type === 'beast' ? './img/beast.png' : './img/minion.png');
    background.width = 80;
    background.height = 80;

    var health = new PIXI.Text(minion.health, new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#ff0000',
            dropShadow: true,
            dropShadowDistance: 1
    }));
    minion.interactive = true;
    minion.buttonMode = true;
    minion.healthText = health;
    health.anchor.set(0.5);
    health.x = 70;
    health.y = 70;

    var attack = new PIXI.Text(minion.attack, new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#ffff00',
            dropShadow: true,
            dropShadowDistance: 1
    }));
    minion.attackText = attack;
    attack.anchor.set(0.5);
    attack.x = 15;
    attack.y = 70;

    var name = new PIXI.Text(minionInfo.name, new PIXI.TextStyle({
        fontFamily: 'Pangolin',
        fontSize: 12
    }));
    name.anchor.set(0.5);
    name.x = 40;
    name.y = 10;

    minion.addChild(background);
    minion.addChild(name);

    minion.attributeSprites = {};
    minion.regenAttributes = function() {
        Object.keys(minion.attributeSprites).forEach(function(attr) {
            minion.removeChild(minion.attributeSprites[attr]);
        });
        minion.attributeSprites = {};
        if (minion.attributes) {
            game.ATTRIBUTE_MAP.forEach(function(attr) {
                if (minion.attributes.indexOf(attr[0]) > -1) {
                    var attrSprite = PIXI.Sprite.fromImage(attr[1]);
                    attrSprite.anchor.set(0.5);
                    attrSprite.width = 20;
                    attrSprite.height = 20;
                    attrSprite.x = 40;
                    attrSprite.y = 60;
                    minion.attributeSprites[attr[0]] = attrSprite;
                    minion.addChild(attrSprite);
                }
            });
        }
    };
    minion.regenAttributes();

    minion.addChild(health);
    minion.addChild(attack);
    return minion;
}

function createDamageEffect(item, x, y) {
    var emitter = new PIXI.particles.Emitter(item, [PIXI.Texture.fromImage('./img/particle.png')], {
        pos: {
            x: x,
            y: y
        },
        frequency: 0.01,
        spawnChance: 1,
        particlesPerWave: 1,
        maxParticles: 1000,
        lifetime: {
            min: 0.5,
            max: 0.5
        },
        startRotation: {
            min: 0,
            max: 360
        },
        alpha: {
            list: [{ value: 0.5, time: 0 }, { value: 0.1, time: 1 }],
            isStepped: false
        },
        color: {
            list: [{value: "ff0000", time: 0}, {value: "cc0000", time: 1}],
            isStepped: false
        },
        speed: {
            list: [{value: 100, time: 0}, {value: 50, time: 1}],
            isStepped: false
        },
        emitterLifetime: 0.1
    });
    emitter.emit = true;
    emitter.playOnceAndDestroy();
}

function titleize(str) {
    if (str.length < 1) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function createCard(cardInfo) {
    var card = new PIXI.Container();
    card.id = cardInfo.id;
    card.type = cardInfo.type;
    card.target = cardInfo.target;
    card._mana = cardInfo.mana;
    Object.defineProperty(card, 'mana', {
        set: function(x) { card._mana = x; card.manaText.text = x; },
        get: function() { return card._mana; }
    });
    var background = PIXI.Sprite.fromImage('./img/card.png');
    var imagePlaceholder = new PIXI.Graphics();
    imagePlaceholder.beginFill(0xff00ff);
    imagePlaceholder.drawRect(0, 0, 160, 100);
    imagePlaceholder.x = 15;
    imagePlaceholder.y = 15;

    var title = new PIXI.Text(cardInfo.name || 'Untitled Card', new PIXI.TextStyle({
        fontFamily: 'Pangolin',
        fontSize: 20
    }));
    title.anchor.set(0.5);
    title.x = 100;
    title.y = 120;
    var description = new PIXI.Text(cardInfo.description, new PIXI.TextStyle({
        fontFamily: 'Pangolin',
        fontSize: 14,
        wordWrap: true,
        wordWrapWidth: 150
    }));
    description.anchor.set(0.5, 0);
    description.x = 100;
    description.y = 140;
    background.width = 200;
    background.height = 250;
    var type, subtype;
    if (cardInfo.type == 'minion') {
        type = 'Minion x ' + cardInfo.spawn.length;
    }
    else if (cardInfo.type == 'spell') {
        type = 'Spell';
    }
    type = new PIXI.Text(type, new PIXI.TextStyle({
        fontFamily: 'Pangolin',
        fontSize: 14,
        wordWrap: true,
        wordWrapWidth: 150
    }));
    type.anchor.set(0.5, 0);
    type.x = 100;
    type.y = 210;

    if (cardInfo.type == 'minion') {
        subtype = titleize(constants.minions[cardInfo.spawn[0]].type || '');
        if (subtype.length > 0) {
            subtype = new PIXI.Text(subtype, new PIXI.TextStyle({
                fontFamily: 'Pangolin',
                fontSize: 12,
                fill: '#666666'
            }));
            subtype.anchor.set(0.5, 0);
            subtype.x = 100;
            subtype.y = 197;
        }
    }

    var mana = new PIXI.Text(cardInfo.mana, new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#0000ff',
            dropShadow: true,
            dropShadowDistance: 1
    }));
    card.manaText = mana;
    mana.y = 10;
    mana.x = 160;
    card.interative = true;
    card.buttonMode = true;
    card.addChild(imagePlaceholder);

    if (cardInfo.image) {
        var image = PIXI.Sprite.fromImage('./img/cards/' + cardInfo.image);
        image.x = 15;
        image.y = 15;
        card.addChild(image);
    }

    card.addChild(background);
    card.addChild(title);
    card.addChild(mana);
    card.addChild(description);
    if (subtype) { card.addChild(subtype); }
    card.addChild(type);
    card.interative = true;
    card.buttonMode = true;
    if (cardInfo.spawn) {
        var minion = constants.minions[cardInfo.spawn[0]];
        var health = new PIXI.Text(minion.health, new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#ff0000',
            dropShadow: true,
            dropShadowDistance: 1
        }));
        health.anchor.set(0.5);
        health.x = 180;
        health.y = 220;
        var attack = new PIXI.Text(minion.attack, new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#cccc00',
            dropShadow: true,
            dropShadowDistance: 1
        }));
        attack.anchor.set(0.5);
        attack.x = 30;
        attack.y = 220;
        card.addChild(health);
        card.addChild(attack);

        if (minion.attributes) {
            var i = 0;
            game.ATTRIBUTE_MAP.forEach(function(attr) {
                if (minion.attributes.indexOf(attr[0]) > -1) {
                    var attrSprite = PIXI.Sprite.fromImage(attr[1]);
                    attrSprite.anchor.set(0.5);
                    attrSprite.alpha = 0.8;
                    attrSprite.width = 20;
                    attrSprite.height = 20;
                    attrSprite.x = background.width - 40 - 20 * i;
                    attrSprite.y = background.height - 40;
                    card.addChild(attrSprite);
                    i++;
                }
            });
        }
    }
    card.interactive = true;
    card.buttonMode = true;
    return card;
}

function createMenuBackground() {
    var cardBack = PIXI.Sprite.fromImage('./img/card_back.png');
    cardBack.anchor.set(0.5);
    cardBack.alpha = 0.3;
    cardBack.width = 400;
    cardBack.height = 500;
    cardBack.x = game.getScreenWidth() / 2;
    cardBack.y = game.getScreenHeight() / 2;
    cardBack.rotation = 15;
    return cardBack;
}
