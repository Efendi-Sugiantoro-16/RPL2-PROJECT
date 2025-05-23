document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});

function loadHistory() {
    const historyList = document.getElementById('history-list');
    const historyData = JSON.parse(localStorage.getItem('history')) || [];
    historyList.innerHTML = '';
    historyData.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            ${item}
            <button onclick="editHistory(${index})">Edit</button>
            <button onclick="deleteHistory(${index})">Delete</button>
        `;
        historyList.appendChild(historyItem);
    });
}

function addHistory() {
    const historyInput = document.getElementById('history-input');
    const newHistory = historyInput.value.trim();
    if (newHistory) {
        const historyData = JSON.parse(localStorage.getItem('history')) || [];
        historyData.push(newHistory);
        localStorage.setItem('history', JSON.stringify(historyData));
        historyInput.value = '';
        loadHistory();
    }
}

function editHistory(index) {
    const historyData = JSON.parse(localStorage.getItem('history')) || [];
    const newHistory = prompt('Edit history item:', historyData[index]);
    if (newHistory !== null) {
        historyData[index] = newHistory;
        localStorage.setItem('history', JSON.stringify(historyData));
        loadHistory();
    }
}

function deleteHistory(index) {
    const historyData = JSON.parse(localStorage.getItem('history')) || [];
    historyData.splice(index, 1);
    localStorage.setItem('history', JSON.stringify(historyData));
    loadHistory();
}
