'use strict';

export default class Grid {

  constructor(windowSize){
    this.windowSize = windowSize;
    this.position = {};
  }

  changepos(){
    /*if(this.position.y > -5){
      this.position.y--;
    }
    requestAnimationFrame(() => this.changepos());*/
    this.position.y = 200;
  }

  render(){
    let grid = new THREE.GridHelper(this.windowSize.width, 20);

    grid.setColors(0xA3A3A3, 0xA3A3A3);

    grid.position.x = 0;
    grid.position.y = 0;
    grid.position.z = 0;

    this.position = grid.position;

    this.grid = grid;

    return grid;
  }

}
