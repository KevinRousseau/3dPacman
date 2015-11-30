'use strict';

export default class Floor {

  constructor(windowSize){
    this.windowSize = windowSize;
    this.position = {};
  }

  changepos(){
    if(this.position.y > -5){
      this.position.y--;
    }
    requestAnimationFrame(() => this.changepos());
  }

  render(){
    let floorMaterial = new THREE.MeshLambertMaterial( {color: 0x444444, side: THREE.DoubleSide} );
    let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 10, 10);
    let floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.1;
    floor.rotation.x = Math.PI / 2;
    floor.receiveShadow = true;

    this.position = floor.position;

    return floor;
  }

}
