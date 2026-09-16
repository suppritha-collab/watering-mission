/* ============================================
   WATERING MISSION — Application Logic
   Smart Garden Watering Assistant
   ============================================ */

(function () {
    'use strict';

    // ---- Constants ----
    const STORAGE_KEYS = {
        SESSIONS: 'wm_sessions',
        ACTIVE_SESSION: 'wm_activeSession',
        ALERTS: 'wm_alerts',
        PREFERENCES: 'wm_preferences'
    };

    const WEEKLY_GOAL = 3;
    const TIMER_INTERVAL = 1000; // 1 second
    const CIRCUMFERENCE = 2 * Math.PI * 90; // For the SVG circle (radius=90)

    // ---- State ----
    let timerIntervalId = null;
    let alertSoundIntervalId = null;
    let audioContext = null;
    let currentOscillator = null;
    let selectedDuration = 30; // default 30 minutes
    let feedbackData = { motor: null, reminder: null };

    // ---- DOM Ready ----
    document.addEventListener('DOMContentLoaded', function () {
        initApp();
    });

    // ============================================
    // INITIALIZATION
    // ============================================

    function initApp() {
        setupNavigation();
        setupStartSessionForm();
        setupActiveSessionButtons();
        setupHistoryFilters();
        setupModals();
        setupAboutButton();
        restoreActiveSession();
        renderCurrentPage();
        requestNotificationPermission();

        // Set default start time
        setDefaultStartTime();
        updateExpectedEndTime();
    }

    // ============================================
    // NAVIGATION
    // ============================================

    function setupNavigation() {
        // Sidebar nav links
        const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateTo(this.dataset.page);
            });
        });

        // Bottom nav links
        const bottomLinks = document.querySelectorAll('.bottom-nav-link');
        bottomLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                navigateTo(this.dataset.page);
            });
        });

        // CTA buttons that navigate
        document.getElementById('ctaStartBtn').addEventListener('click', function () {
            navigateTo('start-session');
        });

        document.getElementById('goToStartBtn').addEventListener('click', function () {
            navigateTo('start-session');
        });

        document.getElementById('historyStartBtn').addEventListener('click', function () {
            navigateTo('start-session');
        });
    }

    function navigateTo(page) {
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.bottom-nav-link').forEach(l => l.classList.remove('active'));

        document.querySelectorAll(`[data-page="${page}"]`).forEach(l => l.classList.add('active'));

        // Update pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Render page content
        renderPage(page);

        // Scroll to top
        window.scrollTo(0, 0);
    }

    function renderCurrentPage() {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id.replace('page-', '');
            renderPage(pageId);
        }
    }

    function renderPage(page) {
        switch (page) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'start-session':
                setDefaultStartTime();
                updateExpectedEndTime();
                break;
            case 'active-session':
                renderActiveSession();
                break;
            case 'history':
                renderHistory();
                break;
            case 'weekly-plan':
                renderWeeklyPlan();
                break;
        }
    }

    // ============================================
    // DASHBOARD
    // ============================================

    function renderDashboard() {
        const sessions = getSessions();
        const activeSession = getActiveSession();
        const weekData = getWeeklyData();

        // Today's Status
        const todayStatus = document.getElementById('todayStatus');
        const todayBadge = document.getElementById('todayBadge');

        if (activeSession) {
            todayStatus.textContent = 'Session Active';
            todayBadge.textContent = 'Active';
            todayBadge.className = 'card-badge active';
        } else if (hasSessionToday(sessions)) {
            todayStatus.textContent = 'Session Completed';
            todayBadge.textContent = 'Completed';
            todayBadge.className = 'card-badge completed';
        } else {
            todayStatus.textContent = 'Not Started';
            todayBadge.textContent = 'Pending';
            todayBadge.className = 'card-badge pending';
        }

        // Next Watering
        const nextDate = document.getElementById('nextWateringDate');
        const nextTime = document.getElementById('nextWateringTime');
        if (activeSession) {
            nextDate.textContent = 'Session in progress';
            nextTime.textContent = '';
        } else if (!hasSessionToday(sessions)) {
            nextDate.textContent = 'Today';
            nextTime.textContent = 'Whenever you\'re ready';
        } else {
            const nextDay = getNextWateringDay(weekData);
            nextDate.textContent = nextDay || 'Goal reached!';
            nextTime.textContent = nextDay ? 'As per your schedule' : 'Great work this week!';
        }

        // Weekly Progress
        const weeklyCount = weekData.completedDays;
        document.getElementById('weeklyProgressText').textContent = `${weeklyCount} / ${WEEKLY_GOAL} sessions`;
        document.getElementById('weeklyProgressBar').style.width = `${Math.min((weeklyCount / WEEKLY_GOAL) * 100, 100)}%`;

        // Last Session
        const lastSessionInfo = document.getElementById('lastSessionInfo');
        const lastSessionDetails = document.getElementById('lastSessionDetails');
        if (sessions.length > 0) {
            const last = sessions[sessions.length - 1];
            lastSessionInfo.textContent = last.section;
            const lastDate = new Date(last.startTimestamp);
            lastSessionDetails.textContent = `${formatDate(lastDate)} · ${last.plannedDuration} min`;
        } else {
            lastSessionInfo.textContent = 'No sessions yet';
            lastSessionDetails.textContent = '';
        }

        // Alerts
        const alerts = getAlerts();
        document.getElementById('alertCount').textContent = alerts.length;

        // Statistics
        document.getElementById('totalSessions').textContent = sessions.length;

        if (sessions.length > 0) {
            const avgDur = Math.round(sessions.reduce((sum, s) => sum + s.plannedDuration, 0) / sessions.length);
            document.getElementById('avgDuration').textContent = `${avgDur} min`;

            const longest = Math.max(...sessions.map(s => s.plannedDuration));
            document.getElementById('longestSession').textContent = `${longest} min`;

            const lastDate = new Date(sessions[sessions.length - 1].startTimestamp);
            document.getElementById('lastWateringDate').textContent = formatDateShort(lastDate);
        } else {
            document.getElementById('avgDuration').textContent = '0 min';
            document.getElementById('longestSession').textContent = '0 min';
            document.getElementById('lastWateringDate').textContent = '—';
        }

        // Goal badge
        document.getElementById('goalProgressBadge').textContent = `${weeklyCount} / ${WEEKLY_GOAL}`;
    }

    function hasSessionToday(sessions) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return sessions.some(s => {
            const d = new Date(s.startTimestamp);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        });
    }

    function getNextWateringDay(weekData) {
        if (weekData.completedDays >= WEEKLY_GOAL) return null;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        for (let i = 0; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const dayStr = d.toISOString().split('T')[0];
            if (!weekData.completedDates.includes(dayStr)) {
                if (i === 0) return 'Today';
                if (i === 1) return 'Tomorrow';
                return days[d.getDay()];
            }
        }
        return 'This week';
    }

    // ============================================
    // START SESSION FORM
    // ============================================

    function setupStartSessionForm() {
        // Duration buttons
        const durationBtns = document.querySelectorAll('.duration-btn');
        durationBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                durationBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const duration = this.dataset.duration;
                if (duration === 'custom') {
                    document.getElementById('customDurationInput').style.display = 'block';
                    const customVal = document.getElementById('customMinutes').value;
                    selectedDuration = customVal ? parseInt(customVal) : 30;
                } else {
                    document.getElementById('customDurationInput').style.display = 'none';
                    selectedDuration = parseInt(duration);
                }
                updateExpectedEndTime();
            });
        });

        // Custom duration input
        document.getElementById('customMinutes').addEventListener('input', function () {
            selectedDuration = parseInt(this.value) || 30;
            updateExpectedEndTime();
        });

        // Start time change
        document.getElementById('startTime').addEventListener('change', function () {
            updateExpectedEndTime();
        });

        // Form submission
        document.getElementById('sessionForm').addEventListener('submit', function (e) {
            e.preventDefault();
            startNewSession();
        });
    }

    function setDefaultStartTime() {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        document.getElementById('startTime').value = timeStr;
    }

    function updateExpectedEndTime() {
        const timeInput = document.getElementById('startTime').value;
        if (!timeInput) {
            document.getElementById('endTimeDisplay').textContent = '—';
            return;
        }

        const [hours, minutes] = timeInput.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate.getTime() + selectedDuration * 60 * 1000);
        document.getElementById('endTimeDisplay').textContent = formatTime(endDate);
    }

    function startNewSession() {
        // Check if session already active
        if (getActiveSession()) {
            showToast('⚠️ A session is already active!', 'warning');
            navigateTo('active-session');
            return;
        }

        // Get form values
        const sectionRadio = document.querySelector('input[name="gardenSection"]:checked');
        const section = sectionRadio ? sectionRadio.value : 'Section 1';

        const timeInput = document.getElementById('startTime').value;
        if (!timeInput) {
            showToast('⚠️ Please set a start time', 'warning');
            return;
        }

        // Validate custom duration
        if (selectedDuration < 1 || selectedDuration > 180 || isNaN(selectedDuration)) {
            showToast('⚠️ Please set a valid duration (1–180 minutes)', 'warning');
            return;
        }

        const [hours, minutes] = timeInput.split(':').map(Number);
        const startTimestamp = Date.now();
        const endTimestamp = startTimestamp + selectedDuration * 60 * 1000;

        const session = {
            id: generateId(),
            section: section,
            plannedDuration: selectedDuration,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
            status: 'active', // active, paused, attention_shift, alerted, completed
            attentionShift: false,
            alertGenerated: false,
            motorFeedback: null,
            reminderUseful: null,
            pausedAt: null,
            totalPausedDuration: 0
        };

        // Save active session
        saveActiveSession(session);

        showToast('✅ Watering session started!');
        navigateTo('active-session');
    }

    // ============================================
    // ACTIVE SESSION
    // ============================================

    function renderActiveSession() {
        const session = getActiveSession();

        if (!session) {
            document.getElementById('noActiveSession').style.display = 'block';
            document.getElementById('activeSessionContent').style.display = 'none';
            document.getElementById('activeSessionSubtitle').textContent = 'No active session';
            stopTimer();
            return;
        }

        document.getElementById('noActiveSession').style.display = 'none';
        document.getElementById('activeSessionContent').style.display = 'block';
        document.getElementById('activeSessionSubtitle').textContent = session.section;

        // Session info
        document.getElementById('activeSection').textContent = session.section;
        document.getElementById('activeStartTime').textContent = formatTime(new Date(session.startTimestamp));
        document.getElementById('activeEndTime').textContent = formatTime(new Date(session.endTimestamp));
        document.getElementById('activeDuration').textContent = `${session.plannedDuration} min`;

        // Update status display
        updateSessionStatus(session);

        // Start timer
        startTimer();
    }

    function updateSessionStatus(session) {
        const badge = document.getElementById('sessionStatusBadge');
        const statusText = document.getElementById('sessionStatusText');
        const attentionMsg = document.getElementById('attentionShiftMsg');
        const alertCard = document.getElementById('alertCard');
        const actions = document.getElementById('sessionActions');
        const pauseBtn = document.getElementById('pauseBtn');

        // Reset
        badge.className = 'session-status-badge';
        attentionMsg.style.display = 'none';
        alertCard.style.display = 'none';
        actions.style.display = 'flex';

        switch (session.status) {
            case 'active':
                badge.classList.add('watering');
                statusText.textContent = 'WATERING';
                pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> PAUSE';
                break;

            case 'paused':
                badge.classList.add('paused');
                statusText.textContent = 'PAUSED';
                pauseBtn.innerHTML = '<span class="btn-icon">▶️</span> RESUME';
                break;

            case 'attention_shift':
                badge.classList.add('attention');
                statusText.textContent = 'ATTENTION SHIFT';
                attentionMsg.style.display = 'flex';
                break;

            case 'alerted':
                badge.classList.add('alert');
                statusText.textContent = 'ALERT';
                alertCard.style.display = 'block';
                // Hide attention shift and pause buttons during alert
                document.getElementById('attentionShiftBtn').style.display = 'none';
                document.getElementById('pauseBtn').style.display = 'none';
                break;

            case 'completed':
                badge.classList.add('completed');
                statusText.textContent = 'COMPLETED';
                actions.style.display = 'none';
                break;
        }
    }

    function setupActiveSessionButtons() {
        // Attention Shift
        document.getElementById('attentionShiftBtn').addEventListener('click', function () {
            const session = getActiveSession();
            if (!session) return;

            session.status = 'attention_shift';
            session.attentionShift = true;
            saveActiveSession(session);
            updateSessionStatus(session);
            showToast('🔄 Attention shift noted. We\'ll remind you.');
        });

        // Pause / Resume
        document.getElementById('pauseBtn').addEventListener('click', function () {
            const session = getActiveSession();
            if (!session) return;

            if (session.status === 'paused') {
                // Resume
                const pausedDuration = Date.now() - session.pausedAt;
                session.endTimestamp += pausedDuration;
                session.totalPausedDuration += pausedDuration;
                session.pausedAt = null;
                session.status = session.attentionShift ? 'attention_shift' : 'active';
                saveActiveSession(session);
                updateSessionStatus(session);
                startTimer();
                showToast('▶️ Session resumed');
            } else {
                // Pause
                session.pausedAt = Date.now();
                session.status = 'paused';
                saveActiveSession(session);
                updateSessionStatus(session);
                stopTimer();
                showToast('⏸️ Session paused');
            }
        });

        // Complete Session
        document.getElementById('completeSessionBtn').addEventListener('click', function () {
            showCompletionModal();
        });

        // Stop Alert
        document.getElementById('stopAlertBtn').addEventListener('click', function () {
            stopAlertSound();
            showCompletionModal();
        });
    }

    // ============================================
    // TIMER LOGIC
    // ============================================

    function startTimer() {
        stopTimer(); // Clear any existing interval

        timerIntervalId = setInterval(function () {
            updateTimerDisplay();
        }, TIMER_INTERVAL);

        // Immediate update
        updateTimerDisplay();
    }

    function stopTimer() {
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
    }

    function updateTimerDisplay() {
        const session = getActiveSession();
        if (!session) {
            stopTimer();
            return;
        }

        // If paused, show frozen time
        if (session.status === 'paused') {
            const remaining = session.endTimestamp - session.pausedAt;
            displayTimerValues(remaining, session);
            return;
        }

        const now = Date.now();
        const remaining = session.endTimestamp - now;
        const totalDuration = session.plannedDuration * 60 * 1000;

        if (remaining <= 0) {
            // Timer complete!
            displayTimerValues(0, session);

            if (session.status !== 'alerted') {
                triggerAlert(session);
            }
            return;
        }

        displayTimerValues(remaining, session);

        // Check for attention shift reminder (at 50% remaining)
        if (session.attentionShift && session.status === 'attention_shift') {
            const halfwayMark = totalDuration * 0.5;
            const elapsed = totalDuration - remaining;
            if (elapsed >= halfwayMark && elapsed < halfwayMark + 2000) {
                showBrowserNotification(
                    'Watering Mission Reminder',
                    'Your watering session is still active. Please check the motor when possible.'
                );
            }
        }
    }

    function displayTimerValues(remaining, session) {
        if (remaining < 0) remaining = 0;

        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        const timerEl = document.getElementById('timerRemaining');
        timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Progress
        const totalDuration = session.plannedDuration * 60 * 1000;
        const elapsed = totalDuration - remaining;
        const progress = Math.min((elapsed / totalDuration) * 100, 100);

        // Linear progress bar
        document.getElementById('sessionProgressBar').style.width = `${progress}%`;
        document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;

        // Circular progress (SVG)
        const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
        const progressCircle = document.getElementById('timerProgress');
        progressCircle.style.strokeDasharray = CIRCUMFERENCE;
        progressCircle.style.strokeDashoffset = offset;

        // Change color based on progress
        if (progress >= 100) {
            progressCircle.style.stroke = '#e74c3c';
        } else if (progress >= 75) {
            progressCircle.style.stroke = '#ff9800';
        } else {
            progressCircle.style.stroke = '#3d7a56';
        }
    }

    // ============================================
    // ALERT SYSTEM
    // ============================================

    function triggerAlert(session) {
        session.status = 'alerted';
        session.alertGenerated = true;
        saveActiveSession(session);
        updateSessionStatus(session);

        // Save alert
        const alerts = getAlerts();
        alerts.push({
            id: generateId(),
            sessionId: session.id,
            timestamp: Date.now(),
            section: session.section,
            acknowledged: false
        });
        saveAlerts(alerts);

        // Play sound
        playAlertSound();

        // Browser notification
        showBrowserNotification(
            '⚠️ Watering Session Complete',
            `The scheduled watering for ${session.section} has ended. Please check the motor.`
        );

        showToast('⚠️ Session complete! Please check the motor.');
    }

    function playAlertSound() {
        stopAlertSound(); // Prevent duplicates

        try {
            // Create AudioContext
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            function playTone() {
                if (!audioContext || audioContext.state === 'closed') return;

                // Resume context if suspended
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }

                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                // Alert pattern: two-tone beep
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.15);
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.3);

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            }

            // Play immediately
            playTone();

            // Repeat every 3 seconds
            alertSoundIntervalId = setInterval(playTone, 3000);
        } catch (e) {
            console.warn('Web Audio API not available:', e);
        }
    }

    function stopAlertSound() {
        if (alertSoundIntervalId) {
            clearInterval(alertSoundIntervalId);
            alertSoundIntervalId = null;
        }
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().catch(() => {});
            audioContext = null;
        }
    }

    function showBrowserNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body: body,
                    icon: '🌿',
                    badge: '💧',
                    tag: 'watering-mission',
                    requireInteraction: true
                });
            } catch (e) {
                console.warn('Notification failed:', e);
            }
        }
    }

    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            // Delay the request slightly so it doesn't feel intrusive
            setTimeout(() => {
                Notification.requestPermission();
            }, 3000);
        }
    }

    // ============================================
    // COMPLETION / FEEDBACK
    // ============================================

    function showCompletionModal() {
        const session = getActiveSession();
        if (!session) return;

        feedbackData = { motor: null, reminder: null };

        // Reset UI
        document.querySelectorAll('#motorFeedbackOptions .feedback-btn').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('#reminderFeedbackOptions .feedback-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('saveFeedbackBtn').disabled = true;

        // Show modal info
        const duration = session.plannedDuration;
        const startTime = formatTime(new Date(session.startTimestamp));
        const endTime = formatTime(new Date());
        document.getElementById('modalSessionInfo').textContent =
            `${session.section} · ${startTime} – ${endTime} · ${duration} min`;

        document.getElementById('completionModal').style.display = 'flex';
    }

    function setupModals() {
        // Motor feedback
        document.querySelectorAll('#motorFeedbackOptions .feedback-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('#motorFeedbackOptions .feedback-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                feedbackData.motor = this.dataset.value;
                checkFeedbackComplete();
            });
        });

        // Reminder feedback
        document.querySelectorAll('#reminderFeedbackOptions .feedback-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('#reminderFeedbackOptions .feedback-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                feedbackData.reminder = this.dataset.value;
                checkFeedbackComplete();
            });
        });

        // Save feedback
        document.getElementById('saveFeedbackBtn').addEventListener('click', function () {
            completeSession();
        });

        // Close modal
        document.getElementById('modalCloseBtn').addEventListener('click', function () {
            document.getElementById('completionModal').style.display = 'none';
        });

        // About modal close
        document.getElementById('aboutModalCloseBtn').addEventListener('click', function () {
            document.getElementById('aboutModal').style.display = 'none';
        });

        // Confirm modal
        document.getElementById('confirmCancelBtn').addEventListener('click', function () {
            document.getElementById('confirmModal').style.display = 'none';
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', function (e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
        });
    }

    function checkFeedbackComplete() {
        const btn = document.getElementById('saveFeedbackBtn');
        btn.disabled = !(feedbackData.motor && feedbackData.reminder);
    }

    function completeSession() {
        const session = getActiveSession();
        if (!session) return;

        stopAlertSound();
        stopTimer();

        // Build completed session record
        const completedSession = {
            id: session.id,
            section: session.section,
            plannedDuration: session.plannedDuration,
            startTimestamp: session.startTimestamp,
            endTimestamp: Date.now(),
            status: 'completed',
            attentionShift: session.attentionShift,
            alertGenerated: session.alertGenerated,
            motorFeedback: feedbackData.motor,
            reminderUseful: feedbackData.reminder === 'yes',
            totalPausedDuration: session.totalPausedDuration || 0,
            completedAt: Date.now()
        };

        // Save to history
        const sessions = getSessions();
        sessions.push(completedSession);
        saveSessions(sessions);

        // Clear active session
        clearActiveSession();

        // Close modal
        document.getElementById('completionModal').style.display = 'none';

        // Show buttons again
        document.getElementById('attentionShiftBtn').style.display = '';
        document.getElementById('pauseBtn').style.display = '';

        showToast('✅ Session completed and saved!');
        navigateTo('dashboard');
    }

    // ============================================
    // HISTORY
    // ============================================

    function renderHistory(filter = 'all') {
        const sessions = getSessions();
        const historyList = document.getElementById('historyList');
        const emptyState = document.getElementById('historyEmpty');
        const historyActions = document.getElementById('historyActions');

        historyList.innerHTML = '';

        if (sessions.length === 0) {
            emptyState.style.display = 'block';
            historyActions.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        historyActions.style.display = 'block';

        // Filter sessions
        let filtered = [...sessions];
        const now = new Date();
        const weekStart = getWeekStart(now);
        const weekEnd = getWeekEnd(now);

        switch (filter) {
            case 'completed':
                filtered = filtered.filter(s => s.status === 'completed');
                break;
            case 'alerted':
                filtered = filtered.filter(s => s.alertGenerated);
                break;
            case 'week':
                filtered = filtered.filter(s => {
                    const d = new Date(s.startTimestamp);
                    return d >= weekStart && d <= weekEnd;
                });
                break;
        }

        // Sort newest first
        filtered.sort((a, b) => b.startTimestamp - a.startTimestamp);

        if (filtered.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state" style="padding: 40px 20px;">
                    <div class="empty-icon">🔍</div>
                    <h3>No matching sessions</h3>
                    <p>Try a different filter.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(session => {
            const startDate = new Date(session.startTimestamp);
            const endDate = new Date(session.endTimestamp);
            const day = startDate.getDate();
            const month = startDate.toLocaleString('en', { month: 'short' });
            const year = startDate.getFullYear();

            let motorTag = '';
            if (session.motorFeedback === 'off') {
                motorTag = '<span class="history-tag tag-motor">Motor OFF</span>';
            } else if (session.motorFeedback === 'running') {
                motorTag = '<span class="history-tag tag-motor-warning">Motor Running</span>';
            } else if (session.motorFeedback === 'unsure') {
                motorTag = '<span class="history-tag tag-motor-warning">Not Sure</span>';
            }

            let alertTag = '';
            if (session.alertGenerated) {
                alertTag = '<span class="history-tag tag-alert">Alert Generated</span>';
            }

            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="history-date-col">
                    <span class="history-day">${day}</span>
                    <span class="history-month">${month} ${year}</span>
                </div>
                <div class="history-details">
                    <span class="history-section">${session.section}</span>
                    <span class="history-time">${formatTime(startDate)} – ${formatTime(endDate)}</span>
                    <div class="history-meta">
                        <span class="history-tag tag-duration">${session.plannedDuration} min</span>
                        ${alertTag}
                        ${motorTag}
                    </div>
                </div>
                <div class="history-status-col">
                    <span class="history-status status-completed">Completed</span>
                </div>
            `;
            historyList.appendChild(card);
        });
    }

    function setupHistoryFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                renderHistory(this.dataset.filter);
            });
        });

        // Clear History
        document.getElementById('clearHistoryBtn').addEventListener('click', function () {
            showConfirm('Clear History', 'Are you sure you want to delete all watering history? This cannot be undone.', function () {
                saveSessions([]);
                saveAlerts([]);
                renderHistory();
                renderDashboard();
                showToast('🗑️ History cleared');
            });
        });
    }

    // ============================================
    // WEEKLY PLAN
    // ============================================

    function renderWeeklyPlan() {
        const weekData = getWeeklyData();
        const weekGrid = document.getElementById('weekGrid');
        const weeklySummary = document.getElementById('weeklySummary');

        // Update goal card
        document.getElementById('weeklyGoalBadge').textContent = `${weekData.completedDays} / ${WEEKLY_GOAL}`;
        document.getElementById('weeklyPlanProgressBar').style.width = `${Math.min((weekData.completedDays / WEEKLY_GOAL) * 100, 100)}%`;
        document.getElementById('weeklyRemaining').textContent = `Remaining: ${Math.max(WEEKLY_GOAL - weekData.completedDays, 0)}`;

        // Build day cards
        weekGrid.innerHTML = '';
        const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekStart = getWeekStart(new Date());

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);
            const dayStr = dayDate.toISOString().split('T')[0];
            const isToday = dayDate.getTime() === today.getTime();
            const isCompleted = weekData.completedDates.includes(dayStr);

            const card = document.createElement('div');
            card.className = `day-card${isToday ? ' today' : ''}${isCompleted ? ' completed' : ''}`;
            card.innerHTML = `
                <div class="day-name">${dayNames[i]}</div>
                <div class="day-date">${dayDate.getDate()}</div>
                <div class="day-status">${isCompleted ? '✓' : '○'}</div>
                <div class="day-label">${isCompleted ? 'Completed' : (isToday ? 'Today' : 'Pending')}</div>
            `;
            weekGrid.appendChild(card);
        }

        // Weekly summary
        const sessions = getSessions();
        const weekSessions = sessions.filter(s => {
            const d = new Date(s.startTimestamp);
            return d >= weekStart && d <= getWeekEnd(new Date());
        });

        const totalMinutes = weekSessions.reduce((sum, s) => sum + s.plannedDuration, 0);
        const alertsThisWeek = weekSessions.filter(s => s.alertGenerated).length;
        const sectionsUsed = [...new Set(weekSessions.map(s => s.section))];

        weeklySummary.innerHTML = `
            <h4>📊 This Week's Summary</h4>
            <div class="summary-item">
                <span class="summary-label">Sessions Completed</span>
                <span class="summary-value">${weekSessions.length}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Unique Days Watered</span>
                <span class="summary-value">${weekData.completedDays}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Watering Time</span>
                <span class="summary-value">${totalMinutes} min</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Alerts Generated</span>
                <span class="summary-value">${alertsThisWeek}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Sections Watered</span>
                <span class="summary-value">${sectionsUsed.length > 0 ? sectionsUsed.join(', ') : '—'}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Weekly Goal</span>
                <span class="summary-value">${weekData.completedDays >= WEEKLY_GOAL ? '✅ Reached!' : '🔄 In Progress'}</span>
            </div>
        `;
    }

    function getWeeklyData() {
        const sessions = getSessions();
        const now = new Date();
        const weekStart = getWeekStart(now);
        const weekEnd = getWeekEnd(now);

        // Find completed sessions this week
        const weekSessions = sessions.filter(s => {
            const d = new Date(s.startTimestamp);
            return d >= weekStart && d <= weekEnd && s.status === 'completed';
        });

        // Get unique dates
        const completedDates = [];
        weekSessions.forEach(s => {
            const dateStr = new Date(s.startTimestamp).toISOString().split('T')[0];
            if (!completedDates.includes(dateStr)) {
                completedDates.push(dateStr);
            }
        });

        return {
            completedDays: completedDates.length,
            completedDates: completedDates,
            sessions: weekSessions
        };
    }

    // ============================================
    // ABOUT
    // ============================================

    function setupAboutButton() {
        document.getElementById('aboutBtn').addEventListener('click', function () {
            document.getElementById('aboutModal').style.display = 'flex';
        });
    }

    // ============================================
    // RESTORE ACTIVE SESSION
    // ============================================

    function restoreActiveSession() {
        const session = getActiveSession();
        if (!session) return;

        // Calculate if session should have already ended
        const now = Date.now();

        if (session.status === 'paused') {
            // Session was paused — keep it paused
            return;
        }

        if (session.endTimestamp <= now) {
            // Session should have triggered alert
            if (session.status !== 'alerted' && session.status !== 'completed') {
                session.status = 'alerted';
                session.alertGenerated = true;
                saveActiveSession(session);

                // Save alert record
                const alerts = getAlerts();
                alerts.push({
                    id: generateId(),
                    sessionId: session.id,
                    timestamp: now,
                    section: session.section,
                    acknowledged: false
                });
                saveAlerts(alerts);
            }
            // Navigate to active session to show alert
            navigateTo('active-session');
        } else {
            // Session still active, show it
            // The timer will be started when Active Session page renders
        }
    }

    // ============================================
    // LOCALSTORAGE HELPERS
    // ============================================

    function getSessions() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveSessions(sessions) {
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }

    function getActiveSession() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function saveActiveSession(session) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    }

    function clearActiveSession() {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }

    function getAlerts() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveAlerts(alerts) {
        localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    function generateId() {
        return 'wm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    }

    function formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function formatDateShort(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        // Monday as start of week
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function getWeekEnd(date) {
        const start = getWeekStart(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return end;
    }

    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        const msg = document.getElementById('toastMessage');

        msg.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function showConfirm(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').style.display = 'flex';

        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        // Remove old listeners by cloning
        const newOk = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOk, okBtn);

        newOk.addEventListener('click', function () {
            document.getElementById('confirmModal').style.display = 'none';
            onConfirm();
        });
    }

})();
