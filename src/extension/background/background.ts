// Dosya: src/extension/background/background.ts

let userGestures: Record<string, string> = {};

chrome.storage.local.get(['customGestures'], (result) => {
    if (result.customGestures) {
        userGestures = result.customGestures;
    } else {
        // Varsayılanlara yeni aksiyonları da örnek olarak ekleyebiliriz
        userGestures = { "DR": "CloseTab", "L": "GoBack", "R": "GoForward", "UD": "Reload", "U": "ScrollTop", "D": "ScrollBottom" };
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.customGestures) {
        userGestures = changes.customGestures.newValue;
    }
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'PROCESS_GESTURE' && message.payload.sequence) {
        const actionName = userGestures[message.payload.sequence];
        if (actionName) {
            executeAction(actionName, sender.tab?.id);
        }
    }
});

function executeAction(actionName: string, tabId?: number) {
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
            // Son kapanan sekmeyi veya pencereyi geri yükler
            chrome.sessions.restore();
            break;
        case "ScrollTop":
        case "ScrollBottom":
            // Bu komutları sayfaya (content script'e) iletiyoruz
            if (tabId) {
                chrome.tabs.sendMessage(tabId, { type: 'PAGE_ACTION', action: actionName }).catch(() => { });
            }
            break;
    }
}

// Eklenti ikonuna tıklandığında ayarlar sayfasını yeni bir sekmede tam ekran aç
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'options.html' });
});