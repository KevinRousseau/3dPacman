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
    let texture = THREE.ImageUtils.loadTexture('/assets/brick-pattern.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(9.5, 4.5);


    //let floorMaterial = new THREE.MeshLambertMaterial( {color: 0x000000, side: THREE.DoubleSide} );
    let floorMaterial = new THREE.MeshBasicMaterial( { map: texture, side: THREE.DoubleSide });
    let floorGeometry = new THREE.PlaneGeometry(760, 360, 10, 10);
    let floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.1;
    floor.rotation.x = Math.PI / 2;
    floor.receiveShadow = true;

    this.position = floor.position;

    return floor;
  }

}
