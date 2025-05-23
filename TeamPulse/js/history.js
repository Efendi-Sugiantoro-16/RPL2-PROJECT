class HistoryManager {
    constructor() {
        this.entriesContainer = document.getElementById('history-entries');
        this.filterSelect = document.getElementById('filter-period');
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.loadHistory();
    }
    
    setupEventListeners() {
        if (this.filterSelect) {
            this.filterSelect.addEventListener('change', () => this.loadHistory());
        }
    }
    
    loadHistory() {
        const filterValue = this.filterSelect ? this.filterSelect.value : 'all';
        let entries = DataService.getEntries();
        
        // Apply filters
        if (filterValue !== 'all') {
            const now = new Date();
            entries = entries.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                const diffTime = now - entryDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                switch(filterValue) {
                    case 'today':
                        return diffDays === 0;
                    case 'week':
                        return diffDays <= 7;
                    case 'month':
                        return diffDays <= 30;
                    default:
                        return true;
                }
            });
        }
        
        this.renderEntries(entries);
    }
    
    renderEntries(entries) {
        if (!this.entriesContainer) return;
        
        if (entries.length === 0) {
            this.entriesContainer.innerHTML = `
                <div class="no-entries">
                    <i class="fas fa-inbox"></i>
                    <p>No entries found</p>
                </div>
            `;
            return;
        }
        
        // Group entries by date
        const groupedEntries = this.groupEntriesByDate(entries);
        
        // Generate HTML for each date group
        let html = '';
        for (const [date, dateEntries] of Object.entries(groupedEntries)) {
            html += `
                <div class="date-group">
                    <h3>${date}</h3>
                    <div class="entries">
                        ${dateEntries.map(entry => this.renderEntry(entry)).join('')}
                    </div>
                </div>
            `;
        }
        
        this.entriesContainer.innerHTML = html;
    }
    
    groupEntriesByDate(entries) {
        return entries.reduce((groups, entry) => {
            const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            if (!groups[date]) {
                groups[date] = [];
            }
            
            groups[date].push(entry);
            return groups;
        }, {});
    }
    
    renderEntry(entry) {
        const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const moodEmoji = this.getMoodEmoji(entry.mood);
        const moodText = this.getMoodText(entry.mood);
        
        return `
            <div class="entry" data-id="${entry.id}">
                <div class="entry-time">${time}</div>
                <div class="entry-mood">
                    <span class="mood-emoji">${moodEmoji}</span>
                    <span class="mood-text">${moodText}</span>
                </div>
                ${entry.notes ? `
                    <div class="entry-notes">
                        <p>${this.escapeHtml(entry.notes)}</p>
                    </div>
                ` : ''}
                <div class="entry-actions">
                    <button class="btn-icon" onclick="historyManager.deleteEntry('${entry.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    getMoodEmoji(mood) {
        if (!mood) return '❓';
        if (mood >= 4) return '😊';
        if (mood >= 2.5) return '😐';
        return '😔';
    }
    
    getMoodText(mood) {
        if (!mood) return 'No mood data';
        if (mood >= 4) return 'Happy';
        if (mood >= 2.5) return 'Neutral';
        return 'Sad';
    }
    
    deleteEntry(entryId) {
        if (!confirm('Are you sure you want to delete this entry?')) {
            return;
        }
        
        try {
            const data = DataService.getAllData();
            data.entries = data.entries.filter(entry => entry.id !== entryId);
            DataService.saveAllData(data);
            this.loadHistory();
            this.showNotification('Entry deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting entry:', error);
            this.showNotification('Failed to delete entry', 'error');
        }
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize history manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.historyManager = new HistoryManager();
});
