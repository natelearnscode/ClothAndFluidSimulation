import { Particle } from './particle.js';
import * as THREE from '../three.module.js';

export class SPHWater {
    constructor(kRad, kStiff, kRestDensity, numParticles) {
        this.particles = [];
        this.meshes = [];
        this.MAXNUMPARTICLES = numParticles;
        this.k_smooth_radius = kRad;
        this.k_stiff = kStiff;
        this.k_rest_density = kRestDensity;
    }


    Update(dt, scene) {
        if(dt > 0.5 || dt == 0) {
            return;
        }   
        this.GenerateParticles(dt, scene);
        for (let i = 0; i < 10; i++) {
            this.UpdatePhysics(dt/10);
        }
        this.UpdateMeshes();
    }

    GenerateParticles(dt, scene) {
        if(this.particles.length > this.MAXNUMPARTICLES) { //hit max particles so stop generating
            return;
        }

        const random = Math.random();
        if(random > 0.6) { // chance of generating particle
                //generate particle
                const randomX = Math.random();
                const randomZ = Math.random();
                const position = new THREE.Vector3(2.5,5.5,1.5);
                const newPosition = new THREE.Vector3(2.5 + (randomX/100.0),5.4999,1.5 + (randomZ/100));
                const velocity = new THREE.Vector3(0,0,0);
                const pressure = 0;
                const density = 0;
                const particle = new Particle(newPosition, position, velocity, pressure, density);
                this.particles.push(particle);

                //generate particle mesh
                const geometry = new THREE.SphereGeometry(0.25, 32, 16);
                const material = new THREE.MeshBasicMaterial({color: "rgb(0, 0, 150)"});
                const particleMesh = new THREE.Mesh(geometry, material);
                particleMesh.position.set(particle.pos.x, particle.pos.y, particle.pos.z);
                this.meshes.push(particleMesh);
                scene.add(particleMesh);
        }

    }

    UpdatePhysics(dt) {
        for (let i = 0; i < this.particles.length; i++) {
            // compute vel from previous pos 
            const p = this.particles[i];
            p.vel = new THREE.Vector3();
            p.vel.subVectors(p.pos, p.oldPos);
            p.vel.multiplyScalar(1/dt);

            // add gravity force
            const gravity = -9.8;
            const gravityVel = new THREE.Vector3(0,gravity * dt,0);

            p.vel.add(gravityVel);

            // collision computations
            if(p.pos.y < 0) { //collision with floor
                p.pos.y = 0;
                p.vel.y *= -0.9;
            }
            if(p.pos.x < 0) { //collision with left side on x axis
                p.pos.x = 0;
                p.vel.x *= -0.3;
            }
            if(p.pos.x > 5) { //collision with right side on x axis
                p.pos.x = 5;
                p.vel.x *= -0.3;
            }
            if(p.pos.z < 0) { //collision with left side on z axis
                p.pos.z = 0;
                p.vel.z *= -0.3;
            }
            if(p.pos.z > 5) { //collision with right side on z axis
                p.pos.z = 5;
                p.vel.z *= -0.3;
            }
   
            
            p.oldPos.copy(p.pos);
            p.vel.multiplyScalar(dt);
            p.pos.add(p.vel);

            p.density = 0.0;
            p.densityN = 0.0;
        }

        // find pairs of neighboring particles
        let pairs = [];
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = 0; j < this.particles.length; j++) {
                const dist = this.particles[i].pos.distanceTo(this.particles[j].pos);
                if(dist < this.k_smooth_radius && i < j) {
                    let q = 1 - (dist/this.k_smooth_radius);
                    pairs.push([i,j,q]);
                }
            }
        }

        // accumulate per-particle density
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const p1 = this.particles[ pair[0] ];
            const p2 = this.particles[ pair[1] ];
            const q = pair[2];

            p1.density += q*q;
            p2.density += q*q;

            p1.densityN += q * q * q;
            p2.densityN += q * q * q;
        }

        // compute per particle pressure
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];

            particle.pressure = this.k_stiff * (particle.density - this.k_rest_density);
            particle.pressureN = this.k_stiff * particle.densityN;
            if (particle.pressure > 50) { // max pressure
                particle.pressure = 50;
            }
        }

        // move particles given pressure
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const p1 = this.particles[ pair[0] ];
            const p2 = this.particles[ pair[1] ];
            const q = pair[2];

            const pressure =  (p1.pressure + p2.pressure);
            const pressureN = (p1.pressureN + p2.pressureN);
            const displace = (pressure * q + (pressureN * q * q)) * (dt * dt);
            let newPos1 = new THREE.Vector3();

            newPos1.subVectors(p1.pos, p2.pos).normalize();
            newPos1.multiplyScalar(displace);
            p1.pos.add(newPos1);

            let newPos2 = new THREE.Vector3();
            newPos2.subVectors(p2.pos, p1.pos).normalize();
            newPos2.multiplyScalar(displace);
            p2.pos.add(newPos2);
        }
    }

    UpdateMeshes() {

        for (let i = 0; i < this.particles.length; i++) {
            const x = this.particles[i].pos.x;
            const y = this.particles[i].pos.y;
            const z = this.particles[i].pos.z;

            this.meshes[i].position.set(x,y,z);
            const density = this.particles[i].density;
            const offset = (200 * density);
            this.meshes[i].material.color.set( 255 - offset, 255 - offset, 255);
        }
    }
}