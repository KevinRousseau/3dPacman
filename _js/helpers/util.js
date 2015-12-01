'use strict';

import 'array.from';

export const randomPos = arr => {
  return arr[Math.floor((Math.random() * arr.length) + 0)];
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
