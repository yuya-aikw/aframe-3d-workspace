"use strict";

// A-Frame component: vehicle-controller (rig-following)
// - Attach to the rig (camera root). Receives forces and moves the vehicle entity,
//   while the rig smoothly follows the vehicle so camera appears to "ride" it.
// - Accepts keyboard WSAD input (continuous force while held) and DOM 'apply-force' events.

(function () {
  if (typeof window === "undefined" || !window.AFRAME) return;
  const AFRAME = window.AFRAME;
  const THREE = AFRAME.THREE;

  AFRAME.registerComponent('vehicle-controller', {
    schema: {
      vehicleSelector: { type: 'selector', default: '#yamaha_ae88' },
      rigSelector: { type: 'selector', default: '#rig' },
      mass: { type: 'number', default: 1000 },
      damping: { type: 'number', default: 0.92 },
      maxSpeed: { type: 'number', default: 5 },
      steeringRate: { type: 'number', default: 1.8 },
      smoothing: { type: 'number', default: 0.12 },
      lateralTilt: { type: 'number', default: 5 } // degrees of roll on lateral movement
    },

    init: function () {
      this.velocity = new THREE.Vector3(0, 0, 0); // local-frame velocity: x lateral, z forward
      this.force = new THREE.Vector3(0, 0, 0); // accumulated force impulses
      this.lastTime = null;
      this.prevRigPos = null;

      // keyboard state for WSAD -> forward/back/left/right
      this.keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };
      this.keyForce = 1600; // force applied per second when key held (tune as needed)
      this._onKeyDown = (e) => this._handleKeyDown(e);
      this._onKeyUp = (e) => this._handleKeyUp(e);
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);

      // Bind so external code can call
      this.applyForce = this.applyForce.bind(this);

      // Listen for DOM event: el.dispatchEvent(new CustomEvent('apply-force',{detail:{x:..,z:..}}))
      this.el.addEventListener('apply-force', (evt) => {
        const d = evt.detail || {};
        this.applyForce(d);
      });
    },

    /**
     * Public method to apply an impulse force in local vehicle frame
     * detail: { x: lateral, y: vertical (unused), z: forward }
     */
    applyForce: function (detail) {
      const x = detail.x || 0;
      const y = detail.y || 0;
      const z = detail.z || 0;
      this.force.x += x;
      this.force.y += y;
      this.force.z += z;
    },

    _handleKeyDown: function (evt) {
      if (evt.repeat) return;
      const code = evt.code;
      if (code in this.keys) {
        this.keys[code] = true;
        evt.preventDefault();
      }
    },

    _handleKeyUp: function (evt) {
      const code = evt.code;
      if (code in this.keys) {
        this.keys[code] = false;
        evt.preventDefault();
      }
    },

    tick: function (time, delta) {
      const dt = (delta || 0) / 1000; // seconds
      if (dt <= 0) return;
      const data = this.data;

      // Resolve selectors each tick in case scene wasn't ready on init
      const vehicleEl = data.vehicleSelector || document.querySelector('#yamaha_ae88');
      const rigEl = data.rigSelector || document.querySelector('#rig');
      if (!vehicleEl || !rigEl) return;

      const vehicleObj = vehicleEl.object3D;
      const rigObj = rigEl.object3D;

      // detect rig movement from external controls (e.g., user moved the camera/rig)
      // and apply the same delta to the vehicle so they stay together.
      const currentRigPos = rigObj.position.clone();
      let rigDelta = new THREE.Vector3(0, 0, 0);
      if (this.prevRigPos) {
        rigDelta.copy(currentRigPos).sub(this.prevRigPos);
      }

      // Keyboard input mapping: WS -> forward/back (force), AD -> steering (yaw)
      // Apply forward/back force proportional to keyForce and dt (continuous while held)
      if (this.keys['KeyW']) this.force.z += this.keyForce * dt;
      if (this.keys['KeyS']) this.force.z -= this.keyForce * dt;

      // Compute steering input from keys (D -> +1, A -> -1)
      const steerInput = (this.keys['KeyA'] ? 1 : 0) - (this.keys['KeyD'] ? 1 : 0);
      // Apply steering by rotating the vehicle yaw (adjust sign if direction is reversed)
      if (steerInput !== 0) {
        vehicleObj.rotation.y += steerInput * (data.steeringRate || 1.0) * dt;
      }

      // Simple physics integration (local-frame)
      // acceleration = force / mass
      const accX = this.force.x / data.mass;
      const accZ = this.force.z / data.mass;

  // Only forward/back velocity is used for driving; clear lateral velocity to avoid strafing
  this.velocity.x = 0;
  this.velocity.z += accZ * dt;

      // limit speed
      const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
      if (speed > data.maxSpeed && speed > 0) {
        const s = data.maxSpeed / speed;
        this.velocity.x *= s;
        this.velocity.z *= s;
      }

      // damping (friction)
      const dampingFactor = Math.pow(data.damping, dt * 60);
      this.velocity.multiplyScalar(dampingFactor);

  // Convert local velocity to world using vehicle yaw (move relative to vehicle facing)
  const yaw = vehicleObj.rotation.y; // yaw in radians
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      const worldVelX = this.velocity.x * cos - this.velocity.z * sin;
      const worldVelZ = this.velocity.x * sin + this.velocity.z * cos;

      // update vehicle position directly from physics
      vehicleObj.position.x += worldVelX * dt;
      vehicleObj.position.z += worldVelZ * dt;

      // If the rig has been moved externally (e.g. user input), apply that delta to vehicle
      if (rigDelta.lengthSq() > 1e-8) {
        vehicleObj.position.add(rigDelta);
        // Optionally damp velocity when user drags the rig to avoid runaway
        this.velocity.multiplyScalar(0.9);
      }

      // Smoothly move rig (camera) to follow vehicle (keeping camera height)
      const cameraHeight = 1.6; // keep camera roughly at this height
      const rigTarget = new THREE.Vector3(vehicleObj.position.x, cameraHeight, vehicleObj.position.z);
      rigObj.position.lerp(rigTarget, data.smoothing);

  // Sync rig rotation (yaw) to vehicle so viewpoint faces same direction as car.
  // Use smoothing to avoid sudden jumps.
  rigObj.rotation.y = THREE.MathUtils.lerp(rigObj.rotation.y, vehicleObj.rotation.y, data.smoothing);

      // store rig position for next tick (use post-update position so deltas reflect external changes)
      this.prevRigPos = rigObj.position.clone();

      // Do NOT auto-orient the vehicle to movement direction.
      // Vehicle facing remains controlled separately (e.g., steering/animation).

  // Add small roll (banking) based on steering and forward speed to simulate leaning in turns
  const speedForBank = Math.abs(this.velocity.z);
  const steerForBank = steerInput; // -1..1
  const lateralDeg = THREE.MathUtils.clamp(-steerForBank * (speedForBank / Math.max(0.01, data.maxSpeed)) * data.lateralTilt, -12, 12);
      const lateralRad = THREE.MathUtils.degToRad(lateralDeg);
      vehicleObj.rotation.z = THREE.MathUtils.lerp(vehicleObj.rotation.z || 0, lateralRad, data.smoothing);

      // Reset accumulated impulses each tick (server sends impulses per update)
      this.force.set(0, 0, 0);
    },

    remove: function () {
      if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
      if (this._onKeyUp) window.removeEventListener('keyup', this._onKeyUp);
    }
  });
})();
