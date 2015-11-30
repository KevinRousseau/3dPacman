'use strict';

export default class Grid {

  constructor(windowSize){
    this.windowSize = windowSize;
    this.position = {};
  }

  changepos(){
    if(this.position.y > -10){
      this.position.y--;
    }
    requestAnimationFrame(() => this.changepos());
  }

  render(){
    let grid = new THREE.GridHelper(this.windowSize.width, 20);

    grid.setColors( 0xE30E5C, 0xffffff );

    grid.position.x = 0;
    grid.position.y = 0;
    grid.position.z = 0;

    this.position = grid.position;

    this.grid = grid;

    return grid;
  }

}
