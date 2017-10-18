const express = require('express');
const app = express();
const config = require('./config.js');
const bodyParser = require('body-parser');
const Twit = require('twit')
const T = new Twit({
  consumer_key:         config.consumer_key,
  consumer_secret:      config.consumer_secret,
  access_token:         config.access_token,
  access_token_secret:  config.access_token_secret
});
const twitter = {
  tweets: [],
  follows: [],
  dms: []
};
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(bodyParser.urlencoded({ extended: false}));
app.use('/static', express.static('public'));
app.set('view engine', 'pug');

T.get('account/verify_credentials', { skip_status: true })
  .catch(function (err) {
    next(err);
  })
  .then(function (result) {
    twitter.id = result.data.id;
    twitter.name = result.data.name;
    twitter.username = result.data.screen_name;
    twitter.following = result.data.friends_count;
    twitter.image = result.data.profile_image_url;
    twitter.banner = result.data.profile_background_image_url;
});

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

      twitter.tweets.push(tweets);
    }

});

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

      twitter.follows.push(friends);
    }

});

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

      twitter.dms.push(message);
    }

});

app.get('/', (req, res, next) => {
  res.render('index', {twitter});
});


app.listen(3000, () => {
	console.log('App is running on port 3000');
});
