const Pool = require('pg').Pool;
class Pg{
  setConfig(config){
    this.config = config;
    this.pool = new Pool(this.config);
  }
}

module.exports = new Pg();