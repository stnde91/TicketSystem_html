/* =================================================================
   TICKET SYSTEM PRO - STORAGE JS
   LocalStorage Management für Tickets, Users und Einstellungen
   ================================================================= */

// Storage Keys - Zentrale Definition
const STORAGE_KEYS = {
    TICKETS: 'ticketSystemTickets',
    USERS: 'ticketSystemSiteUsers', 
    COUNTER: 'ticketSystemCounter',
    SETTINGS: 'ticketSystemSettings',
    VERSION: 'ticketSystemVersion'
};

// Current App Version
const APP_VERSION = '1.0.0';

// Global Storage Variables
let tickets = [];
let siteUsers = [];
let ticketCounter = 1;
let appSettings = {};

/**
 * =================================================================
 * TICKET STORAGE FUNCTIONS
 * =================================================================
 */

/**
 * Speichert alle Tickets im LocalStorage
 * @returns {boolean} Erfolg der Speicherung
 */
function saveTicketsToStorage() {
    try {
        const ticketsData = {
            tickets: tickets,
            counter: ticketCounter,
            timestamp: new Date().toISOString(),
            version: APP_VERSION
        };
        
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(ticketsData));
        localStorage.setItem(STORAGE_KEYS.COUNTER, ticketCounter.toString());
        
        console.log(`✅ ${tickets.length} Tickets gespeichert (Counter: ${ticketCounter})`);
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Tickets:', error);
        
        // Quota exceeded handling
        if (error.name === 'QuotaExceededError') {
            showNotification('⚠️ Speicher voll! Ältere Daten werden gelöscht...', 'error');
            cleanupOldData();
            return saveTicketsToStorage(); // Retry after cleanup
        }
        
        showNotification('⚠️ Tickets konnten nicht gespeichert werden', 'error');
        return false;
    }
}

/**
 * Lädt alle Tickets aus dem LocalStorage
 * @returns {boolean} Erfolg des Ladens
 */
function loadTicketsFromStorage() {
    try {
        const savedTickets = localStorage.getItem(STORAGE_KEYS.TICKETS);
        const savedCounter = localStorage.getItem(STORAGE_KEYS.COUNTER);
        
        if (savedTickets) {
            const ticketsData = JSON.parse(savedTickets);
            
            // Version check und Migration
            if (ticketsData.version && ticketsData.version !== APP_VERSION) {
                console.log(`🔄 Migriere Tickets von Version ${ticketsData.version} zu ${APP_VERSION}`);
                tickets = migrateTickets(ticketsData.tickets || ticketsData);
            } else {
                tickets = ticketsData.tickets || ticketsData;
            }
            
            // Validate ticket structure
            tickets = tickets.map(ticket => validateTicketStructure(ticket));
            
            console.log(`✅ ${tickets.length} Tickets geladen`);
        } else {
            console.log('ℹ️ Keine gespeicherten Tickets gefunden');
            tickets = [];
        }
        
        if (savedCounter) {
            ticketCounter = Math.max(parseInt(savedCounter), getHighestTicketId() + 1);
            console.log(`✅ Ticket-Counter: ${ticketCounter}`);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Tickets:', error);
        tickets = [];
        ticketCounter = 1;
        showNotification('⚠️ Tickets konnten nicht geladen werden', 'error');
        return false;
    }
}

/**
 * Validiert und repariert Ticket-Struktur
 * @param {Object} ticket - Ticket Objekt
 * @returns {Object} Validiertes Ticket
 */
function validateTicketStructure(ticket) {
    // Ensure all required fields exist
    const validatedTicket = {
        id: ticket.id || Date.now(),
        kundenName: ticket.kundenName || 'Unbekannt',
        firma: ticket.firma || 'Unbekannt',
        telefon: ticket.telefon || '',
        kundenEmail: ticket.kundenEmail || '',
        zugewiesen: ticket.zugewiesen || '',
        gruppe: ticket.gruppe || 'Software',
        prioritaet: ticket.prioritaet || 'Normal',
        stoerung: ticket.stoerung || 'Keine Beschreibung',
        kategorie: ticket.kategorie || '',
        status: ticket.status || 'Offen',
        ersteller: ticket.ersteller || 'System',
        erstelltAm: ticket.erstelltAm || new Date().toLocaleString('de-DE'),
        kommentare: Array.isArray(ticket.kommentare) ? ticket.kommentare : []
    };
    
    // Validate comments structure
    validatedTicket.kommentare = validatedTicket.kommentare.map(comment => ({
        author: comment.author || 'System',
        date: comment.date || new Date().toLocaleString('de-DE'),
        text: comment.text || ''
    }));
    
    return validatedTicket;
}

/**
 * Findet die höchste Ticket-ID
 * @returns {number} Höchste ID
 */
function getHighestTicketId() {
    if (tickets.length === 0) return 0;
    return Math.max(...tickets.map(ticket => ticket.id || 0));
}

/**
 * =================================================================
 * USER STORAGE FUNCTIONS
 * =================================================================
 */

/**
 * Speichert alle Benutzer im LocalStorage
 * @returns {boolean} Erfolg der Speicherung
 */
function saveSiteUsersToStorage() {
    try {
        const usersData = {
            users: siteUsers,
            timestamp: new Date().toISOString(),
            version: APP_VERSION
        };
        
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersData));
        
        console.log(`✅ ${siteUsers.length} Benutzer gespeichert`);
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Benutzer:', error);
        showNotification('⚠️ Benutzer konnten nicht gespeichert werden', 'error');
        return false;
    }
}

