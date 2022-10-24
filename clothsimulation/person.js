import * as THREE from '../three.module.js';

export class Person {
    constructor() {
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;

        this.vel = new THREE.Vector3(0,0,0);
        this.pos = new THREE.Vector3(0,2,0);
        this.posOld = new THREE.Vector3(0,2,0);
        this.speed = 5;

        this.radius = 1;
        this.material = new THREE.MeshToonMaterial({color: 0x556b2f});
        this.geometry = new THREE.CapsuleBufferGeometry(this.radius, 1, 4, 8);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
    }

    Update(dt) {
        this.vel.subVectors(this.pos, this.posOld);
        this.posOld.copy(this.pos);
        if(this.moveForward) {
            this.pos.z -= this.speed * dt;
        }

        if(this.moveBackward) {
            this.pos.z += this.speed * dt;
        }

        if(this.moveLeft) {
            this.pos.x -= this.speed * dt;
        }

        if(this.moveRight) {
            this.pos.x += this.speed * dt;
        }

        if(this.moveUp) {
            this.pos.y += this.speed * dt;
        }

        if(this.moveDown) {
            this.pos.y -= this.speed * dt;
        }

        this.mesh.position.copy(this.pos);
    }
}