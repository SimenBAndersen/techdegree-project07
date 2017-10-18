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

app.use(bodyParser.urlencoded({ extended: false}));
app.use('/static', express.static('public'));
app.set('view engine', 'pug');

T.get('account/verify_credentials', { skip_status: true })
  .catch(function (err) {
    console.log('caught error', err.message);
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
    console.log('caught error', err.message);
  })
  .then(function (result) {
    let tweets = {};
    for(let i = 0; i < result.data.length; i++) {
      tweets.message = result.data[i].text;
      tweets.retweets = result.data[i].retweet_count;
      tweets.likes = result.data[i].favorite_count;
      tweets.date = result.data[i].created_at;

      if (typeof result.data[i].retweeted_status !== "undefined") {
        tweets.likes = result.data[i].retweeted_status.favorite_count;
      }

      twitter.tweets.push(tweets);
      console.log(tweets);
    }
});

app.get('/', (req, res, next) => {
  res.render('index');
});

app.listen(3000, () => {
	console.log('App is running on port 3000');
});
