class EmotionInput {
    constructor() {
        this.videoStream = null;
        this.audioStream = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.emotionAnalyzer = new EmotionAnalyzer();
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

    async toggleVideo() {
        if (!this.videoStream) {
            try {
                this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                this.videoFeed.srcObject = this.videoStream;
                this.startVideoBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Camera';
                this.captureVideoBtn.disabled = false;
            } catch (error) {
                console.error('Error accessing camera:', error);
                alert('Unable to access camera. Please check permissions.');
            }
        } else {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoFeed.srcObject = null;
            this.videoStream = null;
            this.startVideoBtn.innerHTML = '<i class="fas fa-play"></i> Start Camera';
            this.captureVideoBtn.disabled = true;
        }
    }

    async captureVideo() {
        const canvas = document.createElement('canvas');
        canvas.width = this.videoFeed.videoWidth;
        canvas.height = this.videoFeed.videoHeight;
        canvas.getContext('2d').drawImage(this.videoFeed, 0, 0);
        
        try {
            const emotions = await this.emotionAnalyzer.analyzeVideo(canvas);
            console.log('Video emotions:', emotions);
        } catch (error) {
            console.error('Error analyzing video:', error);
            alert('Error analyzing video emotions.');
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
            alert('Unable to access microphone. Please check permissions.');
        }
    }

    stopAudioRecording() {
        this.mediaRecorder.stop();
        this.audioStream.getTracks().forEach(track => track.stop());
        this.startAudioBtn.disabled = false;
        this.stopAudioBtn.disabled = true;

        this.mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            try {
                const emotions = await this.emotionAnalyzer.analyzeAudio(audioBlob);
                console.log('Audio emotions:', emotions);
            } catch (error) {
                console.error('Error analyzing audio:', error);
                alert('Error analyzing audio emotions.');
            }
        };
    }

    visualizeAudio() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(this.audioStream);
        source.connect(analyser);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const canvas = document.createElement('canvas');
        canvas.width = this.audioVisualizer.clientWidth;
        canvas.height = this.audioVisualizer.clientHeight;
        this.audioVisualizer.innerHTML = '';
        this.audioVisualizer.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;

            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#f5f6fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                ctx.fillStyle = `rgb(52, 152, 219)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };

        draw();
    }

    async submitEmotions() {
        const videoMood = document.querySelector('input[name="videoMood"]:checked')?.value;
        const audioMood = document.querySelector('input[name="audioMood"]:checked')?.value;
        const textMood = document.querySelector('input[name="textMood"]:checked')?.value;
        const textInput = this.emotionText.value;

        if (!videoMood && !audioMood && !textMood) {
            alert('Please rate at least one emotion input method.');
            return;
        }

        const emotionData = {
            video: videoMood,
            audio: audioMood,
            text: {
                mood: textMood,
                content: textInput
            },
            timestamp: new Date().toISOString()
        };

        try {
            // Here you would typically send the data to your backend
            console.log('Submitting emotion data:', emotionData);
            alert('Emotions submitted successfully!');
            this.resetForm();
        } catch (error) {
            console.error('Error submitting emotions:', error);
            alert('Error submitting emotions. Please try again.');
        }
    }

    resetForm() {
        // Reset radio buttons
        document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
        
        // Reset text input
        this.emotionText.value = '';

        // Stop video if running
        if (this.videoStream) {
            this.toggleVideo();
        }

        // Stop audio if running
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.stopAudioRecording();
        }
    }
}

// Initialize the EmotionInput class when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const emotionInput = new EmotionInput();
});
