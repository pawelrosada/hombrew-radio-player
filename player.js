const request = require('request'),
  lame = require('lame'),
  Speaker = require('speaker');

class Player {

  constructor(log, reconnectAfter) {
    this.log = log;
    this.minReconnectAfter = Math.max(0, reconnectAfter - 300000);
    this.maxReconnectAfter = Math.max(600000, reconnectAfter + 300000);
    this.isPlaying = false;
  }

  play(streamURL) {
    if (!this.isPlaying) {
      this.isPlaying = true;
      function getRandomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      const startStream = function() {
        this.log.info('Connecting to ' + streamURL);
        this.stream = request(streamURL);
        this.stream
          .pipe(new lame.Decoder())
          .pipe(new Speaker());
        setTimeout(() => { 
          if (this.isPlaying) {
            this.stream.abort();
            startStream();
          }
        }, getRandomInteger(this.minReconnectAfter, this.maxReconnectAfter));
      }.bind(this)
      startStream();
    }
  }

  stop() {
    if (this.isPlaying) {
      this.stream.abort();
      this.isPlaying = false;
    }
  }

}

module.exports = Player;
