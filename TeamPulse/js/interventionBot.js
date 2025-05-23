class InterventionBot {
    constructor() {
        this.messageHistory = [];
        this.suggestions = {
            highStress: [
                "Consider taking a short break to recharge",
                "Try some deep breathing exercises",
                "Schedule a team check-in meeting",
                "Review workload distribution",
                "Practice mindfulness meditation"
            ],
            conflict: [
                "Schedule a one-on-one discussion",
                "Use active listening techniques",
                "Focus on the issue, not personalities",
                "Seek common ground",
                "Consider involving a mediator"
            ],
            teamBuilding: [
                "Organize a virtual team building activity",
                "Share positive feedback and appreciation",
                "Schedule regular casual catch-ups",
                "Create opportunities for collaboration",
                "Celebrate team achievements"
            ]
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        const toggleBot = document.getElementById('toggleBot');
        const sendButton = document.getElementById('sendBotMessage');
        const inputField = document.getElementById('botInput');

        toggleBot.addEventListener('click', () => {
            document.querySelector('.bot-content').classList.toggle('hidden');
            toggleBot.querySelector('i').classList.toggle('fa-chevron-up');
            toggleBot.querySelector('i').classList.toggle('fa-chevron-down');
        });

        sendButton.addEventListener('click', () => {
            this.handleUserInput();
        });

        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserInput();
            }
        });
    }

    handleUserInput() {
        const inputField = document.getElementById('botInput');
        const message = inputField.value.trim();

        if (message) {
            this.addMessage(message, 'outgoing');
            this.processUserInput(message);
            inputField.value = '';
        }
    }

    processUserInput(message) {
        // Analyze user input and generate appropriate response
        const response = this.generateResponse(message);
        setTimeout(() => {
            this.addMessage(response, 'incoming');
        }, 1000);
    }

    generateResponse(message) {
        const lowercaseMessage = message.toLowerCase();
        
        // Check for stress-related keywords
        if (this.containsAny(lowercaseMessage, ['stress', 'overwhelm', 'tired', 'exhausted'])) {
            return this.getRandomSuggestion('highStress');
        }
        
        // Check for conflict-related keywords
        if (this.containsAny(lowercaseMessage, ['conflict', 'disagree', 'argument', 'tension'])) {
            return this.getRandomSuggestion('conflict');
        }
        
        // Check for team building related keywords
        if (this.containsAny(lowercaseMessage, ['team', 'collaborate', 'together', 'build'])) {
            return this.getRandomSuggestion('teamBuilding');
        }

        // Default response
        return "I'm here to help! You can ask me about managing stress, resolving conflicts, or building team relationships.";
    }

    containsAny(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    getRandomSuggestion(category) {
        const suggestions = this.suggestions[category];
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }

    addMessage(content, type) {
        const messagesContainer = document.getElementById('botMessages');
        const messageElement = document.createElement('div');
        messageElement.className = `bot-message ${type}`;
        messageElement.textContent = content;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Store message in history
        this.messageHistory.push({
            content,
            type,
            timestamp: new Date()
        });
    }

    suggestIntervention(stressLevel, context) {
        let suggestion;
        
        if (stressLevel > 0.8) {
            suggestion = this.getRandomSuggestion('highStress');
        } else if (context.includes('conflict')) {
            suggestion = this.getRandomSuggestion('conflict');
        } else {
            suggestion = this.getRandomSuggestion('teamBuilding');
        }

        this.addMessage(suggestion, 'incoming');
    }
}

// Initialize bot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.interventionBot = new InterventionBot();
});
