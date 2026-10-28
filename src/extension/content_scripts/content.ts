// src/extension/content_scripts/content.ts
import { getDirections } from '../../core/domain/recognizer';
import { ACTION_LABELS, DEFAULT_SETTINGS } from '../../core/domain/settings';

class GestureTracker {
    private isDisabled = false;
    private isDrawing = false;
    private hasMoved = false;
    private isCancelled = false;
    private points: { x: number, y: number }[] = [];
    private overlay: HTMLDivElement | null = null;
    private arrowsEl: HTMLDivElement | null = null;
    private labelEl: HTMLDivElement | null = null;
    private customGestures: Record<string, string> = { ...DEFAULT_SETTINGS.customGestures };
    private triggerButton = DEFAULT_SETTINGS.triggerButton; // 1 = Middle Click, 2 = Right Click
    private lastClickTime = 0;  // For double-click bypass
    private contextMenuSuppressedOnDown = false;
    private showOverlay = DEFAULT_SETTINGS.showOverlay;
    private showActionLabel = DEFAULT_SETTINGS.showActionLabel;
    private arrowColor = DEFAULT_SETTINGS.arrowColor;
    private overlayBgColor = DEFAULT_SETTINGS.overlayBgColor;

    public setDisabled(disabled: boolean) {
        this.isDisabled = disabled;
        if (disabled) {
            this.isDrawing = false;
            this.hasMoved = false;
            this.isCancelled = false;
            this.hideOverlay();
        }
    }

