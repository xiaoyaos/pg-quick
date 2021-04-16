const Builder = require('./builder')
const pg = require('./pg');

class Pgq {
  constructor(config){
    pg.setConfig(config);
    return this.table.bind(this);
  }

  table(tableName) {
    return new Builder(tableName, pg.pool)
  }
};
module.exports = Pgq;