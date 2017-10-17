const express = require('express');
const app = express();
const config = require('./config.js');
const Twit = require('twit')
const T = new Twit({
  consumer_key:         config.consumer_key,
  consumer_secret:      config.consumer_secret,
  access_token:         config.access_token,
  access_token_secret:  config.access_token_secret
});

app.set('view engine', 'pug');
