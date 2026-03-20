// Hero Page - Modern Interactions

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	anchor.addEventListener('click', function (e) {
		e.preventDefault();
		const target = document.querySelector(this.getAttribute('href'));
		if (target) {
			target.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		}
	});
});

// Add scroll animations for feature cards
const observerOptions = {
	threshold: 0.1,
	rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			entry.target.style.opacity = '1';
			entry.target.style.transform = 'translateY(0)';
		}
	});
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
	card.style.opacity = '0';
	card.style.transform = 'translateY(20px)';
	card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
	observer.observe(card);
});

// Smooth fade-in on page load
window.addEventListener('load', () => {
	document.querySelector('.hero-section').style.animation = 'fadeIn 0.8s ease-in';
});

// Add active state to nav links on scroll
const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
window.addEventListener('scroll', () => {
	let current = '';
	const sections = document.querySelectorAll('section[id]');
	
	sections.forEach(section => {
		const sectionTop = section.offsetTop;
		if (scrollY >= sectionTop - 200) {
			current = section.getAttribute('id');
		}
	});
	
	navLinks.forEach(link => {
		link.classList.remove('active');
		if (link.getAttribute('href').slice(1) === current) {
			link.classList.add('active');
		}
	});
});

// Button ripple effect
document.querySelectorAll('.btn').forEach(button => {
	button.addEventListener('click', function(e) {
		const ripple = document.createElement('span');
		const rect = this.getBoundingClientRect();
		const size = Math.max(rect.width, rect.height);
		const x = e.clientX - rect.left - size / 2;
		const y = e.clientY - rect.top - size / 2;
		
		ripple.style.width = ripple.style.height = size + 'px';
		ripple.style.left = x + 'px';
		ripple.style.top = y + 'px';
		ripple.style.position = 'absolute';
		ripple.style.background = 'rgba(255,255,255,0.5)';
		ripple.style.borderRadius = '50%';
		ripple.style.transform = 'scale(0)';
		ripple.style.animation = 'ripple 0.6s ease-out';
		ripple.style.pointerEvents = 'none';
		
		this.style.position = 'relative';
		this.style.overflow = 'hidden';
		this.appendChild(ripple);
		
		setTimeout(() => ripple.remove(), 600);
	});
});

// Add CSS animation for ripple effect
const style = document.createElement('style');
style.textContent = `
	@keyframes ripple {
		to {
			transform: scale(4);
			opacity: 0;
		}
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.nav-link.active {
		color: var(--khaki-primary);
	}
`;
document.head.appendChild(style);
