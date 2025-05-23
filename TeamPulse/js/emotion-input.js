class EmotionInput {
    constructor() {
        this.videoStream = null;
        this.audioStream = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.emotionAnalyzer = new EmotionAnalyzer();
        this.currentData = {
            videoMood: null,
            audioMood: null,
            textMood: null,
            notes: '',
            timestamp: null
        };
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Video elements
        this.videoFeed = document.getElementById('videoFeed');
        this.startVideoBtn = document.getElementById('startVideo');
        this.captureVideoBtn = document.getElementById('captureVideo');

        // Audio elements
        this.startAudioBtn = document.getElementById('startAudio');
        this.stopAudioBtn = document.getElementById('stopAudio');
        this.audioVisualizer = document.getElementById('audioVisualizer');

        // Text elements
        this.emotionText = document.getElementById('emotionText');

        // Submit button
        this.submitBtn = document.getElementById('submitEmotions');
    }

    setupEventListeners() {
        // Video event listeners
        this.startVideoBtn.addEventListener('click', () => this.toggleVideo());
        this.captureVideoBtn.addEventListener('click', () => this.captureVideo());

        // Audio event listeners
        this.startAudioBtn.addEventListener('click', () => this.startAudioRecording());
        this.stopAudioBtn.addEventListener('click', () => this.stopAudioRecording());

        // Submit event listener
        this.submitBtn.addEventListener('click', () => this.submitEmotions());
    }


    async captureVideo() {
        const canvas = document.createElement('canvas');
        canvas.width = this.videoFeed.videoWidth;
        canvas.height = this.videoFeed.videoHeight;
        canvas.getContext('2d').drawImage(this.videoFeed, 0, 0);
        
        try {
            const emotions = await this.emotionAnalyzer.analyzeVideo(canvas);
            const selectedMood = document.querySelector('input[name="videoMood"]:checked');
            this.currentData.videoMood = selectedMood ? parseInt(selectedMood.value) : null;
            
            this.showNotification('Video captured and mood recorded!', 'success');
            return true;
        } catch (error) {
            console.error('Error analyzing video:', error);
            this.showNotification('Error analyzing video emotions.', 'error');
            return false;
        }
    }

    async startAudioRecording() {
        try {
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.audioStream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.start();
            this.startAudioBtn.disabled = true;
            this.stopAudioBtn.disabled = false;
            this.visualizeAudio();
        } catch (error) {
            console.error('Error starting audio recording:', error);
            this.showNotification('Unable to access microphone. Please check permissions.', 'error');
        }
    }

    async stopAudioRecording() {
        return new Promise((resolve) => {
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                try {
                    const emotions = await this.emotionAnalyzer.analyzeAudio(audioBlob);
                    const selectedMood = document.querySelector('input[name="audioMood"]:checked');
                    this.currentData.audioMood = selectedMood ? parseInt(selectedMood.value) : null;
                    
                    this.showNotification('Audio recorded and mood saved!', 'success');
                    resolve(true);
                } catch (error) {
                    console.error('Error analyzing audio:', error);
                    this.showNotification('Error analyzing audio emotions.', 'error');
                    resolve(false);
                }
            };
            
            this.mediaRecorder.stop();
            this.audioStream.getTracks().forEach(track => track.stop());
            this.startAudioBtn.disabled = false;
            this.stopAudioBtn.disabled = true;
        });
    }

    visualizeAudio() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(this.audioStream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!this.audioStream) return;
            
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            
            // Simple visualization
            const barWidth = (this.audioVisualizer.offsetWidth / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            this.audioVisualizer.innerHTML = '';
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                
                const bar = document.createElement('div');
                bar.style.position = 'absolute';
                bar.style.bottom = '0';
                bar.style.left = x + 'px';
                bar.style.width = (barWidth - 1) + 'px';
                bar.style.height = barHeight + 'px';
                bar.style.backgroundColor = '#3498db';
                
                this.audioVisualizer.appendChild(bar);
                x += barWidth + 1;
            }
        };
        
        draw();
    }

    async submitEmotions() {
        try {
            // Get text mood if any
            const textMoodInput = document.querySelector('input[name="textMood"]:checked');
            this.currentData.textMood = textMoodInput ? parseInt(textMoodInput.value) : null;
            
            // Get optional notes
            this.currentData.notes = document.getElementById('emotionText').value || '';
            this.currentData.timestamp = new Date().toISOString();
            
            // Save to data service
            const savedData = DataService.saveEmotionData(this.currentData);
            
            // Show success message
            this.showNotification('Emotion data saved successfully!', 'success');
            
            // Reset form
            this.resetForm();
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
            return savedData;
        } catch (error) {
            console.error('Error saving emotion data:', error);
            this.showNotification('Failed to save emotion data. Please try again.', 'error');
            throw error;
        }
    }
    
    resetForm() {
        // Reset form elements
        this.currentData = {
            videoMood: null,
            audioMood: null,
            textMood: null,
            notes: '',
            timestamp: null
        };
        
        // Reset radio buttons
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
        
        // Reset text area
        document.getElementById('emotionText').value = '';
        
        // Stop any active media streams
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
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

// Initialize the EmotionInput class when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const emotionInput = new EmotionInput();
});