/**
 * Lädt alle Benutzer aus dem LocalStorage
 * @returns {boolean} Erfolg des Ladens
 */
function loadSiteUsersFromStorage() {
    try {
        const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        
        if (savedUsers) {
            const usersData = JSON.parse(savedUsers);
            
            // Version check und Migration
            if (usersData.version && usersData.version !== APP_VERSION) {
                console.log(`🔄 Migriere Benutzer von Version ${usersData.version} zu ${APP_VERSION}`);
                siteUsers = migrateUsers(usersData.users || usersData);
            } else {
                siteUsers = usersData.users || usersData;
            }
            
            // Validate user structure
            siteUsers = siteUsers.map(user => validateUserStructure(user));
            
            console.log(`✅ ${siteUsers.length} Benutzer geladen`);
        } else {
            console.log('ℹ️ Keine gespeicherten Benutzer gefunden - Erstelle Standard-Benutzer');
            siteUsers = createDefaultUsers();
            saveSiteUsersToStorage();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Benutzer:', error);
        siteUsers = createDefaultUsers();
        showNotification('⚠️ Standard-Benutzer wurden erstellt', 'info');
        return false;
    }
}

/**
 * Erstellt Standard-Benutzer
 * @returns {Array} Standard-Benutzer Array
 */
function createDefaultUsers() {
    return [
        { 
            name: 'Administrator', 
            email: 'admin@firma.de', 
            password: 'admin123', 
            role: 'admin',
            createdAt: new Date().toISOString()
        },
        { 
            name: 'Max Schmidt', 
            email: 'max@firma.de', 
            password: 'user123', 
            role: 'user',
            createdAt: new Date().toISOString()
        },
        { 
            name: 'Gast Demo', 
            email: 'gast@demo.de', 
            password: 'guest123', 
            role: 'guest',
            createdAt: new Date().toISOString()
        }
    ];
}

/**
 * Validiert und repariert Benutzer-Struktur
 * @param {Object} user - Benutzer Objekt
 * @returns {Object} Validierter Benutzer
 */
function validateUserStructure(user) {
    return {
        name: user.name || 'Unbekannt',
        email: user.email || 'unknown@example.com',
        password: user.password || 'changeme',
        role: ['admin', 'user', 'guest'].includes(user.role) ? user.role : 'user',
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin || null
    };
}

/**
 * =================================================================
 * SETTINGS STORAGE FUNCTIONS
 * =================================================================
 */

/**
 * Speichert App-Einstellungen
 * @param {Object} settings - Einstellungen Objekt
 * @returns {boolean} Erfolg der Speicherung
 */
function saveSettingsToStorage(settings = {}) {
    try {
        const settingsData = {
            ...appSettings,
            ...settings,
            timestamp: new Date().toISOString(),
            version: APP_VERSION
        };
        
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsData));
        appSettings = settingsData;
        
        console.log('✅ Einstellungen gespeichert:', Object.keys(settingsData));
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Einstellungen:', error);
        return false;
    }
}

/**
 * Lädt App-Einstellungen
 * @returns {Object} Einstellungen Objekt
 */
function loadSettingsFromStorage() {
    try {
        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        
        if (savedSettings) {
            appSettings = JSON.parse(savedSettings);
            console.log('✅ Einstellungen geladen:', Object.keys(appSettings));
        } else {
            appSettings = getDefaultSettings();
            saveSettingsToStorage();
            console.log('ℹ️ Standard-Einstellungen erstellt');
        }
        
        return appSettings;
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Einstellungen:', error);
        appSettings = getDefaultSettings();
        return appSettings;
    }
}

/**
 * Standard-Einstellungen
 * @returns {Object} Standard-Einstellungen
 */
function getDefaultSettings() {
    return {
        theme: 'light',
        language: 'de',
        autoSave: true,
        notifications: true,
        compactView: false,
        debugMode: false
    };
}

/**
 * =================================================================
 * MIGRATION FUNCTIONS
 * =================================================================
 */

/**
 * Migriert Tickets zwischen Versionen
 * @param {Array} oldTickets - Alte Tickets
 * @returns {Array} Migrierte Tickets
 */
function migrateTickets(oldTickets) {
    return oldTickets.map(ticket => {
        // Add new fields if missing
        if (!ticket.kategorie) ticket.kategorie = '';
        if (!ticket.zugewiesen) ticket.zugewiesen = '';
        if (!Array.isArray(ticket.kommentare)) ticket.kommentare = [];
        
        return validateTicketStructure(ticket);
    });
}

/**
 * Migriert Benutzer zwischen Versionen
 * @param {Array} oldUsers - Alte Benutzer
 * @returns {Array} Migrierte Benutzer
 */
