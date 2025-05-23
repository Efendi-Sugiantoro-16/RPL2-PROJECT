class Dashboard {
    constructor() {
        this.emotionAnalyzer = new EmotionAnalyzer();
        this.initializeElements();
        this.setupEventListeners();
        this.initializeCharts();
        this.loadDashboardData();
        this.startRealTimeUpdates();
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
        this.chartTypeSelect.addEventListener('change', () => this.updateChartType());

        // Time period buttons
        this.periodButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.updateTimePeriod(button.dataset.period);
                this.setActiveButton(button);
            });
        });

        // Generate report
        this.generateReportBtn.addEventListener('click', () => this.generateReport());

        // Emotion input controls
        document.getElementById('startVideo').addEventListener('click', () => {
            this.startVideoTracking();
        });

        document.getElementById('startAudio').addEventListener('click', () => {
            this.startAudioTracking();
        });

        document.getElementById('analyzeText').addEventListener('click', () => {
            this.analyzeTextInput();
        });

        // Feedback form
        document.getElementById('feedbackForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitFeedback(new FormData(e.target));
        });
    }

    initializeWebSocket() {
        // In a real implementation, connect to your WebSocket server
        this.socket = {
            send: (data) => console.log('WebSocket message sent:', data),
            onmessage: (callback) => {
                // Simulate receiving real-time updates
                setInterval(() => {
                    const mockData = this.generateMockEmotionData();
                    callback({ data: JSON.stringify(mockData) });
                }, 5000);
            }
        };

        this.socket.onmessage((event) => {
            const data = JSON.parse(event.data);
            this.updateDashboard(data);
        });
    }

    initializeMoodChart() {
        const ctx = document.getElementById('moodChart').getContext('2d');
        this.moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Team Mood',
                    data: [],
                    borderColor: '#3498db',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1
                    }
                }
            }
        });
    }

    updateChartType(type) {
        if (this.moodChart) {
            this.moodChart.destroy();
        }

        const ctx = document.getElementById('moodChart').getContext('2d');
        const chartConfig = this.getChartConfig(type);
        this.moodChart = new Chart(ctx, chartConfig);
    }

    getChartConfig(type) {
        if (type === 'pie') {
            return {
                type: 'pie',
                data: {
                    labels: ['Happy', 'Sad', 'Angry', 'Neutral'],
                    datasets: [{
                        data: [30, 20, 20, 30],
                        backgroundColor: [
                            '#2ecc71',
                            '#3498db',
                            '#e74c3c',
                            '#95a5a6'
                        ]
                    }]
                }
            };
        }

        return {
            type: 'line',
            data: {
                labels: Array.from({length: 10}, (_, i) => `${i + 1}h ago`),
                datasets: [{
                    label: 'Team Mood',
                    data: Array.from({length: 10}, () => Math.random()),
                    borderColor: '#3498db',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1
                    }
                }
            }
        };
    }

    async setupEmotionTracking() {
        try {
            await this.emotionAnalyzer.loadModels();
            console.log('Emotion tracking models loaded');
        } catch (error) {
            console.error('Error setting up emotion tracking:', error);
            this.showAlert('Error setting up emotion tracking', 'error');
        }
    }

    async startVideoTracking() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const videoElement = document.getElementById('videoInput');
            videoElement.srcObject = stream;
            
            // Analyze video frames periodically
            setInterval(async () => {
                const emotions = await this.emotionAnalyzer.analyzeVideo(videoElement);
                if (emotions) {
                    this.processEmotionData(emotions, 'video');
                }
            }, 1000);
        } catch (error) {
            console.error('Error starting video tracking:', error);
            this.showAlert('Could not access camera', 'error');
        }
    }

    async startAudioTracking() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioElement = document.getElementById('audioInput');
            audioElement.srcObject = stream;

            // Create audio analyzer
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            source.connect(analyzer);

            // Analyze audio periodically
            setInterval(async () => {
                const audioData = new Float32Array(analyzer.frequencyBinCount);
                analyzer.getFloatTimeDomainData(audioData);
                const emotions = await this.emotionAnalyzer.analyzeAudio(audioData);
                if (emotions) {
                    this.processEmotionData(emotions, 'audio');
                }
            }, 1000);
        } catch (error) {
            console.error('Error starting audio tracking:', error);
            this.showAlert('Could not access microphone', 'error');
        }
    }

    async analyzeTextInput() {
        const textInput = document.getElementById('textInput');
        const text = textInput.value.trim();

        if (text) {
            const emotions = await this.emotionAnalyzer.analyzeText(text);
            if (emotions) {
                this.processEmotionData(emotions, 'text');
            }
        }
    }

    processEmotionData(emotions, source) {
        // Send data to server
        this.socket.send(JSON.stringify({
            type: 'emotion_data',
            source,
            data: emotions
        }));

        // Check for stress/conflicts
        this.detectStressAndConflicts(emotions);

        // Update dashboard
        this.updateDashboard(emotions);
    }

    detectStressAndConflicts(emotions) {
        const stressLevel = this.calculateStressLevel(emotions);
        if (stressLevel > this.alertThreshold) {
            this.createAlert({
                level: 'high',
                message: 'High stress levels detected in the team',
                timestamp: new Date()
            });
        }
    }

    calculateStressLevel(emotions) {
        // Simple stress calculation based on negative emotions
        return (emotions.sad + emotions.angry) / 2;
    }

    createAlert(alert) {
        const alertsList = document.getElementById('alertsList');
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.level}`;
        alertElement.innerHTML = `
            <h4>${alert.level.toUpperCase()} Alert</h4>
            <p>${alert.message}</p>
            <small>${alert.timestamp.toLocaleTimeString()}</small>
        `;
        alertsList.prepend(alertElement);
    }

    updateDashboard(data) {
        // Update chart
        if (this.moodChart.config.type === 'line') {
            this.updateLineChart(data);
        } else {
            this.updatePieChart(data);
        }
    }

    updateLineChart(data) {
        const timestamp = new Date().toLocaleTimeString();
        const averageMood = (data.happy - data.sad - data.angry + data.neutral) / 4;

        this.moodChart.data.labels.push(timestamp);
        this.moodChart.data.datasets[0].data.push(averageMood);

        if (this.moodChart.data.labels.length > 10) {
            this.moodChart.data.labels.shift();
            this.moodChart.data.datasets[0].data.shift();
        }

        this.moodChart.update();
    }

    updatePieChart(data) {
        this.moodChart.data.datasets[0].data = [
            data.happy * 100,
            data.sad * 100,
            data.angry * 100,
            data.neutral * 100
        ];
        this.moodChart.update();
    }

    togglePrivacyMode() {
        const privacyButton = document.getElementById('privacyToggle');
        const isEnabled = privacyButton.classList.toggle('active');
        this.emotionAnalyzer.togglePrivacyMode(isEnabled);
        this.showAlert(
            `Privacy mode ${isEnabled ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    submitFeedback(formData) {
        // In a real implementation, send to server
        console.log('Feedback submitted:', Object.fromEntries(formData));
        this.showAlert('Thank you for your feedback!', 'success');
    }

    showAlert(message, type) {
        // Create and show a temporary alert
        const alertContainer = document.createElement('div');
        alertContainer.className = `dashboard-alert ${type}`;
        alertContainer.textContent = message;
        document.body.appendChild(alertContainer);

        setTimeout(() => {
            alertContainer.remove();
        }, 3000);
    }

    generateMockEmotionData() {
        return {
            happy: Math.random(),
            sad: Math.random() * 0.5,
            angry: Math.random() * 0.3,
            neutral: Math.random() * 0.7
        };
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
