const { Schema, model } = require('mongoose');

const Time = Schema({
    milliseconds: Number,
}, { strict: false });

module.exports = model('Time', Time);