function migrateUsers(oldUsers) {
    return oldUsers.map(user => {
        // Add new fields if missing
        if (!user.createdAt) user.createdAt = new Date().toISOString();
        if (!user.role) user.role = 'user';
        
        return validateUserStructure(user);
    });
}

/**
 * =================================================================
 * UTILITY FUNCTIONS
 * =================================================================
 */

/**
 * Bereinigt alte Daten bei Speicher-Überlauf
 */
function cleanupOldData() {
    try {
        // Remove old tickets (keep only last 50)
        if (tickets.length > 50) {
            tickets = tickets
                .sort((a, b) => new Date(b.erstelltAm) - new Date(a.erstelltAm))
                .slice(0, 50);
            
            console.log('🧹 Alte Tickets bereinigt, behalte neueste 50');
        }
        
        // Clear old localStorage entries
        const keysToCheck = Object.keys(localStorage);
        keysToCheck.forEach(key => {
            if (key.includes('ticketSystem') && !Object.values(STORAGE_KEYS).includes(key)) {
                localStorage.removeItem(key);
                console.log('🧹 Veralteter Schlüssel entfernt:', key);
            }
        });
        
    } catch (error) {
        console.error('❌ Fehler bei der Datenbereinigung:', error);
    }
}

/**
 * Exportiert alle Daten als JSON
 * @returns {string} JSON Export
 */
function exportAllData() {
    try {
        const exportData = {
            tickets: tickets,
            users: siteUsers.map(user => ({...user, password: '[PROTECTED]'})), // Don't export passwords
            settings: appSettings,
            version: APP_VERSION,
            exportDate: new Date().toISOString()
        };
        
        return JSON.stringify(exportData, null, 2);
        
    } catch (error) {
        console.error('❌ Fehler beim Datenexport:', error);
        return null;
    }
}

/**
 * Importiert Daten aus JSON
 * @param {string} jsonData - JSON Daten
 * @returns {boolean} Erfolg des Imports
 */
function importAllData(jsonData) {
    try {
        const importData = JSON.parse(jsonData);
        
        if (importData.tickets) {
            tickets = importData.tickets.map(ticket => validateTicketStructure(ticket));
            ticketCounter = getHighestTicketId() + 1;
            saveTicketsToStorage();
        }
        
        if (importData.settings) {
            saveSettingsToStorage(importData.settings);
        }
        
        console.log('✅ Daten erfolgreich importiert');
        showNotification('✅ Daten erfolgreich importiert!', 'success');
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Datenimport:', error);
        showNotification('❌ Fehler beim Datenimport!', 'error');
        return false;
    }
}

/**
 * Prüft verfügbaren Speicherplatz
 * @returns {Object} Speicher-Informationen
 */
function getStorageInfo() {
    try {
        const totalSize = new Blob(Object.values(localStorage)).size;
        const ticketsSize = new Blob([localStorage.getItem(STORAGE_KEYS.TICKETS) || '']).size;
        const usersSize = new Blob([localStorage.getItem(STORAGE_KEYS.USERS) || '']).size;
        
        return {
            totalSize: Math.round(totalSize / 1024), // KB
            ticketsSize: Math.round(ticketsSize / 1024), // KB
            usersSize: Math.round(usersSize / 1024), // KB
            ticketsCount: tickets.length,
            usersCount: siteUsers.length
        };
        
    } catch (error) {
        console.error('❌ Fehler bei Speicher-Analyse:', error);
        return null;
    }
}

/**
 * Löscht alle gespeicherten Daten
 * @returns {boolean} Erfolg der Löschung
 */
function clearAllData() {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Reset variables
        tickets = [];
        siteUsers = [];
        ticketCounter = 1;
        appSettings = {};
        
        console.log('🗑️ Alle Daten gelöscht');
        return true;
        
    } catch (error) {
        console.error('❌ Fehler beim Löschen der Daten:', error);
        return false;
    }
}

/**
 * =================================================================
 * INITIALIZATION
 * =================================================================
 */

/**
 * Initialisiert das Storage-System
 * @returns {boolean} Erfolg der Initialisierung
 */
function initializeStorage() {
    try {
        console.log('🔄 Initialisiere Storage-System...');
        
        // Check localStorage availability
        if (typeof Storage === "undefined") {
            console.error('❌ LocalStorage nicht verfügbar!');
            showNotification('❌ LocalStorage nicht verfügbar!', 'error');
            return false;
        }
        
        // Set version
        localStorage.setItem(STORAGE_KEYS.VERSION, APP_VERSION);
        
        // Load all data
        loadSettingsFromStorage();
        loadSiteUsersFromStorage();
        loadTicketsFromStorage();
        
        console.log('✅ Storage-System initialisiert');
        console.log('📊 Speicher-Info:', getStorageInfo());
        
        return true;
        
    } catch (error) {
        console.error('❌ Fehler bei Storage-Initialisierung:', error);
        return false;
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    // Ensure storage is initialized when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeStorage);
    } else {
        initializeStorage();
    }
}