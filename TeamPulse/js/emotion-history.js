// emotion-history.js - Handles visualization and management of emotion tracking history

document.addEventListener('DOMContentLoaded', () => {
  loadEmotionHistory();
  setupEventListeners();
});

// Global variables
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

// Load emotion logs from localStorage
function loadEmotionLogs() {
  const savedLogs = localStorage.getItem('emotionLogs');
  if (savedLogs) {
    return JSON.parse(savedLogs);
  }
  return [];
}

// Setup event listeners for filters and buttons
function setupEventListeners() {
  // Session filter
  document.getElementById('session-filter').addEventListener('change', loadEmotionHistory);
  
  // Emotion filter
  document.getElementById('emotion-filter').addEventListener('change', loadEmotionHistory);
  
  // Source filter
  document.getElementById('source-filter').addEventListener('change', loadEmotionHistory);
  
  // Clear data button
  document.getElementById('clear-data').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all emotion tracking data? This cannot be undone.')) {
      localStorage.removeItem('emotionLogs');
      showNotification('All emotion tracking data has been cleared');
      loadEmotionHistory();
    }
  });
  
  // Export all data button
  document.getElementById('export-all').addEventListener('click', exportAllData);
}

// Load and display emotion history based on filters
function loadEmotionHistory() {
  const sessionFilter = document.getElementById('session-filter').value;
  const emotionFilter = document.getElementById('emotion-filter').value;
  const sourceFilter = document.getElementById('source-filter').value;
  
  const emotionLogs = loadEmotionLogs();
  const sessionsContainer = document.getElementById('sessions-container');
  
  // Clear container
  sessionsContainer.innerHTML = '';
  
  if (emotionLogs.length === 0) {
    sessionsContainer.innerHTML = `
      <div class="no-data-message">
        <h3>No emotion tracking data available</h3>
        <p>Use the Emotion Tracker to record and analyze your emotions</p>
      </div>
    `;
    return;
  }
  
  // Group logs by session
  const sessionGroups = {};
  emotionLogs.forEach(log => {
    const sessionId = log.sessionId || 'unknown';
    if (!sessionGroups[sessionId]) {
      sessionGroups[sessionId] = [];
    }
    sessionGroups[sessionId].push(log);
  });
  
  // Update session filter options if needed
  updateSessionFilterOptions(Object.keys(sessionGroups));
  
  // Filter sessions based on selected filters
  let filteredSessions = Object.entries(sessionGroups);
  
  // Apply session filter
  if (sessionFilter !== 'all') {
    filteredSessions = filteredSessions.filter(([id]) => id === sessionFilter);
  }
  
  // Sort sessions by date (most recent first)
  filteredSessions.sort(([, logsA], [, logsB]) => {
    const dateA = new Date(logsA[0].timestamp);
    const dateB = new Date(logsB[0].timestamp);
    return dateB - dateA;
  });
  
  // Render each session
  filteredSessions.forEach(([sessionId, logs]) => {
    // Apply source filter
    let filteredLogs = logs;
    if (sourceFilter !== 'all') {
      filteredLogs = logs.filter(log => log.source === sourceFilter);
      if (filteredLogs.length === 0) return; // Skip if no logs match the source filter
    }
    
    // Apply emotion filter (only if a specific emotion is selected)
    if (emotionFilter !== 'all') {
      // Check if the dominant emotion matches the filter
      filteredLogs = filteredLogs.filter(log => {
        const emotions = Object.entries(log)
          .filter(([key, value]) => 
            Object.keys(emojiMap).includes(key) && typeof value === 'number'
          )
          .sort(([, a], [, b]) => b - a);
        
        return emotions.length > 0 && emotions[0][0] === emotionFilter;
      });
      
      if (filteredLogs.length === 0) return; // Skip if no logs match the emotion filter
    }
    
    // Create session container
    const sessionContainer = document.createElement('div');
    sessionContainer.className = 'session-container';
    
    // Format date for display
    const sessionDate = new Date(logs[0].timestamp);
    const formattedDate = sessionDate.toLocaleString();
    
    // Create session header
    sessionContainer.innerHTML = `
      <div class="session-header">
        <div>
          <h3>Session: ${formatSessionId(sessionId)}</h3>
          <p>Date: ${formattedDate}</p>
          <p>Records: ${logs.length}</p>
        </div>
        <div class="session-actions">
          <button onclick="exportSession('${sessionId}')"><i class="fas fa-download"></i></button>
          <button onclick="deleteSession('${sessionId}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="session-charts">
        <div class="chart-wrapper">
          <h4>Emotion Distribution</h4>
          <canvas id="emotion-chart-${sessionId}"></canvas>
        </div>
        <div class="chart-wrapper">
          <h4>Emotion Timeline</h4>
          <canvas id="timeline-chart-${sessionId}"></canvas>
        </div>
      </div>
      <div class="emotion-summary" id="emotion-summary-${sessionId}"></div>
    `;
    
    sessionsContainer.appendChild(sessionContainer);
    
    // Create charts after adding to DOM
    createEmotionDistributionChart(sessionId, filteredLogs);
    createEmotionTimelineChart(sessionId, filteredLogs);
    createEmotionSummary(sessionId, filteredLogs);
  });
  
  // Show message if no sessions match filters
  if (sessionsContainer.children.length === 0) {
    sessionsContainer.innerHTML = `
      <div class="no-data-message">
        <h3>No data matches the selected filters</h3>
        <p>Try changing your filter selections</p>
      </div>
    `;
  }
}

