var game = {
    ATTRIBUTE_MAP: [['charge', './img/charge.png'], ['taunt', './img/taunt.png'], ['deathrattle', './img/deathrattle.png'], ['shield', './img/shield.png'], ['special', './img/special.png']],
    getScreenWidth: function() {
        return 800;
    },
    getScreenHeight: function() {
        return 600;
    },
    init: function() {
        game.pixi = new PIXI.Application(game.getScreenWidth(), game.getScreenHeight());
        document.body.appendChild(game.pixi.view);

        // initialize pixi containers
        game.containers = [];

        // waiting screen
        var queuedContainer = new PIXI.Container();
        game.queuedContainer = queuedContainer;
        var loadingMessage = new PIXI.Text('Finding an opponent...', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 36,
            fill: '#ccccff'
        }));
        loadingMessage.anchor.set(0.5);
        loadingMessage.x = game.getScreenWidth() / 2;
        loadingMessage.y = 100;
        var cancelButton = createButton('Cancel', function() {
            game.sendPacket('dequeue');
        });
        cancelButton.style.fontSize -= 10;
        cancelButton.anchor.set(0.5);
        cancelButton.x = game.getScreenWidth() / 2;
        cancelButton.y = 150;
        var tipMessage = new PIXI.Text('Tip: Unknown', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 16,
            fill: '#f0e68c'
        }));
        tipMessage.anchor.set(0.5);
        tipMessage.x = game.getScreenWidth() / 2;
        tipMessage.y = game.getScreenHeight() - 100;
        queuedContainer.addChild(tipMessage);
        queuedContainer.tipMessage = tipMessage;
        queuedContainer.addChild(cancelButton);
        queuedContainer.addChild(loadingMessage);
        game.pixi.stage.addChild(queuedContainer);
        game.containers.push(queuedContainer);

        queuedContainer.cardBack = createMenuBackground();
        queuedContainer.addChild(queuedContainer.cardBack);

        // main menu screen
        var lobbyContainer = new PIXI.Container();
        game.lobbyContainer = lobbyContainer;

        lobbyContainer.addChild(createMenuBackground());

        var gameTitle = PIXI.Sprite.fromImage('./img/logo.png');
        gameTitle.anchor.set(0.5);
        gameTitle.x = game.getScreenWidth() / 2;
        gameTitle.y = 125;
        lobbyContainer.addChild(gameTitle);
        var userWelcome = new PIXI.Text("<Unknown>", new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 18,
            fill: '#ffffff'
        }));
        userWelcome.anchor.set(0.5);
        userWelcome.x = game.getScreenWidth() / 2;
        userWelcome.y = 225;
        lobbyContainer.userWelcome = userWelcome;
        lobbyContainer.addChild(userWelcome);
        var playButton = createButton('Play', function() {
            game.sendPacket('queue');
        });
        playButton.x = game.getScreenWidth() / 2;
        playButton.y = 125 + 140;
        var cardButton = createButton('Your Cards', function() {
            game.setGameState('cards');
        });
        cardButton.x = game.getScreenWidth() / 2;
        cardButton.y = 125 + 140 + 100;
        var botButton = createButton('Tutorial', function() {
            game.sendPacket('playBot');
        });
        botButton.x = game.getScreenWidth() / 2;
        botButton.y = 125 + 140 + 50;
        var logoutButton = createButton('Quit', function() {
            game.setGameState('empty');
            $("#login-container").fadeIn();
            localStorage.removeItem('username');
            game.ws.close();
        });
        logoutButton.x = game.getScreenWidth() / 2;
        logoutButton.y = 125 + 140 + 150;

        lobbyContainer.addChild(logoutButton);
        lobbyContainer.addChild(cardButton);
        lobbyContainer.addChild(playButton);
        lobbyContainer.addChild(botButton);
        game.pixi.stage.addChild(lobbyContainer);
        game.containers.push(lobbyContainer);

        // cards screen
        var cardsContainer = new PIXI.Container();
        game.cardsContainer = cardsContainer;

        var cardCollectionTitle = new PIXI.Text('Your Cards', new PIXI.TextStyle({
            fill: '#ffffff',
            fontSize: 48,
            fontFamily: 'Pangolin'
        }));
        cardCollectionTitle.x = 10;
        cardCollectionTitle.y = 10;
        cardsContainer.addChild(createMenuBackground());
        cardsContainer.addChild(cardCollectionTitle);

        var backButton = createButton('Back', function() {
            if (!game.editedDeck) {
                game.setGameState("lobby");
                return;
            }
            if (game.playerDeckList.length != constants.player.DECK_SIZE) {
                game.showError('Please add more cards to this deck! You need at least ' + constants.player.DECK_SIZE + ' cards.');
            }
            else {
                game.sendPacket('saveCards', { deck: game.playerDeckList });
                localStorage.setItem("deck", JSON.stringify(game.playerDeckList));
            }
        });
        var prevPageButton = createButton('<<<', function() {
            game.playerCardRenderOffset = Math.max(0, game.playerCardRenderOffset - 1);
            game.renderCardCollection();
        });
        var nextPageButton = createButton('>>>', function() {
            game.playerCardRenderOffset = Math.min(game.playerCardRenderOffset + 1, Math.floor(game.filteredPlayerCardList.length / (constants.cardcollection.CARDS_PER_ROW * constants.cardcollection.CARDS_PER_COL)));
            game.renderCardCollection();
        });
        nextPageButton.anchor.set(0, 1);
        prevPageButton.anchor.set(0, 1);
        nextPageButton.x = 10 + 100;
        prevPageButton.x = 10;
        nextPageButton.y = game.getScreenHeight() - 5;
        prevPageButton.y = game.getScreenHeight() - 5;
        backButton.anchor.set(1);
        backButton.x = game.getScreenWidth() - 5;
        backButton.y = game.getScreenHeight() - 5;
        cardsContainer.addChild(backButton);
        cardsContainer.addChild(nextPageButton);
        cardsContainer.addChild(prevPageButton);

        var currentDeck = new PIXI.Container();
        currentDeck.x = game.getScreenWidth() - 150;
        currentDeck.y = 75;
        var currentDeckBg = new PIXI.Graphics();
        currentDeckBg.alpha = 0.2;
        currentDeckBg.beginFill(0xDDDDDD);
        currentDeckBg.drawRect(5, 0, 140, game.getScreenHeight() - 120);
        currentDeck.addChild(currentDeckBg);
        cardsContainer.currentDeck = currentDeck;

        var currentDeckTitle = new PIXI.Text("Deck", new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 14,
            fill: '#ffffff'
        }));
        currentDeckTitle.x = 10;
        currentDeckTitle.y = -20;
        cardsContainer.currentDeck.title = currentDeckTitle;
        currentDeck.addChild(currentDeckTitle);

        var currentDeckCancel = new PIXI.Text("X", new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 14,
            fill: '#cc0000'
        }));
        currentDeckCancel.interactive = true;
        currentDeckCancel.buttonMode = true;
        currentDeckCancel.on('mouseover', function() {
            currentDeckCancel.style.fill = '#ff0000';
        });
        currentDeckCancel.on('mouseout', function() {
            currentDeckCancel.style.fill = '#cc0000';
        });
        currentDeckCancel.on('click', function() {
            if (confirm('Are you sure you want to clear all cards in this deck?')) {
                game.playerDeckList = [];
                game.renderCardCollection();
            }
        });
        currentDeckCancel.x = 130;
        currentDeckCancel.y = -20;
        currentDeck.addChild(currentDeckCancel);

        var currentDeckSearch = new PIXI.Text("S", new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 14,
            fill: '#00cc00'
        }));
        currentDeckSearch.interactive = true;
        currentDeckSearch.buttonMode = true;
        currentDeckSearch.on('mouseover', function() {
            currentDeckSearch.style.fill = '#00ff00';
        });
        currentDeckSearch.on('mouseout', function() {
            currentDeckSearch.style.fill = '#00cc00';
        });
        currentDeckSearch.on('click', function() {
            game.filterCardCollection(prompt('Enter your card search terms:\nLeave this field blank to show all cards.'));
        });
        currentDeckSearch.x = 115;
        currentDeckSearch.y = -20;
        currentDeck.addChild(currentDeckSearch);

        var currentDeckIndicator = new PIXI.Text("U", new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 14,
            fill: '#0000cc'
        }));
        currentDeckIndicator.interactive = true;
        currentDeckIndicator.buttonMode = true;
        currentDeckIndicator.on('mouseover', function() {
            currentDeckIndicator.style.fill = '#0000ff';
        });
        currentDeckIndicator.on('mouseout', function() {
            currentDeckIndicator.style.fill = '#0000cc';
        });
        currentDeckIndicator.on('click', function() {
            game.showUsedCards = !game.showUsedCards;
            game.renderCardCollection();
        });
        currentDeckIndicator.x = 130;
        currentDeckIndicator.y = -40;
        currentDeck.addChild(currentDeckIndicator);

        var helpText = new PIXI.Text('Click cards to add them to your deck. Click cards in your deck (on the right) to remove them from your deck.', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 14,
            fill: '#ffffff'
        }));
        helpText.x = 10;
        helpText.y = 60;
        cardsContainer.helpText = helpText;
        cardsContainer.addChild(helpText);

        cardsContainer.addChild(currentDeck);
        game.pixi.stage.addChild(cardsContainer);
        game.containers.push(cardsContainer);

        // game screen
        var gameContainer = new PIXI.Container();
        game.gameContainer = gameContainer;

        game.statusText = {};
        var infoFont = new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 16,
            fill: '#ffffff'
        });
        var playerInfo = new PIXI.Text('Unknown vs. Unknown', infoFont);
        playerInfo.x = 5;
        var turnStatus = new PIXI.Text('Unknown', infoFont);
        turnStatus.x = 5;
        turnStatus.y = 18;

        var playerCardsLeft = new PIXI.Text('You have ? cards left', infoFont);
        playerCardsLeft.x = 5;
        playerCardsLeft.y = 36;
        game.gameContainer.addChild(playerCardsLeft);

        var opponentCardsLeft = new PIXI.Text('Your opponent has ? cards left', infoFont);
        opponentCardsLeft.x = 5;
        opponentCardsLeft.y = 54;
        game.gameContainer.addChild(opponentCardsLeft);

        var turnTimer = new PIXI.Text('0:00', infoFont);
        turnTimer.x = 5;
        turnTimer.y = 90;
        game.gameContainer.addChild(turnTimer);

        var playerPortrait = new PIXI.Graphics();
        playerPortrait.beginFill(0xffff00);
        playerPortrait.drawRect(0, 0, 100, 120);
        playerPortrait.x = game.getScreenWidth() / 2 - 50;
        playerPortrait.y = game.getScreenHeight() - 25 - playerPortrait.height - 100;
        playerPortrait.interactive = true;
        playerPortrait.buttonMode = true;
        playerPortrait.attackData = "player";
        game.playerPortrait = playerPortrait;

        var playerLabel = new PIXI.Text('You', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 18
        }));
        playerLabel.anchor.set(0.5);
        playerLabel.x = playerPortrait.width / 2;
        playerLabel.y = 50;
        game.playerPortrait.addChild(playerLabel);

        var opponentPortrait = new PIXI.Graphics();
        opponentPortrait.beginFill(0xffff00);
        opponentPortrait.drawRect(0, 0, 100, 120);
        opponentPortrait.x = game.getScreenWidth() / 2 - 50;
        opponentPortrait.y = 25;
        opponentPortrait.interactive = true;
        opponentPortrait.buttonMode = true;
        opponentPortrait.attackData = "opponent";
        game.opponentPortrait = opponentPortrait;

        var opponentLabel = new PIXI.Text('Opponent', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 18
        }));
        opponentLabel.anchor.set(0.5);
        opponentLabel.x = opponentPortrait.width / 2;
        opponentLabel.y = 50;
        game.opponentPortrait.addChild(opponentLabel);

        playerPortrait.on('mouseup', function() {
            if (game.selectedMinion) {
                game.doAttack(game.selectedMinion, playerPortrait);
            }
            else if (game.selectedCard) {
                game.selectedCard.filters = game.selectedCard.oldFilters;
                game.playCard(game.selectedCard, playerPortrait.attackData);
                game.selectedCard = null;
            }
        });
        playerPortrait.on('mouseover', function() {
            if (game.targetIndicator) {
                game.targetIndicator.alpha = 1;
            }
        });
        playerPortrait.on('mouseout', function() {
            if (game.targetIndicator) {
                game.targetIndicator.alpha = 0.5;
            }
        });

        opponentPortrait.on('mouseup', function() {
            if (game.selectedMinion) {
                game.doAttack(game.selectedMinion, opponentPortrait);
            }
            else if (game.selectedCard) {
                game.selectedCard.filters = game.selectedCard.oldFilters;
                game.playCard(game.selectedCard, opponentPortrait.attackData);
                game.selectedCard = null;
            }
        });
        opponentPortrait.on('mouseover', function() {
            if (game.targetIndicator) {
                game.targetIndicator.alpha = 1;
            }
        });
        opponentPortrait.on('mouseout', function() {
            if (game.targetIndicator) {
                game.targetIndicator.alpha = 0.5;
            }
        });

        var playerHealth = new PIXI.Text('??', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#ff0000'
        }));
        playerHealth.x = 85;
        playerHealth.y = 105;
        var playerMana = new PIXI.Text('??', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#0000ff'
        }));
        playerMana.x = -5;
        playerMana.y = 105;
        var opponentHealth = new PIXI.Text('??', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#ff0000'
        }));
        opponentHealth.x = 85;
        opponentHealth.y = 105;
        var opponentMana = new PIXI.Text('??', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#0000ff'
        }));
        opponentMana.x = -5;
        opponentMana.y = 105;
        game.statusText.turnTimer = turnTimer;
        game.statusText.turnStatus = turnStatus;
        game.statusText.playerHealth = playerHealth;
        game.statusText.opponentHealth = opponentHealth;
        game.statusText.playerMana = playerMana;
        game.statusText.opponentMana = opponentMana;
        game.statusText.playerInfo = playerInfo;
        game.statusText.playerCardsLeft = playerCardsLeft;
        game.statusText.opponentCardsLeft = opponentCardsLeft;
        playerPortrait.addChild(playerHealth);
        opponentPortrait.addChild(opponentHealth);
        playerPortrait.addChild(playerMana);
        opponentPortrait.addChild(opponentMana);

        var endTurn = new PIXI.Text("End Turn", new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 18,
            fill: '#ffffff'
        }));
        game.statusText.endTurn = endTurn;
        endTurn.x = game.getScreenWidth() - 90;
        endTurn.y = game.getScreenHeight() / 2 + 60;
        endTurn.interactive = true;
        endTurn.buttonMode = true;
        endTurn.on('click', function() {
            game.sendPacket('endTurn');
        });

        var surrender = new PIXI.Text("Surrender", new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 18,
            fill: '#ffffff'
        }));
        game.statusText.surrender = surrender;
        surrender.x = game.getScreenWidth() - 80;
        surrender.y = 5;
        surrender.interactive = true;
        surrender.buttonMode = true;
        surrender.on('click', function() {
            if (confirm('Are you sure you want to give up?')) {
                game.sendPacket('surrender');
            }
        });

        var playerCards = new PIXI.Container();
        playerCards.x = game.getScreenWidth() / 2 - 450;
        playerCards.y = game.getScreenHeight() - 130;
        game.playerCardContainer = playerCards;
        gameContainer.addChild(playerCards);

        var opponentCards = new PIXI.Container();
        opponentCards.x = game.getScreenWidth() - 300;
        game.opponentCardsContainer = opponentCards;
        gameContainer.addChild(opponentCards);

        var playerMinions = new PIXI.Container();
        var minionBg = new PIXI.Graphics();
        minionBg.beginFill(0xcccccc);
        minionBg.drawRect(0, 0, game.getScreenWidth() - 10, 100);
        playerMinions.addChild(minionBg);
        playerMinions.x = 5;
        playerMinions.y = game.getScreenHeight() / 2 - 50;
        game.playerMinionContainer = playerMinions;
        game.playerMinionContainer.interactive = true;
        game.playerMinionContainer.on('mouseup', function(e) {
            var mouseX = e.data.global.x;
            var minionX = game.playerArmy.map((x) => x.getGlobalPosition().x + x.width / 2);
            var insertPos = 0;
            while (insertPos < minionX.length && minionX[insertPos] < mouseX) {
                insertPos++;
            }
            if (game.selectedCard) {
                game.selectedCard.filters = game.selectedCard.oldFilters;
                game.playCard(game.selectedCard, null, insertPos);
                game.selectedCard = null;
            }
        });
        gameContainer.addChild(playerMinions);

        var playerMinionsHelp = new PIXI.Text("(Drag and Drop Minion Cards Here)", new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 20,
            fill: '#999999'
        }));
        playerMinionsHelp.anchor.set(0.5);
        playerMinionsHelp.x = playerMinions.width / 2;
        playerMinionsHelp.y = playerMinions.height / 2;
        gameContainer.playerMinionsHelp = playerMinionsHelp;
        playerMinionsHelp.visible = false;
        playerMinions.addChild(playerMinionsHelp);

        var playerManaVisual = new PIXI.Container();
        playerManaVisual.y = game.playerMinionContainer.y + 110;
        playerManaVisual.x = game.playerPortrait.x + 120;
        playerManaVisual.manas = [];
        for (var i = 0; i < 10; i++) {
            var mana = PIXI.Sprite.fromImage('./img/mana.png');
            mana.width = 16;
            mana.height = 16;
            mana.x = 18 * i;
            playerManaVisual.manas.push(mana);
            playerManaVisual.addChild(mana);
            gameContainer.addChild(playerManaVisual);
        }
        gameContainer.playerManaVisual = playerManaVisual;

        var opponentMinions = new PIXI.Container();
        minionBg = new PIXI.Graphics();
        minionBg.beginFill(0xdddddd);
        minionBg.drawRect(0, 0, game.getScreenWidth() - 10, 100);
        opponentMinions.addChild(minionBg);
        opponentMinions.x = 5;
        opponentMinions.y = game.getScreenHeight() / 2 - 150;
        game.opponentMinionContainer = opponentMinions;
        gameContainer.addChild(opponentMinions);

        var opponentManaVisual = new PIXI.Container();
        opponentManaVisual.y = game.opponentMinionContainer.y - 26;
        opponentManaVisual.x = game.opponentPortrait.x + 120;
        opponentManaVisual.manas = [];
        for (var i = 0; i < 10; i++) {
            var mana = PIXI.Sprite.fromImage('./img/mana.png');
            mana.width = 16;
            mana.height = 16;
            mana.x = 18 * i;
            opponentManaVisual.manas.push(mana);
            opponentManaVisual.addChild(mana);
            gameContainer.addChild(opponentManaVisual);
        }
        gameContainer.opponentManaVisual = opponentManaVisual;

        // minion overlay (tutorial)
        var minionOverlay = new PIXI.Container();
        minionOverlay.visible = false;
        gameContainer.minionOverlay = minionOverlay;

        var minionOpponentOverlay = new PIXI.Text('Alternatively, you can attack your opponent (the yellow box) if there are no taunt minions. ==>', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 16,
            fill: '#cccc00',
            wordWrap: true,
            wordWrapWidth: 200,
            align: 'right'
        }));
        minionOpponentOverlay.x = 150;
        minionOpponentOverlay.y = 75;
        minionOverlay.addChild(minionOpponentOverlay);

        var opponentInfoOverlay = new PIXI.Text("Once your opponent's health is less than or equal to 0, you win!", new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 16,
            fill: '#cc0000',
            wordWrap: true,
            wordWrapWidth: 200,
            align: 'center'
        }));
        opponentInfoOverlay.x = game.getScreenWidth() / 2;
        opponentInfoOverlay.y = 160;
        minionOverlay.addChild(opponentInfoOverlay);

        var opponentMinionOverlay = new PIXI.Text("Drag and drop your minions onto your opponent's minions to attack them.", new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 16,
            fill: '#00cc00',
            wordWrap: true,
            wordWrapWidth: 200,
            align: 'center'
        }));
        opponentMinionOverlay.x = game.getScreenWidth() / 2 - 220;
        opponentMinionOverlay.y = 160;
        minionOverlay.addChild(opponentMinionOverlay);

        // card overlay (tutorial)
        var cardOverlay = new PIXI.Container();
        cardOverlay.visible = false;
        cardOverlay.x = game.getScreenWidth() / 2;
        cardOverlay.y = game.getScreenHeight() / 2;

        var manaOverlay = new PIXI.Container();
        manaOverlay.addChild(new PIXI.Text('<= Mana Cost', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#0000cc',
        })));
        var manaOverlayDetails = new PIXI.Text('Indicates how much mana it costs to play the current card. You cannot play cards that have a mana cost higher than your current mana.', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 16,
            fill: '#0000cc',
            wordWrap: true,
            wordWrapWidth: 250
        }));
        manaOverlayDetails.y = 35;
        manaOverlay.addChild(manaOverlayDetails);
        manaOverlay.x = 100;
        manaOverlay.y = -120;
        cardOverlay.addChild(manaOverlay);

        var healthOverlay = new PIXI.Container();
        healthOverlay.addChild(new PIXI.Text('<= Minion Health', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#cc0000'
        })));
        var healthOverlayDetails = new PIXI.Text('Only minion cards have this. Indicates how much health the spawned minion will have.', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 16,
            fill: '#cc0000',
            wordWrap: true,
            wordWrapWidth: 250
        }));
        healthOverlayDetails.y = 35;
        healthOverlay.addChild(healthOverlayDetails);
        healthOverlay.x = 100;
        healthOverlay.y = 75;
        cardOverlay.addChild(healthOverlay);

        var attackOverlay = new PIXI.Container();
        attackOverlay.addChild(new PIXI.Text('Minion Attack =>', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 32,
            fill: '#cccc00'
        })));
        var attackOverlayDetails = new PIXI.Text('Only minion cards have this. Indicates how much attack the spawned minion will have.', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 16,
            fill: '#cccc00',
            wordWrap: true,
            wordWrapWidth: 250
        }));
        attackOverlayDetails.y = 35;
        attackOverlay.addChild(attackOverlayDetails);
        attackOverlay.x = -350;
        attackOverlay.y = 75;
        cardOverlay.addChild(attackOverlay);

        cardOverlay.healthText = healthOverlay;
        cardOverlay.attackText = attackOverlay;
        gameContainer.cardOverlay = cardOverlay;

        // target indicator
        var targetIndicator = PIXI.Sprite.fromImage('./img/target.png');
        targetIndicator.anchor.set(0.5);
        targetIndicator.visible = false;
        targetIndicator.alpha = 0.5;
        targetIndicator.width = 64;
        targetIndicator.height = 64;
        game.targetIndicator = targetIndicator;

        // victory screen
        var endContainer = new PIXI.Container();
        game.endContainer = endContainer;
        game.statusText.endText = new PIXI.Text('Unknown!', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 72,
            fill: '#0000ff'
        }));
        game.statusText.endText.anchor.set(0.5);
        game.statusText.endText.x = game.getScreenWidth() / 2;
        game.statusText.endText.y = game.getScreenHeight() / 2 - 100;
        var fadedBg = new PIXI.Graphics();
        fadedBg.beginFill(0x000000);
        fadedBg.drawRect(0, 0, game.getScreenWidth(), game.getScreenHeight());
        fadedBg.alpha = 0.5;
        fadedBg.interactive = true;
        endContainer.addChild(fadedBg);
        endContainer.addChild(game.statusText.endText);

        tipMessage = new PIXI.Text('Tip: ' + constants.game.TUTORIAL_DEFEAT_HELP, new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 16,
            fill: '#f0e68c'
        }));
        tipMessage.anchor.set(0.5);
        tipMessage.x = game.getScreenWidth() / 2;
        tipMessage.y = game.getScreenHeight() - 150;
        endContainer.tipMessage = tipMessage;
        endContainer.addChild(tipMessage);

        var endButton = createButton('End Game', function() {
            endContainer.visible = false;
            game.setGameState('lobby');
        });
        endButton.x = game.getScreenWidth() / 2;
        endButton.y = game.getScreenHeight() / 2;
        endContainer.addChild(endButton);

        gameContainer.addChild(playerPortrait);
        gameContainer.addChild(opponentPortrait);
        gameContainer.addChild(playerInfo);
        gameContainer.addChild(turnStatus);
        gameContainer.addChild(endTurn);
        gameContainer.addChild(surrender);
        gameContainer.addChild(cardOverlay);
        gameContainer.addChild(minionOverlay);
        gameContainer.addChild(targetIndicator);

        // mulligan screen
        var mulliganContainer = new PIXI.Container();
        var mulliganBg = new PIXI.Graphics();
        mulliganBg.beginFill(0x000000);
        mulliganBg.drawRect(0, 0, game.getScreenWidth(), game.getScreenHeight());
        mulliganBg.alpha = 0.5;
        mulliganBg.interactive = true;
        var mTitle = new PIXI.Text('Choose Cards to Replace', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 56,
            fill: '#ffffff'
        }));
        mTitle.anchor.set(0.5);
        mTitle.x = game.getScreenWidth() / 2;
        mTitle.y = 75;

        var mHelp = new PIXI.Text('Click on cards to choose the ones you want to discard, and then press finish.', new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 18,
            fill: '#ffffff'
        }));

        mHelp.anchor.set(0.5);
        mHelp.x = game.getScreenWidth() / 2;
        mHelp.y = 125;

        var mButton = createButton('Finish', function() {
            mulliganContainer.cards.forEach((x) => mulliganContainer.removeChild(x));
            game.sendPacket('doMulligan', mulliganContainer.cards.map((x) => x.selected));
            mulliganContainer.visible = false;
        });
        mButton.x = game.getScreenWidth() / 2;
        mButton.y = game.getScreenHeight() - 175;

        mulliganContainer.addChild(mulliganBg);
        mulliganContainer.addChild(mTitle);
        mulliganContainer.addChild(mHelp);
        mulliganContainer.addChild(mButton);
        gameContainer.mulliganContainer = mulliganContainer;

        gameContainer.addChild(mulliganContainer);
        gameContainer.addChild(endContainer);

        game.pixi.stage.addChild(gameContainer);
        game.containers.push(gameContainer);

        game.animations = [];
        game.pixi.ticker.add(game.processAnimations);

        game.setGameState('empty');
        setInterval(game.doTurnTimer, 1000);
        setInterval(game.sendPing, constants.game.PING_TIME / 2);
    },
    doTurnTimer: function() {
        if (game.turnTimer) {
            game.turnTimer -= 1;
            game.updateInfo("turn_timer", game.turnTimer);
        }
    },
    playCard: function(card, target, position) {
        game.sendPacket("playCard", { card: card.id, target: target, position: position });
    },
    resize: function() {
        game.pixi.renderer.resize(game.getScreenWidth(), game.getScreenHeight());
    },
    processAnimations: function(delta) {
        game.animations = game.animations.filter(function(anim) {
            anim.obj[anim.field] += (anim.speed || 0.1) * delta;
            if (anim.obj[anim.field] > 1) {
                anim.obj[anim.field] = 1;
                if (anim.callback) {
                    anim.callback();
                }
                return false;
            }
            else if (anim.obj[anim.field] <= 0) {
                anim.obj[anim.field] = 0;
                if (anim.callback) {
                    anim.callback();
                }
                return false;
            }
            return true;
        });
        if (game.targetIndicator) {
            game.targetIndicator.rotation += delta / 100;
        }
        game.queuedContainer.cardBack.rotation += delta / 200;
    },
    connect: function(username) {
        game.ws = new WebSocket(window.location.protocol.replace('http', 'ws') + "//" + window.location.host + window.location.pathname);
        game.lobbyContainer.userWelcome.text = "Logged in as: " + username;
        game.ws.onopen = function() {
            game.sendPacket("auth", username);
            var savedDeck = localStorage.getItem('deck');
            if (savedDeck) {
                game.sendPacket("saveCards", { deck: JSON.parse(savedDeck) });
            }
        };
        game.ws.onmessage = game.receivePacket;
        game.ws.onclose = function() {
            $("#login-container").fadeIn();
            $("#login-container .error").text('Disconnected from server!');
            game.setGameState('empty');
            game.ws = null;
        };
    },
    sendPing: function() {
        if (game.ws && game.ws.readyState == 1 && game.lastPacket) {
            var now = new Date();
            if (now.getTime() - game.lastPacket.getTime() >= constants.game.PING_TIME) {
                game.sendPacket("ping");
            }
        }
    },
    sendPacket: function(type, data) {
        if (game.ws && game.ws.readyState == 1) {
            game.lastPacket = new Date();
            game.ws.send(JSON.stringify({
                type: type,
                data: data
            }));
        }
        else {
            console.warn("Failed to send packet " + type + " " + JSON.stringify(data) + ", socket not open.");
        }
    },
    setGameState: function(state) {
        game.containers.forEach(function(e) {
            e.visible = false;
        });
        switch (state) {
            case 'lobby':
                game.lobbyContainer.visible = true;
                break;
            case 'queued':
                game.queuedContainer.cardBack.rotation = 15;
                game.queuedContainer.tipMessage.text = 'Tip: ' + constants.game.TIPS[Math.floor(Math.random() * constants.game.TIPS.length)];
                game.queuedContainer.visible = true;
                break;
            case 'game':
                game.gameContainer.visible = true;
                game.endContainer.visible = false;
                break;
            case 'cards':
                game.cardsContainer.visible = true;
                game.cardsContainer.helpText.visible = true;
                game.editedDeck = false;
                game.sendPacket("loadCards");
                break;
            case 'empty':
                break;
            default:
                console.warn('Invalid game state requested: ' + state);
        }
    },
    updateInfo: function(info, value) {
        switch (info) {
            case 'player_names':
                game.statusText.playerInfo.text = value[0] + ' vs. ' + value[1];
                break;
            case 'turn_timer':
                game.turnTimer = value;
                game.statusText.turnTimer.text = Math.floor(game.turnTimer / 60) + ":" + ("00" + (game.turnTimer % 60)).slice(-2);
                break;
            case 'player_cards_left':
                game.statusText.playerCardsLeft.text = 'You have ' + value + ' cards left';
                break;
            case 'opponent_cards_left':
                game.statusText.opponentCardsLeft.text = 'Your opponent has ' + value + ' cards left';
                break;
            case 'player_health':
                if (game.playerHealth > value) {
                    createDamageEffect(game.playerPortrait, 50, 60);
                }
                game.playerHealth = value;
                game.statusText.playerHealth.text = value;
                break;
            case 'opponent_health':
                if (game.opponentHealth > value) {
                    createDamageEffect(game.opponentPortrait, 50, 60);
                }
                game.opponentHealth = value;
                game.statusText.opponentHealth.text = value;
                break;
            case 'player_mana':
                game.playerMana = value;
                game.statusText.playerMana.text = value;
                game.gameContainer.playerManaVisual.manas.slice(0, value).forEach((x) => x.alpha = 1);
                game.gameContainer.playerManaVisual.manas.slice(value).forEach((x) => x.alpha = 0.5);
                break;
            case 'opponent_mana':
                game.opponentMana = value;
                game.statusText.opponentMana.text = value;
                game.gameContainer.opponentManaVisual.manas.slice(0, value).forEach((x) => x.alpha = 1);
                game.gameContainer.opponentManaVisual.manas.slice(value).forEach((x) => x.alpha = 0.5);
                break;
            case 'player_turn':
                if (value == -1) {
                    game.statusText.turnStatus.text = 'Card Selection';
                }
                else {
                    value = value == game.playerId;
                    game.statusText.endTurn.interactive = value;
                    game.statusText.endTurn.buttonMode = value;
                    game.statusText.endTurn.style.fill = value ? '#ffffff' : '#aaaaaa';
                    game.statusText.turnStatus.text = value ? 'Your Turn' : "Opponent's Turn";
                }
                break;
            default:
                console.warn('No information update handler for ' + info + ' -> ' + value + '.');
                break;
        }
    },
    showPlayedCard: function(cardId, wasDiscarded) {
        var card = createCard(constants.cards[cardId]);
        card.interactive = false;
        card.buttonMode = false;
        card.width /= 2;
        card.height /= 2;
        card.x = game.getScreenWidth() - 235 - 100 * game.cardDisplayMax;
        game.cardDisplayIncr++;
        game.cardDisplayMax++;
        card.y = 5;
        card.filters = [ new PIXI.filters.GlowFilter(5, 2, 2, wasDiscarded ? 0xff0000 : 0xaaaaaa, 0.5) ];
        game.gameContainer.addChild(card);
        setTimeout(function() {
            game.animations.push({
                obj: card,
                field: 'alpha',
                speed: -0.1,
                callback: function() {
                    game.gameContainer.removeChild(card);
                    game.cardDisplayIncr--;
                    if (game.cardDisplayIncr <= 0) {
                        game.cardDisplayMax = 0;
                    }
                }
            });
        }, constants.game.LAST_CARD_DELAY);
    },
    removeCard: function(player, card, wasDiscarded) {
        if (player == game.playerId) {
            var cardIndex = game.playerHand.map((x) => parseInt(x.id)).indexOf(parseInt(card));
            if (cardIndex > -1) {
                game.playerCardContainer.removeChild(game.playerHand[cardIndex]);
                game.playerHand.splice(cardIndex, 1);
            }
            if (wasDiscarded) {
                game.showPlayedCard(card, wasDiscarded);
            }
        }
        else {
            game.opponentHand--;
            game.showPlayedCard(card, wasDiscarded);
        }
        game.reorderCards();
    },
    addCard(player, cardId) {
        if (player == game.playerId) {
            var card = createCard(constants.cards[cardId]);
            card.on('mouseover', function() {
                if (game.cardPreview) {
                    game.pixi.stage.removeChild(game.cardPreview);
                    game.cardPreview = null;
                }
                game.cardPreview = createCard(constants.cards[card.id]);
                game.cardPreview.interactive = false;
                game.playerCardContainer.removeChild(card);
                game.playerCardContainer.addChild(card);
                game.cardPreview.x = (game.getScreenWidth() - game.cardPreview.width) / 2;
                game.cardPreview.y = (game.getScreenHeight() - game.cardPreview.height) / 2;
                card.oldFilters = card.filters;
                card.filters = [ new PIXI.filters.GlowFilter(5, 2, 2, 0x00ff00, 0.5) ];
                game.pixi.stage.addChild(game.cardPreview);
                if (game.isTutorial) {
                    game.gameContainer.cardOverlay.visible = true;
                    game.gameContainer.cardOverlay.healthText.visible = card.type == 'minion';
                    game.gameContainer.cardOverlay.attackText.visible = card.type == 'minion';
                }
            });
            card.on('mousedown', function() {
                if (game.cardPreview) {
                    game.pixi.stage.removeChild(game.cardPreview);
                    game.cardPreview = null;
                    game.gameContainer.cardOverlay.visible = false;
                }
                if (game.selectedCard) {
                    game.selectedCard.filters = game.selectedCard.oldFilters;
                    if (game.selectedCard == card) {
                        game.selectedCard = null;
                        return;
                    }
                    else {
                        game.selectedCard = null;
                    }
                }
                card.filters = [ new PIXI.filters.GlowFilter(5, 2, 2, 0x0000ff, 0.5) ];
                if (card.target) {
                    game.targetIndicator.visible = true;
                }
                game.selectedCard = card;
            });
            card.on('mouseup', function() {
                game.doneClick = true;
            });
            card.on('mouseout', function() {
                if (game.cardPreview && card.id == game.cardPreview.id) {
                    game.pixi.stage.removeChild(game.cardPreview);
                    game.cardPreview = null;
                    card.filters = card.oldFilters;
                    game.gameContainer.cardOverlay.visible = false;
                }
            });
            game.playerHand.push(card);
            card.width /= 2;
            card.height /= 2;
            game.playerCardContainer.addChild(card);
            game.reorderCards();
        }
    },
    checkCanMove: function() {
        if (game.ended) {
            return;
        }
        if (game.turn == game.playerId) {
            if (game.playerHand.filter((x) => x.mana <= game.playerMana).length > 0) {
                return true;
            }
            if (game.playerArmy.filter((x) => x.hasAttack).length > 0) {
                return true;
            }
            game.sendPacket('endTurn');
        }
    },
    doAttack: function(from, to) {
        game.hasAttackedOnce = true;
        game.sendPacket("doAttack", { from: from.attackData, to: to.attackData });
        setTimeout(game.checkCanMove, constants.player.NO_MOVE_DELAY);
    },
    spawnMinion: function(playerId, minionId, hasAttack, minionInstanceId, cardId, position) {
        var minion = createMinion(constants.minions[minionId], minionInstanceId);
        minion.cardId = cardId;
        minion.on('mousedown', function() {
            if (game.selectedMinion) {
                game.lastSelectedMinion = game.selectedMinion;
                game.selectedMinion.filters = game.selectedMinion.oldFilters;
                game.selectedMinion = null;
            }
            game.selectedMinion = minion;
            minion.oldFilters = minion.filters;
            minion.filters = [new PIXI.filters.GlowFilter(2, 2, 2, 0x0000ff, 0.5)];
            game.doneClick = true;
        });
        minion.on('mouseup', function() {
            if (game.lastSelectedMinion && game.lastSelectedMinion != minion) {
                game.doAttack(game.lastSelectedMinion, minion);
            }
            else if (game.selectedCard) {
                game.selectedCard.filters = game.selectedCard.oldFilters;
                game.playCard(game.selectedCard, minion.minionInstanceId);
                game.selectedCard = null;
            }
            game.lastSelectedMinion = null;
        });
        minion.on('mouseover', function() {
            if (game.targetIndicator) {
                game.targetIndicator.alpha = 1;
            }
            if (!game.isMouseDown) {
                if (typeof cardId !== 'undefined') {
                    if (game.cardPreview) {
                        if (game.cardPreview.id != cardId) {
                            game.gameContainer.removeChild(game.cardPreview);
                            game.cardPreview = null;
                        }
                        else {
                            return;
                        }
                    }
                    var card = createCard(constants.cards[cardId]);
                    card.x = 5;
                    card.y = 350;
                    card.filters = [ new PIXI.filters.GlowFilter(5, 2, 2, 0x551A8B, 0.5) ];
                    card.on('click', function() {
                        game.gameContainer.removeChild(card);
                    });
                    game.cardPreview = card;
                    game.gameContainer.addChild(card);
                }
                if (game.isTutorial && !game.hasAttackedOnce) {
                    game.gameContainer.minionOverlay.visible = true;
                }
            }
            else {
                if (game.cardPreview) {
                    game.gameContainer.removeChild(game.cardPreview);
                    game.cardPreview = null;
                }
            }
        });
        minion.on('mouseout', function() {
            if (game.targetIndicator) {
                game.targetIndicator.alpha = 0.5;
            }
            if (game.cardPreview) {
                game.gameContainer.removeChild(game.cardPreview);
                game.cardPreview = null;
            }
            game.gameContainer.minionOverlay.visible = false;
        });
        minion.hasAttack = hasAttack;
        if (game.playerId == playerId) {
            game.playerMinionContainer.addChild(minion);
            game.playerArmy.splice(position, 0, minion);
        }
        else {
            game.opponentMinionContainer.addChild(minion);
            game.opponentArmy.splice(position, 0, minion);
        }
        minion.alpha = 0;
        game.animations.push({
            field: 'alpha',
            obj: minion,
            speed: 0.15
        });
        game.refreshMinions();
    },
    refreshMinions: function() {
        var opponentOffset = (constants.player.MAX_MINIONS - game.opponentArmy.length) * 50 + game.getScreenWidth() / 2 - 400;
        for (var i = 0; i < game.opponentArmy.length; i++) {
            if (game.opponentArmy[i].hasAttack) {
                game.opponentArmy[i].filters = [ new PIXI.filters.GlowFilter(2, 2, 2, 0x00ff00, 0.5) ];
            }
            else {
                game.opponentArmy[i].filters = [];
            }
            game.opponentArmy[i].x = 100 * i + opponentOffset;
        }
        var playerOffset = (constants.player.MAX_MINIONS - game.playerArmy.length) * 50 + game.getScreenWidth() / 2 - 400;
        for (var i = 0; i < game.playerArmy.length; i++) {
            if (game.playerArmy[i].hasAttack) {
                game.playerArmy[i].filters = [ new PIXI.filters.GlowFilter(2, 2, 2, 0x00ff00, 0.5) ];
            }
            else {
                game.playerArmy[i].filters = [];
            }
            game.playerArmy[i].x = 100 * i + playerOffset;
        }
    },
    reorderCards: function() {
        // render player cards
        var order = [];
        for (var i = 0; i < 10; i++) {
            var temp = {};
            temp.y = -15 * Math.abs(5 - i) + 50;
            temp.x = 80 * i;
            order.push(temp);
        }
        var isPlayerTurn = game.turn == game.playerId;
        for (var i = 0; i < game.playerHand.length; i++) {
            var temp = order[5 + Math.floor((i + 1) / 2) * (i % 2 == 0 ? 1 : -1)];
            game.playerHand[i].x = temp.x;
            game.playerHand[i].y = temp.y;
            if (game.playerHand[i].mana <= game.playerMana && isPlayerTurn) {
                game.playerHand[i].filters = [ new PIXI.filters.GlowFilter(2, 2, 2, 0x00ff00, 0.5) ];
            }
            else {
                game.playerHand[i].filters = [];
            }
        }

        // render opponent card backs
        game.opponentCardsContainer.children.forEach((x) => game.opponentCardsContainer.removeChild(x));
        for (var i = 0; i < game.opponentHand; i++) {
            var cardBack = PIXI.Sprite.fromImage('./img/card_back.png');
            cardBack.width = 100;
            cardBack.height = 125;
            cardBack.x = i * 25;
            game.opponentCardsContainer.addChild(cardBack);
        }
    },
    showMessage: function(msg) {
        var msgText = new PIXI.Text(msg, new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 18,
            fill: '#00ff00',
            wordWrap: true,
            wordWrapWidth: 300
        }));
        msgText.x = 5;
        msgText.y = game.getScreenHeight() / 2 + 50 + 20 * game.msgIncrMax;
        game.msgIncr++;
        game.msgIncrMax += Math.floor(msgText.height / 18);
        game.gameContainer.addChild(msgText);
        setTimeout(function() {
            game.gameContainer.removeChild(msgText);
            game.msgIncr--;
            if (game.msgIncr <= 0) {
                game.msgIncrMax = 0;
            }
        }, constants.game.MESSAGE_FADE_SPEED);
    },
    showError: function(errorMsg) {
        var errorText = new PIXI.Text(errorMsg, new PIXI.TextStyle({
            fontFamily: 'Pangolin',
            fontSize: 18,
            fill: '#ff0000'
        }));
        if (game.cardsContainer.visible) {
            game.cardsContainer.helpText.visible = false;
            errorText.x = 10;
            errorText.y = 58;
        }
        else {
            errorText.x = 5;
            errorText.y = 72;
        }
        game.pixi.stage.addChild(errorText);
        setTimeout(function() {
            game.animations.push({
                field: 'alpha',
                obj: errorText,
                speed: -0.1,
                callback: function() {
                    game.pixi.stage.removeChild(errorText);
                }
            });
        }, 1000);
    },
    filterCardCollection: function(query) {
        game.filteredPlayerCardList = game.playerCardList;
        if (query) {
            var term = query.toLowerCase();
            game.filteredPlayerCardList = game.filteredPlayerCardList.filter((x) => {
                const card = constants.cards[x];
                var terms = card.name.toLowerCase();
                terms += ' ' + card.type + ' ' + card.mana;
                if (card.type == 'minion') {
                    var attrs = [].concat.apply([], card.spawn.map((minionId) => constants.minions[minionId].attributes || []));
                    terms += ' ' + attrs.join(' ');

                    var types = card.spawn.map((minionId) => constants.minions[minionId].type).filter((x) => x);
                    terms += ' ' + types.join(' ');
                }
                return terms.indexOf(term) > -1
            });
            game.playerCardRenderOffset = 0;
        }
        game.renderCardCollection();
    },
    renderCardCollection: function() {
        if (!game.playerCardRender) {
            game.playerCardRender = [];
            game.playerCardRenderOffset = 0;
        }
        else {
            game.playerCardRender.forEach((x) => game.cardsContainer.removeChild(x));
            game.playerCardRender = [];
        }
        if (!game.playerDeckRender) {
            game.playerDeckRender = [];
        }
        else {
            game.playerDeckRender.forEach((x) => game.cardsContainer.currentDeck.removeChild(x));
            game.playerDeckRender = [];
        }
        const cardsPerPage = constants.cardcollection.CARDS_PER_ROW * constants.cardcollection.CARDS_PER_COL;
        for (var i = 0; i < cardsPerPage; i++) {
            var cardIndex = i + game.playerCardRenderOffset * cardsPerPage;
            if (cardIndex >= game.filteredPlayerCardList.length) {
                break;
            }
            const cardId = game.filteredPlayerCardList[cardIndex];
            const card = createCard(constants.cards[cardId]);
            card.on('click', function() {
                if (game.playerDeckList.length >= constants.player.DECK_SIZE) {
                    game.showError('Maximum deck card limit reached!');
                }
                else if (game.playerDeckList.reduce((acc, val) => acc + (val == cardId ? 1 : 0), 0) >= constants.player.MAX_DUPLICATES) {
                    game.showError('Cannot have more duplicates of this card!');
                }
                else {
                    game.editedDeck = true;
                    game.playerDeckList.push(cardId);
                    game.renderCardCollection();
                }
            });
            card.on('mouseover', function() {
                card.oldFilters = card.filters;
                card.filters = card.filters.concat([ new PIXI.filters.GlowFilter(3, 2, 2, 0x00ff00, 0.5) ]);
            });
            card.on('mouseout', function() {
                card.filters = card.oldFilters;
            });
            if (game.showUsedCards && game.playerDeckList.indexOf(cardId) > -1) {
                let colorMatrix = new PIXI.filters.ColorMatrixFilter();
                card.filters = [ colorMatrix ];
                if (game.playerDeckList.filter((x) => x == cardId).length <= 1) {
                    colorMatrix.alpha = 0.5;
                }
                colorMatrix.greyscale(0.3);
            }
            else {
                card.filters = [];
            }
            card.width /= 1.6;
            card.height /= 1.6;
            card.x = 5 + (130 * (i % constants.cardcollection.CARDS_PER_ROW));
            card.y = 75 + 5 + (160 * Math.floor(i / constants.cardcollection.CARDS_PER_ROW));
            game.playerCardRender.push(card);
            game.cardsContainer.addChild(card);
        }
        var counter = 0;
        var deckCounts = {};
        for (var i = 0; i < game.playerDeckList.length; i++) {
            var cardId = game.playerDeckList[i];
            deckCounts[cardId] = (deckCounts[cardId] || 0) + 1;
        }
        game.playerDeckList.sort((x, y) => {
            var manaDiff = constants.cards[x].mana - constants.cards[y].mana;
            if (manaDiff != 0) return manaDiff;
            return constants.cards[x].name.localeCompare(constants.cards[y].name);
        });
        game.playerDeckList.forEach(function(cardId) {
            if (!deckCounts.hasOwnProperty(cardId)) {
                return;
            }
            const cardSmall = new PIXI.Text(constants.cards[cardId].name + ' x ' + deckCounts[cardId], new PIXI.TextStyle({
                fontFamily: 'Pangolin',
                fontSize: 12,
                fill: '#ffffff'
            }));
            cardSmall.interactive = true;
            cardSmall.buttonMode = true;
            cardSmall.on('click', function() {
                if (game.cardPreview) {
                    game.pixi.stage.removeChild(game.cardPreview);
                    game.cardPreview = null;
                }
                game.playerDeckList.splice(game.playerDeckList.indexOf(cardId), 1);
                game.renderCardCollection();
            });
            cardSmall.on('mouseover', function() {
                if (game.cardPreview && game.cardPreview.id != cardId) {
                    game.pixi.stage.removeChild(game.cardPreview);
                    game.cardPreview = null;
                }
                game.cardPreview = createCard(constants.cards[cardId]);
                game.cardPreview.interactive = false;
                game.cardPreview.x = (game.getScreenWidth() - game.cardPreview.width) / 2;
                game.cardPreview.y = (game.getScreenHeight() - game.cardPreview.height) / 2;
                game.cardPreview.filters = [ new PIXI.filters.GlowFilter(3, 2, 2, 0x00ff00, 0.5) ];
                game.pixi.stage.addChild(game.cardPreview);
                cardSmall.style.fill = '#cccccc';
            });
            cardSmall.on('mouseout', function() {
                if (game.cardPreview && game.cardPreview.id == cardId) {
                    game.pixi.stage.removeChild(game.cardPreview);
                    game.cardPreview = null;
                }
                cardSmall.style.fill = '#ffffff';
            });
            cardSmall.x = 10;
            cardSmall.y = 16 * counter;
            game.playerDeckRender.push(cardSmall);
            game.cardsContainer.currentDeck.addChild(cardSmall);
            delete deckCounts[cardId];
            counter++;
        });
        game.cardsContainer.currentDeck.title.text = 'Deck - ' + game.playerDeckList.length + ' Cards';
        if (game.cardPreview) {
            game.pixi.stage.removeChild(game.cardPreview);
            game.cardPreview = null;
        }
    },
    drawAction: function(from, to) {
        if (from === to) {
            return false;
        }
        if (typeof from === 'number') {
            from = game.findMinion(from);
        }
        else if (from == 'player') {
            from = game.playerPortrait;
        }
        else if (from == 'opponent') {
            from = game.opponentPortrait;
        }
        else {
            return false;
        }
        var fromCoord = from.getGlobalPosition();
        fromCoord.x += from.width / 2;
        fromCoord.y += from.height / 2;
        if (typeof from.id !== 'number') {
            fromCoord.x -= 15;
            fromCoord.y -= 10;
        }
        if (typeof to === 'number') {
            to = game.findMinion(to);
        }
        else if (to == 'player') {
            to = game.playerPortrait;
        }
        else if (to == 'opponent') {
            to = game.opponentPortrait;
        }
        else {
            return false;
        }
        var toCoord = to.getGlobalPosition();
        toCoord.x += to.width / 2;
        toCoord.y += to.height / 2;
        if (typeof to.id !== 'number') {
            toCoord.x -= 15;
            toCoord.y -= 10;
        }
        var newLine = new PIXI.Graphics();
        newLine.alpha = 0.7;
        newLine.position.set(fromCoord.x, fromCoord.y);
        var lx = toCoord.x - fromCoord.x;
        var ly = toCoord.y - fromCoord.y;
        var angle = Math.atan2(ly, lx);
        newLine.lineStyle(8, 0xff0000).moveTo(0, 0).lineTo(lx, ly);
        newLine.lineStyle(6, 0xff0000);
        newLine.moveTo(lx, ly).lineTo(lx + Math.cos(Math.PI + angle - Math.PI / 6) * 30, ly + Math.sin(Math.PI + angle - Math.PI / 6) * 30);
        newLine.moveTo(lx, ly).lineTo(lx + Math.cos(Math.PI + angle + Math.PI / 6) * 30, ly + Math.sin(Math.PI + angle + Math.PI / 6) * 30);
        game.gameContainer.addChild(newLine);
        setTimeout(function() {
            game.gameContainer.removeChild(newLine);
        }, 600);
        return true;
    },
    findMinion: function(minionInstanceId) {
        function process(item) {
            if (item.minionInstanceId == minionInstanceId) {
                return true;
            }
            return false;
        }
        var minion = game.playerArmy.find(process);
        if (minion) {
            return minion;
        }
        minion = game.opponentArmy.find(process);
        return minion;
    },
    receivePacket: function(rawData) {
        game.lastPacket = new Date();
        var data = JSON.parse(rawData.data);
        switch (data.type) {
            case 'gameState':
                game.setGameState(data.data);
                break;
            case 'gameInit':
                game.setGameState('game');
                if (game.playerHand) {
                    game.playerHand.forEach((x) => game.playerCardContainer.removeChild(x));
                }
                game.playerHand = [];
                game.opponentHand = 0;
                if (game.playerArmy) {
                    game.playerArmy.forEach((x) => game.playerMinionContainer.removeChild(x));
                }
                if (game.opponentArmy) {
                    game.opponentArmy.forEach((x) => game.opponentMinionContainer.removeChild(x));
                }
                game.playerArmy = [];
                game.opponentArmy = [];
                game.playerId = data.data.player.id;
                game.opponentId = data.data.opponent.id;
                game.turn = data.data.turn;
                game.cardDisplayIncr = 0;
                game.cardDisplayMax = 0;
                game.msgIncr = 0;
                game.msgIncrMax = 0;
                game.ended = false;
                game.updateInfo("turn_timer", data.data.turnTimer);
                game.updateInfo("player_turn", game.turn);
                game.updateInfo("player_names", [data.data.player.name, data.data.opponent.name]);
                game.updateInfo("player_health", data.data.player.health);
                game.updateInfo("player_mana", data.data.player.mana);
                game.updateInfo("opponent_health", data.data.opponent.health);
                game.updateInfo("opponent_mana", data.data.opponent.mana);
                game.updateInfo("player_cards_left", data.data.playerDeckSize);
                game.updateInfo("opponent_cards_left", data.data.opponentDeckSize);
                data.data.playerHand.forEach(function(card) {
                    game.addCard(game.playerId, card);
                });
                game.opponentHand = data.data.opponentHandSize;
                game.reorderCards();

                var i = 0;
                game.gameContainer.mulliganContainer.visible = true;
                game.gameContainer.mulliganContainer.cards = [];
                data.data.playerHand.forEach(function(cardId) {
                    var card = createCard(constants.cards[cardId]);
                    card.on('click', function() {
                        card.selected = !card.selected;
                        if (card.selected) {
                            card.filters = [ new PIXI.filters.GlowFilter(10, 2, 2, 0x00ff00, 0.5) ];
                        }
                        else {
                            card.filters = [];
                        }
                    });
                    card.x = (game.getScreenWidth() - card.width) / 2 + (i - 1) * (card.width + 20);
                    card.y = 150;
                    game.gameContainer.mulliganContainer.cards.push(card);
                    game.gameContainer.mulliganContainer.addChild(card);
                    i++;
                });

                if (data.data.isTutorial) {
                    game.isTutorial = true;
                    game.gameContainer.playerMinionsHelp.visible = true;
                }
                break;
            case 'updatePlayer':
                ['health', 'mana'].forEach(function(item) {
                    if (typeof data.data[item] !== 'undefined') {
                        if (data.data.playerId == game.playerId) {
                            game.updateInfo('player_' + item, data.data[item]);
                        }
                        else {
                            game.updateInfo('opponent_' + item, data.data[item]);
                        }
                        if (typeof data.data.attackFrom !== 'undefined') {
                            if (data.data.playerId == game.playerId) {
                                game.drawAction(data.data.attackFrom, "player");
                            }
                            else {
                                game.drawAction(data.data.attackFrom, "opponent");
                            }
                        }
                    }
                });
                break;
            case 'updateMinion':
                var instId = data.data.minionInstanceId;
                var process = function(minion) {
                    if (minion.minionInstanceId == instId) {
                        if (typeof data.data.hasAttack !== 'undefined') {
                            minion.hasAttack = data.data.hasAttack;
                        }
                        if (typeof data.data.health !== 'undefined') {
                            minion.health = data.data.health;
                        }
                        if (typeof data.data.attack !== 'undefined') {
                            minion.attack = data.data.attack;
                        }
                        if (typeof data.data.attributes !== 'undefined') {
                            minion.attributes = data.data.attributes;
                        }
                        if (typeof data.data.attackFrom !== 'undefined') {
                            game.drawAction(data.data.attackFrom, instId);
                        }
                        return true;
                    }
                    return false;
                };
                game.playerArmy.find(process);
                game.opponentArmy.find(process);
                game.refreshMinions();
                break;
            case 'removeMinion':
                var instId = data.data.minionInstanceId;
                var minionToRemove;
                var callback;
                if (typeof data.data.attackFrom !== 'undefined') {
                    game.drawAction(data.data.attackFrom, instId);
                }
                game.playerArmy.forEach(function(minion) {
                    if (minion.minionInstanceId == instId) {
                        minionToRemove = minion;
                        callback = function() {
                            game.playerArmy.splice(game.playerArmy.indexOf(minion), 1);
                            game.playerMinionContainer.removeChild(minion);
                        };
                        return false;
                    }
                    return true;
                });
                game.opponentArmy.forEach(function(minion) {
                    if (minion.minionInstanceId == instId) {
                        minionToRemove = minion;
                        callback = function() {
                            game.opponentArmy.splice(game.opponentArmy.indexOf(minion), 1);
                            game.opponentMinionContainer.removeChild(minion);
                        };
                        return false;
                    }
                    return true;
                });
                if (minionToRemove) {
                    if (typeof data.data.health !== 'undefined') {
                        minionToRemove.health = data.data.health;
                    }
                    createDamageEffect(minionToRemove, 40, 40);
                    setTimeout(function() {
                        callback();
                        game.refreshMinions();
                    }, 600);
                }
                break;
            case 'addCard':
                if (data.data.player == game.playerId) {
                    game.updateInfo("player_cards_left", data.data.cardsLeft);
                    game.addCard(game.playerId, data.data.card);
                }
                else {
                    game.updateInfo("opponent_cards_left", data.data.cardsLeft);
                    game.opponentHand++;
                    game.reorderCards();
                }
                break;
            case 'nextTurn':
                game.turn = data.data.turn;
                game.gameContainer.mulliganContainer.visible = false;
                game.updateInfo("turn_timer", data.data.turnTimer);
                game.updateInfo("player_turn", game.turn);
                if (typeof data.data[game.playerId] !== 'undefined' && typeof data.data[game.playerId].mana !== 'undefined') {
                    game.updateInfo("player_mana", data.data[game.playerId].mana);
                }
                if (typeof data.data[game.opponentId] !== 'undefined' && typeof data.data[game.opponentId].mana !== 'undefined') {
                    game.updateInfo("opponent_mana", data.data[game.opponentId].mana);
                }
                if (typeof data.data.minionAttack !== 'undefined') {
                    var min;
                    var oth;
                    if (game.playerId == game.turn) {
                        min = game.playerArmy;
                        oth = game.opponentArmy;
                    }
                    else {
                        min = game.opponentArmy;
                        oth = game.playerArmy;
                    }
                    for (var i = 0; i < min.length; i++) {
                        min[i].hasAttack = data.data.minionAttack[i];
                    }
                    for (var i = 0; i < oth.length; i++) {
                        oth[i].hasAttack = false;
                    }
                }
                game.refreshMinions();
                game.reorderCards();
                setTimeout(game.checkCanMove, constants.player.NO_MOVE_DELAY);
                break;
            case 'gameEnd':
                game.ended = true;
                game.statusText.endText.text = data.data.winner == game.playerId ? 'Victory!' : 'Defeat!';
                game.endContainer.visible = true;
                game.endContainer.tipMessage.visible = data.data.winner != game.playerId && game.isTutorial;
                break;
            case 'discardCard':
                game.removeCard(data.data.playerId, data.data.cardId, true);
                break;
            case 'playCard':
                if (game.playerId == data.data.playerId) {
                    game.updateInfo("player_mana", data.data.playerMana);
                }
                else {
                    game.updateInfo("opponent_mana", data.data.playerMana);
                }
                game.removeCard(data.data.playerId, data.data.cardId, false);
                setTimeout(game.checkCanMove, constants.player.NO_MOVE_DELAY);
                break;
            case 'addMinion':
                game.spawnMinion(data.data.playerId, data.data.minionId, data.data.hasAttack, data.data.minionInstanceId, data.data.cardId, data.data.position);
                break;
            case 'loadCards':
                game.playerCardList = data.data.cards;
                game.filteredPlayerCardList = game.playerCardList.slice();
                game.playerDeckList = data.data.deck;
                game.showUsedCards = true;
                game.renderCardCollection();
                break;
            case 'gameTimer':
                game.updateInfo("turn_timer", data.data);
                break;
            case 'error':
                game.showError(data.data);
                break;
            case 'message':
                game.showMessage(data.data);
                break;
            default:
                console.warn("Unknown packet: " + JSON.stringify(data));
                break;
        }
    }
};

