/* =================================================================
   TICKET SYSTEM PRO - MAIN JS
   Hauptinitialisierung, Module-Koordination und App Lifecycle
   ================================================================= */

// Application State
const APP_STATE = {
    isInitialized: false,
    isLoading: true,
    modules: new Map(),
    errors: [],
    startTime: Date.now(),
    version: '1.0.0'
};

// Module Dependencies and Load Order
const MODULE_CONFIG = {
    loadOrder: ['storage', 'auth', 'ui', 'tickets'],
    dependencies: {
        auth: ['storage'],
        tickets: ['storage', 'auth'],
        ui: ['storage', 'auth']
    },
    criticalModules: ['storage', 'auth']
};

/**
 * =================================================================
 * APPLICATION INITIALIZATION
 * =================================================================
 */

/**
 * Hauptinitialisierung der Anwendung
 */
async function initializeApp() {
    try {
        console.log('🚀 Ticket System Pro wird gestartet...');
        console.log(`📊 Version: ${APP_STATE.version}`);
        
        // Show loading state
        showLoadingState();
        
        // Initialize modules in correct order
        await initializeModules();
        
        // Verify critical systems
        await verifyCriticalSystems();
        
        // Setup global error handling
        setupGlobalErrorHandling();
        
        // Initialize app-specific features
        await initializeAppFeatures();
        
        // Perform health checks
        await performHealthChecks();
        
        // Complete initialization
        completeInitialization();
        
    } catch (error) {
        console.error('❌ Kritischer Fehler bei App-Initialisierung:', error);
        handleCriticalError(error);
    }
}

/**
 * Initialisiert alle Module in der richtigen Reihenfolge
 */
async function initializeModules() {
    console.log('🔧 Initialisiere Module...');
    
    for (const moduleName of MODULE_CONFIG.loadOrder) {
        try {
            await initializeModule(moduleName);
        } catch (error) {
            const isCritical = MODULE_CONFIG.criticalModules.includes(moduleName);
            
            if (isCritical) {
                throw new Error(`Kritisches Modul ${moduleName} konnte nicht geladen werden: ${error.message}`);
            } else {
                console.warn(`⚠️ Nicht-kritisches Modul ${moduleName} konnte nicht geladen werden:`, error);
                APP_STATE.errors.push({ module: moduleName, error: error.message, critical: false });
            }
        }
    }
}

/**
 * Initialisiert ein einzelnes Modul
 * @param {string} moduleName - Name des Moduls
 */
