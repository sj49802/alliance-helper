let players = [];
let teamA = [];
let teamB = [];
let waitingLobby = [];
let actionHistory = [];

const cardValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'j': 11, 'q': 12, 'k': 13, 'a': 14
};

function showAddPlayerPopup() {
    const popup = createPopup('Add Player');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter player name';
    input.className = 'popup-input';
    
    const addButton = document.createElement('button');
    addButton.textContent = 'Add';
    addButton.className = 'popup-button';
    addButton.addEventListener('click', () => {
        const playerName = input.value.trim();
        if (playerName) {
            addPlayer(playerName);
            closePopup(popup);
        }
    });
    
    popup.querySelector('.popup-content').appendChild(input);
    popup.querySelector('.popup-content').appendChild(addButton);
}

function addPlayer(playerName) {
    let player = { name: playerName, score: 0, cards: [], team: null };
    players.push(player);
    waitingLobby.push(player);
    addToHistory('add', player);
    updatePlayerDisplay();
}

function updatePlayerDisplay() {
    updateTeam('teamA', teamA);
    updateTeam('teamB', teamB);
    updateLobby();
    attachDragAndDropListeners();
}

function updateTeam(teamId, teamPlayers) {
    const teamElement = document.querySelector(`#${teamId} .team-players`);
    teamElement.innerHTML = '';
    let teamTotal = 0;
    teamPlayers.forEach(player => {
        const playerElement = createPlayerElement(player);
        teamElement.appendChild(playerElement);
        teamTotal += player.score;
    });
    const teamHeaderElement = document.querySelector(`#${teamId} h2`);
    teamHeaderElement.textContent = `${teamId === 'teamA' ? 'Team A' : 'Team B'} (Total: ${teamTotal})`;
}

function updateLobby() {
    const lobbyElement = document.querySelector('.lobby-players');
    lobbyElement.innerHTML = '';
    waitingLobby.forEach(player => {
        const playerElement = createPlayerElement(player);
        lobbyElement.appendChild(playerElement);
    });
}

function createPlayerElement(player) {
    const playerElement = document.createElement('div');
    playerElement.className = 'player';
    playerElement.draggable = true;
    playerElement.id = `player-${player.name}`;
    let cardsText = player.cards.length > 0 ? ` Cards: [${player.cards.join(', ')}]` : '';
    playerElement.textContent = `${player.name} (${player.score})${cardsText}`;
    playerElement.addEventListener('click', () => showPlayerMenu(player));
    return playerElement;
}

function showPlayerMenu(player) {
    const popup = createPopup(`Actions for ${player.name}`);
    
    const actions = player.team === null
        ? ['Add to Team A', 'Add to Team B', 'Remove player']
        : ['Remove from team', 'Swap team', 'Play card', 'Remove player'];
    
    actions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action;
        button.className = 'popup-button';
        button.addEventListener('click', () => {
            handlePlayerAction(player, action);
            closePopup(popup);
        });
        popup.querySelector('.popup-content').appendChild(button);
    });
}

function handlePlayerAction(player, action) {
    switch(action) {
        case 'Add to Team A':
            addToTeam(player, 'A');
            break;
        case 'Add to Team B':
            addToTeam(player, 'B');
            break;
        case 'Remove from team':
            removeFromTeam(player);
            break;
        case 'Swap team':
            swapTeam(player);
            break;
        case 'Play card':
            showPlayCardPopup(player);
            break;
        case 'Remove player':
            removePlayer(player);
            break;
    }
    updatePlayerDisplay();
}

function addToTeam(player, team) {
    if (player.team) removeFromTeam(player);
    player.team = team;
    if (team === 'A') teamA.push(player);
    else teamB.push(player);
    waitingLobby = waitingLobby.filter(p => p !== player);
    addToHistory('addToTeam', player, team);
}

function removeFromTeam(player) {
    if (player.team === 'A') {
        teamA = teamA.filter(p => p !== player);
    } else if (player.team === 'B') {
        teamB = teamB.filter(p => p !== player);
    }
    addToHistory('removeFromTeam', player, player.team);
    player.team = null;
    if (!waitingLobby.includes(player)) {
        waitingLobby.push(player);
    }
}

