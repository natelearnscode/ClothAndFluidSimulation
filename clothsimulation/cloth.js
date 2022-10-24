import * as THREE from '../three.module.js';

export class Cloth {

    constructor(width, height, color, restlen, kConst, kvConst, m, debug, startX) {
        this.width = width;
        this.height = height;
        this.color = color;
        this.restlength = restlen;
        this.k = kConst; // hookes law spring constant
        this.kv = kvConst; // dampening constant
        this.mass = m; //mass of node used for calculations
        this.debugMode = debug; 

        this.nodesPos = [];
        this.nodesVel = [];
        this.nodesAcc = [];

        //initiate 2d array of nodes positions and velocities
        this.InitializeNodes(startX);

        //initialize array of vertex indices that make up triangles in the given 2d array of nodes
        this.vertices = [];
        for(let j=0; j < this.height-1; j++) {
            for(let i=0; i < this.width; i++) {
                //triangle to the right
                if(i < width-1 ) { //don't have a triangle to the right at end of row
                    this.vertices.push([i,j]);
                    this.vertices.push([i+1, j]);
                    this.vertices.push([i, j+1]);
                }

                //triangle to the left
                if(i>0) { //don't have a triangle to the right at end of row
                    this.vertices.push([i,j]);
                    this.vertices.push([i, j+1]);
                    this.vertices.push([i-1, j+1]);
                }
            }
        }

        //console.log(this.vertices);



        //initiate helper spheres to visualize nodes in cloth
        this.sphereHelpersGeomtery = new THREE.SphereGeometry(1);
        this.sphereHelperMaterial = new THREE.MeshLambertMaterial({color: color});
        this.sphereHelperMeshes = [];
        if(this.debugMode) {
            this.InitializeSphereHelpers();
        }

        // initialize cloth mesh
        this.geometry = new THREE.BufferGeometry();

        const MAX_POINTS = this.vertices.length * 3; //num of triangles times 3 for each point in triangle
        const positions = new Float32Array( MAX_POINTS * 3); // 3 values per point

        let index = 0;
        for(let i=0; i < this.vertices.length; i++) {
            let xPos = this.vertices[i][0];
            let yPos = this.vertices[i][1];
            let vertex = this.nodesPos[xPos][yPos];
            //console.log(vertex);
            positions[index++] = vertex.x;
            positions[index++] = vertex.y;
            positions[index++] = vertex.z;
        }

        this.geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );


        // draw range
        console.log(this.vertices.length);
        const drawCount = this.vertices.length; // draw the first 2 points, only
        this.geometry.setDrawRange( 0, drawCount );
        this.geometry.computeVertexNormals();

