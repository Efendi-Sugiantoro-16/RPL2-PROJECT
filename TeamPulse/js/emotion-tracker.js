// emotion-tracker.js (Enhanced with Manual Controls, Logging, and Audio Analysis)

const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const emojis = document.getElementById('emojis');
const chartCtx = document.getElementById('emotionChart').getContext('2d');
const audioChartCtx = document.getElementById('audioFeaturesChart').getContext('2d');
const startBtn = document.getElementById('startDetection');
const stopBtn = document.getElementById('stopDetection');
const reportBtn = document.getElementById('downloadReport');
const statusEl = document.createElement('div');
statusEl.className = 'status-message';
document.querySelector('.chart-controls').appendChild(statusEl);

// Audio analysis elements
const energyMeter = document.getElementById('energyMeter');
const loudnessMeter = document.getElementById('loudnessMeter');
const speechRateMeter = document.getElementById('speechRateMeter');
const voiceEmotionEl = document.getElementById('voiceEmotion');
const voiceConfidenceEl = document.getElementById('voiceConfidence');

const emojiMap = {
  happy: "😃",
  sad: "😢",
  angry: "😡",
  surprised: "😲",
  fearful: "😱",
  disgusted: "🤮",
  neutral: "😐"
};

const emotionColors = {
  happy: '#FFD700',
  sad: '#4169E1',
  angry: '#FF0000',
  surprised: '#FF69B4',
  fearful: '#800080',
  disgusted: '#32CD32',
  neutral: '#808080'
};

let chart, audioChart, audioContext, meydaAnalyzer, micStream, videoInterval, micInterval, emotionLog = [];
let audioFeatureHistory = [];
let lastZeroCrossings = 0;
let speechRateBuffer = [];

// Load emotion logs from localStorage if available
function loadEmotionLogs() {
  const savedLogs = localStorage.getItem('emotionLogs');
  if (savedLogs) {
    emotionLog = JSON.parse(savedLogs);
    console.log(`Loaded ${emotionLog.length} emotion records from storage`);
    return emotionLog;
  }
  return [];
}

// Save emotion logs to localStorage
function saveEmotionLogs() {
  // Keep only the last 1000 records to avoid localStorage limits
  const logsToSave = emotionLog.slice(-1000);
  localStorage.setItem('emotionLogs', JSON.stringify(logsToSave));
  console.log(`Saved ${logsToSave.length} emotion records to storage`);
}

