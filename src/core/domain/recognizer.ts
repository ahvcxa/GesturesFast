// src/core/domain/recognizer.ts

// Internal type — not exported as it is only used within this file.
type Direction = 'U' | 'D' | 'L' | 'R';

// Takes an array of points and returns a direction string, e.g. "RU" (Right → Up).
export function getDirections(points: { x: number, y: number }[]): string {
    if (points.length < 2) return '';

    const MIN_DISTANCE = 20; // Minimum pixels the mouse must travel before a direction is registered
    let sequence: Direction[] = [];
    let lastPoint = points[0];

    for (let i = 1; i < points.length; i++) {
        const pt = points[i];
        const dx = pt.x - lastPoint.x;
        const dy = pt.y - lastPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only register a direction if the mouse has moved far enough
        if (dist > MIN_DISTANCE) {
            let dir: Direction;
            // Determine dominant axis: horizontal or vertical
            if (Math.abs(dx) > Math.abs(dy)) {
                dir = dx > 0 ? 'R' : 'L'; // Right or Left
            } else {
                dir = dy > 0 ? 'D' : 'U'; // Down or Up
            }

            // Only append if the sequence is empty or the direction has changed
            if (sequence.length === 0 || sequence[sequence.length - 1] !== dir) {
                sequence.push(dir);
            }

            // Advance the reference point
            lastPoint = pt;
        }
    }

    return sequence.join(''); // e.g. "R", "RU", "LDR"
}