async function initializeModule(moduleName) {
    console.log(`📦 Lade Modul: ${moduleName}`);
    
    const startTime = performance.now();
    let success = false;
    
    try {
        // Check dependencies
        const dependencies = MODULE_CONFIG.dependencies[moduleName] || [];
        for (const dep of dependencies) {
            if (!APP_STATE.modules.has(dep)) {
                throw new Error(`Abhängigkeit ${dep} nicht verfügbar`);
            }
        }
        
        // Initialize module
        switch (moduleName) {
            case 'storage':
                success = await initializeStorage();
                break;
            case 'auth':
                success = await initializeAuthSystem();
                break;
            case 'ui':
                success = await initializeUISystem();
                break;
            case 'tickets':
                success = await initializeTicketSystem();
                break;
            default:
                throw new Error(`Unbekanntes Modul: ${moduleName}`);
        }
        
        if (success) {
            const loadTime = Math.round(performance.now() - startTime);
            APP_STATE.modules.set(moduleName, { 
                status: 'loaded', 
                loadTime: loadTime,
                timestamp: new Date().toISOString()
            });
            console.log(`✅ Modul ${moduleName} geladen (${loadTime}ms)`);
        } else {
            throw new Error('Modul-Initialisierung fehlgeschlagen');
        }
        
    } catch (error) {
        APP_STATE.modules.set(moduleName, { 
            status: 'error', 
            error: error.message,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}

/**
 * =================================================================
 * SYSTEM VERIFICATION
 * =================================================================
 */

/**
 * Überprüft kritische Systeme
 */
async function verifyCriticalSystems() {
    console.log('🔍 Überprüfe kritische Systeme...');
    
    // Check localStorage availability
    if (!checkLocalStorageAvailability()) {
        throw new Error('LocalStorage nicht verfügbar');
    }
    
    // Check essential DOM elements
    if (!checkEssentialDOMElements()) {
        throw new Error('Essentielle DOM-Elemente nicht gefunden');
    }
    
    // Check module functions
    if (!checkModuleFunctions()) {
        throw new Error('Kritische Modul-Funktionen nicht verfügbar');
    }
    
    console.log('✅ Alle kritischen Systeme funktionsfähig');
}

/**
 * Prüft LocalStorage Verfügbarkeit
 * @returns {boolean} LocalStorage verfügbar
 */
function checkLocalStorageAvailability() {
    try {
        const testKey = 'ticketSystemTest';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.error('❌ LocalStorage nicht verfügbar:', error);
        return false;
    }
}

/**
 * Prüft essentielle DOM-Elemente
 * @returns {boolean} DOM-Elemente vorhanden
 */
function checkEssentialDOMElements() {
    const essentialElements = [
        'loginScreen',
        'mainApp',
        'ticketForm',
        'ticketsList'
    ];
    
    for (const elementId of essentialElements) {
        if (!document.getElementById(elementId)) {
            console.error(`❌ Essentielles Element nicht gefunden: ${elementId}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Prüft Modul-Funktionen
 * @returns {boolean} Funktionen verfügbar
 */
function checkModuleFunctions() {
    const criticalFunctions = [
        'saveTicketsToStorage',
        'loadTicketsFromStorage',
        'showNotification',
        'loginUser',
        'logout'
    ];
    
    for (const functionName of criticalFunctions) {
        if (typeof window[functionName] !== 'function') {
            console.error(`❌ Kritische Funktion nicht verfügbar: ${functionName}`);
            return false;
        }
    }
    
    return true;
}

/**
 * =================================================================
 * APP FEATURES INITIALIZATION
 * =================================================================
 */

/**
 * Initialisiert anwendungsspezifische Features
 */
async function initializeAppFeatures() {
    console.log('⚙️ Initialisiere App-Features...');
    
    try {
        // Setup auto-save
        setupAutoSave();
        
        // Initialize demo data if needed
        await initializeDemoData();
        
        // Setup periodic health checks
        setupPeriodicHealthChecks();
        
        // Initialize PWA features
        initializePWAFeatures();
        
        // Setup analytics (if enabled)
        setupAnalytics();
        
        console.log('✅ App-Features initialisiert');
        
    } catch (error) {
        console.warn('⚠️ Einige App-Features konnten nicht initialisiert werden:', error);
    }
}

/**
 * Richtet Auto-Save ein
 */
function setupAutoSave() {
    let autoSaveInterval;
    
    if (appSettings.autoSave) {
        autoSaveInterval = setInterval(() => {
            try {
                saveTicketsToStorage();
                saveSiteUsersToStorage();
                console.log('💾 Auto-Save ausgeführt');
            } catch (error) {
                console.error('❌ Auto-Save Fehler:', error);
            }
        }, 60000); // Every minute
        
        console.log('💾 Auto-Save aktiviert (60s Intervall)');
    }
    
    // Store interval reference for cleanup
    window.autoSaveInterval = autoSaveInterval;
}

/**
 * Initialisiert Demo-Daten falls nötig
 */
async function initializeDemoData() {
    try {
        // Check if this is first run
        const isFirstRun = !localStorage.getItem('ticketSystemInitialized');
        
        if (isFirstRun) {
            console.log('🎯 Erste Ausführung erkannt - initialisiere Demo-Daten...');
            
            // Add demo tickets if none exist
            if (typeof addDemoTickets === 'function') {
                addDemoTickets();
            }
            
            // Mark as initialized
            localStorage.setItem('ticketSystemInitialized', 'true');
            localStorage.setItem('ticketSystemFirstRun', new Date().toISOString());
            
            // Show welcome message
            setTimeout(() => {
                showNotification(
                    '🎉 Willkommen beim Ticket System Pro!\nDemo-Daten wurden geladen.',
                    'success',
                    5000
                );
            }, 2000);
        }
        
    } catch (error) {
        console.warn('⚠️ Demo-Daten konnten nicht initialisiert werden:', error);
    }
}

/**
 * Richtet periodische Gesundheitschecks ein
 */
function setupPeriodicHealthChecks() {
    setInterval(async () => {
        try {
            await performHealthChecks();
        } catch (error) {
            console.warn('⚠️ Gesundheitscheck fehlgeschlagen:', error);
        }
    }, 300000); // Every 5 minutes
    
    console.log('🏥 Periodische Gesundheitschecks aktiviert');
}

/**
 * Initialisiert PWA-Features
 */
function initializePWAFeatures() {
    try {
        // Service Worker registration (if available)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(() => {
                console.log('📱 Service Worker registriert');
            }).catch(error => {
                console.warn('⚠️ Service Worker Registrierung fehlgeschlagen:', error);
            });
        }
        
        // Add to home screen prompt
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            window.deferredPrompt = event;
            console.log('📱 PWA Installation verfügbar');
        });
        
        console.log('📱 PWA-Features initialisiert');
        
    } catch (error) {
        console.warn('⚠️ PWA-Features konnten nicht initialisiert werden:', error);
    }
}

/**
 * Richtet Analytics ein (falls aktiviert)
 */
function setupAnalytics() {
    try {
        if (appSettings.analytics && !appSettings.debugMode) {
            // Track app start
            trackEvent('app_start', {
                version: APP_STATE.version,
                timestamp: new Date().toISOString()
            });
            
            console.log('📊 Analytics aktiviert');
        }
    } catch (error) {
        console.warn('⚠️ Analytics Setup fehlgeschlagen:', error);
    }
}

/**
 * =================================================================
 * HEALTH CHECKS
 * =================================================================
 */

/**
 * Führt Gesundheitschecks durch
 */
async function performHealthChecks() {
    const healthStatus = {
        timestamp: new Date().toISOString(),
        modules: {},
        storage: {},
        memory: {},
        performance: {}
    };
    
    try {
        // Check modules
        for (const [moduleName, moduleInfo] of APP_STATE.modules) {
            healthStatus.modules[moduleName] = moduleInfo.status === 'loaded';
        }
        
        // Check storage
        healthStatus.storage = {
            available: checkLocalStorageAvailability(),
            usage: getStorageInfo(),
            tickets: tickets.length,
            users: siteUsers.length
        };
        
        // Check memory usage (if available)
        if (performance.memory) {
            healthStatus.memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        
        // Check performance
        const now = performance.now();
        healthStatus.performance = {
            uptime: Math.round(now - APP_STATE.startTime),
            timing: performance.timing ? {
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
            } : null
        };
        
        if (appSettings.debugMode) {
            console.log('🏥 Gesundheitscheck:', healthStatus);
        }
        
        return healthStatus;
        
    } catch (error) {
        console.error('❌ Fehler bei Gesundheitscheck:', error);
        return null;
    }
}

/**
 * =================================================================
 * ERROR HANDLING
 * =================================================================
 */

/**
 * Richtet globale Fehlerbehandlung ein
 */
function setupGlobalErrorHandling() {
    // Unhandled errors
    window.addEventListener('error', (event) => {
        console.error('❌ Unbehandelter Fehler:', event.error);
        handleGlobalError(event.error, 'unhandled_error');
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ Unbehandelte Promise-Ablehnung:', event.reason);
        handleGlobalError(event.reason, 'unhandled_promise_rejection');
    });
    
    console.log('🛡️ Globale Fehlerbehandlung eingerichtet');
}

/**
 * Behandelt globale Fehler
 * @param {Error} error - Fehler-Objekt
 * @param {string} type - Fehlertyp
 */
function handleGlobalError(error, type) {
    try {
        const errorInfo = {
            message: error.message || 'Unbekannter Fehler',
            stack: error.stack,
            type: type,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Store error for debugging
        APP_STATE.errors.push(errorInfo);
        
        // Show user-friendly error message
        if (typeof showNotification === 'function') {
            showNotification(
                '❌ Ein unerwarteter Fehler ist aufgetreten. Das System funktioniert weiterhin.',
                'error',
                5000
            );
        }
        
        // Log to console in debug mode
        if (appSettings.debugMode) {
            console.error('🐛 Fehlerdetails:', errorInfo);
        }
        
    } catch (handlingError) {
        console.error('❌ Fehler bei der Fehlerbehandlung:', handlingError);
    }
}

/**
 * Behandelt kritische Fehler
 * @param {Error} error - Kritischer Fehler
 */
function handleCriticalError(error) {
    console.error('💥 KRITISCHER FEHLER:', error);
    
    // Show critical error screen
    document.body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            text-align: center;
            padding: 20px;
        ">
            <div style="font-size: 64px; margin-bottom: 20px;">💥</div>
            <h1>Kritischer Fehler</h1>
            <p style="margin: 20px 0; max-width: 600px;">
                Das Ticket System konnte nicht gestartet werden. 
                Bitte laden Sie die Seite neu oder kontaktieren Sie den Administrator.
            </p>
            <button onclick="window.location.reload()" style="
                background: white;
                color: #dc2626;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 20px;
            ">
                🔄 Seite neu laden
            </button>
            <details style="margin-top: 30px; max-width: 600px;">
                <summary style="cursor: pointer; margin-bottom: 10px;">🔧 Technische Details</summary>
                <pre style="
                    background: rgba(0,0,0,0.2);
                    padding: 15px;
                    border-radius: 8px;
                    text-align: left;
                    overflow: auto;
                    font-size: 12px;
                ">${error.message}\n\n${error.stack}</pre>
            </details>
        </div>
    `;
}

/**
 * =================================================================
 * LOADING STATE MANAGEMENT
 * =================================================================
 */

/**
 * Zeigt Loading-State an
 */
function showLoadingState() {
    const loadingHTML = `
        <div id="loadingScreen" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        ">
            <div style="font-size: 80px; margin-bottom: 20px; animation: pulse 2s infinite;">🎫</div>
            <h1 style="margin-bottom: 10px;">Ticket System Pro</h1>
            <p style="margin-bottom: 30px; opacity: 0.9;">Version ${APP_STATE.version}</p>
            <div style="
                width: 200px;
                height: 4px;
                background: rgba(255,255,255,0.3);
                border-radius: 2px;
                overflow: hidden;
            ">
                <div id="loadingProgress" style="
                    width: 0%;
                    height: 100%;
                    background: white;
                    border-radius: 2px;
                    transition: width 0.3s ease;
                "></div>
            </div>
            <p id="loadingStatus" style="margin-top: 15px; font-size: 14px; opacity: 0.8;">
                Initialisierung...
            </p>
        </div>
        <style>
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

/**
 * Aktualisiert Loading-Progress
 * @param {number} progress - Progress (0-100)
 * @param {string} status - Status Text
 */
function updateLoadingProgress(progress, status) {
    const progressBar = document.getElementById('loadingProgress');
    const statusText = document.getElementById('loadingStatus');
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (statusText) statusText.textContent = status;
}

/**
 * Versteckt Loading-State
 */
function hideLoadingState() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
    }
}

/**
 * =================================================================
 * COMPLETION & CLEANUP
 * =================================================================
 */

/**
 * Schließt die Initialisierung ab
 */
function completeInitialization() {
    try {
        const totalTime = Date.now() - APP_STATE.startTime;
        
        // Update loading progress
        updateLoadingProgress(100, 'Abgeschlossen!');
        
        // Hide loading screen
        setTimeout(() => {
            hideLoadingState();
        }, 500);
        
        // Mark as initialized
        APP_STATE.isInitialized = true;
        APP_STATE.isLoading = false;
        
        // Log success
        console.log(`🎉 Ticket System Pro erfolgreich gestartet! (${totalTime}ms)`);
        console.log('📊 Module-Status:', Object.fromEntries(APP_STATE.modules));
        
        // Show success notification
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification('🎉 System erfolgreich geladen!', 'success');
            }
        }, 1000);
        
        // Track successful initialization
        trackEvent('app_initialized', {
            loadTime: totalTime,
            modules: Array.from(APP_STATE.modules.keys()),
            version: APP_STATE.version
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Abschluss der Initialisierung:', error);
    }
}

/**
 * Bereinigt Ressourcen beim Schließen
 */
function cleanup() {
    try {
        console.log('🧹 Bereinige Ressourcen...');
        
        // Clear intervals
        if (window.autoSaveInterval) {
            clearInterval(window.autoSaveInterval);
        }
        
        // Save final state
        if (typeof saveTicketsToStorage === 'function') {
            saveTicketsToStorage();
        }
        if (typeof saveSiteUsersToStorage === 'function') {
            saveSiteUsersToStorage();
        }
        
        console.log('✅ Bereinigung abgeschlossen');
        
    } catch (error) {
        console.error('❌ Fehler bei der Bereinigung:', error);
    }
}

/**
 * =================================================================
 * UTILITY FUNCTIONS
 * =================================================================
 */

/**
 * Verfolgt Events (Analytics)
 * @param {string} eventName - Event Name
 * @param {Object} properties - Event Properties
 */
function trackEvent(eventName, properties = {}) {
    try {
        if (appSettings.analytics && !appSettings.debugMode) {
            console.log(`📊 Event: ${eventName}`, properties);
            // Hier würde in einer echten App ein Analytics-Service aufgerufen
        }
    } catch (error) {
        console.warn('⚠️ Event-Tracking fehlgeschlagen:', error);
    }
}

/**
 * Gibt App-Informationen zurück
 * @returns {Object} App-Informationen
 */
function getAppInfo() {
    return {
        version: APP_STATE.version,
        isInitialized: APP_STATE.isInitialized,
        isLoading: APP_STATE.isLoading,
        uptime: Date.now() - APP_STATE.startTime,
        modules: Object.fromEntries(APP_STATE.modules),
        errors: APP_STATE.errors.length,
        lastHealthCheck: new Date().toISOString()
    };
}

/**
 * =================================================================
 * EVENT LISTENERS
 * =================================================================
 */

// App lifecycle events
window.addEventListener('beforeunload', cleanup);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Expose debug functions to global scope (development only)
if (typeof window !== 'undefined') {
    window.getAppInfo = getAppInfo;
    window.performHealthChecks = performHealthChecks;
    window.trackEvent = trackEvent;
    
    // Development tools
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        window.APP_STATE = APP_STATE;
        window.debugMode = true;
        console.log('🔧 Debug-Modus aktiviert - window.getAppInfo() verfügbar');
    }
}

console.log('📱 Ticket System Pro Main-Script geladen');