    constructor() {
        // Load the user's preferred settings before binding events
        chrome.storage.local.get(['customGestures', 'triggerButton', 'showOverlay', 'showActionLabel', 'arrowColor', 'overlayBgColor'], (result) => {
            if (result.customGestures !== undefined) {
                this.customGestures = result.customGestures;
            }
            if (result.triggerButton !== undefined) {
                this.triggerButton = result.triggerButton;
            }
            if (result.showOverlay !== undefined) {
                this.showOverlay = result.showOverlay;
            }
            if (result.showActionLabel !== undefined) {
                this.showActionLabel = result.showActionLabel;
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
                if (changes.customGestures !== undefined) {
                    this.customGestures = changes.customGestures.newValue || {};
                }
                if (changes.triggerButton) {
                    this.triggerButton = changes.triggerButton.newValue;
                }
                if (changes.showOverlay !== undefined) {
                    this.showOverlay = changes.showOverlay.newValue;
                    if (!this.showOverlay) {
                        this.hideOverlay();
                    }
                }
                if (changes.showActionLabel !== undefined) {
                    this.showActionLabel = changes.showActionLabel.newValue;
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

    private getOverlay(): HTMLDivElement {
        if (!this.overlay) {
            this.overlay = this.createOverlay();
            this.applyOverlayColors();
        }
        return this.overlay;
    }

    private hideOverlay() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
            if (this.arrowsEl) this.arrowsEl.textContent = '';
            if (this.labelEl) this.labelEl.textContent = '';
        }
    }

    private renderOverlayContent(arrows: string, actionId?: string) {
        const overlay = this.getOverlay();
        if (this.arrowsEl) {
            this.arrowsEl.textContent = arrows;
        }
        if (this.labelEl) {
            if (this.showActionLabel) {
                this.labelEl.textContent = actionId ? (ACTION_LABELS[actionId] || actionId) : 'No Action';
                this.labelEl.style.opacity = actionId ? '0.95' : '0.5';
                this.labelEl.style.display = 'block';
            } else {
                this.labelEl.style.display = 'none';
            }
        }
        overlay.style.display = 'flex';
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
        padding: 16px 34px; 
        border-radius: 20px;
        display: none; 
        flex-direction: column;
        gap: 6px;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
      }
      .arrows {
        font-size: 5.5rem;
        font-weight: bold;
        line-height: 1.05;
        letter-spacing: 0.08em;
        text-shadow: 0px 8px 18px rgba(0,0,0,0.3);
      }
      .action-label {
        font-size: 1.15rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        text-shadow: 0px 2px 8px rgba(0,0,0,0.4);
      }
    `;

        // 4. The arrow and HUD label display box
        const div = document.createElement('div');
        div.className = 'overlay';

        const arrowsDiv = document.createElement('div');
        arrowsDiv.className = 'arrows';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'action-label';

        div.appendChild(arrowsDiv);
        div.appendChild(labelDiv);

        this.arrowsEl = arrowsDiv;
        this.labelEl = labelDiv;

        shadow.appendChild(style);
        shadow.appendChild(div);

        return div;
    }

    /** Applies the current arrowColor and overlayBgColor to the overlay element. */
    private applyOverlayColors() {
        if (!this.overlay) return;
        // Convert the stored hex color to an rgba value with 0.7 opacity for the background
        const hex = this.overlayBgColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        this.overlay.style.color = this.arrowColor;
        this.overlay.style.background = `rgba(${r}, ${g}, ${b}, 0.7)`;
    }

    private bindEvents() {
        const options = { capture: true };
        window.addEventListener('mousedown', this.onMouseDown.bind(this), options);
        window.addEventListener('mousemove', this.onMouseMove.bind(this), options);
        window.addEventListener('mouseup', this.onMouseUp.bind(this), options);
        window.addEventListener('keydown', this.onKeyDown.bind(this), options);
        window.addEventListener('contextmenu', this.onContextMenu.bind(this), options);
    }

    private onMouseDown(e: MouseEvent) {
        if (this.isDisabled || e.button !== this.triggerButton) return;

        // Always clear movement state so contextmenu handler starts clean
        this.hasMoved = false;
        this.isCancelled = false;

        // Double-click bypass for Middle-Click Auto-Scroll, or Right-Click Context Menu on platforms
        // (such as Linux) where contextmenu fires on mousedown and was suppressed on the first click.
        const now = Date.now();
        const needsDoubleClickBypass = this.triggerButton === 1 || this.contextMenuSuppressedOnDown;
        if (needsDoubleClickBypass && now - this.lastClickTime < 300) {
            this.isCancelled = true;
            this.contextMenuSuppressedOnDown = false;
            this.lastClickTime = 0;
            this.isDrawing = false;
            return; // Allow the browser to execute its native action (auto-scroll / context menu)
        }
        this.lastClickTime = now;
        this.contextMenuSuppressedOnDown = false;

        this.isDrawing = true;
        this.points = [{ x: e.clientX, y: e.clientY }];

        this.hideOverlay();

        // If Middle Click is used, block native auto-scroll on the first click.
        if (this.triggerButton === 1) {
            e.preventDefault();
        }
    }

    private onMouseMove(e: MouseEvent) {
        if (!this.isDrawing || this.isCancelled) return;

        const startPt = this.points[0];
        const dx = e.clientX - startPt.x;
        const dy = e.clientY - startPt.y;

        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            this.hasMoved = true;
            e.preventDefault();
            e.stopPropagation();
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

                const actionId = this.customGestures[sequence];
                this.renderOverlayContent(arrows, actionId);
            }
        }
    }

    private onMouseUp(e: MouseEvent) {
        if (e.button !== this.triggerButton || !this.isDrawing) return;
        this.isDrawing = false;

        this.hideOverlay();

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
            this.hideOverlay();
        }
    }

    private onContextMenu(e: MouseEvent) {
        if (this.isDisabled || this.triggerButton !== 2 || this.isCancelled) return;
        // On Linux, contextmenu fires on mousedown while isDrawing is still true.
        // Record that suppression happened on mousedown so a double right-click can open the native menu.
        if (this.isDrawing) {
            this.contextMenuSuppressedOnDown = true;
            e.preventDefault();
            return;
        }
        // On Windows/macOS, contextmenu fires after mouseup (isDrawing is false).
        // Only suppress if the user actually dragged to draw a gesture; plain right-click opens the menu.
        if (this.hasMoved) {
            this.hasMoved = false;
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
            // Scroll by roughly 85% of the visible container/viewport height so the user doesn't lose their reading position
            const isRootScroller = scrollContainer === document.scrollingElement || scrollContainer === document.body || scrollContainer === document.documentElement;
            const visibleHeight = isRootScroller ? window.innerHeight : scrollContainer.clientHeight;
            const scrollAmount = Math.max(100, Math.round((visibleHeight || window.innerHeight) * 0.85));
            scrollContainer.scrollBy({
                top: direction === 'down' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    }
}

function isDomainBlacklisted(hostname: string, blacklistedDomains: string[]): boolean {
    const cleanHost = hostname.toLowerCase().replace(/^www\./, '');
    return blacklistedDomains.some((domain) => {
        const cleanDomain = domain.toLowerCase().replace(/^www\./, '');
        return cleanHost === cleanDomain || cleanHost.endsWith(`.${cleanDomain}`);
    });
}

let tracker: GestureTracker | null = null;
let pageListenerBound = false;

function applyBlacklistState(blacklistedDomains: string[]) {
    const blacklisted = isDomainBlacklisted(window.location.hostname, blacklistedDomains);
    if (blacklisted) {
        tracker?.setDisabled(true);
        return;
    }

    if (!tracker) {
        tracker = new GestureTracker();
    } else {
        tracker.setDisabled(false);
    }

    if (!pageListenerBound) {
        pageListenerBound = true;
        chrome.runtime.onMessage.addListener((message) => {
            if (tracker && message.type === 'PAGE_ACTION') {
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
    }
}

chrome.storage.local.get(['blacklistedDomains'], (result) => {
    applyBlacklistState(result.blacklistedDomains || []);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.blacklistedDomains !== undefined) {
        applyBlacklistState(changes.blacklistedDomains.newValue || []);
    }
});