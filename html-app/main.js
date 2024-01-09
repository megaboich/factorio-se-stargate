import * as THREE from 'three';
import { ArcballControls } from 'three/addons/ArcballControls.js';
import { getPentakisDodecahedronGeometry } from './pentakis-dodecahedron-geometry.js';
import { mappingData } from './mapping-data.js'

/** @type {HTMLDivElement} */
let container;
/** @type {THREE.Camera} */
let camera;
/** @type {THREE.Scene} */
let scene;
/** @type {THREE.WebGLRenderer} */
let renderer;

const scale = 100;

init();
animate();

/**
 * @param {Array<number[]>} mappingData
 * @param {THREE.Scene} scene
 */
function addSpheres(mappingData, scene) {
    for (const entry of mappingData) {
        const [x, y, z, file] = entry;
        const spriteMaterial = new THREE.SpriteMaterial({
            map: new THREE.TextureLoader().load('./html-app/assets/mapped/' + (file || 'Unknown') + '.png'),
            color: 0xFAD5A5,
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x * scale, y * scale, z * scale);
        sprite.scale.set(20, 20, 20);
        scene.add(sprite);
    }
}

function init() {
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 1000;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcecece);
    // camera.lookAt(scene.position);


    const geometrySphere = getPentakisDodecahedronGeometry(scale);
    const materialSphere = new THREE.MeshBasicMaterial({ color: 0xA9A9A9 });
    const meshSphere = new THREE.Mesh(geometrySphere, materialSphere);

    const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true });
    const wireframeMesh = new THREE.Mesh(geometrySphere, wireframeMaterial);
    meshSphere.add(wireframeMesh);

    scene.add(meshSphere);

    addSpheres(mappingData, scene);

    const axesHelper = new THREE.AxesHelper(200);
    scene.add(axesHelper);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // controls
    const controls = new ArcballControls(camera, renderer.domElement, scene);
    controls.addEventListener('change', function () {
        renderer.render(scene, camera);
        saveCameraState();
    });

    restoreCameraState();
    //
    window.addEventListener('resize', onWindowResize);
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