let selectedPlayer = null;
const history = { team1: { actions: [], undoneActions: [] }, team2: { actions: [], undoneActions: [] } };

document.querySelectorAll('.player-list li').forEach(item => {
    item.addEventListener('click', event => {
        document.querySelectorAll('.player-list li').forEach(el => el.classList.remove('selected'));
        event.target.classList.add('selected');
        selectedPlayer = event.target.getAttribute('data-player');
    });
});

function addRuns(runs, team) {
    if (!selectedPlayer) return alert('Please select a player first.');
    updateScore(runs, team);
}

function nextBall(team) {
    const scoreBoard = document.getElementById(`${team}-score`);
    let [totalRuns, wickets] = scoreBoard.querySelector('h3').innerText.match(/\d+/g).map(Number);
    let [overs, balls] = scoreBoard.querySelector('p').innerText.match(/\d+/g).map(Number);
    balls++;
    if (balls === 6) {
        overs++;
        balls = 0;
    }
    scoreBoard.querySelector('p').innerText = `Overs: ${overs}.${balls}`;
    saveAction({ type: 'ball', overs, balls }, team);
}

function toggleExtras(team) {
    const extrasTab = document.getElementById(`${team}-extras`);
    extrasTab.classList.toggle('active');
}

function addExtras(type, team) {
    const scoreBoard = document.getElementById(`${team}-score`);
    let [totalRuns, wickets] = scoreBoard.querySelector('h3').innerText.match(/\d+/g).map(Number);
    let extraRuns = 0;
    switch (type) {
        case 'lb':
        case 'wd':
        case 'nb':
            extraRuns = 1;
            break;
        case 'b':
            extraRuns = 1;
            wickets++;
            break;
    }
    totalRuns += extraRuns;
    scoreBoard.querySelector('h3').innerText = `Score: ${totalRuns}/${wickets}`;
    saveAction({ type: 'extra', extraType: type, extraRuns, wickets }, team);
    toggleExtras(team);
}

function playerOut(team) {
    if (!selectedPlayer) return alert('Please select a player first.');
    const playerElement = document.querySelector(`#${team} .player-list li[data-player="${selectedPlayer}"]`);
    playerElement.classList.add('out');
    const scoreBoard = document.getElementById(`${team}-score`);
    let [totalRuns, wickets] = scoreBoard.querySelector('h3').innerText.match(/\d+/g).map(Number);
    wickets++;
    scoreBoard.querySelector('h3').innerText = `Score: ${totalRuns}/${wickets}`;
    selectedPlayer = null;
    playerElement.classList.remove('selected');
    saveAction({ type: 'wicket', wickets }, team);
}

function resetWicket(team) {
    const playerList = document.querySelector(`#${team} .player-list`);
    playerList.querySelectorAll('li').forEach(item => {
        item.classList.remove('out');
    });
    const scoreBoard = document.getElementById(`${team}-score`);
    let [totalRuns, wickets] = scoreBoard.querySelector('h3').innerText.match(/\d+/g).map(Number);
    wickets = 0;
    scoreBoard.querySelector('h3').innerText = `Score: ${totalRuns}/${wickets}`;
    saveAction({ type: 'resetWicket', wickets }, team);
}

function editScore(event) {
    const span = event.target;
    const newScore = prompt('Enter new score:', span.innerText);
    if (newScore !== null && !isNaN(newScore)) {
        const oldScore = parseInt(span.innerText);
        span.innerText = newScore;
        const player = span.id.split('-')[0];
        saveAction({ type: 'editScore', player, oldScore, newScore }, span.id.split('-')[1]);
    }
}

function updateScore(runs, team) {
    const scoreBoard = document.getElementById(`${team}-score`);
    let [totalRuns, wickets] = scoreBoard.querySelector('h3').innerText.match(/\d+/g).map(Number);
    totalRuns += runs;
    scoreBoard.querySelector('h3').innerText = `Score: ${totalRuns}/${wickets}`;

    const playerScore = document.getElementById(`${selectedPlayer}-score`);
    playerScore.innerText = parseInt(playerScore.innerText) + runs;
    saveAction({ type: 'runs', player: selectedPlayer, runs }, team);
}