// Update session filter options
function updateSessionFilterOptions(sessionIds) {
  const sessionFilter = document.getElementById('session-filter');
  const currentValue = sessionFilter.value;
  
  // Save the current selection
  const selectedOption = sessionFilter.value;
  
  // Clear options except 'All Sessions'
  while (sessionFilter.options.length > 1) {
    sessionFilter.remove(1);
  }
  
  // Add session options
  sessionIds.forEach(sessionId => {
    const option = document.createElement('option');
    option.value = sessionId;
    option.textContent = formatSessionId(sessionId);
    sessionFilter.appendChild(option);
  });
  
  // Restore selection if it still exists
  if (sessionIds.includes(selectedOption)) {
    sessionFilter.value = selectedOption;
  }
}

// Format session ID for display
function formatSessionId(sessionId) {
  if (sessionId.startsWith('session_')) {
    const timestamp = parseInt(sessionId.replace('session_', ''));
    const date = new Date(timestamp);
    return `Session ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }
  return sessionId;
}

// Create emotion distribution chart
function createEmotionDistributionChart(sessionId, logs) {
  // Aggregate emotions across all logs
  const emotionTotals = {};
  const emotionCounts = {};
  
  logs.forEach(log => {
    Object.entries(log).forEach(([key, value]) => {
      if (Object.keys(emojiMap).includes(key) && typeof value === 'number') {
        emotionTotals[key] = (emotionTotals[key] || 0) + value;
        emotionCounts[key] = (emotionCounts[key] || 0) + 1;
      }
    });
  });
  
  // Calculate averages
  const emotions = Object.keys(emojiMap);
  const averages = emotions.map(emotion => {
    return emotionCounts[emotion] ? emotionTotals[emotion] / emotionCounts[emotion] : 0;
  });
  
  // Create chart
  const ctx = document.getElementById(`emotion-chart-${sessionId}`).getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: emotions.map(emotion => `${emojiMap[emotion]} ${emotion}`),
      datasets: [{
        label: 'Average Confidence',
        data: averages,
        backgroundColor: emotions.map(emotion => emotionColors[emotion]),
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 1
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// Create emotion timeline chart
function createEmotionTimelineChart(sessionId, logs) {
  // Sort logs by timestamp
  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Prepare data for timeline chart
  const timestamps = sortedLogs.map(log => {
    const date = new Date(log.timestamp);
    return date.toLocaleTimeString();
  });
  
  // Create datasets for each emotion
  const datasets = Object.keys(emojiMap).map(emotion => {
    return {
      label: `${emojiMap[emotion]} ${emotion}`,
      data: sortedLogs.map(log => log[emotion] || 0),
      borderColor: emotionColors[emotion],
      backgroundColor: `${emotionColors[emotion]}33`, // Add transparency
      tension: 0.4,
      fill: false
    };
  });
  
  // Create chart
  const ctx = document.getElementById(`timeline-chart-${sessionId}`).getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: datasets
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 1
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// Create emotion summary
function createEmotionSummary(sessionId, logs) {
  const summaryContainer = document.getElementById(`emotion-summary-${sessionId}`);
  
  // Calculate dominant emotions
  const emotionTotals = {};
  const emotionCounts = {};
  
  logs.forEach(log => {
    Object.entries(log).forEach(([key, value]) => {
      if (Object.keys(emojiMap).includes(key) && typeof value === 'number') {
        emotionTotals[key] = (emotionTotals[key] || 0) + value;
        emotionCounts[key] = (emotionCounts[key] || 0) + 1;
      }
    });
  });
  
  // Calculate averages and sort
  const emotionAverages = Object.keys(emotionTotals).map(emotion => {
    return {
      emotion,
      average: emotionTotals[emotion] / emotionCounts[emotion]
    };
  }).sort((a, b) => b.average - a.average);
  
  // Display top 3 emotions
  const top3 = emotionAverages.slice(0, 3);
  
  summaryContainer.innerHTML = '<h4>Dominant Emotions:</h4>';
  
  top3.forEach(item => {
    const percentage = Math.round(item.average * 100);
    const badge = document.createElement('div');
    badge.className = 'emotion-badge';
    badge.style.borderLeft = `4px solid ${emotionColors[item.emotion]}`;
    badge.innerHTML = `
      <span>${emojiMap[item.emotion]}</span>
      <span>${item.emotion}</span>
      <strong>${percentage}%</strong>
    `;
    summaryContainer.appendChild(badge);
  });
}

// Export data for a specific session
function exportSession(sessionId) {
  const emotionLogs = loadEmotionLogs();
  const sessionLogs = emotionLogs.filter(log => log.sessionId === sessionId);
  
  if (sessionLogs.length === 0) {
    showNotification('No data found for this session', 'error');
    return;
  }
  
  // Format filename with date
  const sessionDate = new Date(sessionLogs[0].timestamp);
  const formattedDate = sessionDate.toISOString().split('T')[0];
  const filename = `emotion_session_${formattedDate}.csv`;
  
  downloadCSV(sessionLogs, filename);
}

// Export all data
function exportAllData() {
  const emotionLogs = loadEmotionLogs();
  
  if (emotionLogs.length === 0) {
    showNotification('No emotion tracking data available', 'error');
    return;
  }
  
  const filename = `all_emotion_data_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(emotionLogs, filename);
}

// Download data as CSV
function downloadCSV(data, filename) {
  // Create header row with all possible emotion types and metadata
  const headers = ['timestamp', 'source', 'sessionId', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
  
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
  
  showNotification(`Data exported as ${filename}`);
}

// Delete a specific session
function deleteSession(sessionId) {
  if (confirm('Are you sure you want to delete this session? This cannot be undone.')) {
    const emotionLogs = loadEmotionLogs();
    const filteredLogs = emotionLogs.filter(log => log.sessionId !== sessionId);
    
    localStorage.setItem('emotionLogs', JSON.stringify(filteredLogs));
    showNotification('Session deleted successfully');
    loadEmotionHistory();
  }
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => document.body.removeChild(notification), 500);
  }, 3000);
}

// Make functions available globally for onclick handlers
window.exportSession = exportSession;
window.deleteSession = deleteSession;
