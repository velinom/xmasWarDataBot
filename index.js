var fs = require('fs');
var path = require('path');
const express = require('express');
var Twit = require('twit');
var config = require(path.join(__dirname, 'config.js'));

// Set up port using express for Heroku app
const PORT = process.env.PORT || 5000;
express().use(express.static(path.join(__dirname, 'public'))).set('views', path.join(__dirname, 'views'))
         .set('view engine', 'ejs').get('/', (req, res) => res.render('pages/index'))
         .listen(PORT, () => console.log(`Listening on ${ PORT }`));

// Initialize a stream and handle each tweet
var Twit = new Twit(config);
var stream = Twit.stream('statuses/filter', { track: ['christmas', 'holidays'] });
stream.on('tweet', function(tweet) { handleTweet(tweet) });

// Initialize global counters and set to tweet every 12 hrs
var NUMBER_XMAS_TWEETS = 0;
var NUMBER_HOLIDAY_TWEETS = 0;
setInterval(function() {
  sendTweet();
  NUMBER_XMAS_TWEETS = 0;
  NUMBER_HOLIDAY_TWEETS = 0;
}, 43200000);

function handleTweet(tweet) {
  if (tweet.retweeted_status) return;

  const xmas = tweet.text.match(new RegExp('(merry|happy) christmas', 'i'));
  const holidays = tweet.text.match(new RegExp('(merry|happy) holidays', 'i'));

  if (!(xmas || holidays)) return;
  if (xmas && holidays === null) NUMBER_XMAS_TWEETS++;
  if (holidays && xmas === null) NUMBER_HOLIDAY_TWEETS++;
}

function sendTweet(tweet) {
  Twit.post('statuses/update', { status: generateTweet() }, function(err, data, response) { console.log(data) });
}

function generateTweet() {
  const total = NUMBER_HOLIDAY_TWEETS + NUMBER_XMAS_TWEETS;
  return 'In the last 12 hours, there were:\n' +
         NUMBER_HOLIDAY_TWEETS + ' Holiday Tweets (' + (100 * NUMBER_HOLIDAY_TWEETS / total).toFixed(1) + '%)\n' +
         NUMBER_XMAS_TWEETS + ' Christmas Tweets (' + (100 * NUMBER_XMAS_TWEETS / total).toFixed(1) + '%)';
}