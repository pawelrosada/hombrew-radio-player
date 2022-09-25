const request = require('request'),
  lame = require('lame'),
  Speaker = require('speaker');

function sleep(time, callback) {
  var stop = new Date().getTime();
  while (new Date().getTime() < stop + time) {
    ;
  }
  callback();
}
class Player {

  constructor(log, reconnectAfter) {
    this.log = log;
    this.minReconnectAfter = Math.max(0, reconnectAfter - 300000);
    this.maxReconnectAfter = Math.max(600000, reconnectAfter + 300000);
    this.isPlaying = false;
    this.track_id = 0;
    this.state = 0;
    this.done = 0;
  }

  sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
  }

  startPlay() {
    this.log.info('Connecting to ' + 'http://localhost:3689/api/player/play');
    request.put({
      headers: { 'content-type': 'application/json' }
      , url: 'http://192.168.1.35:3689/api/outputs/97664490104995', body: '{"selected": true}'
    }
      , function (error, response, bodu) { });
    request.put({
      headers: { 'content-type': 'application/json' }
      , url: 'http://localhost:3689/api/player/play', body: ''
    }
      , function (error, response, body) { });
  }

  play(streamURL) {
    if (!this.isPlaying) {
      this.isPlaying = true;
      function getRandomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      const startStream = function () {
        this.log.info('Connecting to ' + streamURL);
        request.post({
          headers: { 'content-type': 'application/json' }
          , url: streamURL, body: ''
        }
          , function (error, response, body) { });
        setTimeout(() => {
          if (this.isPlaying) {
            this.stream.abort();
            startStream();
          }
        }, getRandomInteger(this.minReconnectAfter, this.maxReconnectAfter));
      }.bind(this)
      startStream();
    } else {
      stop();
      play(streamURL);
      startPlay();
    }
  }

  stop() {
    if (this.isPlaying) {
      const stopStream = function () {
        this.log.info('Connecting to ' + 'http://localhost:3689/api/player/stop');
        request.put({
          headers: { 'content-type': 'application/json' }
          , url: 'http://localhost:3689/api/player/stop', body: ''
        }
          , function (error, response, body) { });
        this.isPlaying = false;
      }.bind(this)
      stopStream();
    }
  }

  status(streamUrl) {
    try {
      request.get({ url: 'http://192.168.1.35:3689/api/queue' }, function (error, response, body) {
        this.log.info('StatusRequest: Length' + JSON.parse(body).items.length);

        if (JSON.parse(body).items.length == 0) {
          this.log.info('StatusRequest: empty response from http://192.168.1.35:3689/api/queue');
          request.post({
            headers: { 'content-type': 'application/json' }
            , url: 'http://192.168.1.35:3689/api/queue/items/add?uris=library:playlist:22', body: ''
          }
            , function (error, response, body) { });
        } else {
          this.log.info('StatusRequest: ' + JSON.parse(body).items[0].track_id);
          this.track_id = JSON.parse(body).items[0].track_id;
          this.done++;
        }
      }.bind(this));

      request.get({ url: 'http://localhost:3689/api/player' }, function (error, response, body) {
        this.log.info('StatusRequest: ' + JSON.parse(body).state);
        this.state = JSON.parse(body).state;
        this.done++;
      }.bind(this));

      while (this.done < 2) {
        sleep(1000, function () {
        });
        this.log.info('StatusRequest: still wating ' + this.done);
        this.done++;
      }
      this.log.info('Status: track: ' + streamUrl.split('track:')[1].split('&')[0] + 'track_id: ' + this.track_id + ' state: ' + this.state);
      this.log.info('Status bool = ' + Number(this.track_id) == Number(streamUrl.split('track:')[1].split('&')[0]) + 'Status value bool 2 = ' + this.state == 'play');
      this.log.info('Status this.track_id = ' + Number(this.track_id) + 'streamUrl = ' + Number(streamUrl.split('track:')[1].split('&')[0]) + 'this.state = ' + this.state);
      if (Number(this.track_id) == Number(streamUrl.split('track:')[1].split('&')[0]) && this.state == 'play') {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      this.log.info(error);
    } finally {
      return false;
    }
  }
}

module.exports = Player;
