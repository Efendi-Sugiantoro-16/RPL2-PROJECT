class DataService {
    static STORAGE_KEY = 'teamPulseData';

    static saveEmotionData(data) {
        try {
            const allData = this.getAllData();
            const entry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...data,
                mood: this.calculateAverageMood(data)
            };
            
            allData.entries.push(entry);
            this.updateTeamStats(allData);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
            return entry;
        } catch (error) {
            console.error('Error saving emotion data:', error);
            throw error;
        }
    }

    static getAllData() {
        const defaultData = {
            entries: [],
            stats: {
                totalEntries: 0,
                avgMood: 0,
                moodDistribution: {
                    happy: 0,
                    neutral: 0,
                    sad: 0
                },
                lastUpdated: null
            }
        };

        try {
            const savedData = localStorage.getItem(this.STORAGE_KEY);
            return savedData ? JSON.parse(savedData) : defaultData;
        } catch (error) {
            console.error('Error loading data:', error);
            return defaultData;
        }
    }

    static getEntries(filter = {}) {
        const { entries } = this.getAllData();
        if (!Object.keys(filter).length) return entries;
        
        return entries.filter(entry => {
            return Object.entries(filter).every(([key, value]) => {
                if (key === 'date') {
                    return new Date(entry.timestamp).toDateString() === new Date(value).toDateString();
                }
                return entry[key] === value;
            });
        });
    }

    static getTeamStats() {
        const { stats } = this.getAllData();
        return stats;
    }

    static calculateAverageMood(data) {
        const moods = [];
        if (data.videoMood) moods.push(parseInt(data.videoMood));
        if (data.audioMood) moods.push(parseInt(data.audioMood));
        if (data.textMood) moods.push(parseInt(data.textMood));
        
        if (moods.length === 0) return null;
        return Math.round(moods.reduce((a, b) => a + b, 0) / moods.length);
    }

    static updateTeamStats(allData) {
        const entries = allData.entries;
        const totalEntries = entries.length;
        
        if (totalEntries === 0) {
            allData.stats = {
                totalEntries: 0,
                avgMood: 0,
                moodDistribution: {
                    happy: 0,
                    neutral: 0,
                    sad: 0
                },
                lastUpdated: null
            };
            return;
        }

        const moods = entries.map(entry => entry.mood).filter(Boolean);
        const avgMood = moods.length > 0 
            ? Math.round(moods.reduce((a, b) => a + b, 0) / moods.length) 
            : 0;

        const moodDistribution = {
            happy: 0,
            neutral: 0,
            sad: 0
        };

        moods.forEach(mood => {
            if (mood >= 4) moodDistribution.happy++;
            else if (mood >= 2.5) moodDistribution.neutral++;
            else moodDistribution.sad++;
        });

        allData.stats = {
            totalEntries,
            avgMood,
            moodDistribution: {
                happy: Math.round((moodDistribution.happy / totalEntries) * 100) || 0,
                neutral: Math.round((moodDistribution.neutral / totalEntries) * 100) || 0,
                sad: Math.round((moodDistribution.sad / totalEntries) * 100) || 0
            },
            lastUpdated: new Date().toISOString()
        };
    }
}

// Make it globally available
window.DataService = DataService;
