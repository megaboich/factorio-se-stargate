import * as THREE from 'three';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { getPentakisDodecahedronGeometry } from './pentakis-dodecahedron-geometry.js';
import { mappingData, faceToGlyph, source, destination, attempt, pyramidTriangleIndexToGlyph } from './vector-data.js'
import {
    ensure,
    breakTriangle,
    findClosestFaceToPoint,
    generateTextImage,
    getFacesFromGeometry,
    createLineSegment,
    createSphere,
    createSprite,
    computeTriangleLineIntersection
} from './helpers.js';

/** @type {HTMLElement} */
let container;
/** @type {THREE.PerspectiveCamera} */
let camera;
/** @type {THREE.Scene} */
let scene;
/** @type {THREE.WebGLRenderer} */
let renderer;

/** @type {any} */
let controls;

const scale = 100;

container = ensure(document.getElementById('container'));

camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.z = 200;
restoreCameraState();

scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const geometrySphere = getPentakisDodecahedronGeometry(scale);
const materialWireframe = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true });
const meshWireframe = new THREE.Mesh(geometrySphere, materialWireframe);
scene.add(meshWireframe);

const allFaces = getFacesFromGeometry(geometrySphere);
addGlyphs(faceToGlyph, allFaces);

const destinationVector = new THREE.Vector3(...destination).multiplyScalar(scale);
const attemptVector = new THREE.Vector3(...attempt).multiplyScalar(scale);
const firstMappingPoint = new THREE.Vector3(...mappingData[0]).multiplyScalar(scale)

const closestFaceIndex = findClosestFaceToPoint(allFaces, destinationVector);
const closestFace = allFaces[closestFaceIndex];
console.log("Closest face to destination 0 ", closestFaceIndex, closestFace);

const destinationVectorIntersected = ensure(computeTriangleLineIntersection(closestFace[0], closestFace[1], closestFace[2], new THREE.Vector3(), destinationVector));
renderFacetBreakdown(closestFace, destinationVectorIntersected, 1);

//scene.add(createSprite(firstMappingPoint, generateTextImage("?", 96), 'lime'));

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// controls
controls = new FlyControls(camera, renderer.domElement);
controls.movementSpeed = 40;
controls.domElement = renderer.domElement;
controls.rollSpeed = Math.PI / 20;
controls.autoForward = false;
controls.dragToLook = true;
animate();
addEventHandlers();


/** @type {THREE.Mesh} */
let destIndicator;
/** @type {THREE.Mesh} */
let destIntersectedIndicator;
/** @type {THREE.Mesh} */
let attemptIndicator;
function recreateDynamicEntities() {
    const indicatorSize = 3 / camera.zoom;
    /*
    scene.remove(destIndicator);
    destIndicator = createSphere(indicatorSize, destinationVector, 'yellow');
    scene.add(destIndicator);
*/
    scene.remove(destIntersectedIndicator);
    destIntersectedIndicator = createSphere(indicatorSize, destinationVectorIntersected, 'aqua');
    scene.add(destIntersectedIndicator);

    /*
    scene.remove(attemptIndicator);
    attemptIndicator = createSphere(indicatorSize, attemptVector, 'red');
    scene.add(attemptIndicator);
*/
    controls.rollSpeed = Math.PI / (20 * camera.zoom);

    ensure(document.getElementById("zoom-label")).innerText = String(Math.round(camera.zoom * 100) / 100);;
}

recreateDynamicEntities();

/**
 * @param {{[key: number]: string}} faceToGlyph
 * @param {THREE.Vector3[][]} allFaces
 */
function addGlyphs(faceToGlyph, allFaces) {
    for (let faceIndex = 0; faceIndex < allFaces.length; faceIndex++) {
        const face = allFaces[faceIndex];
        // center is the average of three vertices
        const center = face[0].clone().add(face[1]).add(face[2]).divideScalar(3);

        const matchedGlyph = faceToGlyph[faceIndex];
        if (matchedGlyph) {
            scene.add(createSprite(center, `./html-app/assets/mapped/${matchedGlyph}.png`, 'yellow'));
        } else {
            scene.add(createSprite(center, generateTextImage(faceIndex.toString()), 'aqua', 8));
        }
    }
}

