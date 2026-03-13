// src/extension/background/background.ts

let userGestures: Record<string, string> = {};

chrome.storage.local.get(['customGestures'], (result) => {
    if (result.customGestures) {
        userGestures = result.customGestures;
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.customGestures) {
        userGestures = changes.customGestures.newValue;
    }
});

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'options.html' });
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'PROCESS_GESTURE' && message.payload.sequence) {
        const actionName = userGestures[message.payload.sequence];
        if (actionName) {
            executeAction(actionName, sender.tab?.id, message.payload.x, message.payload.y);
        }
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