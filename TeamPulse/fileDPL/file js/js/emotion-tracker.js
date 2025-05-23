// Initialize webcam and microphone
const video = document.getElementById('video');
const startMicButton = document.getElementById('start-mic');

// Load face-api.js models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

// Start video streaming
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error('Error accessing webcam:', err));
}

// Handle microphone
startMicButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            // Further processing for mood detection
        })
        .catch(err => console.error('Error accessing microphone:', err));
});

// Emotion detection and analytics
video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        // Update analytics chart and emojis
        updateAnalytics(resizedDetections);
    }, 100);
});

function updateAnalytics(detections) {
    const emotions = detections.map(detection => detection.expressions);
    // Logic to update chart and emojis based on detections
    console.log(emotions);
    // Example: Update chart.js or DOM elements
}
