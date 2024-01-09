import { PolyhedronGeometry } from 'three';

/**
 * @param {number} size
 */
export function getPentakisDodecahedronGeometry(size) {
    const S = size;
    const S2 = S / 2;

    const C0 = S * (Math.sqrt(5) - 1) / 4;
    const C1 = S * S * (9 + Math.sqrt(5)) / 76;
    const C2 = S * S * (7 + 5 * Math.sqrt(5)) / 76;
    const C3 = S * (1 + Math.sqrt(5)) / 4;

    const vertices = [
        0.0, C0, C3,
        0.0, C0, -C3,
        0.0, -C0, C3,
        0.0, -C0, -C3,
        C3, 0.0, C0,
        C3, 0.0, -C0,
        -C3, 0.0, C0,
        -C3, 0.0, -C0,
        C0, C3, 0.0,
        C0, -C3, 0.0,
        -C0, C3, 0.0,
        -C0, -C3, 0.0,
        C1, 0.0, C2,
        C1, 0.0, -C2,
        -C1, 0.0, C2,
        -C1, 0.0, -C2,
        C2, C1, 0.0,
        C2, -C1, 0.0,
        -C2, C1, 0.0,
        -C2, -C1, 0.0,
        0.0, C2, C1,
        0.0, C2, -C1,
        0.0, -C2, C1,
        0.0, -C2, -C1,
        S2, S2, S2,
        S2, S2, -S2,
        S2, -S2, S2,
        S2, -S2, -S2,
        -S2, S2, S2,
        -S2, S2, -S2,
        -S2, -S2, S2,
        -S2, -S2, -S2,
    ];

    const indicesOfFaces = [
        12, 0, 2,
        12, 2, 26,
        12, 26, 4,
        12, 4, 24,
        12, 24, 0,
        13, 3, 1,
        13, 1, 25,
        13, 25, 5,
        13, 5, 27,
        13, 27, 3,
        14, 2, 0,
        14, 0, 28,
        14, 28, 6,
        14, 6, 30,
        14, 30, 2,
        15, 1, 3,
        15, 3, 31,
        15, 31, 7,
        15, 7, 29,
        15, 29, 1,
        16, 4, 5,
        16, 5, 25,
        16, 25, 8,
        16, 8, 24,
        16, 24, 4,
        17, 5, 4,
        17, 4, 26,
        17, 26, 9,
        17, 9, 27,
        17, 27, 5,
        18, 7, 6,
        18, 6, 28,
        18, 28, 10,
        18, 10, 29,
        18, 29, 7,
        19, 6, 7,
        19, 7, 31,
        19, 31, 11,
        19, 11, 30,
        19, 30, 6,
        20, 8, 10,
        20, 10, 28,
        20, 28, 0,
        20, 0, 24,
        20, 24, 8,
        21, 10, 8,
        21, 8, 25,
        21, 25, 1,
        21, 1, 29,
        21, 29, 10,
        22, 11, 9,
        22, 9, 26,
        22, 26, 2,
        22, 2, 30,
        22, 30, 11,
        23, 9, 11,
        23, 11, 31,
        23, 31, 3,
        23, 3, 27,
        23, 27, 9,
    ];

    const geometry = new PolyhedronGeometry(vertices, indicesOfFaces, S, 0);
    geometry.rotateY(Math.PI / 2);

    return geometry;
}


