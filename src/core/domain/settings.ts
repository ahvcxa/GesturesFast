// src/core/domain/settings.ts

export interface ActionDefinition {
    id: string;
    label: string;
}

export const AVAILABLE_ACTIONS: ActionDefinition[] = [
    { id: 'CloseTab', label: 'Close Tab' },
    { id: 'GoBack', label: 'Go Back' },
    { id: 'GoForward', label: 'Go Forward' },
    { id: 'Reload', label: 'Reload Page' },
    { id: 'ReopenTab', label: 'Reopen Last Closed Tab' },
    { id: 'PreviousTab', label: 'Go to Last Active Tab' },
    { id: 'NextTab', label: 'Switch to Right Tab (Next)' },
    { id: 'PrevTab', label: 'Switch to Left Tab (Previous)' },
    { id: 'NewTab', label: 'Open New Tab' },
    { id: 'DuplicateTab', label: 'Duplicate Tab' },
    { id: 'CloseOtherTabs', label: 'Close Other Tabs' },
    { id: 'CloseRightTabs', label: 'Close Tabs to the Right' },
    { id: 'PinTab', label: 'Pin / Unpin Tab' },
    { id: 'ToggleFullscreen', label: 'Toggle Fullscreen' },
    { id: 'ScrollTop', label: 'Scroll to Top' },
    { id: 'ScrollBottom', label: 'Scroll to Bottom' },
    { id: 'ScrollUp', label: 'Scroll Up' },
    { id: 'ScrollDown', label: 'Scroll Down' },
];

export const ACTION_LABELS: Record<string, string> = Object.fromEntries(
    AVAILABLE_ACTIONS.map((a) => [a.id, a.label])
);

export interface ExtensionSettings {
    customGestures: Record<string, string>;
    triggerButton: number;
    showOverlay: boolean;
    showActionLabel: boolean;
    arrowColor: string;
    overlayBgColor: string;
    blacklistedDomains: string[];
    enableWheelGestures: boolean;
    wheelUpAction: string;
    wheelDownAction: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
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
    showActionLabel: true,
    arrowColor: "#008cff",
    overlayBgColor: "#000000",
    blacklistedDomains: [],
    enableWheelGestures: true,
    wheelUpAction: "PrevTab",
    wheelDownAction: "NextTab"
};
