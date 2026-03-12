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
        // 1. İzole Taşıyıcı (Host) oluştur
        const host = document.createElement('div');
        host.id = 'gesturesfast-host';
        // Host'un kendisi tıklamaları engellememeli ve en üstte görünmez bir katman olmalı
        host.style.cssText = 'position: fixed; z-index: 2147483647; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;';
        document.documentElement.appendChild(host);

        // 2. Gölge Alanı (Shadow Root) yarat - 'closed' modu dışarıdan JS müdahalesini de engeller
        const shadow = host.attachShadow({ mode: 'closed' });

        // 3. Stilleri Sıfırla ve Özel Tasarımı Ekle
        const style = document.createElement('style');
        style.textContent = `
      .overlay {
        all: initial; /* SİHİRLİ SATIR: Sitenin tüm CSS'ini reddeder! */
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 6rem; 
        font-weight: bold; 
        color: #3b82f6; 
        text-shadow: 0px 10px 20px rgba(0,0,0,0.3);
        background: rgba(255,255,255,0.9); 
        padding: 10px 30px; 
        border-radius: 20px;
        display: none; 
        gap: 10px;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
    `;

        // 4. Asıl Ok Kutusu
        const div = document.createElement('div');
        div.className = 'overlay';

        shadow.appendChild(style);
        shadow.appendChild(div);

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
function getDeepElementFromPoint(x: number, y: number): Element | null {
    let el = document.elementFromPoint(x, y);
    while (el && el.shadowRoot) {
        const shadowEl = el.shadowRoot.elementFromPoint(x, y);
        if (!shadowEl || shadowEl === el) break;
        el = shadowEl;
    }
    return el;
}

function getScrollableParent(element: Element | null): HTMLElement | null {
    let current = element;

    while (current) {
        if (current === document.body || current === document.documentElement) {
            return (document.scrollingElement as HTMLElement) || document.body;
        }

        const htmlEl = current as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        const overflowY = style.overflowY;

        const isScrollableCSS = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay');

        if (isScrollableCSS && htmlEl.scrollHeight > htmlEl.clientHeight) {
            return htmlEl;
        }

        if (current.parentElement) {
            current = current.parentElement;
        } else if (current.getRootNode() instanceof ShadowRoot) {
            current = (current.getRootNode() as ShadowRoot).host;
        } else {
            current = null;
        }
    }

    return (document.scrollingElement as HTMLElement) || document.body;
}

function smartScroll(direction: 'top' | 'bottom', x: number, y: number) {
    const targetElement = getDeepElementFromPoint(x, y);
    const scrollContainer = getScrollableParent(targetElement);

    if (scrollContainer) {
        scrollContainer.scrollTo({
            top: direction === 'bottom' ? scrollContainer.scrollHeight : 0,
            behavior: 'smooth'
        });
    }
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PAGE_ACTION') {
        if (message.action === 'ScrollTop') {
            smartScroll('top', message.x, message.y);
        } else if (message.action === 'ScrollBottom') {
            smartScroll('bottom', message.x, message.y);
        }
    }
});