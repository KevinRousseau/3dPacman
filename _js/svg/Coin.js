'use strict';

export default class Coin {

  constructor(xPos, zPos){
    this.position = {
      x: xPos,
      y: 1.5,
      z: zPos
    };
  }

  render(){
    let {x, y, z} = this.position;

    let geometry = new THREE.SphereGeometry(4, 10, 10, 0);
    let material = new THREE.MeshLambertMaterial({color: 0xffffff, side: THREE.FrontSide});

    let coin = new THREE.Mesh(geometry, material);

    coin.castShadow = true;
    coin.receiveShadow = true;

    coin.position.x = x;
    coin.position.y = y;
    coin.position.z = z;

    this.coin = coin;

    return coin;
  }

}
