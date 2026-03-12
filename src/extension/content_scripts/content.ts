// Dosya: src/extension/content_scripts/content.ts
import { getDirections } from '../../core/domain/recognizer';

class GestureTracker {
    private isDrawing = false;
    private hasMoved = false;
    private isCancelled = false;
    private points: { x: number, y: number }[] = [];
    private overlay: HTMLDivElement;

    constructor() {
        this.overlay = this.createOverlay();
        this.bindEvents();
    }

    private createOverlay() {
        const div = document.createElement('div');
        div.id = 'gesturesfast-overlay';
        div.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-size: 6rem; font-weight: bold; color: #3b82f6; z-index: 2147483647;
      pointer-events: none; text-shadow: 0px 10px 20px rgba(0,0,0,0.3);
      background: rgba(255,255,255,0.9); padding: 10px 30px; border-radius: 20px;
      display: none; gap: 10px; transition: none;
    `;
        document.documentElement.appendChild(div);
        return div;
    }

    private bindEvents() {
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    private onMouseDown(e: MouseEvent) {
        if (e.button !== 1) return;

        this.isDrawing = true;
        this.hasMoved = false;
        this.isCancelled = false;
        this.points = [{ x: e.clientX, y: e.clientY }];

        this.overlay.style.display = 'none';
        this.overlay.innerText = '';
    }

    private onMouseMove(e: MouseEvent) {
        if (!this.isDrawing || this.isCancelled) return;

        const startPt = this.points[0];
        const dx = e.clientX - startPt.x;
        const dy = e.clientY - startPt.y;

        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            this.hasMoved = true;
            e.preventDefault();
        }

        if (this.hasMoved) {
            this.points.push({ x: e.clientX, y: e.clientY });
            const sequence = getDirections(this.points);

            if (sequence.length > 0) {
                const arrows = sequence.split('').map(char => {
                    if (char === 'U') return '↑';
                    if (char === 'D') return '↓';
                    if (char === 'L') return '←';
                    return '→';
                }).join('');

                this.overlay.innerText = arrows;
                this.overlay.style.display = 'flex';
            }
        }
    }

    private onMouseUp(e: MouseEvent) {
        if (e.button !== 1 || !this.isDrawing) return;
        this.isDrawing = false;

        this.overlay.style.display = 'none';
        this.overlay.innerText = '';

        if (this.hasMoved && !this.isCancelled) {
            const sequence = getDirections(this.points);
            if (sequence) {
                this.sendGesture(sequence);
            }
        }
    }

    private onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' && this.isDrawing) {
            this.isCancelled = true;
            this.isDrawing = false;
            this.overlay.style.display = 'none';
            this.overlay.innerText = '';
        }
    }

    private sendGesture(sequence: string) {
        if (chrome && chrome.runtime) {
            // KRİTİK DEĞİŞİKLİK: Jesti başlattığımız ilk noktanın (x, y) koordinatlarını gönderiyoruz
            const startPoint = this.points[0];
            chrome.runtime.sendMessage({
                type: 'PROCESS_GESTURE',
                payload: { sequence, x: startPoint.x, y: startPoint.y }
            });
        }
    }
}

new GestureTracker();


// --- BAĞLAMA DUYARLI (CONTEXT-AWARE) KAYDIRMA MOTORU ---

// Farenin altındaki en derin elementi (Shadow DOM içindekiler dahil) bulan fonksiyon
function getDeepElementFromPoint(x: number, y: number): Element | null {
    let el = document.elementFromPoint(x, y);
    while (el && el.shadowRoot) {
        const shadowEl = el.shadowRoot.elementFromPoint(x, y);
        if (!shadowEl || shadowEl === el) break;
        el = shadowEl;
    }
    return el;
}

// Elementten başlayarak DOM ağacında yukarı tırmanıp ilk "kaydırılabilir" ebeveyni bulan fonksiyon
function getScrollableParent(element: Element | null): HTMLElement | null {
    let current = element;

    while (current) {
        // Eğer en tepeye ulaştıysak ana sayfayı döndür
        if (current === document.body || current === document.documentElement) {
            return (document.scrollingElement as HTMLElement) || document.body;
        }

        const htmlEl = current as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        const overflowY = style.overflowY;

        // Elementin CSS'i kaydırmaya izin veriyor mu?
        const isScrollableCSS = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay');

        // İçerik elementin kendi boyundan uzun mu? (Gerçekten kaydırılacak bir şey var mı?)
        if (isScrollableCSS && htmlEl.scrollHeight > htmlEl.clientHeight) {
            return htmlEl;
        }

        // Bulamadıysak bir üst ebeveyne (parent) geç. Shadow DOM'daysak Gölge Sahibine (host) atla.
        if (current.parentElement) {
            current = current.parentElement;
        } else if (current.getRootNode() instanceof ShadowRoot) {
            current = (current.getRootNode() as ShadowRoot).host;
        } else {
            current = null;
        }
    }

    // Hiçbir şey bulamazsa varsayılan olarak ana sayfayı kaydır
    return (document.scrollingElement as HTMLElement) || document.body;
}

function smartScroll(direction: 'top' | 'bottom', x: number, y: number) {
    // 1. Farenin altındaki spesifik elementi bul
    const targetElement = getDeepElementFromPoint(x, y);

    // 2. O elementin içinde bulunduğu kaydırılabilir kutuyu (veya ana sayfayı) bul
    const scrollContainer = getScrollableParent(targetElement);

    // 3. Bulunan spesifik alanı kaydır
    if (scrollContainer) {
        scrollContainer.scrollTo({
            top: direction === 'bottom' ? scrollContainer.scrollHeight : 0,
            behavior: 'smooth'
        });
    }
}

// Arka plandan gelen koordinatlı sayfa içi komutları dinle
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PAGE_ACTION') {
        if (message.action === 'ScrollTop') {
            smartScroll('top', message.x, message.y);
        } else if (message.action === 'ScrollBottom') {
            smartScroll('bottom', message.x, message.y);
        }
    }
});