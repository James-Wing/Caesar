'use strict';
const Discord = require('discord.js');
const config = require('./config.json');

const { Intents } = require('discord.js');

const client = new Discord.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_INVITES, Intents.FLAGS.DIRECT_MESSAGES],
});

//Connect to Reddit
const snoowrap = require('snoowrap');
const Reddit = new snoowrap({
    userAgent: 'Caesar',
    clientId: config.clientID,
    clientSecret: config.clientSecret,
    refreshToken: config.refreshToken
});

//Connect to MongoDB
const mongoose = require('mongoose');
mongoose.connect(config.mongo, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
}).catch(err => {
    console.error(err);
    return;
});

const redditPost = require('./redditPost');

client.once('ready', async () => {
    console.log(`Ready, logged in as ${client.user.tag}!`)
    let i = 1;
    async function Test() {
        await console.log('Posting loop: ' + i);
        i++;

        /*
        *Find all posts from the redditPosts collection (mongodb)
        *If no posts, wait ten seconds and then check again
        *If posts, find the first element of an array of all posts
        *With time property, constantly update that time.
        *Once time reaches 0, post to Reddit then delete and restart for new posts.
        */

        await redditPost.find({}).then(async (posts) => {
            if (posts[0] === undefined) {
                await setTimeout(Test, 10000);
                return;
            }
            console.log(posts[0]);
            if (!posts) return;
            let myTimer = setTimeout(function a() { console.log('Timer executed') }, posts[0].Time);

            async function getTimeLeft(timeout) {
                let difference = Math.ceil((timeout._idleStart + timeout._idleTimeout) / 1000 - process.uptime());
                await redditPost.updateOne({ "_id": posts[0]._id }, { $set: { "Time": difference * 1000 } }).catch(err => {
                    console.error(err);
                    return;
                });
                if (difference <= 0) {
                    await console.log(false);
                    await clearInterval(interval);
                    await setTimeout(Test, 10000);
                    await Reddit.getSubreddit('romeposting').submitLink({
                        title: posts[0].Title,
                        url: posts[0].Link,
                    }).catch(err => {
                        console.error(err);
                        client.channels.cache.get('866065878738796554').send(`There was an error uploading the image with the URL \`${posts[0].Link}\` \n\n<@449332956474114048> FIX THIS`);
                    });
                    await redditPost.deleteOne({ "_id": posts[0]._id }).catch(err => {
                        console.error(err);
                        return;
                    });
                };
            }

            let interval = setInterval(getTimeLeft, 1000, myTimer);
        });
    }

    Test(); //Call the function to begin everything
});
client.on('messageCreate', async (message) => {
    if (message.channel.id === '866065878738796554') {
        if(!message.attachments.first()) return;
        if (message.attachments.first().url) {
            let msg = await message.content;

            if (message.content.length > 300) {
                msg = await message.content.slice(0, 300);
            }
            console.log(message.attachments.first().url);
            let newData = await new redditPost({
                Title: msg, //<= The title of the redditpost, all content in the message
                Link: message.attachments.first().url, //<= The first image provided by a message
                Time: 86400000, //<= 24 hours in Milliseconds
            });
            await newData.save();
        } else { return; };
    } else { return; };
});

client.login(config.token);
