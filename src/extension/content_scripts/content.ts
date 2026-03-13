// src/extension/content_scripts/content.ts
import { getDirections } from '../../core/domain/recognizer';

class GestureTracker {
    private isDrawing = false;
    private hasMoved = false;
    private isCancelled = false;
    private points: { x: number, y: number }[] = [];
    private overlay: HTMLDivElement;
    private triggerButton = 1;       // 1 = Middle Click, 2 = Right Click
    private lastRightClickTime = 0;  // For double right-click → context menu
    private showOverlay = true;
    private arrowColor = '#ffffff';
    private overlayBgColor = '#000000';

    constructor() {
        this.overlay = this.createOverlay();
        // Load the user's preferred trigger button before binding events
        chrome.storage.local.get(['triggerButton', 'showOverlay', 'arrowColor', 'overlayBgColor'], (result) => {
            if (result.triggerButton !== undefined) {
                this.triggerButton = result.triggerButton;
            }
            if (result.showOverlay !== undefined) {
                this.showOverlay = result.showOverlay;
            }
            if (result.arrowColor !== undefined) {
                this.arrowColor = result.arrowColor;
            }
            if (result.overlayBgColor !== undefined) {
                this.overlayBgColor = result.overlayBgColor;
            }
            this.applyOverlayColors();
            this.bindEvents();
        });

        // React to live settings changes (e.g. Options page open in another tab)
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local') {
                if (changes.triggerButton) {
                    this.triggerButton = changes.triggerButton.newValue;
                }
                if (changes.showOverlay !== undefined) {
                    this.showOverlay = changes.showOverlay.newValue;
                }
                if (changes.arrowColor !== undefined) {
                    this.arrowColor = changes.arrowColor.newValue;
                    this.applyOverlayColors();
                }
                if (changes.overlayBgColor !== undefined) {
                    this.overlayBgColor = changes.overlayBgColor.newValue;
                    this.applyOverlayColors();
                }
            }
        });
    }

    private createOverlay() {
        // 1. Create an isolated host element
        const host = document.createElement('div');
        host.id = 'gesturesfast-host';
        // The host itself must not block clicks and should be an invisible top-level layer
        host.style.cssText = 'position: fixed; z-index: 2147483647; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;';
        document.documentElement.appendChild(host);

        // 2. Create a Shadow Root — 'closed' mode also blocks external JS access
        const shadow = host.attachShadow({ mode: 'closed' });

        // 3. Reset styles and apply custom design
        const style = document.createElement('style');
        style.textContent = `
      .overlay {
        all: initial; /* Rejects all CSS from the host page */
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 6rem; 
        font-weight: bold; 
        text-shadow: 0px 10px 20px rgba(0,0,0,0.3);
        padding: 10px 30px; 
        border-radius: 20px;
        display: none; 
        gap: 10px;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
    `;

        // 4. The arrow display box
        const div = document.createElement('div');
        div.className = 'overlay';

        shadow.appendChild(style);
        shadow.appendChild(div);

        return div;
    }

    /** Applies the current arrowColor and overlayBgColor to the overlay element. */
    private applyOverlayColors() {
        // Convert the stored hex color to an rgba value with 0.7 opacity for the background
        const hex = this.overlayBgColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        this.overlay.style.color = this.arrowColor;
        this.overlay.style.background = `rgba(${r}, ${g}, ${b}, 0.7)`;
    }

    private bindEvents() {
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('contextmenu', this.onContextMenu.bind(this));
    }

    private onMouseDown(e: MouseEvent) {
        if (e.button !== this.triggerButton) return;

        // Always clear movement state so contextmenu handler starts clean
        this.hasMoved = false;
        this.isCancelled = false;

        if (this.triggerButton === 2) {
            const now = Date.now();
            if (now - this.lastRightClickTime < 500) {
                // Double right-click detected: skip gesture mode so the
                // contextmenu event is not suppressed and the native menu shows.
                this.lastRightClickTime = 0; // reset so triple-click doesn't chain
                this.isDrawing = false;
                return;
            }
            this.lastRightClickTime = now;
        }

        this.isDrawing = true;
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

            if (sequence.length > 0 && this.showOverlay) {
                const arrows = sequence.split('').map(char => {
                    if (char === 'U') return '↑';
                    if (char === 'D') return '↓';
                    if (char === 'L') return '←';
                    return '→';
                }).join('');

                this.overlay.innerText = arrows;
                this.overlay.style.display = 'flex';
            }
        };
    }

    private onMouseUp(e: MouseEvent) {
        if (e.button !== this.triggerButton || !this.isDrawing) return;
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

    private onContextMenu(e: MouseEvent) {
        if (this.triggerButton !== 2) return;
        // On Linux, contextmenu fires on mousedown (before any mousemove can set hasMoved).
        // isDrawing is true at that exact moment, so we suppress immediately.
        // On Windows/macOS, contextmenu fires after mouseup (isDrawing is already false),
        // so we fall back to checking hasMoved.
        // Plain right-click (no drag): mouseup fires first → isDrawing=false, hasMoved=false → menu allowed.
        if (this.isDrawing || this.hasMoved) {
            e.preventDefault();
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


// --- CONTEXT-AWARE SMART SCROLL ENGINE ---
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

// src/extension/content_scripts/content.ts (bottom of file)

function smartScroll(direction: 'top' | 'bottom' | 'up' | 'down', x: number, y: number) {
    const targetElement = getDeepElementFromPoint(x, y);
    const scrollContainer = getScrollableParent(targetElement);

    if (scrollContainer) {
        // 1. Jump to absolute top or bottom
        if (direction === 'top' || direction === 'bottom') {
            scrollContainer.scrollTo({
                top: direction === 'bottom' ? scrollContainer.scrollHeight : 0,
                behavior: 'smooth'
            });
        }
        // 2. Incremental scroll (relative position)
        else if (direction === 'up' || direction === 'down') {
            // Scroll by roughly one viewport height so the user doesn't lose their reading position
            const scrollAmount = 1200;
            scrollContainer.scrollBy({
                top: direction === 'down' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    }
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PAGE_ACTION') {
        if (message.action === 'ScrollTop') {
            smartScroll('top', message.x, message.y);
        } else if (message.action === 'ScrollBottom') {
            smartScroll('bottom', message.x, message.y);
        } else if (message.action === 'ScrollUp') {
            smartScroll('up', message.x, message.y);
        } else if (message.action === 'ScrollDown') {
            smartScroll('down', message.x, message.y);
        }
    }
});