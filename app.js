// Requires
const express = require('express');
const app = express();
const config = require('./config.js');
const bodyParser = require('body-parser');
const Twit = require('twit');
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const T = new Twit({
  consumer_key:         config.consumer_key,
  consumer_secret:      config.consumer_secret,
  access_token:         config.access_token,
  access_token_secret:  config.access_token_secret
});

// Object to store twitter information in
const twitter = {
  tweets: [],
  follows: [],
  dms: []
};

//
app.use(bodyParser.urlencoded({ extended: false}));
app.use('/static', express.static('public'));
app.set('view engine', 'pug');

// Collect information about the Twitter user, using the Twit module.
// Information includes:
// - ID, name, username, friends/follows, profile image, background image
T.get('account/verify_credentials', { skip_status: true })
  .catch(function (err) {
    next(err);
  })
  .then(function (result) {

    // Adds the information to the Twitter object for later use
    twitter.id = result.data.id;
    twitter.name = result.data.name;
    twitter.username = result.data.screen_name;
    twitter.following = result.data.friends_count;
    twitter.image = result.data.profile_image_url;
    twitter.banner = result.data.profile_banner_url;
});

// Collect information about the last 5 tweets/retweets using Twit
T.get('statuses/user_timeline', {user_id: twitter.id, count: 5})
  .catch(function (err) {
    next(err);
  })
  .then(function (result) {

    for(let i = 0; i < result.data.length; i++) {
      let tweets = {};
      tweets.message = result.data[i].text;
      tweets.retweets = result.data[i].retweet_count;
      tweets.likes = result.data[i].favorite_count;
      tweets.date = result.data[i].created_at;
      tweets.id = result.data[i].id;

      if (typeof result.data[i].retweeted_status !== "undefined") {
        tweets.likes = result.data[i].retweeted_status.favorite_count;
      }

      // Adds the collected info to the twitter object for later use
      twitter.tweets.push(tweets);
    }

});

// Collect information about the last 5 friends/follows using Twit
T.get('friends/list', {user_id: twitter.id, count: 5})
  .catch(function (err) {
    next(err);
  })
  .then(function (result) {

    for(let i = 0; i < result.data.users.length; i++) {
      let friends = {};
      friends.name = result.data.users[i].name;
      friends.username = result.data.users[i].screen_name;
      friends.image = result.data.users[i].profile_image_url;

      // Adds the information to the Twitter object for later use
      twitter.follows.push(friends);
    }

});

// Collect information about the last 5 received messages using Twit
T.get('direct_messages', {count: 5})
  .catch(function (err) {
    next(err);
  })
  .then(function (result) {

    for(let i = 0; i < result.data.length; i++) {
      let message = {};
      message.name = result.data[i].sender.name;
      message.username = result.data[i].sender.screen_name;
      message.image = result.data[i].sender.profile_image_url;
      message.message = result.data[i].text;
      message.time = result.data[i].created_at;

      // Adds the information to the Twitter object for later use
      twitter.dms.push(message);
    }

});

// "/"-route
app.get('/', (req, res, next) => {
  res.render('index', {twitter});
  io.on("connection", function(socket) {
    socket.emit("user", twitter.username);
    socket.emit("name", twitter.name);
    socket.emit("image", twitter.image);
  });
});

// Post a new Tweet using sockets.io
io.sockets.on("connection", function(socket) {

  // New tweet
  socket.on('newTweet', function (tweetContent) {

    // POST
    T.post('statuses/update', {status: tweetContent}, function (err, data, response) {
      if (err) {
        next(err);
      }
    });
  });
});

// Error-handling for when a user visits a "dead" route
app.use((req, res, next) => {
  let err = new Error("Page not found");
  err.status = 404;
  next(err);
});

// Render the error
app.use((err, req, res, next) => {
  res.locals.error = err;
  res.render("error", err);
});

server.listen(3000, () => {
	console.log('App is running on port 3000');
});
