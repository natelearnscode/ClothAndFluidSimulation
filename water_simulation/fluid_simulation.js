import * as THREE from '../three.module.js';
import { OrbitControls } from '../OrbitControls.js';
import { GUI } from '../dat.gui.module.js';
import * as STATS from '../stats.js';
import { ShallowWater } from './shallow_water.js';
import { SPHWater } from './sph_water.js';
import { Faucet } from './faucet.js';

const contentDiv = document.getElementById("content");

const stats = STATS.default();
contentDiv.appendChild(stats.dom);

let clock = new THREE.Clock();

let renderer, scene, camera, controls;
let gui;

let water;

// Simulation Parameters /////////////////
let parameters = {
    k_smooth_radius: 0.5,
    k_stiff: 150,
    k_rest_density: 0.7,
    numParticles: 200,
    ResetSimulation: restart,
}

// initialize simulation on page load
window.onload=init;

// function that initializes and runs simulation
function init() {
    //set up Threejs components
    setupThreejs();

    // set up GUI
    gui = new GUI();

    //environment parameters
    const parametersFolder = gui.addFolder('Parameters');
    parametersFolder.add(parameters, 'k_smooth_radius', 0.1, 2);
    parametersFolder.add(parameters, 'k_stiff', 1, 250);
    parametersFolder.add(parameters, 'k_rest_density', 0.1, 1, 0.1);
    parametersFolder.add(parameters, 'numParticles', 1, 700, 10);

    parametersFolder.open();

    // restart simulation
    const resetSimulationFolder = gui.addFolder('Restart Simulation');
    resetSimulationFolder.add(parameters, 'ResetSimulation').name("Click To Restart The Simulation");
    resetSimulationFolder.open();



    console.log("running simulation");
    // run the simulation
    runSimulation();

    // render scene
    render();
}

// function that initializes and runs the simulation
function runSimulation() {
    water = new SPHWater(parameters.k_smooth_radius, parameters.k_stiff, parameters.k_rest_density, parameters.numParticles);
    for (let i = 0; i < water.meshes.length; i++) {
        scene.add(water.meshes[i]); 
    }
    //set target of orbital controls
    const target = new THREE.Vector3(2.5,2.5,2.5);
    //target.copy(water.meshes[0].position);
    controls.target = target;//water.meshes[0].position;
    controls.update();
}

//function that sets up all the threejs components for rendering a scene
function setupThreejs() {
    // set up renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( contentDiv.clientWidth, contentDiv.clientHeight );
    renderer.setClearColor("#bff1ff");
    renderer.shadowMap.enabled = true;

    contentDiv.appendChild( renderer.domElement );

    // set up scene
    scene = new THREE.Scene();
    
    // set up camera
    camera = new THREE.PerspectiveCamera( 75, contentDiv.clientWidth / contentDiv.clientHeight, 0.5, 5000 );
    camera.position.set( 2.5, 5, 12 );

    // set up camera controls
    controls = new OrbitControls( camera, renderer.domElement );
    
    // set up listener for window resizing
    window.addEventListener( 'resize', onWindowResize );

    // set up listener to track mouse movements
    //window.addEventListener( 'pointermove', onPointerMove );

    // set up listener for keyboard event
    window.addEventListener('keydown', onButtonPress);

    //set up floor
    const floorGeometry = new THREE.BoxGeometry(5, 0.001, 5);
    const floorMaterial = new THREE.MeshPhongMaterial({color: "rgb(150, 150, 250)"});

    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.receiveShadow = true;
    floorMesh.position.set(2.5,0,2.5);

    scene.add(floorMesh);

    //set up back wall
    const backWallGeometry = new THREE.BoxGeometry(25, 4, 5);
    const backWallMaterial = new THREE.MeshPhongMaterial({
        color: "rgb(250, 250, 250)",
        opacity: 1,
        transparent: true});

    const backWallMesh = new THREE.Mesh(backWallGeometry, backWallMaterial);
    backWallMesh.position.set(2.5,2,-2.5);

    scene.add(backWallMesh);

    //set up left wall
    const leftWallGeometry = new THREE.BoxGeometry(10, 4, 5);
    const leftWallMaterial = new THREE.MeshPhongMaterial({
        color: "rgb(250, 250, 250)",
        opacity: 1,
        transparent: true});

    const lefWallMesh = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
    lefWallMesh.position.set(-5,2,2.5);

    scene.add(lefWallMesh);

    //set up right wall
    const rightWallGeometry = new THREE.BoxGeometry(10, 4, 5);
    const rightWallMaterial = new THREE.MeshPhongMaterial({
        color: "rgb(250, 250, 250)",
        opacity: 1,
        transparent: true});

    const rightWallMesh = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
    rightWallMesh.position.set(10,2,2.5);

    scene.add(rightWallMesh);

    //set up front wall
    const wallGeometry = new THREE.BoxGeometry(5, 4, 0.1);
    const wallMaterial = new THREE.MeshPhongMaterial({
        color: "rgb(250, 250, 250)",
        opacity: 0.5,
        transparent: true});

    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.set(2.5,2,5);

    scene.add(wallMesh);

    //set up faucet
    const faucet = new Faucet();
    scene.add(faucet.baseMesh);
    scene.add(faucet.neckMesh);
    scene.add(faucet.headMesh);
    
    // set up lights
    const light =  new THREE.PointLight( 0xffffff, 0.5 );
    light.castShadow = true; // default false
    light.position.set(2.5, 15, 2.5)
    scene.add(light);


    // add hemispher light
    const hemisphereLight =  new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.5 );
    scene.add(hemisphereLight);
}

// function that runs everytime the window is resized (used for automatically setting the new size and aspect ratio )
function onWindowResize() {

    renderer.setSize( contentDiv.clientWidth, contentDiv.clientHeight );

    camera.aspect = contentDiv.clientWidth / contentDiv.clientHeight;
    camera.updateProjectionMatrix();

    render();
}

// function that is called every frame and renders the scene
function render() {
    stats.begin();
    let dt = clock.getDelta();
    //console.log(camera.position);

    controls.update();


    if(dt != Infinity) { // initially dt is infinity so need to account for this
        water.Update(dt, scene);
    }


    renderer.render( scene, camera );
    stats.end();

    requestAnimationFrame(render);
}


//function that restarts the simulation
function restart () {
    console.log("reseting simulation");
    for (let i = 0; i < water.meshes.length; i++) {
        scene.remove(water.meshes[i]); 
    }
    runSimulation();
}

// function that upon key press moves the plate
function onButtonPress(event) {
    if(event.key == "ArrowUp") { // lift up water
        for (let i = 0; i < water.particles.length; i++) {
            const oldY = water.particles[i].pos.y;
            water.particles[i].pos.setY(oldY + 0.001);
        }
    }
}