function swapTeam(player) {
    const newTeam = player.team === 'A' ? 'B' : 'A';
    removeFromTeam(player);
    addToTeam(player, newTeam);
    addToHistory('swapTeam', player, newTeam);
}

function showPlayCardPopup(player) {
    const popup = createPopup(`Play Card for ${player.name}`);
    
    Object.keys(cardValues).forEach(card => {
        const button = document.createElement('button');
        button.textContent = card.toUpperCase();
        button.className = 'popup-button';
        button.addEventListener('click', () => {
            playCard(player, card);
            closePopup(popup);
        });
        popup.querySelector('.popup-content').appendChild(button);
    });
}

function playCard(player, cardInput) {
    let cardValue = cardValues[cardInput.toLowerCase()];
    player.score += cardValue;
    player.cards.push(cardInput.toUpperCase());
    addToHistory('playCard', player, cardValue);
    updatePlayerDisplay();
}

function removePlayer(player) {
    removeFromTeam(player);
    players = players.filter(p => p !== player);
    waitingLobby = waitingLobby.filter(p => p !== player);
    addToHistory('removePlayer', player);
}

function resetGame() {
    const popup = createPopup('Reset Game');
    
    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to reset the game? This action cannot be undone.';
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.className = 'popup-button';
    confirmButton.addEventListener('click', () => {
        performReset();
        closePopup(popup);
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'popup-button';
    cancelButton.addEventListener('click', () => closePopup(popup));
    
    popup.querySelector('.popup-content').appendChild(message);
    popup.querySelector('.popup-content').appendChild(confirmButton);
    popup.querySelector('.popup-content').appendChild(cancelButton);
}

function performReset() {
    players = [];
    teamA = [];
    teamB = [];
    waitingLobby = [];
    actionHistory = [];
    updatePlayerDisplay();
    addToHistory('resetGame');
}

function undo() {
    if (actionHistory.length === 0) {
        alert("No actions to undo.");
        return;
    }
    
    const lastAction = actionHistory.pop();
    switch(lastAction.action) {
        case 'add':
            players = players.filter(p => p !== lastAction.player);
            waitingLobby = waitingLobby.filter(p => p !== lastAction.player);
            break;
        case 'addToTeam':
            removeFromTeam(lastAction.player);
            break;
        case 'removeFromTeam':
            addToTeam(lastAction.player, lastAction.data);
            break;
        case 'swapTeam':
            swapTeam(lastAction.player);
            break;
        case 'playCard':
            lastAction.player.score -= lastAction.data;
            lastAction.player.cards.pop();
            break;
        case 'removePlayer':
            players.push(lastAction.player);
            waitingLobby.push(lastAction.player);
            break;
        case 'resetGame':
            alert("Cannot undo game reset.");
            return;
    }
    updatePlayerDisplay();
}

function addToHistory(action, player = null, data = null) {
    actionHistory.push({ action, player, data });
    if (actionHistory.length > 10) {
        actionHistory.shift();
    }
}

function createPopup(title) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>${title}</h3>
        </div>
    `;
    document.body.appendChild(popup);
    
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closePopup(popup);
        }
    });

    return popup;
}

function closePopup(popup) {
    popup.remove();
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var playerId = ev.dataTransfer.getData("text");
    var player = players.find(p => `player-${p.name}` === playerId);
    var targetTeam = ev.target.closest('.team') ? ev.target.closest('.team').id : 'lobby';

    if (player) {
        if (targetTeam === 'teamA') {
            addToTeam(player, 'A');
        } else if (targetTeam === 'teamB') {
            addToTeam(player, 'B');
        } else {
            removeFromTeam(player);
            if (!waitingLobby.includes(player)) {
                waitingLobby.push(player);
            }
        }
        updatePlayerDisplay();
    }
}

function attachDragAndDropListeners() {
    document.querySelectorAll('.player').forEach(playerElement => {
        playerElement.addEventListener('dragstart', drag);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addPlayer').addEventListener('click', showAddPlayerPopup);
    document.getElementById('resetGame').addEventListener('click', resetGame);
    document.getElementById('undo').addEventListener('click', undo);

    document.querySelectorAll('.team, .lobby-container').forEach(container => {
        container.addEventListener('dragover', allowDrop);
        container.addEventListener('drop', drop);
    });

    updatePlayerDisplay();
});