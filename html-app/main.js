import * as THREE from 'three';
// import { ArcballControls } from 'three/addons/controls/ArcballControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { getPentakisDodecahedronGeometry } from './pentakis-dodecahedron-geometry.js';
import { mappingData, ruinDiscoveryData, originalTargetVector, destinationVector, attempts } from './mapping-data.js'

/** @type {HTMLDivElement} */
let container;
/** @type {THREE.Camera} */
let camera;
/** @type {THREE.Scene} */
let scene;
/** @type {THREE.WebGLRenderer} */
let renderer;

/** @type {any} */
let controls;

const scale = 100;

init();
animate();

/**
 * @param {Array<number[]>} mappingDataRaw
 * @param {Array<any[]>} ruinDiscoveryDataRaw
 * @param {THREE.BufferGeometry} sphereGeo
 * @param {THREE.Scene} scene
 */
function addSpheres(mappingDataRaw, ruinDiscoveryDataRaw, sphereGeo, scene) {
    const mappedData = mappingDataRaw.map((entry, index) => {
        const [x, y, z, file] = entry;
        const pos = new THREE.Vector3(x, y, z);
        pos.multiplyScalar(scale * 0.924);
        return {
            file,
            pos,
            index
        }
    });

    const ruinData = ruinDiscoveryDataRaw.map((entry) => {
        const [facetIndex, file] = entry;
        return {
            facetIndex,
            file
        }
    })

    console.log("start");

    let pos = sphereGeo.attributes.position.array;
    let facesCount = pos.length / 9;
    for (let i = 0; i < facesCount; i++) {
        const a = new THREE.Vector3(pos[i * 9 + 0], pos[i * 9 + 1], pos[i * 9 + 2]);
        const b = new THREE.Vector3(pos[i * 9 + 3], pos[i * 9 + 4], pos[i * 9 + 5]);
        const c = new THREE.Vector3(pos[i * 9 + 6], pos[i * 9 + 7], pos[i * 9 + 8]);
        // center is the average of three vertices
        const center = a.clone().add(b).add(c).divideScalar(3);

        let spriteMaterial;
        const matchedMapEntry = mappedData.find(x => {
            const currPos = x.pos.clone();
            const distV = currPos.sub(center);
            const dist = distV.length();
            return dist < 1;
        });
        if (matchedMapEntry) {
            if (matchedMapEntry.file) {
                spriteMaterial = new THREE.SpriteMaterial({
                    map: new THREE.TextureLoader().load(`./html-app/assets/mapped/${matchedMapEntry.file}.png`),
                    color: 0x99FF77,
                });
            } else {
                spriteMaterial = new THREE.SpriteMaterial({
                    map: new THREE.TextureLoader().load(generateTextImage("M" + matchedMapEntry.index.toString())),
                    color: 0x00FF00,
                });
            }
        } else {
            const matchedRuinData = ruinData.find(x => x.facetIndex === i);
            if (matchedRuinData) {
                spriteMaterial = new THREE.SpriteMaterial({
                    map: new THREE.TextureLoader().load(`./html-app/assets/mapped/${matchedRuinData.file}.png`),
                    color: 0xFF8855,
                });
            }
        }

        if (!spriteMaterial)
            spriteMaterial = new THREE.SpriteMaterial({
                map: new THREE.TextureLoader().load(generateTextImage("F" + i.toString())),
                color: 0xFF0000,
            });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(center.x, center.y, center.z);
        sprite.scale.set(20, 20, 20);
        scene.add(sprite);
    }

}

function init() {
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 200;
    restoreCameraState();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // camera.lookAt(scene.position);

    const geometrySphere = getPentakisDodecahedronGeometry(scale);
    const materialWireframe = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true, transparent: true });
    const meshWireframe = new THREE.Mesh(geometrySphere, materialWireframe);
    scene.add(meshWireframe);

    addSpheres(mappingData, ruinDiscoveryData, geometrySphere, scene);

    const originalTargetMaterial = new THREE.MeshBasicMaterial({ color: 0x0055FF });
    const smallSphereGeometry = new THREE.SphereGeometry(1, 32, 32); // Radius, widthSegments, heightSegments
    const originalTarget = new THREE.Mesh(smallSphereGeometry, originalTargetMaterial);
    originalTarget.position.set(originalTargetVector.x * scale, originalTargetVector.y * scale, originalTargetVector.z * scale);
    scene.add(originalTarget);

    const destinationMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const destinationTarget = new THREE.Mesh(smallSphereGeometry, destinationMaterial);
    destinationTarget.position.set(destinationVector.x * scale, destinationVector.y * scale, destinationVector.z * scale);
    scene.add(destinationTarget);

    const attemptMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const attemptMesh = new THREE.Mesh(smallSphereGeometry, attemptMaterial);
    attemptMesh.position.set(attempts[0][0] * scale, attempts[0][1] * scale, attempts[0][2] * scale);
    scene.add(attemptMesh);

    const axesHelper = new THREE.AxesHelper(200);
    scene.add(axesHelper);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // controls
    controls = new FlyControls(camera, renderer.domElement);
    controls.movementSpeed = 50;
    controls.domElement = renderer.domElement;
    controls.rollSpeed = Math.PI / 24;
    controls.autoForward = false;
    controls.dragToLook = true;

    //
    window.addEventListener('resize', onWindowResize);

    document.getElementById('btn-reset-camera').addEventListener('click', () => {
        camera.position.set(0, 0, 200);
        camera.rotation.set(0, 0, 0);
        render();
    })
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
    controls.update(0.02);
    saveCameraState();
}

// Function to save the camera state
function saveCameraState() {
    const state = {
        position: {
            x: Math.round(camera.position.x * 1000) / 1000,
            y: Math.round(camera.position.y * 1000) / 1000,
            z: Math.round(camera.position.z * 1000) / 1000,
        },
        rotation: {
            x: Math.round(camera.rotation.x * 1000) / 1000,
            y: Math.round(camera.rotation.y * 1000) / 1000,
            z: Math.round(camera.rotation.z * 1000) / 1000,
        }
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
    }
}

function generateTextImage(text, fontSize = 48, color = 'white') {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set font and measure text size
    context.font = `normal 100 ${fontSize}px Arial`;
    const textSize = context.measureText(text);

    // Set canvas dimensions
    canvas.width = textSize.width + 50;
    canvas.height = fontSize + 50;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `normal 100 ${fontSize}px Arial`;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Return the canvas element
    return canvas.toDataURL('image/png');
}