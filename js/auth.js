/* =================================================================
   TICKET SYSTEM PRO - AUTHENTICATION JS
   Benutzer-Authentifizierung und Rollen-Management
   ================================================================= */

// Global Authentication Variables
let currentUser = null;
let isAuthenticated = false;
let sessionTimeout = null;

// Session Configuration
const SESSION_CONFIG = {
    TIMEOUT_MINUTES: 60, // Auto-logout after 60 minutes
    WARNING_MINUTES: 5,  // Show warning 5 minutes before logout
    REMEMBER_DAYS: 7     // Remember login for 7 days
};

/**
 * =================================================================
 * LOGIN FUNCTIONS
 * =================================================================
 */

/**
 * Schnell-Login für Demo-Zwecke
 * @param {string} emailToLogin - E-Mail Adresse für Login
 * @returns {boolean} Erfolg des Logins
 */
function quickLogin(emailToLogin) {
    try {
        const user = siteUsers.find(u => u.email === emailToLogin);
        
        if (user) {
            console.log(`🚀 Schnell-Login für: ${user.name}`);
            showNotification(`✅ Angemeldet als ${user.name} (Schnell-Login)`, 'success');
            return loginUser(user, true);
        } else {
            console.error(`❌ Benutzer ${emailToLogin} nicht gefunden`);
            showNotification(`❌ Schnell-Login für ${emailToLogin} fehlgeschlagen`, 'error');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Schnell-Login:', error);
        showNotification('❌ Schnell-Login fehlgeschlagen', 'error');
        return false;
    }
}

/**
 * Standard Login über Formular
 * @param {Event} event - Form Submit Event
 * @returns {boolean} Erfolg des Logins
 */
function handleLogin(event) {
    event.preventDefault();
    
    try {
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        // Input Validation
        if (!email || !password) {
            showNotification('❌ Bitte E-Mail und Passwort eingeben!', 'error');
            return false;
        }
        
        if (!isValidEmail(email)) {
            showNotification('❌ Ungültige E-Mail Adresse!', 'error');
            return false;
        }
        
        // Find user
        const user = siteUsers.find(u => u.email === email);
        
        if (!user) {
            console.log(`❌ Login-Versuch für unbekannte E-Mail: ${email}`);
            showNotification('❌ Ungültige E-Mail oder Passwort!', 'error');
            trackFailedLogin(email);
            return false;
        }
        
        // Check password
        if (!validatePassword(user, password)) {
            console.log(`❌ Falsches Passwort für: ${email}`);
            showNotification('❌ Ungültige E-Mail oder Passwort!', 'error');
            trackFailedLogin(email);
            return false;
        }
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        saveSiteUsersToStorage();
        
        console.log(`✅ Erfolgreicher Login: ${user.name} (${user.role})`);
        showNotification(`✅ Willkommen ${user.name}!`, 'success');
        
        // Remember me functionality
        if (rememberMe) {
            saveRememberMeToken(user);
        }
        
        return loginUser(user, false);
        
    } catch (error) {
        console.error('❌ Fehler beim Login:', error);
        showNotification('❌ Login fehlgeschlagen', 'error');
        return false;
    }
}

/**
 * Führt den eigentlichen Login durch
 * @param {Object} userObject - Benutzer Objekt
 * @param {boolean} isQuickLogin - Ist es ein Schnell-Login?
 * @returns {boolean} Erfolg des Logins
 */
function loginUser(userObject, isQuickLogin = false) {
    try {
        currentUser = userObject;
        isAuthenticated = true;
        
        // Start session timeout
        startSessionTimeout();
        
        // Update UI
        setTimeout(() => {
            // Hide login screen
            const loginScreen = document.getElementById('loginScreen');
            const mainApp = document.getElementById('mainApp');
            
            if (loginScreen && mainApp) {
                loginScreen.style.display = 'none';
                mainApp.style.display = 'block';
            }
            
            // Update user info
            updateUserInterface();
            
            // Show admin tab if admin
            toggleAdminAccess();
            
            // Load user data
            initializeUserSession();
            
            // Reset login form
            if (!isQuickLogin) {
                const loginForm = document.getElementById('loginForm');
                if (loginForm) loginForm.reset();
            }
            
            // Navigate to dashboard
            showTab('dashboard');
            
        }, 800);
        
        // Track successful login
        trackSuccessfulLogin(userObject);
        
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Benutzer-Login:', error);
        return false;
    }
}

/**
 * =================================================================
 * LOGOUT FUNCTIONS
 * =================================================================
 */

/**
 * Meldet den Benutzer ab
 * @param {boolean} showMessage - Abmelde-Nachricht anzeigen?
 * @returns {boolean} Erfolg des Logouts
 */
function logout(showMessage = true) {
    try {
        if (showMessage) {
            showNotification('👋 Abgemeldet', 'info');
        }
        
        // Clear session
        clearSession();
        
        setTimeout(() => {
            // Show login screen
            const loginScreen = document.getElementById('loginScreen');
            const mainApp = document.getElementById('mainApp');
            
            if (loginScreen && mainApp) {
                mainApp.style.display = 'none';
                loginScreen.style.display = 'block';
            }
            
            // Reset forms
            const loginForm = document.getElementById('loginForm');
            if (loginForm) loginForm.reset();
            
            // Hide admin tab
            const adminTab = document.getElementById('adminTabButton');
            if (adminTab) adminTab.style.display = 'none';
            
        }, showMessage ? 1000 : 0);
        
        console.log('✅ Benutzer abgemeldet');
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Logout:', error);
        return false;
    }
}

/**
 * Löscht die aktuelle Session
 */
function clearSession() {
    currentUser = null;
    isAuthenticated = false;
    
    // Clear session timeout
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        sessionTimeout = null;
    }
    
    // Clear remember me token
    localStorage.removeItem('ticketSystemRememberToken');
    
    console.log('🗑️ Session gelöscht');
}

