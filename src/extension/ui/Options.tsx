// Dosya: src/extension/ui/Options.tsx
import React, { useState, useRef, useEffect } from 'react';

interface Point { x: number; y: number; }
interface SavedGesture { id: string; name: string; action: string; points: Point[] }

const AVAILABLE_ACTIONS = [
    { id: 'CloseTab', label: 'Sekmeyi Kapat' },
    { id: 'GoBack', label: 'Geri Git' },
    { id: 'GoForward', label: 'İleri Git' },
    { id: 'Reload', label: 'Sayfayı Yenile' }
];

export const Options: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    const [savedGestures, setSavedGestures] = useState<SavedGesture[]>([]);
    const [selectedAction, setSelectedAction] = useState('CloseTab');
    const [gestureName, setGestureName] = useState('');

    // Yüklendiğinde kayıtlı jestleri Chrome Storage'dan çek
    useEffect(() => {
        if (chrome && chrome.storage) {
            chrome.storage.local.get(['userGestures'], (result) => {
                if (result.userGestures) {
                    setSavedGestures(result.userGestures);
                }
            });
        }
    }, []);

    // Çizim İşlemleri
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const rect = canvasRef.current!.getBoundingClientRect();
        setCurrentPoints([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);

        const ctx = canvasRef.current!.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
            ctx.beginPath();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#3b82f6';
            ctx.lineCap = 'round';
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const newPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setCurrentPoints(prev => [...prev, newPoint]);

        const ctx = canvasRef.current!.getContext('2d');
        if (ctx) {
            ctx.lineTo(newPoint.x, newPoint.y);
            ctx.stroke();
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    // Yeni Jesti Kaydet
    const saveGesture = () => {
        if (currentPoints.length < 10) {
            alert('Lütfen daha belirgin bir şekil çizin.');
            return;
        }
        if (!gestureName.trim()) {
            alert('Lütfen jestinize bir isim verin.');
            return;
        }

        const newGesture: SavedGesture = {
            id: crypto.randomUUID(),
            name: gestureName,
            action: selectedAction,
            points: currentPoints
        };

        const updatedGestures = [...savedGestures, newGesture];
        setSavedGestures(updatedGestures);

        if (chrome && chrome.storage) {
            chrome.storage.local.set({ userGestures: updatedGestures }, () => {
                console.log('Jest başarıyla kaydedildi.');
                // Çizim alanını temizle
                setCurrentPoints([]);
                setGestureName('');
                const ctx = canvasRef.current!.getContext('2d');
                ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">ProjectMaker: Jest Yönetimi</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sol Panel: Yeni Jest Ekleme */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Yeni Jest Öğret</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jest Adı</label>
                        <input
                            type="text"
                            value={gestureName}
                            onChange={(e) => setGestureName(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                            placeholder="Örn: V Şekli"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tetiklenecek Aksiyon</label>
                        <select
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                        >
                            {AVAILABLE_ACTIONS.map(action => (
                                <option key={action.id} value={action.id}>{action.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buraya Çizin (Farenin sol tuşuna basılı tutarak)</label>
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={300}
                            className="border-2 border-dashed border-gray-300 bg-gray-50 cursor-crosshair w-full rounded"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                        />
                    </div>

                    <button
                        onClick={saveGesture}
                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
                    >
                        Kaydet ve Senkronize Et
                    </button>
                </div>

                {/* Sağ Panel: Kayıtlı Jestler */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Kayıtlı Jestlerim</h2>
                    {savedGestures.length === 0 ? (
                        <p className="text-gray-500">Henüz kaydedilmiş bir jestiniz yok.</p>
                    ) : (
                        <ul className="space-y-3">
                            {savedGestures.map(gesture => (
                                <li key={gesture.id} className="p-3 border border-gray-100 rounded bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <span className="font-semibold block">{gesture.name}</span>
                                        <span className="text-sm text-gray-500">Aksiyon: {AVAILABLE_ACTIONS.find(a => a.id === gesture.action)?.label}</span>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {gesture.points.length} Nokta
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};