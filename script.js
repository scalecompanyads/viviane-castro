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



    // Lead Form
    // Lead vai para o webhook do Make (salva na planilha) e, se qualificado, segue para o WhatsApp da Dra.
    const LEAD_ENDPOINT = 'https://hook.us1.make.com/mpntnzbe1vdh5w95ycf6t94pkntu2pmk';
    const WHATSAPP_NUMBER = '5531984717680';

    // UTMs: guarda a primeira origem da sessão para não perder ao navegar por âncoras
    const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
    const getTracking = () => {
        const params = new URLSearchParams(window.location.search);
        let stored = {};
        try { stored = JSON.parse(sessionStorage.getItem('lead_tracking') || '{}'); } catch (e) { }
        const fromUrl = {};
        UTM_KEYS.forEach(k => { if (params.get(k)) fromUrl[k] = params.get(k); });
        const tracking = Object.keys(fromUrl).length ? fromUrl : stored;
        try { sessionStorage.setItem('lead_tracking', JSON.stringify(tracking)); } catch (e) { }
        const out = {};
        UTM_KEYS.forEach(k => { out[k] = tracking[k] || ''; });
        return out;
    };
    const tracking = getTracking();

    const leadForm = document.getElementById('lead-form');
    if (leadForm) {
        const selects = leadForm.querySelectorAll('.custom-select');

        const closeAllSelects = (except) => {
            selects.forEach(s => {
                if (s !== except) {
                    s.classList.remove('open');
                    s.querySelector('.select-trigger').setAttribute('aria-expanded', 'false');
                }
            });
        };

        selects.forEach(select => {
            const trigger = select.querySelector('.select-trigger');
            const valueEl = select.querySelector('.select-value');
            const hidden = select.querySelector('input[type="hidden"]');
            const options = Array.from(select.querySelectorAll('[role="option"]'));
            let activeIndex = -1;

            const setActive = (i) => {
                options.forEach(o => o.classList.remove('active'));
                activeIndex = i;
                if (options[i]) {
                    options[i].classList.add('active');
                    options[i].scrollIntoView({ block: 'nearest' });
                }
            };

            const open = () => {
                closeAllSelects(select);
                select.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
                setActive(Math.max(0, options.findIndex(o => o.getAttribute('aria-selected') === 'true')));
            };

            const close = () => {
                select.classList.remove('open');
                trigger.setAttribute('aria-expanded', 'false');
            };

            const choose = (option) => {
                options.forEach(o => o.setAttribute('aria-selected', 'false'));
                option.setAttribute('aria-selected', 'true');
                hidden.value = option.textContent.trim();
                hidden.dataset.qualifies = option.dataset.qualifies || 'true';
                valueEl.textContent = hidden.value;
                select.classList.add('has-value');
                select.closest('.form-field').classList.remove('invalid');
                close();
                trigger.focus();
            };

            options.forEach((option, i) => {
                option.setAttribute('aria-selected', 'false');
                option.addEventListener('click', () => choose(option));
                option.addEventListener('mouseenter', () => setActive(i));
            });

            trigger.addEventListener('click', () => {
                select.classList.contains('open') ? close() : open();
            });

            trigger.addEventListener('keydown', (e) => {
                const isOpen = select.classList.contains('open');
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!isOpen) return open();
                    const step = e.key === 'ArrowDown' ? 1 : -1;
                    setActive((activeIndex + step + options.length) % options.length);
                } else if ((e.key === 'Enter' || e.key === ' ') && isOpen) {
                    e.preventDefault();
                    if (options[activeIndex]) choose(options[activeIndex]);
                } else if (e.key === 'Escape' || e.key === 'Tab') {
                    close();
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) closeAllSelects();
        });

        // Máscara de telefone: (31) 98471-7680
        const phoneInput = leadForm.querySelector('input[name="whatsapp"]');
        phoneInput.addEventListener('input', () => {
            const d = phoneInput.value.replace(/\D/g, '').slice(0, 11);
            let out = d;
            if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
            if (d.length > 6) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
            phoneInput.value = out;
        });

        leadForm.querySelectorAll('.input-wrap input').forEach(input => {
            input.addEventListener('input', () => input.parentElement.classList.remove('invalid'));
        });

        const validate = () => {
            let firstInvalid = null;
            const mark = (el, ok, focusEl) => {
                el.classList.toggle('invalid', !ok);
                if (!ok && !firstInvalid) firstInvalid = focusEl;
            };

            selects.forEach(s => {
                mark(s.closest('.form-field'), !!s.querySelector('input[type="hidden"]').value, s.querySelector('.select-trigger'));
            });

            const nome = leadForm.querySelector('input[name="nome"]');
            mark(nome.parentElement, nome.value.trim().length >= 2, nome);

            const digits = phoneInput.value.replace(/\D/g, '');
            mark(phoneInput.parentElement, digits.length === 10 || digits.length === 11, phoneInput);

            if (firstInvalid) firstInvalid.focus();
            return !firstInvalid;
        };

        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validate()) return;

            const fd = new FormData(leadForm);
            const qualificado = Array.from(leadForm.querySelectorAll('input[type="hidden"]'))
                .every(h => h.dataset.qualifies !== 'false');

            const lead = {
                situacao: fd.get('situacao'),
                titular: fd.get('titular'),
                valor: fd.get('valor'),
                nome: fd.get('nome').trim(),
                whatsapp: fd.get('whatsapp').replace(/\D/g, ''),
                qualificado: qualificado ? 'Sim' : 'Não',
                ...tracking,
                referrer: document.referrer,
                pagina: window.location.href,
                enviado_em: new Date().toISOString()
            };

            const submitBtn = leadForm.querySelector('.btn-submit');
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-label').textContent = 'Enviando...';

            // Form-urlencoded + no-cors: evita preflight de CORS e o Make lê os campos normalmente
            try {
                await fetch(LEAD_ENDPOINT, {
                    method: 'POST',
                    mode: 'no-cors',
                    keepalive: true,
                    body: new URLSearchParams(lead)
                });
            } catch (err) {
                console.error('Falha ao enviar lead para a planilha', err);
            }

            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'lead_form_submit',
                lead_qualificado: qualificado,
                lead_situacao: lead.situacao,
                lead_titular: lead.titular,
                lead_valor: lead.valor
            });

            const success = leadForm.querySelector('.form-success');
            leadForm.querySelector('.form-steps').hidden = true;
            leadForm.querySelector('.lead-form-header').hidden = true;
            success.hidden = false;

            if (!qualificado) {
                success.classList.add('disqualified');
                success.querySelector('.success-icon').innerHTML = '<i class="fa-solid fa-circle-info"></i>';
                success.querySelector('.success-title').textContent = 'Obrigado pelo contato!';
                success.querySelector('.success-text').textContent =
                    'Nossa atuação é focada em dívidas tributárias (Execução Fiscal, dívida ativa e bloqueios pelo Fisco). Pelo que você informou, seu caso pode não se enquadrar, mas nossa equipe vai avaliar e retornar se pudermos ajudar.';
                return;
            }

            const message = [
                'Olá! Preenchi a análise inicial no site e gostaria de falar com a Dra. Viviane.',
                '',
                `*Nome:* ${lead.nome}`,
                `*Situação:* ${lead.situacao}`,
                `*Cobrança em nome de:* ${lead.titular}`,
                `*Valor aproximado:* ${lead.valor}`
            ].join('\n');
            const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

            success.querySelector('.success-text').innerHTML =
                `Estamos te levando para o WhatsApp da Dra. Viviane para enviar sua mensagem. Se não abrir, <a href="${waUrl}" class="success-link">clique aqui</a>.`;
            setTimeout(() => { window.location.href = waUrl; }, 1200);
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
