const { Schema, model } = require('mongoose');

const redditPost = Schema({
    Title: String,
    Link: String,
    Time: Number,
}, { strict: false });

module.exports = model('redditPost', redditPost);