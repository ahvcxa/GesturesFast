// Dosya: src/core/domain/recognizer.ts

export class Point {
    constructor(public x: number, public y: number) { }
}

export class Template {
    public points: Point[];
    constructor(public name: string, points: Point[]) {
        this.points = normalizePoints(points); // Şablon kaydedilirken normalize edilir
    }
}

export class RecognizerResult {
    constructor(public name: string, public score: number, public timeMs: number) { }
}

// --- $1 UNISTROKE SABİTLERİ ---
const NUM_POINTS = 64;
const SQUARE_SIZE = 250.0;
const HALF_DIAGONAL = 0.5 * Math.sqrt(SQUARE_SIZE * SQUARE_SIZE + SQUARE_SIZE * SQUARE_SIZE);
const ANGLE_RANGE = deg2Rad(45.0);
const ANGLE_PRECISION = deg2Rad(2.0);
const PHI = 0.5 * (-1.0 + Math.sqrt(5.0)); // Altın Oran

// --- ANA TANIMA MOTORU ---
export class GestureRecognizer {
    private templates: Template[] = [];

    public addTemplate(name: string, points: Point[]) {
        this.templates.push(new Template(name, points));
    }

    public recognize(points: Point[]): RecognizerResult {
        const t0 = performance.now();

        if (points.length < 10) {
            return new RecognizerResult("Bilinmiyor", 0.0, performance.now() - t0);
        }

        const normalizedPoints = normalizePoints(points);
        let bestDistance = Infinity;
        let bestTemplate: string = "Bilinmiyor";

        for (const template of this.templates) {
            const distance = distanceAtBestAngle(
                normalizedPoints,
                template.points,
                -ANGLE_RANGE,
                ANGLE_RANGE,
                ANGLE_PRECISION
            );

            if (distance < bestDistance) {
                bestDistance = distance;
                bestTemplate = template.name;
            }
        }

        const score = 1.0 - (bestDistance / HALF_DIAGONAL);
        const t1 = performance.now();

        return new RecognizerResult(bestDistance > 0 ? bestTemplate : "Bilinmiyor", Math.max(score, 0.0), t1 - t0);
    }
}

// --- NORMALİZASYON VE MATEMATİK YARDIMCILARI ---

export function normalizePoints(points: Point[]): Point[] {
    let pts = resample(points, NUM_POINTS);
    const radians = indicatorAngle(pts);
    pts = rotateBy(pts, -radians);
    pts = scaleTo(pts, SQUARE_SIZE);
    pts = translateTo(pts, new Point(0, 0));
    return pts;
}

function resample(points: Point[], n: number): Point[] {
    const interval = pathLength(points) / (n - 1);
    let D = 0.0;
    const newPoints: Point[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
        const d = distance(points[i - 1], points[i]);
        if ((D + d) >= interval) {
            const qx = points[i - 1].x + ((interval - D) / d) * (points[i].x - points[i - 1].x);
            const qy = points[i - 1].y + ((interval - D) / d) * (points[i].y - points[i - 1].y);
            const q = new Point(qx, qy);
            newPoints.push(q);
            points.splice(i, 0, q); // Insert 'q' at position i
            D = 0.0;
        } else {
            D += d;
        }
    }

    if (newPoints.length === n - 1) {
        newPoints.push(new Point(points[points.length - 1].x, points[points.length - 1].y));
    }
    return newPoints;
}

function indicatorAngle(points: Point[]): number {
    const c = centroid(points);
    return Math.atan2(c.y - points[0].y, c.x - points[0].x);
}

function rotateBy(points: Point[], radians: number): Point[] {
    const c = centroid(points);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const newPoints: Point[] = [];
    for (const p of points) {
        const qx = (p.x - c.x) * cos - (p.y - c.y) * sin + c.x;
        const qy = (p.x - c.x) * sin + (p.y - c.y) * cos + c.y;
        newPoints.push(new Point(qx, qy));
    }
    return newPoints;
}

function scaleTo(points: Point[], size: number): Point[] {
    const box = boundingBox(points);
    const newPoints: Point[] = [];
    for (const p of points) {
        const qx = p.x * (size / box.width);
        const qy = p.y * (size / box.height);
        newPoints.push(new Point(qx, qy));
    }
    return newPoints;
}

function translateTo(points: Point[], pt: Point): Point[] {
    const c = centroid(points);
    const newPoints: Point[] = [];
    for (const p of points) {
        const qx = p.x + pt.x - c.x;
        const qy = p.y + pt.y - c.y;
        newPoints.push(new Point(qx, qy));
    }
    return newPoints;
}

// Altın oran araması (Golden Section Search) ile en iyi açıyı bulma
function distanceAtBestAngle(points: Point[], T: Point[], a: number, b: number, threshold: number): number {
    let x1 = PHI * a + (1.0 - PHI) * b;
    let f1 = distanceAtAngle(points, T, x1);
    let x2 = (1.0 - PHI) * a + PHI * b;
    let f2 = distanceAtAngle(points, T, x2);

    while (Math.abs(b - a) > threshold) {
        if (f1 < f2) {
            b = x2;
            x2 = x1;
            f2 = f1;
            x1 = PHI * a + (1.0 - PHI) * b;
            f1 = distanceAtAngle(points, T, x1);
        } else {
            a = x1;
            x1 = x2;
            f1 = f2;
            x2 = (1.0 - PHI) * a + PHI * b;
            f2 = distanceAtAngle(points, T, x2);
        }
    }
    return Math.min(f1, f2);
}

function distanceAtAngle(points: Point[], T: Point[], radians: number): number {
    const newPoints = rotateBy(points, radians);
    return pathDistance(newPoints, T);
}

function pathDistance(pts1: Point[], pts2: Point[]): number {
    let d = 0.0;
    for (let i = 0; i < pts1.length; i++) {
        d += distance(pts1[i], pts2[i]);
    }
    return d / pts1.length;
}

function pathLength(points: Point[]): number {
    let d = 0.0;
    for (let i = 1; i < points.length; i++) {
        d += distance(points[i - 1], points[i]);
    }
    return d;
}

function distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function centroid(points: Point[]): Point {
    let x = 0.0, y = 0.0;
    for (const p of points) {
        x += p.x;
        y += p.y;
    }
    return new Point(x / points.length, y / points.length);
}

function boundingBox(points: Point[]): { width: number, height: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    }
    return { width: maxX - minX, height: maxY - minY };
}

function deg2Rad(d: number) { return (d * Math.PI) / 180.0; }