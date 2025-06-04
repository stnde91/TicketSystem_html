/* =================================================================
   TICKET SYSTEM PRO - UI JS
   User Interface Management, Navigation und Interaktionen
   ================================================================= */

// UI State Variables
let currentActiveTab = 'dashboard';
let activeModals = new Set();
let notificationQueue = [];
let isProcessingNotifications = false;

// UI Configuration
const UI_CONFIG = {
    NOTIFICATION_DURATION: 3000,
    NOTIFICATION_SLIDE_DURATION: 300,
    TAB_TRANSITION_DURATION: 200,
    MODAL_ANIMATION_DURATION: 300,
    MAX_NOTIFICATIONS: 3
};

/**
 * =================================================================
 * TAB NAVIGATION FUNCTIONS
 * =================================================================
 */

/**
 * Wechselt zwischen den Haupttabs
 * @param {string} tabName - Name des Tabs
 * @param {Event} event - Optional: Event Objekt
 */
function showTab(tabName, event = null) {
    try {
        // Check if tab exists
        const targetTab = document.getElementById(tabName + '-tab');
        if (!targetTab) {
            console.error(`❌ Tab nicht gefunden: ${tabName}`);
            return false;
        }
        
        // Check permissions for admin tab
        if (tabName === 'admin' && !isAdmin()) {
            showNotification('❌ Keine Berechtigung für Admin-Bereich', 'error');
            return false;
        }
        
        console.log(`🔄 Wechsle zu Tab: ${tabName}`);
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
            tab.style.opacity = '0';
        });
        
        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show target tab with animation
        setTimeout(() => {
            targetTab.classList.add('active');
            targetTab.style.opacity = '1';
        }, UI_CONFIG.TAB_TRANSITION_DURATION / 2);
        
        // Activate nav button
        if (event && event.target) {
            event.target.classList.add('active');
        } else {
            // Find and activate the correct nav button
            const navButton = Array.from(document.querySelectorAll('.nav-tab')).find(
                button => button.getAttribute('onclick')?.includes(`showTab('${tabName}')`)
            );
            if (navButton) {
                navButton.classList.add('active');
            }
        }
        
        // Update current active tab
        currentActiveTab = tabName;
        
        // Execute tab-specific initialization
        initializeTabContent(tabName);
        
        // Save current tab to localStorage
        try {
            localStorage.setItem('ticketSystemCurrentTab', tabName);
        } catch (error) {
            console.warn('⚠️ Konnte aktuellen Tab nicht speichern:', error);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Tab-Wechsel:', error);
        showNotification('❌ Fehler beim Tab-Wechsel', 'error');
        return false;
    }
}

/**
 * Initialisiert Tab-spezifischen Inhalt
 * @param {string} tabName - Name des Tabs
 */
function initializeTabContent(tabName) {
    try {
        switch (tabName) {
            case 'dashboard':
                if (typeof updateStats === 'function') {
                    updateStats();
                }
                break;
                
            case 'tickets':
                if (typeof displayTickets === 'function') {
                    displayTickets();
                }
                break;
                
            case 'admin':
                if (typeof displaySiteUsers === 'function') {
                    displaySiteUsers();
                }
                break;
                
            case 'create':
                // Focus first input field
                const firstInput = document.querySelector('#create-tab .form-input');
                if (firstInput) {
                    setTimeout(() => firstInput.focus(), 100);
                }
                break;
        }
        
        console.log(`✅ Tab-Inhalt initialisiert: ${tabName}`);
        
    } catch (error) {
        console.error(`❌ Fehler bei Tab-Initialisierung (${tabName}):`, error);
    }
}

/**
 * Stellt den letzten aktiven Tab wieder her
 */
function restoreLastActiveTab() {
    try {
        const savedTab = localStorage.getItem('ticketSystemCurrentTab');
        if (savedTab && savedTab !== currentActiveTab) {
            showTab(savedTab);
        }
    } catch (error) {
        console.warn('⚠️ Konnte letzten Tab nicht wiederherstellen:', error);
    }
}

/**
 * =================================================================
 * MODAL MANAGEMENT FUNCTIONS
 * =================================================================
 */

/**
 * Öffnet ein Modal
 * @param {string} modalId - ID des Modals
 * @param {Object} options - Optionale Einstellungen
 */
function openModal(modalId, options = {}) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`❌ Modal nicht gefunden: ${modalId}`);
            return false;
        }
        
        // Add to active modals set
        activeModals.add(modalId);
        
        // Apply options
        if (options.closeOnBackdrop !== false) {
            modal.setAttribute('data-close-on-backdrop', 'true');
        }
        
        // Show modal with animation
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Focus management
        const firstFocusable = modal.querySelector('input, select, textarea, button');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), UI_CONFIG.MODAL_ANIMATION_DURATION);
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        console.log(`📱 Modal geöffnet: ${modalId}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Fehler beim Öffnen des Modals (${modalId}):`, error);
        return false;
    }
}