function updateChart(emotions) {
  const labels = Object.keys(emojiMap);
  const data = labels.map(label => emotions[label] || 0);
  const colors = labels.map(label => emotionColors[label]);

  if (!chart) {
    chart = new Chart(chartCtx, {
      type: 'bar',
      data: {
        labels: labels.map(label => `${emojiMap[label]} ${label}`),
        datasets: [{
          label: 'Confidence',
          backgroundColor: colors,
          data
        }]
      },
      options: {
        responsive: true,
        animation: {
          duration: 500
        },
        scales: {
          y: { 
            beginAtZero: true, 
            max: 1,
            title: {
              display: true,
              text: 'Confidence Level'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Confidence: ${Math.round(context.raw * 100)}%`
            }
          }
        }
      }
    });
  } else {
    chart.data.datasets[0].data = data;
    chart.update('none');
  }
}

function updateEmojis(emotions) {
  const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3);
  emojis.innerHTML = top3.map(([emo, conf]) => 
    `<div class="emotion-item" style="color: ${emotionColors[emo]}">
      <span class="emoji">${emojiMap[emo]}</span>
      <span class="confidence">${Math.round(conf * 100)}%</span>
    </div>`
  ).join('');
}

function logEmotion(emotions, source = 'visual') {
  const timestamp = new Date().toISOString();
  const sessionId = window.currentSessionId || `session_${Date.now()}`;
  emotionLog.push({ timestamp, source, sessionId, ...emotions });
  
  // Save to localStorage every 10 entries to avoid data loss
  if (emotionLog.length % 10 === 0) {
    saveEmotionLogs();
  }
}

// Initialize audio features chart
function initAudioChart() {
  if (audioChart) {
    audioChart.destroy();
  }
  
  audioChart = new Chart(audioChartCtx, {
    type: 'line',
    data: {
      labels: Array(30).fill(''),
      datasets: [
        {
          label: 'Energy',
          borderColor: '#FF9500',
          backgroundColor: 'rgba(255, 149, 0, 0.1)',
          data: Array(30).fill(0),
          tension: 0.4
        },
        {
          label: 'Loudness',
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          data: Array(30).fill(0),
          tension: 0.4
        },
        {
          label: 'ZCR',
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          data: Array(30).fill(0),
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      animation: {
        duration: 300
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 1
        },
        x: {
          display: false
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  });
}

// Update audio feature meters
function updateAudioMeters(features) {
  // Normalize values to 0-100% for meters
  const energyValue = Math.min(100, features.energy * 100);
  const loudnessValue = Math.min(100, features.loudness.total * 10);
  const speechRateValue = Math.min(100, features.zcr / 500 * 100);
  
  // Update meters
  energyMeter.style.width = `${energyValue}%`;
  loudnessMeter.style.width = `${loudnessValue}%`;
  speechRateMeter.style.width = `${speechRateValue}%`;
  
  // Update chart data
  audioFeatureHistory.push({
    energy: features.energy,
    loudness: features.loudness.total / 10,
    zcr: features.zcr / 500
  });
  
  // Keep only the last 30 data points
  if (audioFeatureHistory.length > 30) {
    audioFeatureHistory.shift();
  }
  
  // Update chart
  if (audioChart) {
    audioChart.data.datasets[0].data = audioFeatureHistory.map(f => f.energy);
    audioChart.data.datasets[1].data = audioFeatureHistory.map(f => f.loudness);
    audioChart.data.datasets[2].data = audioFeatureHistory.map(f => f.zcr);
    audioChart.update('none');
  }
}

// Analyze audio features to determine emotion
function analyzeAudioEmotion(features) {
  // Track speech rate using zero-crossing rate changes
  const currentZCR = features.zcr;
  const zcrDiff = Math.abs(currentZCR - lastZeroCrossings);
  lastZeroCrossings = currentZCR;
  
  speechRateBuffer.push(zcrDiff);
  if (speechRateBuffer.length > 20) {
    speechRateBuffer.shift();
  }
  
  // Calculate average speech rate
  const avgSpeechRate = speechRateBuffer.reduce((a, b) => a + b, 0) / speechRateBuffer.length;
  
  // Simple rule-based emotion classification from audio features
  let emotions = {
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    fearful: 0,
    disgusted: 0,
    neutral: 0.2 // baseline
  };
  
  // Energy (high energy often correlates with happy, angry, surprised)
  const energy = features.energy;
  if (energy > 0.6) {
    emotions.happy += 0.3;
    emotions.angry += 0.2;
    emotions.surprised += 0.2;
  } else if (energy < 0.2) {
    emotions.sad += 0.3;
    emotions.fearful += 0.1;
    emotions.neutral += 0.2;
  }
  
  // Loudness (high loudness often indicates angry, surprised)
  const loudness = features.loudness.total / 10; // normalize
  if (loudness > 0.7) {
    emotions.angry += 0.4;
    emotions.surprised += 0.3;
  } else if (loudness < 0.3) {
    emotions.sad += 0.2;
    emotions.fearful += 0.2;
    emotions.neutral += 0.1;
  }
  
  // Speech rate (fast speech often indicates excited, happy, surprised)
  if (avgSpeechRate > 100) {
    emotions.happy += 0.3;
    emotions.surprised += 0.3;
  } else if (avgSpeechRate < 50) {
    emotions.sad += 0.3;
    emotions.neutral += 0.2;
  }
  
  // Spectral features (can indicate emotional tone)
  const spectralFlatness = features.spectralFlatness;
  if (spectralFlatness > 0.5) {
    emotions.neutral += 0.3;
  } else {
    emotions.happy += 0.1;
    emotions.sad += 0.1;
  }
  
  // Normalize emotions to sum to 1
  const total = Object.values(emotions).reduce((a, b) => a + b, 0);
  for (const emotion in emotions) {
    emotions[emotion] = emotions[emotion] / total;
  }
  
  // Update UI with the dominant emotion
  const dominantEmotion = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];
  voiceEmotionEl.textContent = dominantEmotion[0].charAt(0).toUpperCase() + dominantEmotion[0].slice(1);
  voiceConfidenceEl.textContent = `${Math.round(dominantEmotion[1] * 100)}%`;
  
  // Log the audio emotion data
  logEmotion(emotions, 'audio');
  
  return emotions;
}

async function loadModels() {
  const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ]);
    return true;
  } catch (error) {
    console.error('Error loading models:', error);
    return false;
  }
}

async function startDetection() {
  try {
    // Initialize a unique session ID for this detection session
    window.currentSessionId = `session_${Date.now()}`;
    
    // Load any existing emotion logs from localStorage
    loadEmotionLogs();
    
    statusEl.textContent = 'Loading face detection models...';
    startBtn.disabled = true;
    stopBtn.disabled = true;
    reportBtn.disabled = true;

    // Load models if not already loaded
    if (!window.modelsLoaded) {
      const success = await loadModels();
      if (!success) {
        throw new Error('Failed to load face detection models');
      }
      window.modelsLoaded = true;
    }
    
    statusEl.textContent = 'Accessing camera...';

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    video.srcObject = stream;
    micStream = stream;
    
    statusEl.textContent = 'Detection active';

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioSource = audioContext.createMediaStreamSource(stream);
  
  // Initialize audio chart
  initAudioChart();
  
  // Setup Meyda analyzer
  meydaAnalyzer = Meyda.createMeydaAnalyzer({
    audioContext: audioContext,
    source: audioSource,
    bufferSize: 512,
    featureExtractors: [
      'energy',
      'loudness',
      'zcr',
      'mfcc',
      'spectralFlatness',
      'spectralCentroid',
      'spectralRolloff'
    ],
    callback: features => {
      // Update audio visualization
      updateAudioMeters(features);
      
      // Analyze audio for emotion
      const audioEmotions = analyzeAudioEmotion(features);
      
      // Combine with visual emotions (weighted average)
      // This will be handled by the face detection interval
    }
  });
  
  // Start the analyzer
  meydaAnalyzer.start();

  const displaySize = { width: video.width, height: video.height };
  canvas.width = video.width;
  canvas.height = video.height;
  const ctx = canvas.getContext('2d');

  faceapi.matchDimensions(canvas, displaySize);

  videoInterval = setInterval(async () => {
    try {
      const detections = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceExpressions();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detections) {
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Draw face detection box
        const box = resizedDetections.detection.box;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Get visual emotions
        const visualEmotions = resizedDetections.expressions;
        
        // Get the latest audio emotions (if available)
        let combinedEmotions = {...visualEmotions};
        
        // If we have audio emotion data, combine them (70% visual, 30% audio)
        if (audioFeatureHistory.length > 0) {
          // Get the latest audio emotion entry
          const audioEntries = emotionLog.filter(entry => entry.source === 'audio');
          if (audioEntries.length > 0) {
            const latestAudioEmotion = audioEntries[audioEntries.length - 1];
            
            // Remove the source and timestamp properties
            const { source, timestamp, ...audioEmotions } = latestAudioEmotion;
            
            // Combine visual and audio emotions with weights
            for (const emotion in combinedEmotions) {
              if (audioEmotions[emotion] !== undefined) {
                combinedEmotions[emotion] = visualEmotions[emotion] * 0.7 + audioEmotions[emotion] * 0.3;
              }
            }
          }
        }
        
        // Update visualizations with combined emotions
        updateChart(combinedEmotions);
        updateEmojis(combinedEmotions);
        logEmotion(combinedEmotions, 'combined');
      }
    } catch (error) {
      console.error('Error in face detection:', error);
    }
  }, 100);

  startBtn.disabled = true;
  stopBtn.disabled = false;
  reportBtn.disabled = true;
  } catch (error) {
    console.error('Error starting detection:', error);
    statusEl.textContent = 'Error: ' + error.message;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    reportBtn.disabled = false;
  }
}

function stopDetection() {
  if (videoInterval) {
    clearInterval(videoInterval);
    videoInterval = null;
  }

  if (micInterval) {
    clearInterval(micInterval);
    micInterval = null;
  }

  if (meydaAnalyzer) {
    meydaAnalyzer.stop();
    meydaAnalyzer = null;
  }

  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }

  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Reset audio meters
  energyMeter.style.width = '0%';
  loudnessMeter.style.width = '0%';
  speechRateMeter.style.width = '0%';
  voiceEmotionEl.textContent = '-';
  voiceConfidenceEl.textContent = '-';

  // Save emotion logs to localStorage
  saveEmotionLogs();

  startBtn.disabled = false;
  stopBtn.disabled = true;
  reportBtn.disabled = emotionLog.length > 0 ? false : true;
  statusEl.textContent = 'Detection stopped';
  
  // Show a notification that data has been saved
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = `Session data saved! ${emotionLog.length} records stored.`;
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => document.body.removeChild(notification), 500);
  }, 3000);
}

function downloadCSV(data, filename) {
  // Create header row with all possible emotion types and metadata
  const headers = ['timestamp', 'source', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
  
  // Convert data to CSV format with consistent columns
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const rowData = headers.map(header => {
      const value = row[header];
      if (value === undefined) return '';
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvContent += rowData.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadReport() {
  if (emotionLog.length === 0) {
    alert('Tidak ada data untuk diunduh.');
    return;
  }
  downloadCSV(emotionLog, 'emotion_report.csv');
}

window.addEventListener('DOMContentLoaded', () => {
  startBtn.addEventListener('click', startDetection);
  stopBtn.addEventListener('click', stopDetection);
  reportBtn.addEventListener('click', downloadReport);
  stopBtn.disabled = true;

  // Error handling for video stream
  video.addEventListener('error', (error) => {
    console.error('Video stream error:', error);
    statusEl.textContent = 'Error accessing camera. Please check permissions.';
    stopDetection();
  });

  // Add loading text
  statusEl.textContent = 'Click Start Detection to begin';
});
