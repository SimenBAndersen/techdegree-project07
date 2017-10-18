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

app.use(bodyParser.urlencoded({ extended: false}));
app.use('/static', express.static('public'));
app.set('view engine', 'pug');

app.get('/', (req, res, next) => {
  res.render('index');
});

app.listen(3000, () => {
	console.log('App is running on port 3000');
});
