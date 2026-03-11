// Dosya: src/extension/background/background.ts

import { GestureRecognizer, Point } from '../../../core/domain/recognizer';

// 1. Tanıma Motorunu Başlat
const recognizer = new GestureRecognizer();

// 2. MVP için Varsayılan Şablonları (Templates) Yükle
// Gerçek dünyada bu koordinatlar kullanıcının çizdiği örneklerden (UI üzerinden) elde edilir.
// Şimdilik basit geometrik şekillerle simüle ediyoruz.
recognizer.addTemplate("CloseTab", [
    new Point(0, 0), new Point(0, 100), new Point(100, 100) // "L" Şekli
]);

recognizer.addTemplate("GoBack", [
    new Point(100, 50), new Point(0, 50), new Point(50, 0) // Sola Ok "<" Şekli
]);

recognizer.addTemplate("GoForward", [
    new Point(0, 50), new Point(100, 50), new Point(50, 0) // Sağa Ok ">" Şekli
]);

recognizer.addTemplate("Reload", [
    new Point(50, 0), new Point(100, 50), new Point(50, 100), new Point(0, 50), new Point(50, 0) // Çember Şekli
]);

const MIN_MATCH_SCORE = 0.80; // %80 benzerlik eşiği

// 3. Content Script'ten gelen mesajları dinle
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'PROCESS_GESTURE' && message.payload.points) {
        const points: Point[] = message.payload.points;

        // Motoru çalıştır
        const result = recognizer.recognize(points);

        console.log(`[Gesture Engine] Tespit: ${result.name} (Skor: ${(result.score * 100).toFixed(2)}%, Süre: ${result.timeMs.toFixed(2)}ms)`);

        // Eğer güven skoru yeterliyse aksiyonu tetikle
        if (result.score >= MIN_MATCH_SCORE && result.name !== "Bilinmiyor") {
            executeAction(result.name, sender.tab?.id);
        }
    }
});

// 4. Eşleşen jestlere göre Chrome API aksiyonlarını çalıştır
function executeAction(actionName: string, tabId?: number) {
    if (!tabId) return;

    switch (actionName) {
        case "CloseTab":
            chrome.tabs.remove(tabId);
            break;
        case "GoBack":
            // Bazı özel sayfalarda geri gidilemeyebilir, hata yakalama (catch) önemlidir.
            chrome.tabs.goBack(tabId).catch(() => console.log("Geri gidilecek sayfa yok."));
            break;
        case "GoForward":
            chrome.tabs.goForward(tabId).catch(() => console.log("İleri gidilecek sayfa yok."));
            break;
        case "Reload":
            chrome.tabs.reload(tabId);
            break;
        default:
            console.warn("Eşleşen aksiyon için bir komut bulunamadı:", actionName);
    }
}