import * as THREE from '../three.module.js';

export class ShallowWater {
    constructor(maxX, maxZ, dx) {
        this.h = [];
        this.hu = [];
        this.dx = dx;
        this.numCells = maxX/dx;
        this.cells = [];

        //initialize heights
        for(let i = 0; i < this.numCells; i++) {
            this.h.push(20 * i / this.numCells + 1); 
            this.hu.push(0);
        }

        // generate objects used to represent cells in system
        this.InitializeCells();


    }

    InitializeCells() {
        for(let i = 0; i < this.numCells; i++) {
            const geometry = new THREE.BoxGeometry( 1, 1, 1 );
            const material = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
            const cube = new THREE.Mesh( geometry, material );
            cube.position.set(i + 0.5,this.h[i],0);
            this.cells.push(cube);
        }
    }

    Update(dt) {
        //console.log("start");
        let before = this.h[0];
        console.log();
        for(let i=0; i < 100; i++) {
            this.UpdatePhysics(dt/100);
        }
        console.log("differece is ", this.h[0] - before);
        //console.log("end");
        this.UpdateMesh();
    }

    UpdatePhysics(dt) {

        const gravity = 1;
        const damp = 0.9;
        const n = this.h.length;

        let dhdt = []; //height derivation
        let dhudt = []; //momentum derivation

        let h_mid = []; //height (midpoint)
        let hu_mid = [];//momentum (midpoint)

        let dhdt_mid = [];//height derivation (midpoint)
        let dhudt_mid = [];//momentum derivation (midpoint)

        // fill arrays with 0
        for(let i=0; i<n; i++) {
            dhdt.push(0);
            dhdt.push(0); //height derivation
            dhudt.push(0); //momentum derivation
    
            h_mid.push(0); //height (midpoint)
            hu_mid.push(0);//momentum (midpoint)
    
            dhdt_mid.push(0);//height derivation (midpoint)
            dhudt_mid.push(0);//momentum derivation (midpoint)
        }

        //compute midpoint heights and momentums
        for(let i = 0; i < n-1; i++) {
            h_mid[i] = (this.h[i] + this.h[i+1]) / 2 ; 
            hu_mid[i] = (this.hu[i] + this.hu[i+1]) / 2;
        }

        //compute derivatives at midpoint
        for(let i = 0; i < n-1; i++) {
            // Compute dh/dt (mid)
            let dhudx_mid = (this.hu[i+1] - this.hu[i])/this.dx;
            dhdt_mid[i] = -dhudx_mid;

            // Compute dhu/dt (mid)
            let dhu2dx_mid = (Math.pow(this.hu[i+1],2) /this.h[i+1] - Math.pow(this.hu[i],2)/this.h[i])/this.dx;
            let dgh2dx_mid = (gravity * Math.pow(this.h[i+1],2) - Math.pow(this.h[i],2))/this.dx;

            dhudt_mid[i] = -(dhu2dx_mid + 0.5 * dgh2dx_mid);
        }

        //update midpoints for 1/2 a timestep based on midpoint derivations
        for(let i = 0; i < n; i++) {
            h_mid[i] += dhdt_mid[i]*dt/2;
            hu_mid[i] += dhudt_mid[i]*dt/2;
        }

        //compute height and momentum updates (non midpoints)
        for(let i = 1; i < n-1; i++) {
            // Compute dh/dt
            let dhudx = (hu_mid[i] - hu_mid[i-1])/this.dx;
            dhdt[i] = -dhudx;

            // Compute dhu/dt
            let dhu2dx = (  Math.pow(hu_mid[i],2)  / h_mid[i] - Math.pow(hu_mid[i-1],2) / h_mid[i-1])/this.dx;
            let dgh2dx = gravity * (Math.pow(hu_mid[i],2) -  Math.pow(hu_mid[i-1],2))/this.dx; 
            dhudt[i] = -(dhu2dx + 0.5*dgh2dx);
        }

        //Update values (non-midpoint) based on full timestep
        for(let i = 0; i < n; i++) {
            //console.log(damp*dhdt[i]*dt);
            this.h[i] += damp*dhdt[i]*dt;
            this.hu[i] += damp*dhudt[i]*dt;
        }

        //Reflecting boundary conditions
        this.h[0] = this.h[1];
        this.h[n-1] = this.h[n-2];
        this.hu[0] = -this.hu[1];
        this.hu[n-1] = -this.hu[n-2];
    }

    UpdateMesh() {
        for(let i = 0; i < this.numCells; i++) {
            this.cells[i].position.setY(this.h[i]);
        }
    }
}