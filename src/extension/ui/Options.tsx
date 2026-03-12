// Dosya: src/extension/ui/Options.tsx
import React, { useState, useEffect } from 'react';

const AVAILABLE_ACTIONS = [
    { id: 'CloseTab', label: 'Sekmeyi Kapat' },
    { id: 'GoBack', label: 'Geri Git' },
    { id: 'GoForward', label: 'İleri Git' },
    { id: 'Reload', label: 'Sayfayı Yenile' },
    { id: 'ReopenTab', label: 'Son Kapanan Sekmeyi Aç' },
    { id: 'ScrollTop', label: 'Sayfanın En Üstüne Çık' },
    { id: 'ScrollBottom', label: 'Sayfanın En Altına İn' },
    { id: 'ScrollUp', label: 'Yukarı Kaydır (Biraz)' },
    { id: 'ScrollDown', label: 'Aşağı Kaydır (Biraz)' }
];
export const Options: React.FC = () => {
    const [savedGestures, setSavedGestures] = useState<Record<string, string>>({});
    const [currentSequence, setCurrentSequence] = useState<string>('');
    const [selectedAction, setSelectedAction] = useState('CloseTab');

    useEffect(() => {
        chrome.storage.local.get(['customGestures'], (result) => {
            if (result.customGestures) {
                setSavedGestures(result.customGestures);
            } else {
                const defaults = { "DR": "CloseTab", "L": "GoBack", "R": "GoForward", "UD": "Reload" };
                setSavedGestures(defaults);
            }
        });
    }, []);

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
                <p className="text-sm text-gray-500 mt-2">Fare hareketlerinizi yönetin.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* Sol Panel */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-6">Yeni Kombinasyon</h2>

                    <div className="mb-8 bg-gray-50/50 h-28 rounded-xl flex items-center justify-center text-4xl text-gray-700 tracking-[0.2em] border border-gray-100">
                        {currentSequence ? renderArrows(currentSequence) : <span className="text-gray-300 text-sm tracking-normal">Yön tuşlarına tıklayın</span>}
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
                        <button onClick={() => setCurrentSequence('')} className="flex-1 bg-gray-50 text-gray-500 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">Temizle</button>
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
                        Kombinasyonu Kaydet
                    </button>
                </div>

                {/* Sağ Panel */}
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-6">Kayıtlı Hareketler</h2>
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
                                    Sil
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
};