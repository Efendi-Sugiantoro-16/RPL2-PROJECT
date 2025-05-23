class Settings {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadSettings();
    }

    initializeElements() {
        // Account settings
        this.profilePicture = document.getElementById('profilePicture');
        this.username = document.getElementById('username');
        this.email = document.getElementById('email');
        this.currentPassword = document.getElementById('currentPassword');
        this.newPassword = document.getElementById('newPassword');
        this.deleteAccountBtn = document.getElementById('deleteAccount');

        // Notification settings
        this.conflictAlerts = document.getElementById('conflictAlerts');
        this.stressAlerts = document.getElementById('stressAlerts');
        this.moodUpdates = document.getElementById('moodUpdates');
        this.notificationFrequency = document.getElementById('notificationFrequency');

        // Privacy settings
        this.shareData = document.getElementById('shareData');
        this.anonymousMode = document.getElementById('anonymousMode');
        this.dataCollection = document.getElementById('dataCollection');
        this.dataRetention = document.getElementById('dataRetention');

        // Theme settings
        this.darkMode = document.getElementById('darkMode');
        this.accentColor = document.getElementById('accentColor');

        // Save button
        this.saveButton = document.getElementById('saveSettings');
    }

    setupEventListeners() {
        // Profile picture change
        document.getElementById('changeProfilePicture').addEventListener('click', () => this.changeProfilePicture());

        // Dark mode toggle
        this.darkMode.addEventListener('change', () => this.toggleDarkMode());

        // Accent color change
        this.accentColor.addEventListener('change', () => this.updateAccentColor());

        // Save settings
        this.saveButton.addEventListener('click', () => this.saveSettings());

        // Delete account
        this.deleteAccountBtn.addEventListener('click', () => this.confirmDeleteAccount());
    }

    async loadSettings() {
        try {
            // In a real application, you would fetch these from your backend
            const settings = await this.fetchUserSettings();
            this.applySettings(settings);
        } catch (error) {
            console.error('Error loading settings:', error);
            alert('Error loading settings. Please try again later.');
        }
    }

    async fetchUserSettings() {
        // This would typically be an API call to your backend
        // For now, we'll return mock data
        return {
            account: {
                username: 'JohnDoe',
                email: 'john@example.com',
                profilePicture: 'images/default-avatar.png'
            },
            notifications: {
                conflictAlerts: true,
                stressAlerts: true,
                moodUpdates: true,
                frequency: 'realtime'
            },
            privacy: {
                shareData: true,
                anonymousMode: false,
                dataCollection: true,
                retention: '90'
            },
            theme: {
                darkMode: false,
                accentColor: 'blue'
            }
        };
    }

    applySettings(settings) {
        // Account settings
        this.username.value = settings.account.username;
        this.email.value = settings.account.email;
        this.profilePicture.src = settings.account.profilePicture;

        // Notification settings
        this.conflictAlerts.checked = settings.notifications.conflictAlerts;
        this.stressAlerts.checked = settings.notifications.stressAlerts;
        this.moodUpdates.checked = settings.notifications.moodUpdates;
        this.notificationFrequency.value = settings.notifications.frequency;

        // Privacy settings
        this.shareData.checked = settings.privacy.shareData;
        this.anonymousMode.checked = settings.privacy.anonymousMode;
        this.dataCollection.checked = settings.privacy.dataCollection;
        this.dataRetention.value = settings.privacy.retention;

        // Theme settings
        this.darkMode.checked = settings.theme.darkMode;
        this.accentColor.value = settings.theme.accentColor;

        // Apply theme settings
        this.toggleDarkMode();
        this.updateAccentColor();
    }

    changeProfilePicture() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.profilePicture.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode', this.darkMode.checked);
    }

    updateAccentColor() {
        document.documentElement.style.setProperty('--accent-color', this.accentColor.value);
    }

    async saveSettings() {
        const settings = {
            account: {
                username: this.username.value,
                email: this.email.value,
                password: this.newPassword.value || undefined
            },
            notifications: {
                conflictAlerts: this.conflictAlerts.checked,
                stressAlerts: this.stressAlerts.checked,
                moodUpdates: this.moodUpdates.checked,
                frequency: this.notificationFrequency.value
            },
            privacy: {
                shareData: this.shareData.checked,
                anonymousMode: this.anonymousMode.checked,
                dataCollection: this.dataCollection.checked,
                retention: this.dataRetention.value
            },
            theme: {
                darkMode: this.darkMode.checked,
                accentColor: this.accentColor.value
            }
        };

        try {
            // In a real application, you would send these to your backend
            await this.updateUserSettings(settings);
            alert('Settings saved successfully!');
            this.currentPassword.value = '';
            this.newPassword.value = '';
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings. Please try again.');
        }
    }

    async updateUserSettings(settings) {
        // This would typically be an API call to your backend
        console.log('Updating settings:', settings);
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    confirmDeleteAccount() {
        const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
        if (confirmed) {
            this.deleteAccount();
        }
    }

    async deleteAccount() {
        try {
            // This would typically be an API call to your backend
            await new Promise(resolve => setTimeout(resolve, 500));
            alert('Account deleted successfully.');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Error deleting account. Please try again.');
        }
    }
}

// Initialize the Settings class when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const settings = new Settings();
});
