// Navigation active state
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Auth buttons functionality
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    const ctaBtn = document.querySelector('.cta-btn');

    loginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });

    signupBtn.addEventListener('click', () => {
        window.location.href = 'signup.html';
    });

    ctaBtn.addEventListener('click', () => {
        window.location.href = 'signup.html';
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const section = document.querySelector(this.getAttribute('href'));
            if (section) {
                section.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
