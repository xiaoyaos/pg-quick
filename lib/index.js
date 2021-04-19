const Builder = require('./builder')
const pg = require('./pg');

class Pgq {
  constructor(config) {
    pg.setConfig(config);
    this.init_pro()
    return this.table;
  }

  init_pro(){
    //实例一个事务对象，实际就是一个client，因为事务必须保持在一个client上
    this.table.transaction = async function(){
      let trx = await pg.pool.connect();
      // 提交事务
      trx.commit = async()=>{
        await trx.query('COMMIT');
        trx.release();
      }

      // 回滚事务
      trx.rollback = async ()=>{
        await trx.query('ROLLBACK');
        trx.release();
      }
      return trx;
    }
  }

  table(tableName) {
    return new Builder(tableName, pg.pool)
  }

};
module.exports = Pgq;

