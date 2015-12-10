'use strict';

import 'array.from';

export const randomPos = arr => {
  return arr[Math.floor((Math.random() * arr.length) + 0)];
};

export const mapRangeSound = (value) => {
  let val = value * (5 / 2000);
  if(val >= 5){
    return 5;
  } else {
    return val;
  }
};

export const mapRangeGhost = (value2) => {
  let val2 = (value2 - 0) * (0 - 1) / (200 - 0) + 1;
  if(val2 <= 0){
    return 0;
  }else {
    return val2;
  }
};

export const dist = (x0, y0, z0, x1, y1, z1) => {
  let deltaX = x1 - x0;
  let deltaY = y1 - y0;
  let deltaZ = z1 - z0;

  let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

  return distance;
};

export const closest = (num, arr) => {
  let curr = arr[0];
  let diff = Math.abs(num - curr);

  for(let val=0; val<arr.length; val++){
    let newdiff = Math.abs(num - arr[val]);

    if(newdiff < diff){
      diff = newdiff;
      curr = arr[val];
    }
  }

  return curr;
};

export const html = (strings, ...values) => {

  let str = '';

  if(Array.isArray(strings)){
    for(let i = 0; i < strings.length; i++){
      if(strings[i]) str += strings[i];
      if(values[i]) str += values[i];
    }
  }else{
    str = strings;
  }

  let doc = new DOMParser().parseFromString(str.trim(), 'text/html');

  return doc.body.firstChild;

};

export const prepend = ($parent, $element) => {
  let $first = $parent.children[0];
  $parent.insertBefore($element, $first);
};

export const $ = selector => {

  let result;

  if(selector === 'body'){
    return document.body;
  }else if(selector === 'head'){
    return document.head;
  }else if(/^[\#.]?[\w-]+$/.test(selector)){

    if(selector[0] === '#'){
      return document.getElementById(selector.slice(1));
    }else if(selector[0] === '.'){
      result = document.getElementsByClassName(selector.slice(1));
    }else{
      result = document.getElementsByTagName(selector);
    }
  }else{
    result = document.querySelectorAll(selector);
  }


  let elements = [...result];
  if(elements.length === 1) return elements[0];
  return elements;

};
