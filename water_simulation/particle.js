export class Particle {
    constructor(pos, oldpos, vel, press, dens) {
        this.pos = pos;
        this.oldPos = oldpos;
        this.vel = vel;
        this.pressure = press;
        this.pressureN = press;
        this.density  = dens;
        this.densityN = dens;
    }

}