        // material
        this.material = new THREE.MeshToonMaterial( { color: 0xff0000, side: THREE.DoubleSide } );
        this.mesh = new THREE.Mesh( this.geometry, this.material );
        this.mesh.castShadow = true;
    }

    // initializes the 2d array of nodes that are used in the physics calculations for the cloth and the vertices of the mesh
    InitializeNodes(startX) {
        let halfheight = Math.floor(this.height/2);
        let halfwidth = Math.floor(this.width/2);

        for(let i = 0; i < this.width; i++) {
            this.nodesPos.push([]);
            this.nodesVel.push([]);
            this.nodesAcc.push([]);

            for(let j = 0; j < this.height-1; j++) {
                let position = new THREE.Vector3(startX + i, (j - halfheight) ,i+j);
                let velocity = new THREE.Vector3(0,0,0);
                let acceleration = new THREE.Vector3(0,0,0);

                this.nodesPos[i].push(position);  
                this.nodesVel[i].push(velocity);
                this.nodesAcc[i].push(acceleration);
            }
        }

        //initialize top row
        this.nodesPos.push([]);
        this.nodesVel.push([]);
        this.nodesAcc.push([]);
        for(let i=0; i< this.width; i++) {
            let position = new THREE.Vector3(startX + i, 10 + (this.height-1),0);
            let velocity = new THREE.Vector3(0,0,0);
            let acceleration = new THREE.Vector3(0,0,0);

            this.nodesPos[i].push(position);  
            this.nodesVel[i].push(velocity);
            this.nodesAcc[i].push(acceleration);
        }
    }

    // method that initializes spheres at each node position that act as visual helpers for debugging purposes
    InitializeSphereHelpers() {
        for(let i = 0; i < this.width; i++) {
            this.sphereHelperMeshes.push([]);
            for(let j = 0; j < this.height; j++) {
                let sphereMesh = new THREE.Mesh(this.sphereHelpersGeomtery, this.sphereHelperMaterial);
                sphereMesh.position.copy(this.nodesPos[i][j]);
                this.sphereHelperMeshes[i].push(sphereMesh);
            }
        }
    }

    // method that takes a grid of vertices and returns a list of triangles that make up the faces of cloth 
    VerticesToTriangles() {

    }

    Update(dt, person) {
        //console.log(dt);
        this.UpdatePhysics(dt, person);
        this.UpdateMesh();
        if(this.debugMode) {
            this.UpdateSphereHelper();
        }
    }

    // compute physics calculations for given timestep
    UpdatePhysics(dt, person) {
        //console.log(dt);
        // reset acceleration
        for(let i = 0; i < this.width; i++) {
            for(let j = 0; j < this.height; j++) {
                this.nodesAcc[i][j].x = 0;
                this.nodesAcc[i][j].y = -9.8 * this.mass; // start with force of gravity in y direction
                //this.nodesAcc[i][j].y = 0;
                this.nodesAcc[i][j].z = 0;
            }
        }

        // create velocity buffer for computation
        let velocityBuffer = [];
        for(let i = 0; i < this.width; i++) {
            velocityBuffer.push([]);
            for(let j = 0; j < this.height; j++) {
                let copyVel = new THREE.Vector3();
                copyVel.copy(this.nodesVel[i][j]);
                velocityBuffer.push(copyVel);
            }
        }

        //compute vertical forces
        for(let i = 0; i < this.width; i++) {
            for(let j = this.height-1; j > 0; j--) { 
                // compute vector from node below to the node
                let vecToAbove = new THREE.Vector3();
                vecToAbove.subVectors(this.nodesPos[i][j-1], this.nodesPos[i][j]);
                
                // get length of vector
                let length = vecToAbove.length();

                // normalize dir vector
                vecToAbove.normalize();

                // compute force using hookes law
                let springF = -this.k * (length - this.restlength);
                //console.log("springF: ", springF);

                // compute dampening force
                let projVBotVec = new THREE.Vector3();
                projVBotVec.copy(vecToAbove);
                let projVBot = projVBotVec.dot(this.nodesVel[i][j]);

                let projVTopVec = new THREE.Vector3();
                projVTopVec.copy(vecToAbove);
                let projVTop = projVTopVec.dot(this.nodesVel[i][j-1]);

                let dampF = -this.kv * (projVTop - projVBot);

                // compute spring force
                let springForce = new THREE.Vector3();
                springForce.copy(vecToAbove);
                springForce.multiplyScalar(springF + dampF);

                // add to combined forces to acceleration
                let oppositeForce = new THREE.Vector3();
                oppositeForce.copy(springForce);
                springForce.multiplyScalar(-1.0/this.mass);
                oppositeForce.multiplyScalar(1.0/this.mass);

                this.nodesAcc[i][j].add(springForce);
                this.nodesAcc[i][j-1].add(oppositeForce); // equal but opposite force
            }
        }

        // compute horizontal forces
        for(let i = 0; i < this.width - 1; i++) {
            for(let j = this.height-1; j >= 0; j--) {
                //console.log(i, " , ", j);
                // compute vector from node below to the node
                let vecToRight = new THREE.Vector3();
                vecToRight.subVectors(this.nodesPos[i+1][j], this.nodesPos[i][j]);
                
                // get length of vector
                let length = vecToRight.length();

                // normalize dir vector
                vecToRight.normalize();

                // compute force using hookes law
                let springF = -this.k * (length - this.restlength);
                //console.log("springF: ", springF);

                // compute dampening force
                let projVBotVec = new THREE.Vector3();
                projVBotVec.copy(vecToRight);
                let projVBot = projVBotVec.dot(this.nodesVel[i][j]);

                let projVTopVec = new THREE.Vector3();
                projVTopVec.copy(vecToRight);
                let projVTop = projVTopVec.dot(this.nodesVel[i+1][j]);

                let dampF = -this.kv * (projVTop - projVBot);

                // compute spring force
                let springForce = new THREE.Vector3();
                springForce.copy(vecToRight);
                springForce.multiplyScalar(springF + dampF);

                // add to combined forces to acceleration
                let oppositeForce = new THREE.Vector3();
                oppositeForce.copy(springForce);
                springForce.multiplyScalar(-1.0/this.mass);
                oppositeForce.multiplyScalar(1.0/this.mass);

                //console.log(springForce);
                this.nodesAcc[i][j].add(springForce);
                this.nodesAcc[i+1][j].add(oppositeForce); // equal but opposite force
            }
        }

        // Eulerian integration
        for(let i = 0; i < this.width; i++) {
            for(let j = 0; j < this.height-1; j++) {

                // compute and add to velocity (acc * dt)
                let velocityAdd = new THREE.Vector3();
                velocityAdd.copy(this.nodesAcc[i][j]);
                velocityAdd.multiplyScalar(dt);

                this.nodesVel[i][j].add(velocityAdd);

                // compute and add to position (velocity * dt)
                let positionAdd = new THREE.Vector3();
                positionAdd.copy(this.nodesVel[i][j]);
                positionAdd.multiplyScalar(dt);

                this.nodesPos[i][j].add(positionAdd);
            }
        }

        // collision detection
        for(let i = 0; i < this.width; i++) {
            for(let j = 0; j < this.height-1; j++) {
                const distance = person.pos.distanceTo(this.nodesPos[i][j]);
                if (distance < 1 + person.radius) {
                    // get normal dir
                    const dir = new THREE.Vector3();
                    dir.subVectors( this.nodesPos[i][j], person.pos);
                    dir.normalize();

                    //move node pos to right outside of radius
                    const movePos = new THREE.Vector3();
                    movePos.copy(dir);
                    movePos.multiplyScalar(distance + 0.001);
                    this.nodesPos[i][j].copy(person.pos);
                    this.nodesPos[i][j].add(movePos);


                    // compute new vel of node
                    const velDiff = new THREE.Vector3();
                    velDiff.subVectors(person.vel, this.nodesVel[i][j]);
                    const dot = dir.dot(velDiff);
                    dir.multiplyScalar(2 * dot);

                    this.nodesVel[i][j].add(dir);
                }

            }
        }

    }

    // update mesh vertex positions by the positions of nodes
    UpdateMesh() {
        this.geometry.attributes.position.needsUpdate = true; // required after the first render

        const positions = this.mesh.geometry.attributes.position.array;; // 3 vertices per point

        let index = 0;
        for(let i=0; i < this.vertices.length; i++) {
            let xPos = this.vertices[i][0];
            let yPos = this.vertices[i][1];
            let vertex = this.nodesPos[xPos][yPos];
            positions[index++] = vertex.x;
            positions[index++] = vertex.y;
            positions[index++] = vertex.z;
        }
    }

    UpdateSphereHelper() {
        // update helper positions
        for(let i = 0; i < this.width; i++) {
            for(let j = 0; j < this.height; j++) {
                this.sphereHelperMeshes[i][j].position.copy(this.nodesPos[i][j]);
            }
        }
    }
}