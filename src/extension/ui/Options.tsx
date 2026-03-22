// src/extension/ui/Options.tsx
import React, { useState, useEffect } from 'react';



const AVAILABLE_ACTIONS = [
    { id: 'CloseTab', label: 'Close Tab' },
    { id: 'GoBack', label: 'Go Back' },
    { id: 'GoForward', label: 'Go Forward' },
    { id: 'Reload', label: 'Reload Page' },
    { id: 'ReopenTab', label: 'Reopen Last Closed Tab' },
    { id: 'PreviousTab', label: 'Go to Previous Tab' },
    { id: 'NewTab', label: 'Open New Tab' },
    { id: 'PinTab', label: 'Pin / Unpin Tab' },
    { id: 'ScrollTop', label: 'Scroll to Top' },
    { id: 'ScrollBottom', label: 'Scroll to Bottom' },
    { id: 'ScrollUp', label: 'Scroll Up' },
    { id: 'ScrollDown', label: 'Scroll Down' },
];
export const Options: React.FC = () => {
    const [savedGestures, setSavedGestures] = useState<Record<string, string>>({});
    const [currentSequence, setCurrentSequence] = useState<string>('');
    const [selectedAction, setSelectedAction] = useState('CloseTab');
    const [triggerButton, setTriggerButton] = useState<number>(1); // 1 = Middle, 2 = Right
    const [showOverlay, setShowOverlay] = useState<boolean>(true);
    const [arrowColor, setArrowColor] = useState<string>('#ffffff');
    const [overlayBgColor, setOverlayBgColor] = useState<string>('#000000');

    const [blacklistedDomains, setBlacklistedDomains] = useState<string[]>([]);
    const [newDomain, setNewDomain] = useState("");

    const handleAddDomain = () => {
        let domain = newDomain.trim().toLowerCase();
        domain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];

        if (domain && !blacklistedDomains.includes(domain)) {
            const updatedList = [...blacklistedDomains, domain];
            setBlacklistedDomains(updatedList);
            chrome.storage.local.set({ blacklistedDomains: updatedList });
            setNewDomain("");
        }
    };

    const handleRemoveDomain = (domainToRemove: string) => {
        const updatedList = blacklistedDomains.filter(d => d !== domainToRemove);
        setBlacklistedDomains(updatedList);
        chrome.storage.local.set({ blacklistedDomains: updatedList });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddDomain();
        }
    };

    useEffect(() => {
        chrome.storage.local.get(['customGestures', 'triggerButton', 'arrowColor', 'overlayBgColor', 'blacklistedDomains'], (result) => {
            if (result.customGestures) {
                setSavedGestures(result.customGestures);
            } else {
                setSavedGestures({});
            }
            if (result.triggerButton !== undefined) {
                setTriggerButton(result.triggerButton);
            }
            if (result.arrowColor !== undefined) {
                setArrowColor(result.arrowColor);
            }
            if (result.overlayBgColor !== undefined) {
                setOverlayBgColor(result.overlayBgColor);
            }
            if (result.blacklistedDomains !== undefined) {
                setBlacklistedDomains(result.blacklistedDomains);
            }
        });
    }, []);

    const handleTriggerButtonChange = (value: number) => {
        setTriggerButton(value);
        chrome.storage.local.set({ triggerButton: value });
    };

    const addDirection = (dir: string) => {
        if (currentSequence.endsWith(dir)) return;
        setCurrentSequence(prev => prev + dir);
    };

    const saveGesture = () => {
        if (!currentSequence) return;
        const newGestures = { ...savedGestures, [currentSequence]: selectedAction };
        setSavedGestures(newGestures);
        chrome.storage.local.set({ customGestures: newGestures }, () => setCurrentSequence(''));
    };

    const deleteGesture = (sequence: string) => {
        const newGestures = { ...savedGestures };
        delete newGestures[sequence];
        setSavedGestures(newGestures);
        chrome.storage.local.set({ customGestures: newGestures });
    };

    const renderArrows = (seq: string) => {
        return seq.split('').map((char, idx) => {
            if (char === 'U') return <span key={idx}>↑</span>;
            if (char === 'D') return <span key={idx}>↓</span>;
            if (char === 'L') return <span key={idx}>←</span>;
            if (char === 'R') return <span key={idx}>→</span>;
            return null;
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-10 font-sans text-gray-800">
            <header className="mb-12">
                <h1 className="text-3xl font-light tracking-tight text-gray-900">Gestures<span className="font-semibold text-blue-600">Fast</span></h1>
                <p className="text-sm text-gray-500 mt-2">Manage your mouse gestures.</p>
            </header>

            {/* Trigger Button Setting */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Trigger Button</h2>
                <div className="flex gap-4">
                    <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${triggerButton === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                        }`}>
                        <input
                            type="radio"
                            name="triggerButton"
                            value={1}
                            checked={triggerButton === 1}
                            onChange={() => handleTriggerButtonChange(1)}
                            className="accent-blue-600"
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-800">Middle Click</p>
                            <p className="text-xs text-gray-400 mt-0.5">Press the scroll wheel button. Double-click for other tasks.</p>
                        </div>
                    </label>
                    <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${triggerButton === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                        }`}>
                        <input
                            type="radio"
                            name="triggerButton"
                            value={2}
                            checked={triggerButton === 2}
                            onChange={() => handleTriggerButtonChange(2)}
                            className="accent-blue-600"
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-800">Right Click</p>
                            <p className="text-xs text-gray-400 mt-0.5">Press right-click. Double-click for other tasks.</p>
                        </div>
                    </label>
                </div>
            </div>


            {/* --- EXCEPTIONS / BLACKLIST SECTION --- */}
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-2">🛑 Exceptions 🛑</h2>
                <p className="text-sm text-gray-500 mb-4">
                    GesturesFast will be disabled on the domains listed below. Perfect for sites like Figma, Miro, or browser games.
                </p>

                {/* Input Field for Adding Domains */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="e.g. figma.com or youtube.com"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={handleAddDomain}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Add
                    </button>
                </div>

                {/* List of Added Domains (Chip / Badge Design) */}
                <div className="flex flex-wrap gap-2">
                    {blacklistedDomains.length === 0 ? (
                        <span className="text-sm text-gray-400 italic">No exceptions added yet.</span>
                    ) : (
                        blacklistedDomains.map((domain) => (
                            <div
                                key={domain}
                                className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-200"
                            >
                                <span>{domain}</span>
                                <button
                                    onClick={() => handleRemoveDomain(domain)}
                                    className="text-gray-400 hover:text-red-500 focus:outline-none transition-colors"
                                    title="Remove domain"
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>


            {/* STEALTH MODE SETTING */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
                <label className="flex items-center gap-4 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showOverlay}
                        onChange={(e) => {
                            setShowOverlay(e.target.checked);
                            chrome.storage.local.set({ showOverlay: e.target.checked });
                        }}
                        className="w-5 h-5 accent-blue-600 rounded transition-all"
                    />
                    <div>
                        <p className="text-sm font-medium text-gray-800">Show Visual Feedback (Stealth Mode)</p>
                        <p className="text-xs text-gray-400">If disabled, mouse gestures will execute silently in the background without displaying arrows on the screen.</p>
                    </div>
                </label>
            </div>

            {/* OVERLAY APPEARANCE SETTING */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Overlay Appearance</h2>
                <div className="flex flex-col gap-4">
                    <label className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-800">Arrow Color</p>
                            <p className="text-xs text-gray-400 mt-0.5">Color of the directional arrows shown during a gesture.</p>
                        </div>
                        <input
                            type="color"
                            value={arrowColor}
                            onChange={(e) => {
                                setArrowColor(e.target.value);
                                chrome.storage.local.set({ arrowColor: e.target.value });
                            }}
                            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                        />
                    </label>
                    <div className="border-t border-gray-100" />
                    <label className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-800">Background Color</p>
                            <p className="text-xs text-gray-400 mt-0.5">Background color of the overlay box. Opacity is fixed at 70%.</p>
                        </div>
                        <input
                            type="color"
                            value={overlayBgColor}
                            onChange={(e) => {
                                setOverlayBgColor(e.target.value);
                                chrome.storage.local.set({ overlayBgColor: e.target.value });
                            }}
                            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                        />
                    </label>
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* Left Panel */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-6">New Gesture</h2>

                    <div className="mb-8 bg-gray-50/50 h-28 rounded-xl flex items-center justify-center text-4xl text-gray-700 tracking-[0.2em] border border-gray-100">
                        {currentSequence ? renderArrows(currentSequence) : <span className="text-gray-300 text-sm tracking-normal">Click the direction buttons</span>}
                    </div>

                    <div className="grid grid-cols-3 gap-3 w-48 mx-auto mb-8">
                        <div />
                        <button onClick={() => addDirection('U')} className="h-14 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-500 rounded-xl text-xl shadow-sm transition-all duration-200">↑</button>
                        <div />
                        <button onClick={() => addDirection('L')} className="h-14 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-500 rounded-xl text-xl shadow-sm transition-all duration-200">←</button>
                        <button onClick={() => addDirection('D')} className="h-14 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-500 rounded-xl text-xl shadow-sm transition-all duration-200">↓</button>
                        <button onClick={() => addDirection('R')} className="h-14 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-500 rounded-xl text-xl shadow-sm transition-all duration-200">→</button>
                    </div>

                    <div className="flex gap-3 mb-6">
                        <button onClick={() => setCurrentSequence('')} className="flex-1 bg-gray-50 text-gray-500 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">Clear</button>
                    </div>

                    <div className="mb-6">
                        <select
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value)}
                            className="w-full border border-gray-200 bg-gray-50 text-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        >
                            {AVAILABLE_ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                        </select>
                    </div>

                    <button onClick={saveGesture} className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                        Save Gesture
                    </button>
                </div>

                {/* Right Panel */}
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-6">Saved Gestures</h2>
                    <ul className="space-y-3">
                        {Object.entries(savedGestures).map(([seq, actionId]) => (
                            <li key={seq} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex justify-between items-center group transition-all hover:border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="text-xl text-gray-700 font-medium tracking-widest w-16">{renderArrows(seq)}</div>
                                    <span className="text-sm text-gray-600">
                                        {AVAILABLE_ACTIONS.find(a => a.id === actionId)?.label || actionId}
                                    </span>
                                </div>
                                <button
                                    onClick={() => deleteGesture(seq)}
                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
};