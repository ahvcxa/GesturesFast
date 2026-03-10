// Dosya: src/extension/content_scripts/content.ts

// Point arayüzünü core'dan alıyoruz (veya type olarak paylaşıyoruz)
interface Point {
    x: number;
    y: number;
}

class GestureTracker {
    private isDrawing: boolean = false;
    private points: Point[] = [];
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D | null;
    private minDistanceThreshold: number = 10; // Piksel cinsinden, menüyü engellemek için minimum hareket

    constructor() {
        this.canvas = this.createOverlayCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.bindEvents();
    }

    private createOverlayCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.id = 'projectmaker-gesture-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none'; // Tıklamaların alttaki elementlere geçmesine izin ver
        canvas.style.zIndex = '2147483647'; // Maksimum z-index
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Sayfaya ekle
        document.documentElement.appendChild(canvas);

        // Yeniden boyutlandırma yönetimi
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        return canvas;
    }

    private bindEvents() {
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('contextmenu', this.onContextMenu.bind(this), { capture: true });
    }

    private onMouseDown(e: MouseEvent) {
        if (e.button !== 2) return; // Sadece sağ tık (button 2)

        this.isDrawing = true;
        this.points = [{ x: e.clientX, y: e.clientY }];

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.beginPath();
            this.ctx.moveTo(e.clientX, e.clientY);
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = '#3b82f6'; // Tailwind blue-500
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        }
    }

    private onMouseMove(e: MouseEvent) {
        if (!this.isDrawing) return;

        const newPoint = { x: e.clientX, y: e.clientY };
        this.points.push(newPoint);

        if (this.ctx) {
            this.ctx.lineTo(newPoint.x, newPoint.y);
            this.ctx.stroke();
        }
    }

    private onMouseUp(e: MouseEvent) {
        if (e.button !== 2 || !this.isDrawing) return;
        this.isDrawing = false;

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Yeterince uzun bir çizim yapıldıysa (sadece sağ tık değilse)
        if (this.isGesture(this.points)) {
            this.sendGestureToBackground(this.points);
        }
    }

    private onContextMenu(e: MouseEvent) {
        // Eğer bir jest çizildiyse varsayılan sağ tık menüsünü engelle
        if (this.isGesture(this.points)) {
            e.preventDefault();
            e.stopPropagation();
            this.points = []; // Engelledikten sonra sıfırla
        }
    }

    private isGesture(points: Point[]): boolean {
        if (points.length < 5) return false;

        // İlk ve son nokta arası veya toplam kat edilen mesafe kontrolü
        // Basit bir bounding box hesabı ile gerçek bir hareket olup olmadığını anlıyoruz
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxY = Math.max(...points.map(p => p.y));

        const distanceX = maxX - minX;
        const distanceY = maxY - minY;

        return (distanceX > this.minDistanceThreshold || distanceY > this.minDistanceThreshold);
    }

    private sendGestureToBackground(points: Point[]) {
        // Chrome Extension API üzerinden yakalanan noktaları Service Worker'a gönderiyoruz
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({
                type: 'PROCESS_GESTURE',
                payload: { points }
            });
        } else {
            console.warn("Chrome Runtime bulunamadı. (Geliştirme modu olabilir)", points.length, "nokta yakalandı.");
        }
    }
}

// Sayfa yüklendiğinde başlat
new GestureTracker();