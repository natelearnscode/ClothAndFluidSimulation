import * as THREE from '../three.module.js';
import { OrbitControls } from '../OrbitControls.js';
import { GUI } from '../dat.gui.module.js';
import * as STATS from '../stats.js';
import { Cloth } from './cloth.js';
import { Person } from './person.js';

const contentDiv = document.getElementById("content");

const stats = STATS.default();
contentDiv.appendChild(stats.dom);

let clock = new THREE.Clock();


let renderer, scene, camera, controls;
let gui;

// Simulation Parameters /////////////////
let parameters = {
    clothWidth: 10, 
    clothHeight: 6,
    restLength: 1.3,
    kConstant: 20,
    kvConstant: 10,
    mass: 1,
    debugHelper: false,
    ResetSimulation: restart,
}

let floorGeometry, floorMaterial, floorMesh;

let clothLeft, clothRight, person;

///////////////////////////////////


// initialize simulation on page load
window.onload=init;

// function that initializes and runs simulation
function init() {
    //console.log("setting up threejs scene");
    //set up Threejs components
    setupThreejs();

    // set up GUI
    gui = new GUI();

    //environment parameters
    const parametersFolder = gui.addFolder('Parameters');
    parametersFolder.add(parameters, 'clothWidth', 1, 50, 1);
    parametersFolder.add(parameters, 'clothHeight', 1, 50, 1);
    parametersFolder.add(parameters, 'restLength', 0.1, 5);
    parametersFolder.add(parameters, 'kConstant', 0, 200);
    parametersFolder.add(parameters, 'kvConstant', 0, 200);
    parametersFolder.add(parameters, 'mass', 0.1, 100);
    parametersFolder.add(parameters, 'debugHelper');


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

// function that initializes the cloth and runs the simulation
function runSimulation() {
    //cloth
    let clothColor = new THREE.Color(256, 0, 0);
    clothLeft = new Cloth(parameters.clothWidth, parameters.clothHeight, clothColor, parameters.restLength, parameters.kConstant, parameters.kvConstant, parameters.mass, parameters.debugHelper, -15);
    clothRight = new Cloth(parameters.clothWidth, parameters.clothHeight, clothColor, parameters.restLength, parameters.kConstant, parameters.kvConstant, parameters.mass, parameters.debugHelper, 10);
    if(clothLeft.debugMode) {
        for(let i = 0; i < clothLeft.width; i++) {
            for(let j = 0; j < clothLeft.height; j++) {
                scene.add(clothLeft.sphereHelperMeshes[i][j]);
            }
        }
    }

    if(clothRight.debugMode) {
        for(let i = 0; i < clothRight.width; i++) {
            for(let j = 0; j < clothRight.height; j++) {
                scene.add(clothRight.sphereHelperMeshes[i][j]);
            }
        }
    }

    scene.add(clothLeft.mesh);
    scene.add(clothRight.mesh);

    person = new Person();
    scene.add(person.mesh);

    camera.lookAt(person.mesh.position);
}

//function that sets up all the threejs components for rendering a scene
function setupThreejs() {
    // set up renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( contentDiv.clientWidth, contentDiv.clientHeight );
    renderer.setClearColor("#111111");
    renderer.shadowMap.enabled = true;

    contentDiv.appendChild( renderer.domElement );

    // set up scene
    scene = new THREE.Scene();
    
    // set up camera
    camera = new THREE.PerspectiveCamera( 75, contentDiv.clientWidth / contentDiv.clientHeight, 0.5, 5000 );
    camera.position.set( 0, 10, 50 );

    // set up camera controls
    controls = new OrbitControls( camera, renderer.domElement );
    
    // set up listener for window resizing
    window.addEventListener( 'resize', onWindowResize );

    // set up listener to track keydown event
    window.addEventListener( 'keydown', onKeyDown );

    // set up listener to track keyup event
    window.addEventListener('keyup', onKeyUp);

    // set up lights
    const light =  new THREE.PointLight( 0xffffff, 0.5 );
    light.castShadow = true; // default false
    light.position.set(-10, 5, 0)
    //scene.add(light);

    const spotLight = new THREE.SpotLight( 0xffffff, 0.5, 0, Math.PI / 9, 0.01 );
    spotLight.castShadow = true;
    spotLight.position.set( 5, 25, 25 );
    scene.add( spotLight );

    const spotLightHelper = new THREE.SpotLightHelper( spotLight );
    //scene.add( spotLightHelper );

    // Create Floor
    floorGeometry = new THREE.BoxGeometry(30, 2, 25);
    floorMaterial = new THREE.MeshToonMaterial({color: "rgb(150, 75, 0)"});

    // load floor texture
    const texture = new THREE.TextureLoader().load('./Wood_Planks_B_Basecolor.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 4, 4 );
    floorMaterial.map = texture;

    floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.receiveShadow = true;
    floorMesh.position.set(0,-1,0);

    scene.add(floorMesh);


    // add hemispher light
    const hemisphereLight =  new THREE.HemisphereLight( 0xffffff, floorMaterial.color, 0.5 );
    scene.add(hemisphereLight);
}

// function that runs everytime the window is resized (used for automatically setting the new size and aspect ratio )
function onWindowResize() {

    renderer.setSize( contentDiv.clientWidth, contentDiv.clientHeight );

    camera.aspect = contentDiv.clientWidth / contentDiv.clientHeight;
    camera.updateProjectionMatrix();

    render();
}

// function that runs each time a key is pressed down
function onKeyDown( event ) {
    if (event.key == "w") {
        person.moveForward = true;
    }
    if (event.key == "s") {
        person.moveBackward = true;
    }
    if (event.key == "a") {
        person.moveLeft = true;
    }
    if (event.key == "d") {
        person.moveRight = true;
    }
    if (event.key == "q") {
        person.moveUp = true;
    }
    if (event.key == "e") {
        person.moveDown = true;
    }
}

// function that runs each time a key is released
function onKeyUp( event ) {
    if (event.key == "w") {
        person.moveForward = false;
    }
    if (event.key == "s") {
        person.moveBackward = false;
    }
    if (event.key == "a") {
        person.moveLeft = false;
    }
    if (event.key == "d") {
        person.moveRight = false;
    }
    if (event.key == "q") {
        person.moveUp = false;
    }
    if (event.key == "e") {
        person.moveDown = false;
    }
}

// function that is called every frame and renders the scene
function render() {
    stats.begin();
    let dt = clock.getDelta();

    controls.update();


    if(dt != Infinity || dt > 1 || dt == 0) { // initially dt is infinity so need to account for this
        // let amount = 1.0 / 20;
        // for(let i=0; i < 20; i++) {
        //    cloth.Update(amount * dt );
        // }
        person.Update(dt);
        clothLeft.Update(dt, person);
        clothRight.Update(dt, person);
    }


    renderer.render( scene, camera );
    stats.end();

    requestAnimationFrame(render);
}


//function that restarts the simulation
function restart () {
    console.log("reseting simulation");

    if(clothLeft.debugMode) {
        for(let i = 0; i < clothLeft.width; i++) {
            for(let j = 0; j < clothLeft.height; j++) {
    
                scene.remove(clothLeft.sphereHelperMeshes[i][j]);
            }
        }
    }

    if(clothRight.debugMode) {
        for(let i = 0; i < clothRight.width; i++) {
            for(let j = 0; j < clothRight.height; j++) {
    
                scene.remove(clothRight.sphereHelperMeshes[i][j]);
            }
        }
    }

    scene.remove(clothLeft.mesh);
    scene.remove(clothRight.mesh);
    scene.remove(person.mesh);
    runSimulation();
}
