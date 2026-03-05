document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('mosaicContainer');
    const overlay = document.getElementById('overlay');
    const overlayImg = document.getElementById('overlayImage');
    const overlayCaption = document.getElementById('overlayCaption');
    const closeBtn = document.getElementById('closeOverlay');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    let currentIndex = 0;
    const cellSize = 110;
    const gapSize = 15;
    const imageElements = [];
    const slots = [];
    const viewedImages = new Set(); // Track unique images viewed

    const secretBtn = document.getElementById('secretBtn');
    const secretOverlay = document.getElementById('secretOverlay');
    const marqueeTop = document.getElementById('marqueeTop');
    const marqueeBottom = document.getElementById('marqueeBottom');
    const closeSecret = document.getElementById('closeSecret');

    const heartMap = [
        [0, 1, 1, 0, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 0]
    ];

    let imageCaptions = [
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️",
        "❤️"
    ];

    // --- Passcode & Slider Logic ---
    let currentPasscode = "";
    const targetPasscode = "0000";
    const dots = document.querySelectorAll('.dot');
    const passcodeOverlay = document.getElementById('passcodeOverlay');
    const display = document.getElementById('passcodeDisplay');
    const slider = document.getElementById('passcodeSlider');

    // Slider Implementation
    let isDragging = false;
    let isOpen = false;
    let startX = 0;
    let currentTranslate = 0;

    const bgMusic = document.getElementById('bgMusic');
    let musicStarted = false;

    // --- Music Unlock Logic (Mobile Robustness) ---
    const attemptPlayMusic = () => {
        if (!musicStarted) {
            bgMusic.play().then(() => {
                musicStarted = true;
                // Once started, remove global listeners to save resources
                ['click', 'touchstart', 'touchend', 'mousemove', 'keydown'].forEach(evt =>
                    document.removeEventListener(evt, attemptPlayMusic)
                );
            }).catch(err => {
                // Squelch the error in console to avoid annoying user, just retry next time
                // console.log("Auto-play prevented, waiting for next interaction");
            });
        }
    };

    // Try to play on ANY interaction
    ['click', 'touchstart', 'touchend', 'mousemove', 'keydown'].forEach(evt =>
        document.addEventListener(evt, attemptPlayMusic, { passive: false })
    );

    const onStart = (e) => {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        slider.style.transition = 'none';

        // Also try to play specifically on slider touch
        attemptPlayMusic();
    };

    const onMove = (e) => {
        if (!isDragging) return;
        const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        const diff = x - startX;

        // Music logic handled by attemptPlayMusic globally

        let targetX = isOpen ? -slider.offsetWidth + diff : diff;

        // Boundaries
        if (targetX > 0) targetX = 0;
        if (targetX < -slider.offsetWidth) targetX = -slider.offsetWidth;

        currentTranslate = targetX;
        slider.style.transform = `translateX(${targetX}px)`;
    };

    const onEnd = () => {
        // Retry music on release (often more reliable than touchstart)
        attemptPlayMusic();

        if (!isDragging) return;
        isDragging = false;
        slider.style.transition = 'transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)';

        const isDesktop = window.innerWidth > 768;
        const threshold = slider.offsetWidth / 3;

        if (isOpen) {
            // If open, check if dragged back to close
            if (currentTranslate > -slider.offsetWidth + threshold) {
                isOpen = false;
                slider.style.transform = 'translateX(0)';
            } else {
                slider.style.transform = `translateX(${-slider.offsetWidth}px)`;
            }
        } else {
            // If closed, check if dragged to open
            if (currentTranslate < -threshold) {
                isOpen = true;
                slider.style.transform = `translateX(${-slider.offsetWidth}px)`;
                if (!isDesktop) {
                    // On mobile, once open, it slides out completely
                    slider.style.transform = 'translateX(-100%)';
                    slider.style.pointerEvents = 'none';
                }
            } else {
                slider.style.transform = 'translateX(0)';
            }
        }
    };

    slider.addEventListener('mousedown', onStart);
    slider.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    window.enterDigit = (digit) => {
        attemptPlayMusic(); // Also try to play when typing password
        if (currentPasscode.length < 4) {
            currentPasscode += digit;
            updateDots();
            if (currentPasscode.length === 4) setTimeout(checkPasscode, 200);
        }
    };
    window.deleteDigit = () => {
        currentPasscode = currentPasscode.slice(0, -1);
        updateDots();
    };
    window.clearPasscode = () => {
        currentPasscode = "";
        updateDots();
    };

    function updateDots() {
        dots.forEach((dot, idx) => {
            idx < currentPasscode.length ? dot.classList.add('filled') : dot.classList.remove('filled');
        });
    }

    function checkPasscode() {
        if (currentPasscode === targetPasscode) {
            passcodeOverlay.classList.add('hidden');
            startEverything();
        } else {
            display.classList.add('error-shake');
            setTimeout(() => {
                display.classList.remove('error-shake');
                currentPasscode = "";
                updateDots();
            }, 500);
        }
    }

    function startEverything() {
        window.scrollTo(0, 0);

        // 1. Show clear background first
        document.body.classList.add('is-unlocked', 'bg-is-clear');

        // 2. After 1.5s, start blurring the background
        setTimeout(() => {
            document.body.classList.remove('bg-is-clear');
        }, 1500);

        // 3. After another 0.5s (total 2s), show heart and particles
        setTimeout(() => {
            document.body.classList.add('show-content');
            initAllEffects();
        }, 2000);
    }

    function initAllEffects() {
        // Background Sparkles
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.width = Math.random() * 2 + 1 + 'px';
            p.style.height = p.style.width;
            p.style.background = 'rgba(255, 255, 255, 0.1)';
            p.style.borderRadius = '50%';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.top = Math.random() * 100 + 'vh';
            p.animate([{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(-100vh)', opacity: 0.3 }, { transform: 'translateY(-120vh)', opacity: 0 }], {
                duration: (Math.random() * 8 + 8) * 1000,
                iterations: Infinity
            });
            particlesContainer.appendChild(p);
        }

        // 1. Pre-calculate slot positions and create images
        let imgNum = 1;
        heartMap.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                if (cell === 1 && imgNum <= 20) {
                    const finalLeft = cIdx * (cellSize + gapSize);
                    const finalTop = rIdx * (cellSize + gapSize);
                    slots.push({ top: finalTop, left: finalLeft });

                    // Create a container for each image and its tooltip
                    const wrapper = document.createElement('div');
                    wrapper.className = 'img-card-container';
                    wrapper.style.left = imgNum % 2 === 0 ? '-1000px' : '2000px';
                    wrapper.style.top = `${Math.random() * 1000 - 500}px`;
                    wrapper.style.opacity = '0';
                    wrapper.style.transform = `rotate(${Math.random() * 90 - 45}deg) scale(0.5)`;
                    wrapper.style.transition = 'all 1.5s cubic-bezier(0.23, 1, 0.32, 1)';

                    const img = document.createElement('img');
                    img.src = `style/img/Anh (${imgNum}).jpg`;
                    img.className = 'img-card';
                    img.dataset.caption = imageCaptions[imgNum - 1];
                    img.style.position = 'relative';
                    img.style.top = '0';
                    img.style.left = '0';
                    img.style.opacity = '1';

                    const tooltip = document.createElement('div');
                    tooltip.className = 'img-caption-tooltip';
                    tooltip.innerText = imageCaptions[imgNum - 1];

                    img.addEventListener('click', (e) => {
                        e.stopPropagation();
                        currentIndex = imageElements.indexOf(img);

                        // Mark as viewed
                        viewedImages.add(img.src);
                        msgNoti.classList.remove('show');
                        updateOverlayImage();
                        overlay.classList.add('active');
                    });

                    wrapper.appendChild(img);
                    wrapper.appendChild(tooltip);
                    container.appendChild(wrapper);
                    imageElements.push(img);

                    // Animate to final position
                    setTimeout(() => {
                        wrapper.style.left = `${finalLeft}px`;
                        wrapper.style.top = `${finalTop}px`;
                        wrapper.style.opacity = '1';
                        wrapper.style.transform = 'rotate(0deg) scale(1)';
                    }, 100 + imgNum * 80);

                    imgNum++;
                }
            });
        });
    }

    function updateOverlayImage() {
        const img = imageElements[currentIndex];
        overlayImg.src = img.src;
        overlayCaption.innerText = img.dataset.caption;

        // Check if all 20 unique images have been viewed
        if (viewedImages.size >= 20) {
            secretBtn.classList.add('show');
        } else {
            secretBtn.classList.remove('show');
        }
    }

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % imageElements.length;

        // Track arrow navigation too
        viewedImages.add(imageElements[currentIndex].src);
        updateOverlayImage();
    });

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + imageElements.length) % imageElements.length;

        // Track arrow navigation too
        viewedImages.add(imageElements[currentIndex].src);
        updateOverlayImage();
    });

    // 2. Visual Shuffle Function
    function shufflePositions() {
        // Create a shuffled copy of the slot indices
        const indices = Array.from({ length: slots.length }, (_, i) => i);

        // Fisher-Yates shuffle of indices
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Move each container to its new random slot
        imageElements.forEach((img, idx) => {
            const container = img.parentElement;
            const newSlotIdx = indices[idx];
            const newPos = slots[newSlotIdx];
            container.style.left = `${newPos.left}px`;
            container.style.top = `${newPos.top}px`;
        });
    }

    // 3. Close & Shuffle Logic
    const closeOverlay = () => {
        if (overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            // Wait for zoom-out to start, then fly to new spots
            setTimeout(shufflePositions, 300);
        }
    };

    // --- Secret Marquee Logic ---
    secretBtn.addEventListener('click', () => {
        // Hide notification button if showing
        msgNoti.classList.remove('show');

        // Prepare marquee content (double images for seamless loop)
        marqueeTop.innerHTML = "";
        marqueeBottom.innerHTML = "";

        const allImages = Array.from({ length: 27 }, (_, i) => `style/img/Anh (${i + 1}).jpg`);
        // Use a mix for top and bottom
        const topImages = [...allImages, ...allImages];
        const bottomImages = [...allImages, ...allImages];

        topImages.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.className = 'marquee-item';
            marqueeTop.appendChild(img);
        });

        bottomImages.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.className = 'marquee-item';
            marqueeBottom.appendChild(img);
        });

        secretOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Request Fullscreen for cinematic effect
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE11 */
            document.documentElement.msRequestFullscreen();
        }
    });

    closeSecret.addEventListener('click', () => {
        secretOverlay.style.display = 'none';
        document.body.style.overflow = '';
        // Reset secret reveal logic 
        viewedImages.clear();
        secretBtn.classList.remove('show');
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
    });
    closeBtn.addEventListener('click', closeOverlay);

    // --- Scroll & Message Logic ---
    const msgNoti = document.getElementById('msgNoti');
    const chatSection = document.getElementById('chatSection');
    const chatBox = document.getElementById('chatBox');
    const chatMessages = document.getElementById('chatMessages');

    const conversation = [
        { type: 'them', text: "Chào các bạn nữ xinh đẹp của lớp mình! 👋" },
        { type: 'them', text: "Cảm ơn các bạn đã cùng tụi mình đi qua những năm tháng thanh xuân rực rỡ này." },
        { type: 'them', text: "Những khoảnh khắc chúng ta bên nhau thật sự là những kỷ niệm rất đáng trân trọng. ✨" },
        { type: 'them', text: "Mỗi tấm ảnh ở phía trên đều là một mảnh ghép thú vị mà chúng mình luôn muốn giữ gìn." },
        { type: 'them', text: "Cánh con trai xem lại mà cứ thấy vui và tự hào về lớp mình mãi thôi..." },
        { type: 'them', text: "Hy vọng chúng ta sẽ còn viết tiếp thật nhiều kỷ niệm đẹp và lầy lội hơn nữa nhé! 🌸" },
        { type: 'them', text: "Chúc các bạn 8/3 luôn rạng rỡ, hạnh phúc và mãi là những bông hoa của lớp!" },
        { type: 'them', text: "Nhớ xem hết ảnh nhé 😘 " },
    ];

    let typingStarted = false;
    let autoScrolling = false;
    let isChatOpening = false;

    // Detect scroll to show/hide notification
    window.addEventListener('scroll', () => {
        const isOverlayActive = overlay.classList.contains('active');
        const isSecretVisible = secretOverlay.style.display === 'flex';

        if (chatBox.classList.contains('visible') ||
            msgNoti.classList.contains('actually-hidden') ||
            isOverlayActive || isSecretVisible) {
            if (msgNoti.classList.contains('show')) msgNoti.classList.remove('show');
            return;
        }

        if (window.scrollY > window.innerHeight * 0.4) {
            msgNoti.classList.add('show');
        } else {
            msgNoti.classList.remove('show');
        }
    });

    // Detect initial scroll to push heart away (Auto-scroll down)
    window.addEventListener('wheel', (e) => {
        if (e.deltaY > 30 && !autoScrolling && window.scrollY < 100) {
            autoScrolling = true;
            chatSection.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => { autoScrolling = false; }, 1000);
        }
    }, { passive: true });

    // Handle touch scrolling for mobile
    let touchStart = 0;
    window.addEventListener('touchstart', (e) => {
        touchStart = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        let touchEnd = e.touches[0].clientY;
        if (touchStart - touchEnd > 50 && !autoScrolling && window.scrollY < 100) {
            autoScrolling = true;
            chatSection.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => { autoScrolling = false; }, 1000);
        }
    }, { passive: true });

    msgNoti.addEventListener('click', () => {
        msgNoti.classList.add('actually-hidden');
        msgNoti.classList.remove('show');
        chatBox.classList.add('visible');
        if (!typingStarted) {
            startConversation();
        }
    });

    async function startConversation() {
        typingStarted = true;
        for (const msg of conversation) {
            await showSentMessage(msg.text, msg.type);
        }
    }

    function showSentMessage(text, type) {
        return new Promise((resolve) => {
            // 1. Show typing indicator bubble
            const typingBubble = document.createElement('div');
            typingBubble.className = 'message-bubble typing-indicator';
            typingBubble.innerHTML = `
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            `;
            chatMessages.appendChild(typingBubble);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // 2. Wait for a "sending" duration (simulating Zalo/Messenger)
            const delay = 1000 + Math.random() * 1000;

            setTimeout(() => {
                // 3. Remove indicator and pop the actual message bubble
                typingBubble.remove();
                const bubble = document.createElement('div');
                bubble.className = `message-bubble ${type === 'me' ? 'mine' : ''}`;
                bubble.innerText = text;
                chatMessages.appendChild(bubble);

                // Auto scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
                resolve();
            }, delay);
        });
    }
});