function saveAction(action, team) {
    history[team].actions.push(action);
    history[team].undoneActions = [];
}

function undo(team) {
    if (history[team].actions.length === 0) return alert('No actions to undo.');
    const lastAction = history[team].actions.pop();
    history[team].undoneActions.push(lastAction);

    const scoreBoard = document.getElementById(`${team}-score`);
    let [totalRuns, wickets] = scoreBoard.querySelector('h3').innerText.match(/\d+/g).map(Number);
    let [overs, balls] = scoreBoard.querySelector('p').innerText.match(/\d+/g).map(Number);

    switch (lastAction.type) {
        case 'runs':
            totalRuns -= lastAction.runs;
            document.getElementById(`${lastAction.player}-score`).innerText = parseInt(document.getElementById(`${lastAction.player}-score`).innerText) - lastAction.runs;
            break;
        case 'extra':
            totalRuns -= lastAction.extraRuns;
            if (lastAction.extraType === 'b') wickets--;
            break;
        case 'wicket':
            wickets--;
            document.querySelector(`#${team} .player-list li[data-player="${selectedPlayer}"]`).classList.remove('out');
            selectedPlayer = null;
            break;
        case 'resetWicket':
            wickets = lastAction.wickets;
            document.querySelectorAll(`#${team} .player-list li`).forEach(item => item.classList.remove('out'));
            break;
        case 'ball':
            overs = lastAction.overs;
            balls = lastAction.balls;
            break;
        case 'editScore':
            document.getElementById(`${lastAction.player}-score`).innerText = lastAction.oldScore;
            totalRuns -= (lastAction.newScore - lastAction.oldScore);
            break;
    }

    scoreBoard.querySelector('h3').innerText = `Score: ${totalRuns}/${wickets}`;
    scoreBoard.querySelector('p').innerText = `Overs: ${overs}.${balls}`;
}

function redo(team) {
    if (history[team].undoneActions.length === 0) return alert('No actions to redo.');
    const lastUndoneAction = history[team].undoneActions.pop();
    history[team].actions.push(lastUndoneAction);

    const scoreBoard = document.getElementById(`${team}-score`);
    let [totalRuns, wickets] = scoreBoard.querySelector('h3').innerText.match(/\d+/g).map(Number);
    let [overs, balls] = scoreBoard.querySelector('p').innerText.match(/\d+/g).map(Number);

    switch (lastUndoneAction.type) {
        case 'runs':
            totalRuns += lastUndoneAction.runs;
            document.getElementById(`${lastUndoneAction.player}-score`).innerText = parseInt(document.getElementById(`${lastUndoneAction.player}-score`).innerText) + lastUndoneAction.runs;
            break;
        case 'extra':
            totalRuns += lastUndoneAction.extraRuns;
            if (lastUndoneAction.extraType === 'b') wickets++;
            break;
        case 'wicket':
            wickets++;
            document.querySelector(`#${team} .player-list li[data-player="${selectedPlayer}"]`).classList.add('out');
            selectedPlayer = null;
            break;
        case 'resetWicket':
            wickets = lastUndoneAction.wickets;
            document.querySelectorAll(`#${team} .player-list li`).forEach(item => item.classList.add('out'));
            break;
        case 'ball':
            overs = lastUndoneAction.overs;
            balls = lastUndoneAction.balls;
            break;
        case 'editScore':
            document.getElementById(`${lastUndoneAction.player}-score`).innerText = lastUndoneAction.newScore;
            totalRuns += (lastUndoneAction.newScore - lastUndoneAction.oldScore);
            break;
    }

    scoreBoard.querySelector('h3').innerText = `Score: ${totalRuns}/${wickets}`;
    scoreBoard.querySelector('p').innerText = `Overs: ${overs}.${balls}`;
}