/**
 * =================================================================
 * SESSION MANAGEMENT
 * =================================================================
 */

/**
 * Startet Session-Timeout
 */
function startSessionTimeout() {
    // Clear existing timeout
    if (sessionTimeout) {
        clearTimeout(sessionTimeout);
    }
    
    // Set warning timeout (5 minutes before logout)
    const warningTime = (SESSION_CONFIG.TIMEOUT_MINUTES - SESSION_CONFIG.WARNING_MINUTES) * 60 * 1000;
    const logoutTime = SESSION_CONFIG.TIMEOUT_MINUTES * 60 * 1000;
    
    setTimeout(() => {
        if (isAuthenticated) {
            showSessionWarning();
        }
    }, warningTime);
    
    // Set logout timeout
    sessionTimeout = setTimeout(() => {
        if (isAuthenticated) {
            console.log('⏰ Session-Timeout erreicht');
            showNotification('⏰ Session abgelaufen - automatisch abgemeldet', 'info');
            logout(false);
        }
    }, logoutTime);
}

/**
 * Zeigt Session-Warnung
 */
function showSessionWarning() {
    const shouldExtend = confirm(
        `Ihre Session läuft in ${SESSION_CONFIG.WARNING_MINUTES} Minuten ab.\n\n` +
        'Möchten Sie die Session verlängern?'
    );
    
    if (shouldExtend) {
        extendSession();
    }
}

/**
 * Verlängert die aktuelle Session
 */
function extendSession() {
    if (isAuthenticated) {
        startSessionTimeout();
        showNotification('✅ Session verlängert', 'success');
        console.log('🔄 Session verlängert');
    }
}

/**
 * =================================================================
 * USER MANAGEMENT FUNCTIONS
 * =================================================================
 */

/**
 * Erstellt einen neuen Benutzer
 * @param {Event} event - Form Submit Event
 * @returns {boolean} Erfolg der Erstellung
 */