$(document).ready(game.init);
$(window).resize(game.resize);

$(document).ready(function() {
    $("#login input[type=text]").keyup(function(e) {
        if (e.which == 13) {
            $("#login button[type=submit]").click();
        }
    });
    $("#login button[type=submit]").click(function(e) {
        e.preventDefault();
        var username = $("#username").val();
        if (username) {
            localStorage.setItem("username", username);
            game.connect(username);
            $("#login-container").fadeOut();
        }
        else {
            $("#login .error").text("Please enter a username to play the game!");
        }
    });
    $("body").mouseup(function() {
        if (game.selectedCard && !game.doneClick) {
            game.selectedCard.filters = game.selectedCard.oldFilters;
            game.playCard(game.selectedCard);
            game.selectedCard = null;
        }
        if (game.selectedMinion && !game.doneClick) {
            game.selectedMinion.filters = game.selectedMinion.oldFilters;
            game.selectedMinion = null;
        }
        if (game.targetIndicator && !game.doneClick) {
            game.targetIndicator.visible = false;
            game.targetIndicator.alpha = 0.5;
        }
        game.doneClick = false;
    });

    // if username was saved in localstorage, automatically fill
    var username = localStorage.getItem("username");
    if (username) {
        $("#username").val(username);
        $("#login-container").hide();
        $("#login button[type=submit]").click();
    }

    // warn mobile browsers
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        $("#login .error").text("Note: A desktop browser is recommended when playing this game. A mobile browser may experience issues.");
    }

    $("body").mousemove(function() {
        var mousePos = game.pixi.renderer.plugins.interaction.mouse.global;
        if (game.targetIndicator) {
            game.targetIndicator.x = mousePos.x;
            game.targetIndicator.y = mousePos.y;
        }
    }).mousedown(function() {
        game.isMouseDown = true;
    }).mouseup(function() {
        game.isMouseDown = false;
    });
});
