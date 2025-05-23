class Dashboard {
    constructor() {
        this.emotionAnalyzer = new EmotionAnalyzer();
        this.initializeElements();
        this.setupEventListeners();
        this.initializeCharts();
        this.loadDashboardData();
        this.setupRefreshInterval();
    }

    initializeElements() {
        // Stats elements
        this.avgMoodElement = document.getElementById('avgMood');
        this.stressLevelElement = document.getElementById('stressLevel');
        this.engagementElement = document.getElementById('engagement');
        this.responsesElement = document.getElementById('responses');
        this.moodTrendElement = document.getElementById('moodTrend');
        this.responsesTrendElement = document.getElementById('responsesTrend');

        // Chart elements
        this.chartTypeSelect = document.getElementById('chartType');
        this.periodButtons = document.querySelectorAll('.chart-controls .btn');
        this.moodChart = document.getElementById('moodChart');
        this.moodDistributionChart = document.getElementById('moodDistributionChart');
        this.refreshActivityBtn = document.getElementById('refreshActivity');

        // Activity feed
        this.recentActivity = document.getElementById('recentActivity');
    }

    setupEventListeners() {
        // Chart type change
        if (this.chartTypeSelect) {
            this.chartTypeSelect.addEventListener('change', () => this.updateChartType());
        }

        // Time period buttons
        if (this.periodButtons) {
            this.periodButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.updateTimePeriod(button.dataset.period);
                    this.setActiveButton(button);
                });
            });
        }

        // Refresh activity
        if (this.refreshActivityBtn) {
            this.refreshActivityBtn.addEventListener('click', () => this.updateRecentActivity());
        }
        
        // Handle window resize for responsive charts
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleResize() {
        // Debounce the resize event to prevent excessive updates
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            if (this.chart) this.chart.resize();
            if (this.distributionChart) this.distributionChart.resize();
        }, 200);
    }
    
    setupRefreshInterval() {
        // Refresh data every 5 minutes
        setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    async loadDashboardData() {
        try {
            const data = DataService.getTeamStats();
            this.updateDashboard(data);
            this.updateRecentActivity();
            this.updateMoodDistributionChart(data.moodDistribution);
            this.showNotification('Dashboard updated', 'success');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Failed to update dashboard', 'error');
        }
    }
    
    updateDashboard(data) {
        if (!data) return;
        
        // Update stats
        if (data.avgMood !== undefined && this.avgMoodElement) {
            this.avgMoodElement.textContent = `${Math.round(data.avgMood)}%`;
            const meterFill = this.avgMoodElement.parentElement.querySelector('.meter-fill');
            if (meterFill) meterFill.style.width = `${data.avgMood}%`;
            
            // Update trend indicator
            if (data.previousAvgMood !== undefined && this.moodTrendElement) {
                const trend = data.avgMood - data.previousAvgMood;
                this.updateTrendIndicator(this.moodTrendElement, trend, 'mood');
            }
        }
        
        if (data.moodDistribution) {
            const stressLevel = this.calculateStressLevel(data.moodDistribution);
            if (this.stressLevelElement) {
                this.stressLevelElement.textContent = stressLevel.text;
                const stressMeter = this.stressLevelElement.parentElement.querySelector('.meter-fill');
                if (stressMeter) {
                    stressMeter.style.width = `${stressLevel.percentage}%`;
                    // Update meter color based on stress level
                    stressMeter.style.backgroundColor = this.getStressLevelColor(stressLevel.percentage);
                }
            }
            
            const engagement = this.calculateEngagement(data.moodDistribution);
            if (this.engagementElement) {
                this.engagementElement.textContent = engagement.text;
                const engagementMeter = this.engagementElement.parentElement.querySelector('.meter-fill');
                if (engagementMeter) {
                    engagementMeter.style.width = `${engagement.percentage}%`;
                    // Update meter color based on engagement level
                    engagementMeter.style.backgroundColor = this.getEngagementColor(engagement.percentage);
                }
            }
        }
        
        if (data.totalEntries !== undefined && this.responsesElement) {
            const prevResponses = parseInt(this.responsesElement.textContent) || 0;
            this.responsesElement.textContent = data.totalEntries;
            
            // Update responses trend
            if (prevResponses > 0 && this.responsesTrendElement) {
                const trend = data.totalEntries - prevResponses;
                this.updateTrendIndicator(this.responsesTrendElement, trend, 'count');
            }
        }
    }
    
    updateTrendIndicator(element, value, type = 'mood') {
        if (!element) return;
        
        element.textContent = value > 0 ? `↑ ${value}${type === 'mood' ? '%' : ''}` : 
                               value < 0 ? `↓ ${Math.abs(value)}${type === 'mood' ? '%' : ''}` : '→';
        
        element.className = 'stat-trend';
        if (value > 0) element.classList.add('positive');
        else if (value < 0) element.classList.add('negative');
    }
    
    getStressLevelColor(percentage) {
        if (percentage > 70) return '#e74c3c'; // Red for high stress
        if (percentage > 30) return '#f39c12'; // Orange for medium stress
        return '#2ecc71'; // Green for low stress
    }
    
    getEngagementColor(percentage) {
        if (percentage > 70) return '#2ecc71'; // Green for high engagement
        if (percentage > 40) return '#f39c12'; // Orange for medium engagement
        return '#e74c3c'; // Red for low engagement
    }
    
    calculateStressLevel(moodDistribution) {
        // Higher stress if more negative emotions
        const stressPercentage = moodDistribution.sad + (moodDistribution.neutral * 0.3);
        
        if (stressPercentage > 60) return { text: 'High', percentage: stressPercentage };
        if (stressPercentage > 30) return { text: 'Medium', percentage: stressPercentage };
        return { text: 'Low', percentage: stressPercentage };
    }
    
    calculateEngagement(moodDistribution) {
        // Higher engagement if more positive emotions
        const engagementPercentage = moodDistribution.happy + (moodDistribution.neutral * 0.5);
        
        if (engagementPercentage > 70) return { text: 'High', percentage: engagementPercentage };
        if (engagementPercentage > 40) return { text: 'Medium', percentage: engagementPercentage };
        return { text: 'Low', percentage: engagementPercentage };
    }

    initializeCharts() {
        if (!this.moodChart) return;
        
        const ctx = this.moodChart.getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Team Mood',
                    data: [],
                    borderColor: '#3498db',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Mood Level (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
        
        this.updateCharts();
    }
    
    updateCharts() {
        if (!this.chart) return;
        
        const entries = DataService.getEntries();
        const moodData = entries
            .filter(entry => entry.mood !== null)
            .map(entry => ({
                x: new Date(entry.timestamp),
                y: entry.mood * 20 // Convert 1-5 scale to percentage
            }));
        
        // Group by day for better visualization
        const groupedData = this.groupDataByDay(moodData);
        
        this.chart.data.labels = groupedData.labels;
        this.chart.data.datasets[0].data = groupedData.data;
        this.chart.update();
    }
    
    groupDataByDay(data) {
        const grouped = {};
        
        data.forEach(item => {
            const date = new Date(item.x);
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (!grouped[dateString]) {
                grouped[dateString] = {
                    sum: 0,
                    count: 0
                };
            }
            
            grouped[dateString].sum += item.y;
            grouped[dateString].count++;
        });
        
        const labels = Object.keys(grouped);
        const values = Object.values(grouped).map(group => group.sum / group.count);
        
        return { labels, data: values };
    }
    
    updateMoodDistributionChart(distribution) {
        if (!this.moodDistributionChart || !distribution) return;
        
        const ctx = this.moodDistributionChart.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.distributionChart) {
            this.distributionChart.destroy();
        }
        
        this.distributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Happy', 'Neutral', 'Sad'],
                datasets: [{
                    data: [
                        distribution.happy || 0,
                        distribution.neutral || 0,
                        distribution.sad || 0
                    ],
                    backgroundColor: [
                        '#2ecc71', // Green for happy
                        '#f39c12', // Orange for neutral
                        '#e74c3c'  // Red for sad
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    updateRecentActivity() {
        if (!this.recentActivity) return;
        
        const entries = DataService.getEntries().slice(-5).reverse();
        
        if (entries.length === 0) {
            this.recentActivity.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <p>No recent activity. Start tracking your mood to see data here.</p>
                        <small>Just now</small>
                    </div>
                </div>`;
            return;
        }
        
        this.recentActivity.innerHTML = entries.map(entry => {
            const date = new Date(entry.timestamp);
            const timeString = date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            
            const moodEmoji = this.getMoodEmoji(entry.mood);
            const moodText = this.getMoodText(entry.mood);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon" style="background-color: ${this.getMoodColor(entry.mood)}20; color: ${this.getMoodColor(entry.mood)};">
                        ${moodEmoji}
                    </div>
                    <div class="activity-content">
                        <p><strong>${moodText}</strong> mood recorded${entry.notes ? `: "${entry.notes}"` : ''}</p>
                        <small>${timeString}</small>
                    </div>
                </div>`;
        }).join('');
    }
    
    getMoodEmoji(mood) {
        // mood is on a scale of 1-5 (1=very sad, 5=very happy)
        const emojis = ['😢', '😞', '😐', '🙂', '😊'];
        return emojis[mood - 1] || '❓';
    }
    
    getMoodText(mood) {
        const moods = ['Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'];
        return moods[mood - 1] || 'Unknown';
    }
    
    getMoodColor(mood) {
        // Return a color based on mood (1-5)
        const colors = ['#e74c3c', '#e67e22', '#f39c12', '#2ecc71', '#27ae60'];
        return colors[mood - 1] || '#95a5a6';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
    }
    
    updateChartType() {
        if (!this.chart || !this.chartTypeSelect) return;
        this.chart.config.type = this.chartTypeSelect.value;
        this.chart.update();
    }
    
    updateTimePeriod(period) {
        // In a real app, this would filter data based on the selected period
        console.log('Updating time period:', period);
        // For now, just update the chart with all data
        this.updateCharts();
    }
    
    setActiveButton(activeButton) {
        if (!this.periodButtons) return;
        this.periodButtons.forEach(button => {
            button.classList.toggle('active', button === activeButton);
        });
    }
    
    generateReport() {
        try {
            const data = DataService.getTeamStats();
            const entries = DataService.getEntries();
            
            // Create a simple text report
            let report = `TeamPulse Report - ${new Date().toLocaleDateString()}\n\n`;
            report += `Average Mood: ${data.avgMood}%\n`;
            report += `Total Entries: ${data.totalEntries}\n\n`;
            report += `Mood Distribution:\n`;
            report += `- Happy: ${data.moodDistribution.happy}%\n`;
            report += `- Neutral: ${data.moodDistribution.neutral}%\n`;
            report += `- Sad: ${data.moodDistribution.sad}%\n\n`;
            report += `Recent Entries:\n`;
            
            // Add recent entries
            entries.slice(-5).forEach(entry => {
                const date = new Date(entry.timestamp).toLocaleString();
                report += `[${date}] Mood: ${entry.mood || 'N/A'}, Notes: ${entry.notes || 'None'}\n`;
            });
            
            // Create a blob and download link
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `teampulse-report-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Report generated successfully!', 'success');
        } catch (error) {
            console.error('Error generating report:', error);
            this.showNotification('Failed to generate report.', 'error');
        }
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.dashboard = new Dashboard();
        // Show welcome notification
        setTimeout(() => {
            dashboard.showNotification('Welcome to TeamPulse Dashboard!', 'success');
        }, 1000);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = 'Failed to initialize dashboard. Please refresh the page.';
        document.body.appendChild(notification);
    }
});