/**
 * 
 * @param {[THREE.Vector3, THREE.Vector3, THREE.Vector3]} face 
 * @param {THREE.Vector3} destinationVector
 * @param {number} level
 */
function renderFacetBreakdown(face, destinationVector, level) {
    if (level < 8) {
        const subs = breakTriangle(...face);
        for (let subIndex = 0; subIndex < subs.length; ++subIndex) {
            const sub = subs[subIndex];
            scene.add(createLineSegment(sub[0], sub[1], 'red'));
            scene.add(createLineSegment(sub[0], sub[2], 'red'));
            scene.add(createLineSegment(sub[1], sub[2], 'red'));

            const faceCenter = sub[0].clone().add(sub[1]).add(sub[2]).divideScalar(3);

            const dist = faceCenter.clone().sub(destinationVector).length();
            const label = level === 30
                ? Math.round(dist * 1000).toString()
                : subIndex.toString();

            if (pyramidTriangleIndexToGlyph[subIndex]) {
                scene.add(createSprite(faceCenter, `./html-app/assets/mapped/${pyramidTriangleIndexToGlyph[subIndex]}.png`, 'white', 4 / (Math.pow(8, level - 1))));
            } else {
                scene.add(createSprite(faceCenter, generateTextImage(label, 32), 'white', 2 / (Math.pow(8, level - 1))));
            }
        }

        const closestFaceIndex = findClosestFaceToPoint(subs, destinationVector);
        const closestFace = subs[closestFaceIndex];
        console.log("Closest face to destination " + level, closestFaceIndex, closestFace);

        renderFacetBreakdown(closestFace, destinationVector, level + 1);
    }
}


function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
    controls.update(0.02);
}

// Function to save the camera state
function saveCameraState() {
    const state = {
        position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
        },
        rotation: {
            x: camera.rotation.x,
            y: camera.rotation.y,
            z: camera.rotation.z,
        },
        zoom: camera.zoom
    };
    window.localStorage.setItem("CAMERA", JSON.stringify(state));
}

// Function to restore the camera state
function restoreCameraState() {
    const json = window.localStorage.getItem("CAMERA");
    if (json) {
        const state = JSON.parse(json);
        camera.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z)
        camera.position.set(state.position.x, state.position.y, state.position.z);
        camera.zoom = state.zoom;
        camera.updateProjectionMatrix();
    }
}

function addEventHandlers() {
    controls.addEventListener('change', saveCameraState);

    //
    window.addEventListener('resize', onWindowResize);

    ensure(document.getElementById('btn-reset-camera-outside'))
        .addEventListener('click', () => {
            camera.position.set(0, 0, 200);
            camera.rotation.set(0, 0, 0);
            camera.zoom = 1;
            camera.updateProjectionMatrix();
            recreateDynamicEntities()
        });

    ensure(document.getElementById('btn-move-camera-inside'))
        .addEventListener('click', () => {
            function stepMove() {
                const d = camera.position.distanceTo(new THREE.Vector3());
                if (d > 5) {
                    const step = new THREE.Vector3().lerpVectors(camera.position, new THREE.Vector3(), 0.1);
                    camera.position.copy(step);
                    camera.updateProjectionMatrix();
                    setTimeout(stepMove, 100);
                } else {
                    camera.position.set(0, 0, 0);
                    camera.updateProjectionMatrix();
                }
            }
            stepMove();
        })
    ensure(document.getElementById('btn-zoom-in'))
        .addEventListener('click', () => {
            camera.zoom *= 1.2;
            camera.updateProjectionMatrix();
            saveCameraState();
            recreateDynamicEntities();
        })
    ensure(document.getElementById('btn-zoom-out'))
        .addEventListener('click', () => {
            camera.zoom /= 1.2;
            camera.updateProjectionMatrix();
            saveCameraState();
            recreateDynamicEntities();
        })
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}