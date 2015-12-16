'use strict';

import {closest} from '../helpers/util';

export default class Cube {

  constructor(cubeSize){
    this.cubeSize = cubeSize;

    this.windowSize = { //1140 x 750
      'width': window.innerWidth,
      'height': window.innerHeight
    };

    this.position = {};
  }

  _walls(i, j){
    this.position.x = j;
    this.position.y = 0;
    this.position.z = i;
  }

  _singleBlock(pos, xPosGrid, zPosGrid){
    this.position.x = closest(pos.x, xPosGrid);
    this.position.y = 0;
    this.position.z = Math.ceil(closest(pos.z, zPosGrid)-(this.windowSize.height/1000));
  }

  _scaleUp(){
    if(this.scale.y < 20){
      this.scale.y++;
    }
    requestAnimationFrame(() => this._scaleUp());
  }

  render(){
    let {x, y, z} = this.position;
    let geometry = new THREE.BoxGeometry(this.cubeSize.width, this.cubeSize.height, this.cubeSize.depth, 5, 5, 5); //laatste 3 parameterz zijn segmenten voor width, height, depth
    let material = new THREE.MeshPhongMaterial( { map: THREE.ImageUtils.loadTexture('/assets/cube-pattern.jpg') } );
    //let material = new THREE.MeshLambertMaterial({color: 0x0000ff, side: THREE.FrontSide});


    let cube = new THREE.Mesh(geometry, material);
    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;

    cube.castShadow = true;
    cube.receiveShadow = true;

    this.scale = cube.scale;

    return cube;

  }

}