/**
 * Schließt ein Modal
 * @param {string} modalId - ID des Modals
 */
function closeModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`❌ Modal nicht gefunden: ${modalId}`);
            return false;
        }
        
        // Remove from active modals set
        activeModals.delete(modalId);
        
        // Hide modal with animation
        modal.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
            
            // Restore body scroll if no other modals are open
            if (activeModals.size === 0) {
                document.body.style.overflow = '';
            }
        }, UI_CONFIG.MODAL_ANIMATION_DURATION);
        
        console.log(`❌ Modal geschlossen: ${modalId}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Fehler beim Schließen des Modals (${modalId}):`, error);
        return false;
    }
}

/**
 * Schließt alle offenen Modals
 */
function closeAllModals() {
    const openModals = Array.from(activeModals);
    openModals.forEach(modalId => {
        closeModal(modalId);
    });
}

/**
 * =================================================================
 * NOTIFICATION SYSTEM
 * =================================================================
 */

/**
 * Zeigt eine Benachrichtigung an
 * @param {string} message - Nachricht
 * @param {string} type - Typ (success, error, info, warning)
 * @param {number} duration - Anzeigedauer in ms
 */
function showNotification(message, type = 'info', duration = UI_CONFIG.NOTIFICATION_DURATION) {
    try {
        // Add to queue
        notificationQueue.push({ message, type, duration, id: Date.now() });
        
        // Process queue if not already processing
        if (!isProcessingNotifications) {
            processNotificationQueue();
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Anzeigen der Benachrichtigung:', error);
    }
}

/**
 * Verarbeitet die Benachrichtigungs-Queue
 */
function processNotificationQueue() {
    if (notificationQueue.length === 0) {
        isProcessingNotifications = false;
        return;
    }
    
    isProcessingNotifications = true;
    const notification = notificationQueue.shift();
    
    displayNotification(notification);
    
    // Process next notification after delay
    setTimeout(() => {
        processNotificationQueue();
    }, 500);
}

/**
 * Zeigt eine einzelne Benachrichtigung an
 * @param {Object} notification - Benachrichtigungs-Objekt
 */
function displayNotification(notification) {
    try {
        // Limit number of simultaneous notifications
        const existingNotifications = document.querySelectorAll('.notification');
        if (existingNotifications.length >= UI_CONFIG.MAX_NOTIFICATIONS) {
            // Remove oldest notification
            existingNotifications[0].remove();
        }
        
        // Create notification element
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification ${notification.type}`;
        notificationElement.textContent = notification.message;
        notificationElement.setAttribute('data-id', notification.id);
        
        // Add close button for longer notifications
        if (notification.duration > 5000) {
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = 'notification-close';
            closeBtn.onclick = () => removeNotification(notificationElement);
            notificationElement.appendChild(closeBtn);
        }
        
        // Add to DOM
        document.body.appendChild(notificationElement);
        
        // Show with animation
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 100);
        
        // Auto-remove after duration
        setTimeout(() => {
            removeNotification(notificationElement);
        }, notification.duration);
        
        console.log(`📢 Benachrichtigung angezeigt: ${notification.type} - ${notification.message}`);
        
    } catch (error) {
        console.error('❌ Fehler beim Anzeigen der Benachrichtigung:', error);
    }
}

/**
 * Entfernt eine Benachrichtigung
 * @param {HTMLElement} notificationElement - Benachrichtigungs-Element
 */
function removeNotification(notificationElement) {
    if (!notificationElement || !notificationElement.parentNode) return;
    
    notificationElement.classList.remove('show');
    
    setTimeout(() => {
        if (notificationElement.parentNode) {
            notificationElement.remove();
        }
    }, UI_CONFIG.NOTIFICATION_SLIDE_DURATION);
}

/**
 * =================================================================
 * USER LIST DISPLAY FUNCTIONS
 * =================================================================
 */

/**
 * Zeigt die Benutzerliste im Admin-Bereich an
 */
function displaySiteUsers() {
    try {
        const userListDiv = document.getElementById('userList');
        const noUsersDiv = document.getElementById('noUsers');
        
        if (!userListDiv || !noUsersDiv) {
            console.warn('⚠️ User-Display Elemente nicht gefunden');
            return;
        }
        
        if (siteUsers.length === 0) {
            userListDiv.innerHTML = '';
            userListDiv.style.display = 'none';
            noUsersDiv.style.display = 'block';
            return;
        }
        
        userListDiv.style.display = 'block';
        noUsersDiv.style.display = 'none';
        
        // Generate users HTML
        userListDiv.innerHTML = siteUsers.map(user => generateUserCardHTML(user)).join('');
        
        console.log(`👥 ${siteUsers.length} Benutzer angezeigt`);
        
    } catch (error) {
        console.error('❌ Fehler beim Anzeigen der Benutzer:', error);
    }
}

/**
 * Generiert HTML für eine Benutzer-Karte
 * @param {Object} user - Benutzer Objekt
 * @returns {string} HTML String
 */
function generateUserCardHTML(user) {
    const roleClass = user.role === 'admin' ? 'admin' : '';
    const isProtected = user.email === 'admin@firma.de';
    const isSelfUser = currentUser && user.email === currentUser.email;
    
    return `
        <div class="user-card">
            <div class="user-name">${escapeHTML(user.name)} ${user.role === 'admin' ? '👑' : '👤'}</div>
            <div class="user-email">${escapeHTML(user.email)}</div>
            <div class="user-meta">
                <span class="user-role ${roleClass}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                <div class="user-actions">
                    ${!isProtected && !isSelfUser ? 
                        `<button class="action-menu-btn delete-btn" onclick="confirmDeleteSiteUser('${user.email}')">🗑️ Löschen</button>` : 
                        '<span style="font-size:12px; color:#9ca3af;">' + (isProtected ? '(Hauptadmin)' : '(Sie selbst)') + '</span>'
                    }
                </div>
            </div>
        </div>
    `;
}

/**
 * =================================================================
 * FORM HANDLING FUNCTIONS
 * =================================================================
 */

/**
 * Setzt alle Formulare zurück
 */
function resetAllForms() {
    try {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.reset();
        });
        
        console.log('🔄 Alle Formulare zurückgesetzt');
        
    } catch (error) {
        console.error('❌ Fehler beim Zurücksetzen der Formulare:', error);
    }
}

/**
 * Validiert ein Formular
 * @param {string} formId - ID des Formulars
 * @returns {boolean} Validierung erfolgreich
 */
function validateForm(formId) {
    try {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`❌ Formular nicht gefunden: ${formId}`);
            return false;
        }
        
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        if (!isValid) {
            showNotification('❌ Bitte füllen Sie alle Pflichtfelder aus!', 'error');
        }
        
        return isValid;
        
    } catch (error) {
        console.error('❌ Fehler bei der Formular-Validierung:', error);
        return false;
    }
}

/**
 * =================================================================
 * KEYBOARD SHORTCUTS
 * =================================================================
 */

/**
 * Behandelt Tastatur-Shortcuts
 * @param {KeyboardEvent} event - Keyboard Event
 */
function handleKeyboardShortcuts(event) {
    try {
        // Ignore if typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl/Cmd + Key combinations
        if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
                case '1':
                    event.preventDefault();
                    showTab('dashboard');
                    break;
                case '2':
                    event.preventDefault();
                    showTab('create');
                    break;
                case '3':
                    event.preventDefault();
                    showTab('tickets');
                    break;
                case '4':
                    if (isAdmin()) {
                        event.preventDefault();
                        showTab('admin');
                    }
                    break;
            }
        }
        
        // Escape key
        if (event.key === 'Escape') {
            closeAllModals();
        }
        
    } catch (error) {
        console.error('❌ Fehler bei Keyboard-Shortcuts:', error);
    }
}

/**
 * =================================================================
 * RESPONSIVE HELPERS
 * =================================================================
 */

/**
 * Prüft ob Mobile-Ansicht aktiv ist
 * @returns {boolean} Ist Mobile
 */
function isMobileView() {
    return window.innerWidth < 768;
}

/**
 * Prüft ob Tablet-Ansicht aktiv ist
 * @returns {boolean} Ist Tablet
 */
function isTabletView() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * Prüft ob Desktop-Ansicht aktiv ist
 * @returns {boolean} Ist Desktop
 */
function isDesktopView() {
    return window.innerWidth >= 1024;
}

/**
 * Anpassung der UI basierend auf Bildschirmgröße
 */
function adjustUIForScreenSize() {
    try {
        const isMobile = isMobileView();
        const isTablet = isTabletView();
        
        // Mobile-specific adjustments
        if (isMobile) {
            // Compact navigation
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.style.fontSize = '11px';
                tab.style.padding = '8px 4px';
            });
            
            // Adjust modal sizes
            document.querySelectorAll('.modal-content').forEach(modal => {
                modal.style.margin = '10px';
                modal.style.padding = '20px';
            });
        } else {
            // Reset styles for larger screens
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.style.fontSize = '';
                tab.style.padding = '';
            });
            
            document.querySelectorAll('.modal-content').forEach(modal => {
                modal.style.margin = '';
                modal.style.padding = '';
            });
        }
        
        console.log(`📱 UI angepasst für: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}`);
        
    } catch (error) {
        console.error('❌ Fehler bei UI-Anpassung:', error);
    }
}

/**
 * =================================================================
 * THEME MANAGEMENT
 * =================================================================
 */

/**
 * Wechselt zwischen Hell/Dunkel Theme
 * @param {string} theme - Theme Name (light/dark)
 */
function switchTheme(theme) {
    try {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('ticketSystemTheme', theme);
        
        showNotification(`🎨 Theme gewechselt: ${theme === 'dark' ? 'Dunkel' : 'Hell'}`, 'info');
        console.log(`🎨 Theme geändert: ${theme}`);
        
    } catch (error) {
        console.error('❌ Fehler beim Theme-Wechsel:', error);
    }
}

/**
 * Lädt gespeichertes Theme
 */
function loadSavedTheme() {
    try {
        const savedTheme = localStorage.getItem('ticketSystemTheme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        console.log(`🎨 Theme geladen: ${savedTheme}`);
    } catch (error) {
        console.warn('⚠️ Konnte Theme nicht laden:', error);
    }
}

/**
 * =================================================================
 * EVENT LISTENERS SETUP
 * =================================================================
 */

/**
 * Richtet globale Event Listener ein
 */
function setupGlobalEventListeners() {
    try {
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Modal backdrop clicks
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal') && 
                event.target.getAttribute('data-close-on-backdrop') === 'true') {
                const modalId = event.target.id;
                closeModal(modalId);
            }
        });
        
        // Window resize handling
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(adjustUIForScreenSize, 250);
        });
        
        // Before unload warning (if unsaved changes)
        window.addEventListener('beforeunload', function(event) {
            if (activeModals.size > 0) {
                event.preventDefault();
                event.returnValue = 'Es sind noch Modals geöffnet. Möchten Sie wirklich die Seite verlassen?';
            }
        });
        
        // Form input validation
        document.addEventListener('input', function(event) {
            if (event.target.classList.contains('form-input') && event.target.hasAttribute('required')) {
                if (event.target.value.trim()) {
                    event.target.classList.remove('error');
                }
            }
        });
        
        console.log('✅ Globale Event Listener eingerichtet');
        
    } catch (error) {
        console.error('❌ Fehler beim Einrichten der Event Listener:', error);
    }
}

/**
 * =================================================================
 * ACCESSIBILITY FUNCTIONS
 * =================================================================
 */

/**
 * Verbessert die Barrierefreiheit
 */
function enhanceAccessibility() {
    try {
        // Add ARIA labels
        document.querySelectorAll('.nav-tab').forEach((tab, index) => {
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', tab.classList.contains('active'));
            tab.setAttribute('tabindex', tab.classList.contains('active') ? '0' : '-1');
        });
        
        // Add focus management
        document.querySelectorAll('.modal').forEach(modal => {
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
        });
        
        // Add screen reader support
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'polite');
        });
        
        console.log('♿ Barrierefreiheit verbessert');
        
    } catch (error) {
        console.error('❌ Fehler bei Barrierefreiheit-Verbesserungen:', error);
    }
}

/**
 * =================================================================
 * PERFORMANCE MONITORING
 * =================================================================
 */

/**
 * Überwacht UI-Performance
 */
function monitorUIPerformance() {
    try {
        // Monitor tab switches
        const originalShowTab = showTab;
        showTab = function(tabName, event) {
            const startTime = performance.now();
            const result = originalShowTab.call(this, tabName, event);
            const endTime = performance.now();
            
            if (endTime - startTime > 100) {
                console.warn(`⚠️ Langsamer Tab-Wechsel: ${tabName} (${Math.round(endTime - startTime)}ms)`);
            }
            
            return result;
        };
        
        console.log('📊 UI-Performance Monitoring aktiv');
        
    } catch (error) {
        console.error('❌ Fehler beim Performance Monitoring:', error);
    }
}

/**
 * =================================================================
 * INITIALIZATION
 * =================================================================
 */

/**
 * Initialisiert das UI-System
 */
function initializeUISystem() {
    try {
        console.log('🎨 Initialisiere UI-System...');
        
        // Load saved theme
        loadSavedTheme();
        
        // Setup event listeners
        setupGlobalEventListeners();
        
        // Enhance accessibility
        enhanceAccessibility();
        
        // Adjust UI for current screen size
        adjustUIForScreenSize();
        
        // Enable performance monitoring in development
        if (appSettings.debugMode) {
            monitorUIPerformance();
        }
        
        // Restore last active tab
        setTimeout(() => {
            restoreLastActiveTab();
        }, 500);
        
        console.log('✅ UI-System initialisiert');
        return true;
        
    } catch (error) {
        console.error('❌ Fehler bei UI-System Initialisierung:', error);
        return false;
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUISystem);
    } else {
        initializeUISystem();
    }
}