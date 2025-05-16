// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.style.display = 'none';
            });
        });
    }
    
    // Initialize Tokenomics Chart
    const tokenChartCanvas = document.getElementById('tokenChart');
    if (tokenChartCanvas) {
        const tokenChart = new Chart(tokenChartCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Investors', 'Insurance Pool', 'Team', 'Liquidity', 'Marketing'],
                datasets: [{
                    data: [40, 25, 15, 10, 10],
                    backgroundColor: [
                        '#3B82F6',
                        '#10B981',
                        '#6366F1',
                        '#F59E0B',
                        '#EC4899'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Animation on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.feature-card, .team-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };
    
    // Set initial state for animated elements
    document.querySelectorAll('.feature-card, .team-card').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Run once on load
    animateOnScroll();
    
    // Run on scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Fetch token data (simulated)
    function fetchTokenData() {
        // In a real implementation, this would fetch from an API
        return {
            price: 1.25,
            change24h: 2.4,
            marketCap: 12500000,
            circulatingSupply: 10000000
        };
    }
    
    // Update token metrics
    function updateTokenMetrics() {
        const tokenData = fetchTokenData();
        
        // You would update DOM elements with this data
        console.log('Token data:', tokenData);
    }
    
    // Update token metrics every 60 seconds
    updateTokenMetrics();
    setInterval(updateTokenMetrics, 60000);
});