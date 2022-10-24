import * as THREE from '../three.module.js';

export class Faucet {
    constructor() {
        this.material = new THREE.MeshPhongMaterial({
            color: "#5c5c5c",
            specular: "#383838",
            shininess: 100
    });

        // build base
        this.baseGeometry = new THREE.BoxGeometry(5, 0.5, 1 );
        this.baseMesh =  new THREE.Mesh( this.baseGeometry, this.material );
        this.baseMesh.position.set(2.5,4.25,-0.5);
        this.baseMesh.castShadow = true;

        // build neck
        this.neckGeometry = new THREE.BoxGeometry(0.5,2,1);
        this.neckMesh =  new THREE.Mesh( this.neckGeometry, this.material );
        this.neckMesh.position.set(2.5,5,-0.5);
        this.neckMesh.castShadow = true;

        // build head
        this.headGeometry = new THREE.BoxGeometry(0.5, 0.5, 2.5);
        this.headMesh =  new THREE.Mesh( this.headGeometry, this.material );
        this.headMesh.position.set(2.5,5.75,1);
        this.headMesh.castShadow = true;
    }
}