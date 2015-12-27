/**
* Exercise.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  identity: 'Exercise',

  attributes: {
    name: {
      type: 'string',
      required: true
    },
    machine_number: {
      type: 'string',
      required: true,
      defaultsTo: ''
    },
    location: {
      model: 'Location'
    }
  }
};