function handleCreateUser(event) {
    event.preventDefault();
    
    try {
        const name = document.getElementById('newUserName').value.trim();
        const email = document.getElementById('newUserEmail').value.trim().toLowerCase();
        const password = document.getElementById('newUserPassword').value;
        const role = document.getElementById('newUserRole').value;
        
        // Validation
        if (!name || !email || !password || !role) {
            showNotification('❌ Bitte alle Felder ausfüllen.', 'error');
            return false;
        }
        
        if (!isValidEmail(email)) {
            showNotification('❌ Ungültige E-Mail Adresse.', 'error');
            return false;
        }
        
        if (password.length < 6) {
            showNotification('❌ Passwort muss mindestens 6 Zeichen lang sein.', 'error');
            return false;
        }
        
        if (siteUsers.find(user => user.email === email)) {
            showNotification('❌ Ein Benutzer mit dieser E-Mail existiert bereits.', 'error');
            return false;
        }
        
        // Create user
        const newUser = {
            name: name,
            email: email,
            password: password, // In production: hash this!
            role: role,
            createdAt: new Date().toISOString(),
            createdBy: currentUser ? currentUser.email : 'system',
            lastLogin: null
        };
        
        siteUsers.push(newUser);
        saveSiteUsersToStorage();
        
        showNotification(`✅ Benutzer "${name}" erfolgreich angelegt.`, 'success');
        console.log(`✅ Neuer Benutzer erstellt: ${name} (${email})`);
        
        // Reset form
        document.getElementById('createUserForm').reset();
        
        // Refresh user list
        if (typeof displaySiteUsers === 'function') {
            displaySiteUsers();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Erstellen des Benutzers:', error);
        showNotification('❌ Fehler beim Erstellen des Benutzers', 'error');
        return false;
    }
}

/**
 * Bestätigt Benutzer-Löschung
 * @param {string} email - E-Mail des zu löschenden Benutzers
 */
function confirmDeleteSiteUser(email) {
    try {
        const userToDelete = siteUsers.find(user => user.email === email);
        if (!userToDelete) {
            showNotification('❌ Benutzer nicht gefunden', 'error');
            return;
        }
        
        const confirmationMessage = 
            `Möchten Sie den Benutzer "${userToDelete.name}" (${userToDelete.email}) wirklich löschen?\n\n` +
            'Diese Aktion kann nicht rückgängig gemacht werden.';
        
        if (window.confirm(confirmationMessage)) {
            deleteSiteUser(email);
        }
        
    } catch (error) {
        console.error('❌ Fehler bei Lösch-Bestätigung:', error);
    }
}

/**
 * Löscht einen Benutzer
 * @param {string} email - E-Mail des zu löschenden Benutzers
 * @returns {boolean} Erfolg der Löschung
 */
function deleteSiteUser(email) {
    try {
        const userToDelete = siteUsers.find(u => u.email === email);
        
        if (!userToDelete) {
            showNotification('❌ Benutzer nicht gefunden', 'error');
            return false;
        }
        
        // Protect main admin
        if (userToDelete.email === 'admin@firma.de') {
            showNotification('❌ Der Hauptadministrator kann nicht gelöscht werden.', 'error');
            return false;
        }
        
        // Prevent self-deletion
        if (currentUser && userToDelete.email === currentUser.email) {
            showNotification('❌ Sie können sich nicht selbst löschen.', 'error');
            return false;
        }
        
        // Remove user
        siteUsers = siteUsers.filter(user => user.email !== email);
        saveSiteUsersToStorage();
        
        showNotification(`🗑️ Benutzer "${userToDelete.name}" gelöscht.`, 'success');
        console.log(`🗑️ Benutzer gelöscht: ${userToDelete.name} (${email})`);
        
        // Refresh user list
        if (typeof displaySiteUsers === 'function') {
            displaySiteUsers();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Löschen des Benutzers:', error);
        showNotification('❌ Fehler beim Löschen des Benutzers', 'error');
        return false;
    }
}

/**
 * =================================================================
 * AUTHORIZATION FUNCTIONS
 * =================================================================
 */

/**
 * Prüft ob Benutzer berechtigt ist
 * @param {string|Array} requiredRole - Erforderliche Rolle(n)
 * @returns {boolean} Berechtigung vorhanden
 */
function hasPermission(requiredRole) {
    if (!isAuthenticated || !currentUser) {
        return false;
    }
    
    if (Array.isArray(requiredRole)) {
        return requiredRole.includes(currentUser.role);
    }
    
    return currentUser.role === requiredRole;
}

/**
 * Prüft Admin-Berechtigung
 * @returns {boolean} Ist Admin
 */
function isAdmin() {
    return hasPermission('admin');
}

/**
 * Zeigt/versteckt Admin-Tab basierend auf Berechtigung
 */
function toggleAdminAccess() {
    const adminTabButton = document.getElementById('adminTabButton');
    
    if (adminTabButton) {
        adminTabButton.style.display = isAdmin() ? 'block' : 'none';
    }
}

/**
 * Aktualisiert die Benutzeroberfläche nach Login
 */
function updateUserInterface() {
    const userInfo = document.getElementById('userInfo');
    
    if (userInfo && currentUser) {
        userInfo.textContent = `Angemeldet als: ${currentUser.name} (${currentUser.role})`;
    }
}

/**
 * =================================================================
 * VALIDATION FUNCTIONS
 * =================================================================
 */

/**
 * Validiert E-Mail Adresse
 * @param {string} email - E-Mail Adresse
 * @returns {boolean} Gültige E-Mail
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validiert Passwort
 * @param {Object} user - Benutzer Objekt
 * @param {string} password - Eingegebenes Passwort
 * @returns {boolean} Passwort korrekt
 */
function validatePassword(user, password) {
    // In production: use proper password hashing (bcrypt, etc.)
    return user.password === password;
}

/**
 * =================================================================
 * REMEMBER ME FUNCTIONS
 * =================================================================
 */

/**
 * Speichert Remember-Me Token
 * @param {Object} user - Benutzer Objekt
 */
function saveRememberMeToken(user) {
    try {
        const token = {
            email: user.email,
            expires: new Date(Date.now() + SESSION_CONFIG.REMEMBER_DAYS * 24 * 60 * 60 * 1000).toISOString(),
            hash: btoa(user.email + user.password) // Simple hash - use JWT in production
        };
        
        localStorage.setItem('ticketSystemRememberToken', JSON.stringify(token));
        console.log(`💾 Remember-Me Token gespeichert für: ${user.email}`);
        
    } catch (error) {
        console.error('❌ Fehler beim Speichern des Remember-Me Tokens:', error);
    }
}

/**
 * Prüft Remember-Me Token beim Laden
 * @returns {boolean} Automatischer Login erfolgreich
 */
function checkRememberMeToken() {
    try {
        const tokenData = localStorage.getItem('ticketSystemRememberToken');
        
        if (!tokenData) {
            return false;
        }
        
        const token = JSON.parse(tokenData);
        
        // Check if token is expired
        if (new Date() > new Date(token.expires)) {
            localStorage.removeItem('ticketSystemRememberToken');
            console.log('⏰ Remember-Me Token abgelaufen');
            return false;
        }
        
        // Find user
        const user = siteUsers.find(u => u.email === token.email);
        
        if (!user) {
            localStorage.removeItem('ticketSystemRememberToken');
            console.log('❌ Remember-Me Benutzer nicht gefunden');
            return false;
        }
        
        // Validate token hash
        if (token.hash !== btoa(user.email + user.password)) {
            localStorage.removeItem('ticketSystemRememberToken');
            console.log('❌ Remember-Me Token ungültig');
            return false;
        }
        
        console.log(`🔄 Automatischer Login via Remember-Me: ${user.name}`);
        return loginUser(user, true);
        
    } catch (error) {
        console.error('❌ Fehler beim Remember-Me Check:', error);
        localStorage.removeItem('ticketSystemRememberToken');
        return false;
    }
}

/**
 * =================================================================
 * SECURITY FUNCTIONS
 * =================================================================
 */

/**
 * Verfolgt fehlgeschlagene Login-Versuche
 * @param {string} email - E-Mail Adresse
 */
function trackFailedLogin(email) {
    const key = 'ticketSystemFailedLogins';
    const now = Date.now();
    
    try {
        let failedLogins = JSON.parse(localStorage.getItem(key) || '{}');
        
        if (!failedLogins[email]) {
            failedLogins[email] = [];
        }
        
        failedLogins[email].push(now);
        
        // Keep only last 10 failed attempts
        failedLogins[email] = failedLogins[email].slice(-10);
        
        localStorage.setItem(key, JSON.stringify(failedLogins));
        
        // Check for brute force
        const recentFailures = failedLogins[email].filter(time => now - time < 15 * 60 * 1000); // 15 minutes
        
        if (recentFailures.length >= 5) {
            console.warn(`⚠️ Viele fehlgeschlagene Login-Versuche für: ${email}`);
            showNotification('⚠️ Zu viele fehlgeschlagene Versuche. Versuchen Sie es später erneut.', 'error');
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Tracking fehlgeschlagener Logins:', error);
    }
}

/**
 * Verfolgt erfolgreiche Logins
 * @param {Object} user - Benutzer Objekt
 */
function trackSuccessfulLogin(user) {
    console.log(`📊 Login-Tracking: ${user.name} (${user.email}) um ${new Date().toLocaleString('de-DE')}`);
    
    // Clear failed login attempts
    try {
        const key = 'ticketSystemFailedLogins';
        let failedLogins = JSON.parse(localStorage.getItem(key) || '{}');
        delete failedLogins[user.email];
        localStorage.setItem(key, JSON.stringify(failedLogins));
    } catch (error) {
        console.error('❌ Fehler beim Löschen der Failed-Login Daten:', error);
    }
}

/**
 * =================================================================
 * INITIALIZATION FUNCTIONS
 * =================================================================
 */

/**
 * Initialisiert die Benutzer-Session
 */
function initializeUserSession() {
    try {
        // Load user-specific data
        if (typeof displayTickets === 'function') {
            displayTickets();
        }
        
        if (typeof updateStats === 'function') {
            updateStats();
        }
        
        if (typeof displaySiteUsers === 'function' && isAdmin()) {
            displaySiteUsers();
        }
        
        console.log(`✅ Session initialisiert für: ${currentUser.name}`);
        
    } catch (error) {
        console.error('❌ Fehler bei Session-Initialisierung:', error);
    }
}

/**
 * Initialisiert das Auth-System
 * @returns {boolean} Erfolg der Initialisierung
 */
function initializeAuthSystem() {
    try {
        console.log('🔐 Initialisiere Authentication-System...');
        
        // Check for remember me token
        setTimeout(() => {
            if (!isAuthenticated) {
                checkRememberMeToken();
            }
        }, 500);
        
        console.log('✅ Authentication-System bereit');
        return true;
        
    } catch (error) {
        console.error('❌ Fehler bei Auth-Initialisierung:', error);
        return false;
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuthSystem);
    } else {
        initializeAuthSystem();
    }
}