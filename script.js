document.addEventListener('DOMContentLoaded', () => {
    // FAQ Accordion Logic
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;
            const accordionContent = header.nextElementSibling;
            
            // Toggle current item
            const isActive = header.classList.contains('active');
            
            // Close all items
            document.querySelectorAll('.accordion-header').forEach(h => {
                h.classList.remove('active');
                h.nextElementSibling.style.maxHeight = null;
            });

            // If the clicked item was not active, open it
            if (!isActive) {
                header.classList.add('active');
                accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
            }
        });
    });

    // Floating WhatsApp Button Logic
    const floatingWhatsApp = document.getElementById('floating-whatsapp');
    const cenarioSection = document.getElementById('cenario');

    if (floatingWhatsApp && cenarioSection) {
        window.addEventListener('scroll', () => {
            const cenarioTop = cenarioSection.getBoundingClientRect().top;
            
            // Show button when the "Cenário" section is reached
            if (cenarioTop <= window.innerHeight * 0.8) {
                floatingWhatsApp.classList.add('visible');
            } else {
                floatingWhatsApp.classList.remove('visible');
            }
        });
    }

    // Scroll Animations Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once animated if we only want it to animate once
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-up, .fade-in');
    animatedElements.forEach(el => {
        scrollObserver.observe(el);
    });
});
