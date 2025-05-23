class Dashboard {
    constructor() {
        this.emotionAnalyzer = new EmotionAnalyzer();
        this.initializeElements();
        this.setupEventListeners();
        this.initializeCharts();
        this.loadDashboardData();
    }

    initializeElements() {
        // Stats elements
        this.avgMoodElement = document.getElementById('avgMood');
        this.stressLevelElement = document.getElementById('stressLevel');
        this.engagementElement = document.getElementById('engagement');
        this.responsesElement = document.getElementById('responses');

        // Chart elements
        this.chartTypeSelect = document.getElementById('chartType');
        this.periodButtons = document.querySelectorAll('.chart-controls .btn');
        this.moodChart = document.getElementById('moodChart');

        // Activity and alerts
        this.activityList = document.getElementById('activityList');
        this.alertsList = document.getElementById('alertsList');

        // Generate report button
        this.generateReportBtn = document.getElementById('generateReport');
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

        // Generate report
        if (this.generateReportBtn) {
            this.generateReportBtn.addEventListener('click', () => this.generateReport());
        }
    }

    loadDashboardData() {
        const data = DataService.getTeamStats();
        this.updateDashboard(data);
    }
    
    updateDashboard(data) {
        if (!data) return;
        
        // Update stats
        if (data.avgMood !== undefined && this.avgMoodElement) {
            this.avgMoodElement.textContent = `${data.avgMood}%`;
            const meterFill = this.avgMoodElement.parentElement.querySelector('.meter-fill');
            if (meterFill) meterFill.style.width = `${data.avgMood}%`;
        }
        
        if (data.moodDistribution) {
            const stressLevel = this.calculateStressLevel(data.moodDistribution);
            if (this.stressLevelElement) {
                this.stressLevelElement.textContent = stressLevel.text;
                const stressMeter = this.stressLevelElement.parentElement.querySelector('.meter-fill');
                if (stressMeter) stressMeter.style.width = stressLevel.percentage + '%';
            }
            
            const engagement = this.calculateEngagement(data.moodDistribution);
            if (this.engagementElement) {
                this.engagementElement.textContent = engagement.text;
                const engagementMeter = this.engagementElement.parentElement.querySelector('.meter-fill');
                if (engagementMeter) engagementMeter.style.width = engagement.percentage + '%';
            }
        }
        
        if (data.totalEntries !== undefined && this.responsesElement) {
            this.responsesElement.textContent = data.totalEntries;
        }
        
        // Update charts
        this.updateCharts();
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
        
        this.chart.data.labels = moodData.map((_, i) => `Entry ${i + 1}`);
        this.chart.data.datasets[0].data = moodData;
        this.chart.update();
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
    window.dashboard = new Dashboard();
});
