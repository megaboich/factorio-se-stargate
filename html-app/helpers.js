import * as THREE from 'three';

/**
 * @template T
 * @param {T | undefined | null | false} val
 * @return T
 */
export function ensure(val) {
    if (!val) {
        throw new Error("Value must be truthy");
    }
    return val;
}

/**
 * Returns array of faces. Each face is represented by array of its 3 vertices.
 * @param {THREE.BufferGeometry} geometry 
 * @return {[THREE.Vector3, THREE.Vector3, THREE.Vector3][]}
 */
export function getFacesFromGeometry(geometry) {
    let pos = geometry.attributes.position.array;
    let facesCount = pos.length / 9;
    /** @type {[THREE.Vector3, THREE.Vector3, THREE.Vector3][]} */
    const faces = [];
    for (let faceIndex = 0; faceIndex < facesCount; faceIndex++) {
        faces.push([
            new THREE.Vector3(pos[faceIndex * 9 + 0], pos[faceIndex * 9 + 1], pos[faceIndex * 9 + 2]),
            new THREE.Vector3(pos[faceIndex * 9 + 3], pos[faceIndex * 9 + 4], pos[faceIndex * 9 + 5]),
            new THREE.Vector3(pos[faceIndex * 9 + 6], pos[faceIndex * 9 + 7], pos[faceIndex * 9 + 8])
        ]);
    }
    return faces;
}

/**
 * 
 * @param {[THREE.Vector3, THREE.Vector3, THREE.Vector3][]} faces 
 * @param {THREE.Vector3} point 
 */
export function findClosestFaceToPoint(faces, point) {
    for (let faceIndex = 0; faceIndex < faces.length; faceIndex++) {
        const face = faces[faceIndex];
        const subTriangle = new THREE.Triangle(...face);
        if (subTriangle.containsPoint(point)) {
            return faceIndex;
        }
    }
    return 0;
}

/**
 * Compute the intersection point of a triangle with a line.
 * @param {THREE.Vector3} v1 - The first vertex of the triangle.
 * @param {THREE.Vector3} v2 - The second vertex of the triangle.
 * @param {THREE.Vector3} v3 - The third vertex of the triangle.
 * @param {THREE.Vector3} lineStart - The starting point of the line.
 * @param {THREE.Vector3} lineEnd - The ending point of the line.
 * @returns {THREE.Vector3|null} The intersection point, or null if no intersection.
 */
export function computeTriangleLineIntersection(v1, v2, v3, lineStart, lineEnd) {
    const plane = new THREE.Plane().setFromCoplanarPoints(v1, v2, v3);
    const line = new THREE.Line3(lineStart, lineEnd);
    const intersectionPoint = new THREE.Vector3();
    const isIntersection = plane.intersectLine(line, intersectionPoint);
    return isIntersection ? intersectionPoint : null;
}

/**
 * Breaks a triangle into 64 sub-triangles like puzzle pieces.
 * @param {THREE.Vector3} v1 - The first vertex of the triangle.
 * @param {THREE.Vector3} v2 - The second vertex of the triangle.
 * @param {THREE.Vector3} v3 - The third vertex of the triangle.
 * @returns {[THREE.Vector3, THREE.Vector3, THREE.Vector3][]} An array of sub-triangle coordinates.
 */
export function breakTriangle(v1, v2, v3) {
    /** @type {[THREE.Vector3, THREE.Vector3, THREE.Vector3][]} */
    const subTriangles = [];
    const divisions = 3; // Number of divisions along each edge

    /**
     * Divide the triangle into sub-triangles
     * @param {THREE.Vector3} p1 
     * @param {THREE.Vector3} p2 
     * @param {THREE.Vector3} p3 
     * @param {number} depth 
     */
    function divideTriangle(p1, p2, p3, depth) {
        if (depth === 0) {
            subTriangles.push([p1.clone(), p2.clone(), p3.clone()]);
        } else {
            const p12 = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
            const p23 = new THREE.Vector3().lerpVectors(p2, p3, 0.5);
            const p31 = new THREE.Vector3().lerpVectors(p3, p1, 0.5);

            divideTriangle(p1, p12, p31, depth - 1);
            divideTriangle(p12, p2, p23, depth - 1);
            divideTriangle(p31, p23, p3, depth - 1);
            // divideTriangle(p12, p23, p31, depth - 1);
            // divideTriangle(p31, p12, p23, depth - 1);
            divideTriangle(p23, p31, p12, depth - 1);
        }
    }

    divideTriangle(v1, v2, v3, divisions);

    return subTriangles;
}

/**
 * @param {number} size
 * @param {THREE.Vector3} point
 * @param {number | string} color 
 */
export function createSphere(size, point, color) {
    const material = new THREE.MeshBasicMaterial({ color });
    const geometry = new THREE.SphereGeometry(size);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(point);
    return mesh;
}

/**
 * Render a line segment in a Three.js scene.
 * @param {THREE.Vector3} start - The starting point of the line segment.
 * @param {THREE.Vector3} end - The ending point of the line segment.
 * @param {string | number} color - The color of the line segment.
 */
export function createLineSegment(start, end, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    return line;
}

/**
 * @param {THREE.Vector3} center 
 * @param {string} textureUrl
 * @param {string | number} color 
 * @param {number} size
 */
export function createSprite(center, textureUrl, color, size = 20) {
    const spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.TextureLoader().load(textureUrl),
        color,
        transparent: true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(center.x, center.y, center.z);
    sprite.scale.set(size, size, size);
    return sprite;
}


/**
 * @param {string} text 
 * @param {number=} fontSize 
 * @param {string=} color 
 * @returns {string}
 */
export function generateTextImage(text, fontSize = 48, color = 'white') {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const context = ensure(canvas.getContext('2d'));

    // Set font and measure text size
    context.font = `normal 100 ${fontSize}px Arial`;
    const textSize = context.measureText(text);

    // Set canvas dimensions
    canvas.width = textSize.width;
    canvas.height = fontSize;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `normal 100 ${fontSize}px Arial`;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Return the canvas element
    return canvas.toDataURL('image/png');
}