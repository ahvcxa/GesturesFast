// src/extension/background/background.ts

const DEFAULT_SETTINGS = {
    customGestures: { 
        "DR": "CloseTab", 
        "L": "GoBack", 
        "R": "GoForward",
        "U": "ScrollUp",
        "D": "ScrollDown",
        "RD": "ScrollBottom",
        "RU": "ScrollTop",
        "UD": "Reload",
        "UL": "PreviousTab"
    },
    triggerButton: 2, // right click default
    showOverlay: true,
    arrowColor: "#008cff",
    overlayBgColor: "#000000",
    blacklistedDomains: []
};

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.storage.local.set(DEFAULT_SETTINGS, () => {
            console.log("GesturesFast: Default settings initialized.");
        });
    } else if (details.reason === "update") {
        chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS), (existing) => {
            const missingSettings: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
                if (existing[key] === undefined) {
                    missingSettings[key] = value;
                }
            }
            if (Object.keys(missingSettings).length > 0) {
                chrome.storage.local.set(missingSettings);
            }
        });
    }
});


let userGestures: Record<string, string> = { ...DEFAULT_SETTINGS.customGestures };
let currentTabId: number | null = null;
let previousTabId: number | null = null;

const stateReady = new Promise<void>((resolve) => {
    chrome.storage.local.get(['customGestures'], (localResult) => {
        if (localResult.customGestures) {
            userGestures = localResult.customGestures;
        }
        chrome.storage.session.get(['currentTabId', 'previousTabId'], (sessionResult) => {
            if (typeof sessionResult.currentTabId === 'number') {
                currentTabId = sessionResult.currentTabId;
            }
            if (typeof sessionResult.previousTabId === 'number') {
                previousTabId = sessionResult.previousTabId;
            }
            if (currentTabId === null) {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id !== undefined) {
                        currentTabId = tabs[0].id;
                        chrome.storage.session.set({ currentTabId });
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    stateReady.then(() => {
        if (currentTabId !== activeInfo.tabId) {
            previousTabId = currentTabId;
            currentTabId = activeInfo.tabId;
            chrome.storage.session.set({ currentTabId, previousTabId });
        }
    });
});

chrome.tabs.onRemoved.addListener((removedTabId) => {
    stateReady.then(() => {
        if (previousTabId === removedTabId) {
            previousTabId = null;
            chrome.storage.session.set({ previousTabId: null });
        }
    });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.customGestures?.newValue) {
        userGestures = changes.customGestures.newValue;
    }
});

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'options.html' });
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'PROCESS_GESTURE' && message.payload?.sequence) {
        const tabId = sender.tab?.id;
        const { sequence, x, y } = message.payload;
        stateReady.then(() => {
            const actionName = userGestures[sequence];
            if (actionName) {
                executeAction(actionName, tabId, x, y);
            }
        });
    }
});

function executeAction(actionName: string, tabId?: number, x?: number, y?: number) {
    switch (actionName) {
        case "CloseTab":
            if (tabId) chrome.tabs.remove(tabId);
            break;
        case "GoBack":
            if (tabId) chrome.tabs.goBack(tabId).catch(() => { });
            break;
        case "GoForward":
            if (tabId) chrome.tabs.goForward(tabId).catch(() => { });
            break;
        case "Reload":
            if (tabId) chrome.tabs.reload(tabId);
            break;
        case "PreviousTab":
            if (previousTabId !== null) {
                chrome.tabs.update(previousTabId, { active: true }).catch(() => {
                    previousTabId = null;
                    chrome.storage.session.set({ previousTabId: null });
                });
            }
            break;
        case "NewTab":
            chrome.tabs.create({});
            break;
        case "PinTab":
            if (tabId) {
                chrome.tabs.get(tabId, (tab) => {
                    chrome.tabs.update(tabId, { pinned: !tab.pinned });
                });
            }
            break;


        case "ReopenTab":
            chrome.sessions.restore();
            break;
        case "ScrollTop":
        case "ScrollBottom":
        case "ScrollUp":
        case "ScrollDown":
            if (tabId && x !== undefined && y !== undefined) {
                chrome.tabs.sendMessage(tabId, { type: 'PAGE_ACTION', action: actionName, x, y }).catch(() => { });
            }
            break;
        default:
            break;
    }
}