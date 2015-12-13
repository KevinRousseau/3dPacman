'use strict';

module.exports = [

  {
    method: 'GET',
    path: '/game',
    handler: (request, reply) => {
      return reply.view('game');
    }
  },

  {
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
      return reply.redirect('/game');
    }
  }

];
