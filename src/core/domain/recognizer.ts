// Dosya: src/core/domain/recognizer.ts

export type Direction = 'U' | 'D' | 'L' | 'R';

// Noktaları alır ve "RU" (Right -> Up) gibi bir string döndürür.
export function getDirections(points: { x: number, y: number }[]): string {
    if (points.length < 2) return '';

    const MIN_DISTANCE = 20; // Yönün algılanması için farenin gitmesi gereken minimum piksel
    let sequence: Direction[] = [];
    let lastPoint = points[0];

    for (let i = 1; i < points.length; i++) {
        const pt = points[i];
        const dx = pt.x - lastPoint.x;
        const dy = pt.y - lastPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Eğer fare yeterince hareket ettiyse yönü hesapla
        if (dist > MIN_DISTANCE) {
            let dir: Direction;
            // X ekseninde mi yoksa Y ekseninde mi daha çok hareket etti?
            if (Math.abs(dx) > Math.abs(dy)) {
                dir = dx > 0 ? 'R' : 'L'; // Sağ veya Sol
            } else {
                dir = dy > 0 ? 'D' : 'U'; // Aşağı veya Yukarı
            }

            // Eğer dizi boşsa veya son eklenen yön yeni yönden farklıysa ekle
            if (sequence.length === 0 || sequence[sequence.length - 1] !== dir) {
                sequence.push(dir);
            }

            // Yeni referans noktamızı güncelle
            lastPoint = pt;
        }
    }

    return sequence.join(''); // Örn: "R", "RU", "LDR"
}