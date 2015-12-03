'use strict';

let ThreeBSP = require('three-csg');
require('csg');

export default class Pacman {

  constructor(){
    this.position = {};
    this.rotation = {};
  }

  render(){
    let sphereGeometry = new THREE.SphereGeometry(8, 50, 50, 0);
    let sphereMaterial = new THREE.MeshLambertMaterial( {color: 0xffee00, side: THREE.FrontSide} );
    let sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    sphere.geometry.computeVertexNormals();

    sphere.position.y = 0;
    sphere.position.x = -10;
    sphere.position.z = -10;

    sphere.castShadow = true;
    sphere.receiveShadow = true;

    let triangleMaterial = new THREE.MeshLambertMaterial({color: 0x000000});

    let shape = new THREE.Shape([
      new THREE.Vector2(0, 1),
      new THREE.Vector2(-5, 1),
      new THREE.Vector2(-2.5, 6)
    ]);

    let v1 = new THREE.Vector3(0, 0, 0);
    let v2 = new THREE.Vector3(0, 0, 20);
    let path = new THREE.LineCurve3(v1, v2);
    let extrudeSettings2 = {
      bevelEnabled: false,
      steps: 1,
      extrudePath: path
    };

    let geometry2 = new THREE.ExtrudeGeometry(shape, extrudeSettings2);
    let mesh2 = new THREE.Mesh(geometry2, triangleMaterial);
    mesh2.position.set(-19, -2, -20);

    mesh2.castShadow = true;
    mesh2.receiveShadow = true;

    let sphereBSP = new ThreeBSP(sphere);
    let mesh2BSP = new ThreeBSP(mesh2);
    let subtractBSP = sphereBSP.subtract(mesh2BSP);
    let pacman = subtractBSP.toMesh(new THREE.MeshLambertMaterial({ color: 0xffee00}));

    pacman.castShadow = true;
    pacman.receiveShadow = true;

    this.position = pacman.position;
    this.rotation = pacman.rotation;

    return pacman;

  }

}
