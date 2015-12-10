'use strict';

export default class Ghost {

  constructor(){
    this.position = {};
    this.rotation = {};
  }

  render(color, pos){
    let sphereGeometry = new THREE.SphereGeometry(8, 50, 50, 0);
    let sphereMaterial = new THREE.MeshLambertMaterial( {color, side: THREE.FrontSide} );

    let ghost = new THREE.Mesh(sphereGeometry, sphereMaterial);

    ghost.castShadow = true;
    ghost.receiveShadow = true;

    ghost.position.y = 400;
    ghost.position.x = pos.x;
    ghost.position.z = pos.z;

    this.position = ghost.position;
    this.rotation = ghost.rotation;

    return ghost;

  }

}
