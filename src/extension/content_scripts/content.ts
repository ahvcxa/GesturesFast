// Dosya: src/extension/content_scripts/content.ts
import { getDirections } from '../../core/domain/recognizer';

class GestureTracker {
    private isDrawing = false;
    private hasMoved = false;
    private isCancelled = false; // ESC ile iptal edildiğini takip eden bayrak
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

        // ESC tuşunu yakalamak için klavye dinleyicisi
        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    private onMouseDown(e: MouseEvent) {
        // 0: Sol Tık, 1: Orta Tık (Tekerlek), 2: Sağ Tık
        if (e.button !== 1) return;

        this.isDrawing = true;
        this.hasMoved = false;
        this.isCancelled = false; // Yeni çizimde iptal bayrağını sıfırla
        this.points = [{ x: e.clientX, y: e.clientY }];

        this.overlay.style.display = 'none';
        this.overlay.innerText = '';
    }

    private onMouseMove(e: MouseEvent) {
        // Çizim yapılmıyorsa veya ESC ile iptal edildiyse işlemi durdur
        if (!this.isDrawing || this.isCancelled) return;

        const startPt = this.points[0];
        const dx = e.clientX - startPt.x;
        const dy = e.clientY - startPt.y;

        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            this.hasMoved = true;
            // Orta tuşun "auto-scroll" (kaydırma okları) özelliğini engelle
            e.preventDefault();
        }

        if (this.hasMoved) {
            this.points.push({ x: e.clientX, y: e.clientY });
            const sequence = getDirections(this.points);

            if (sequence.length > 0) {
                const arrows = sequence.split('').map(char => {
                    if (char === 'U') return '⬆️';
                    if (char === 'D') return '⬇️';
                    if (char === 'L') return '⬅️';
                    return '➡️';
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

        // Eğer sürüklendiyse VE iptal (ESC) edilmediyse komutu gönder
        if (this.hasMoved && !this.isCancelled) {
            const sequence = getDirections(this.points);
            if (sequence) {
                this.sendGesture(sequence);
            }
        }
    }

    private onKeyDown(e: KeyboardEvent) {
        // Fare basılıyken ESC tuşuna basılırsa
        if (e.key === 'Escape' && this.isDrawing) {
            this.isCancelled = true;
            this.isDrawing = false;

            // Ekranda beliren okları anında sil
            this.overlay.style.display = 'none';
            this.overlay.innerText = '';
            console.log("Jest iptal edildi.");
        }
    }

    private sendGesture(sequence: string) {
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({ type: 'PROCESS_GESTURE', payload: { sequence } });
        }
    }
}



new GestureTracker();


// Arka plandan gelen sayfa içi komutları dinle
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PAGE_ACTION') {
        if (message.action === 'ScrollTop') {
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Yumuşak kaydırma efekti ile en üste
        } else if (message.action === 'ScrollBottom') {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); // En alta
        }
    }
});