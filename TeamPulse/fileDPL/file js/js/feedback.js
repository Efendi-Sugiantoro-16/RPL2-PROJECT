class FeedbackPage {
    constructor() {
        this.feedbackManager = new FeedbackManager();
        this.initializeElements();
        this.setupEventListeners();
        this.loadFeedback();
    }

    initializeElements() {
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.submitButton = document.getElementById('submitFeedback');
        this.feedbackList = document.querySelector('.feedback-list');
    }

    setupEventListeners() {
        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Submit feedback
        this.submitButton.addEventListener('click', () => this.submitFeedback());
    }

    switchTab(tabId) {
        // Update active tab button
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });

        // Update active tab content
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });

        // Reload feedback list if viewing feedback tab
        if (tabId === 'view-feedback') {
            this.loadFeedback();
        }
    }

    async submitFeedback() {
        const rating = document.querySelector('input[name="rating"]:checked')?.value;
        const type = document.getElementById('feedbackType').value;
        const comment = document.getElementById('feedbackComment').value;

        if (!rating) {
            alert('Please select a rating.');
            return;
        }

        if (!comment.trim()) {
            alert('Please enter your feedback.');
            return;
        }

        const feedback = {
            rating: parseInt(rating),
            type,
            comment,
            userId: 'current-user-id', // This would come from your auth system
            userName: 'John Doe', // This would come from your auth system
            timestamp: new Date().toISOString()
        };

        try {
            await this.feedbackManager.submitFeedback(feedback);
            alert('Feedback submitted successfully!');
            this.resetForm();
            this.switchTab('view-feedback');
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Error submitting feedback. Please try again.');
        }
    }

    async loadFeedback() {
        try {
            const feedbackItems = await this.feedbackManager.getFeedback();
            this.renderFeedbackList(feedbackItems);
        } catch (error) {
            console.error('Error loading feedback:', error);
            this.feedbackList.innerHTML = '<p class="error">Error loading feedback. Please try again later.</p>';
        }
    }

    renderFeedbackList(feedbackItems) {
        this.feedbackList.innerHTML = feedbackItems.map(item => `
            <div class="feedback-item">
                <div class="feedback-header">
                    <div class="user-info">
                        <span class="username">${item.userName}</span>
                        <span class="timestamp">${this.formatDate(item.timestamp)}</span>
                    </div>
                    <div class="rating-display">
                        ${this.generateStars(item.rating)}
                    </div>
                </div>
                <div class="feedback-type">${item.type}</div>
                <div class="feedback-comment">${item.comment}</div>
            </div>
        `).join('');
    }

    generateStars(rating) {
        return Array(5).fill(0).map((_, index) => `
            <i class="fas fa-star ${index < rating ? 'filled' : ''}"></i>
        `).join('');
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    resetForm() {
        document.querySelectorAll('input[name="rating"]').forEach(radio => radio.checked = false);
        document.getElementById('feedbackType').value = 'general';
        document.getElementById('feedbackComment').value = '';
    }
}

// Initialize the FeedbackPage class when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const feedbackPage = new FeedbackPage();
});
