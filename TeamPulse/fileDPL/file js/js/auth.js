class AuthManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.signupForm) {
            this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
            this.setupPasswordValidation();
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        this.simulateLogin(username, password);
    }

    handleSignup(e) {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.querySelector('input[name="terms"]').checked;

        if (!fullName || !email || !username || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        if (!this.validatePassword(password)) {
            this.showError('Password does not meet requirements');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (!terms) {
            this.showError('Please accept the Terms of Service');
            return;
        }

        this.simulateSignup({
            fullName,
            email,
            username,
            password
        });
    }

    setupPasswordValidation() {
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.validatePassword(passwordInput.value);
            });
        }
    }

    validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };

        // Update UI for each requirement
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(req);
            if (element) {
                if (requirements[req]) {
                    element.classList.add('valid');
                    element.classList.remove('invalid');
                } else {
                    element.classList.add('invalid');
                    element.classList.remove('valid');
                }
            }
        });

        return Object.values(requirements).every(Boolean);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    simulateLogin(username, password) {
        const submitButton = document.querySelector('.auth-btn');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Logging in...';
        submitButton.disabled = true;
        
        setTimeout(() => {
            if (username && password) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('username', username);
                window.location.href = 'dashboard.html';
            } else {
                this.showError('Invalid credentials');
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        }, 1500);
    }

    simulateSignup(userData) {
        const submitButton = document.querySelector('.auth-btn');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;

        setTimeout(() => {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', userData.username);
            localStorage.setItem('userEmail', userData.email);
            localStorage.setItem('fullName', userData.fullName);
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    showError(message) {
        const existingError = document.querySelector('.error-alert');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-alert';
        errorDiv.style.cssText = `
            color: #e74c3c;
            background-color: #ffd7d7;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            text-align: center;
        `;
        errorDiv.textContent = message;
        
        const form = document.querySelector('.auth-form');
        form.insertBefore(errorDiv, form.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

function showError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-alert');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-alert';
    errorDiv.style.cssText = `
        color: #e74c3c;
        background-color: #ffd7d7;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
        text-align: center;
    `;
    errorDiv.textContent = message;
    
    const form = document.getElementById('loginForm');
    form.insertBefore(errorDiv, form.firstChild);
    
    // Remove error message after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

function simulateLogin(username, password) {
    // Show loading state
    const submitButton = document.querySelector('.auth-btn');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // For demo purposes, we'll redirect to dashboard
        // In a real application, you would verify credentials with your backend
        if (username && password) {
            // Store user session
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            showError('Invalid credentials');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }, 1500);
}
