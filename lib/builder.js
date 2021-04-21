const _ = require('lodash');
const JoinClause = require('./joinClause');

const SQLTYPE = {
  '-1': "SELECT",
  '0': "SELECT",
  '1': "INSERT",
  '2': "UPDATE",
  '3': "DELETE"
}


// TODO: join
class PgBase extends JoinClause {
  /**
   * @param {*} tableName 
   */
  constructor(tableName, pg) {
    super();
    this.pg = pg;
    this.tableName = tableName;
    this.init();
    this.wrapOther();
  }

  init() {
    this.trx = false; // 默认不开启事务
    this.begin = false; // 是否已经执行BEGIN,暂未使用此参数，同一事务目前测试多次begin有效
    this.type = -1; // 0 select 1 add 2 update 3 delete
    this.sql = '';
    this.field = '';
    this.valueStr = '';
    this.whereStr = '';
    this.whereSet = []; // 记录where，用于检测是否重复
    this.returningStr = '';
    this.setStr = '';
    this.setSet = []; // 记录set字段，用于检测是否重复
    this.index = 1;
    this.values = [];
    this.limitStr = '';
    this.selectStr = '*';
    this.orderByStr = '';

    
    
  }

  wrapOther(){
    
  }


  // 注册事务客户端，如果是普通sql查询则使用pool中自动选取的连接，如果开启事务则使用统一的client来查询
  transacting(trx){
    this.trx = true;
    this.pg = trx;
    return this;
  }

  /**
   * insert
   * @param {*} data 
   * @returns 
   */
  insert(data) {
    this.transform(1);
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        this.field += `"${key}",`;
        if(!isNaN(Number(data[key]))){
          this.valueStr += `$${this.index++},`;
        }else if(isNaN(Number(data[key]))){
          this.valueStr += `'$${this.index++}',`;
        }
        
        this.values.push(data[key]);
      }
    }
    this.field = this.field.slice(0, this.field.length - 1);
    this.valueStr = this.valueStr.slice(0, this.valueStr.length - 1);
    this.sql = `INSERT INTO "${this.tableName}" (${this.field}) VALUES(${this.valueStr}) `;
    return this;
  }

  /**
   * update
   * @param {*} data 
   * @param {*} condition 
   * @param {*} returning 
   */
  update(data = false) {
    if(!data && !isJSON(data) && !Array.from(data).length){
      throw new Error('UPDATE data is require contains data a JSON')
    }
    this.transform(2);
    for (let key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        this.setStr += `"${key}" = $${this.index++},`;
        this.values.push(data[key]);
      }
    }
    this.setStr = this.setStr.slice(0, this.setStr.length - 1);
    this.sql = `UPDATE "${this.tableName}" SET ${this.setStr}`;
    return this;
  }

  /**
   * 删除指定条件列
   * @param {*} condition 
   */
  remove(condition = false) {
    this.transform(3);
    if (!condition) {
      throw new Error('not allow null condition');
    }
    this.where_builder(condition);
    this.sql = `delete from "${this.tableName}"`;
    return this;
  }

  /**
   * 可以不调用,构建sql时默认select，如果insert、update、detele没有调用则默认执行
   * @params fields
   * @returns instance
   */
  select(){
    this.transform(0);
    let args = Array.from(arguments);
    if(args.length){
      for (const p of args) {
        this.values.push(p);
        if(this.selectStr == '*') this.selectStr = '';
        this.selectStr += `"$${this.index++}",`
      }
      this.selectStr = this.selectStr.slice(0, this.selectStr.lastIndexOf(','));
    }
    return this;
  }

  /**
   * 支持三种参数列表 [field、 conditional、value] [field、value] [{key:value/Array[]}]
   * @params field
   * @params conditional
   * @params value 
   * @returns instance
   */
  where(){
    this.where_builder(...arguments);
    return this;
  }

  orderBy(field, by = 'AES'){
    by = by.toUpperCase();
    if(by !== 'AES' && by !== 'DESC'){
      throw new Error('ORDER BY type is error');
    }
    if(field || field.length){
      this.orderByStr = " ORDER BY";
      if(field instanceof Object){
        for (const p of field) {
          this.orderByStr += ` "$${this.index++}", `;
          this.values.push(p);
        }
      }else{
        this.orderByStr += ` "$${this.index++}", `;
        this.values.push(field);
      }
      this.orderByStr = this.orderByStr.slice(0, this.orderByStr.lastIndexOf(','))
      this.orderByStr += ` ${by}`;
    }
    return this;
  }

  limit(count){
    this.limitStr(`limit ${count}`);
    return this;
  }

  returning(returning = []){
    this.returning = returning;
    if (this.returning.length) {
      this.returningStr = 'RETURNING ' + returning.join(",");
    }
    
    return this;
  }

  /**
   * 内部使用，此方法为sql定性四大类：SELECT、UPDATE、INSERT、DELETE
   * @param {*} type 
   */
  transform(type = 0){
    if(this.type <= -1){
      this.type = type;
    }else{
      throw new Error(`build sql error-> ${SQLTYPE[this.type]} not transform ${SQLTYPE[type]}`);
    }
  }

  /**
   * 执行sql方法，一般为链式调用最后一个;
   * @returns object 查询结果
   */
  async query() {
    this.compose()
    console.log(this.sql, this.values);
    let result;
    try {
      if(this.type >= 1 && this.trx ){
        // 开启事务
        await this.pg.query('BEGIN');
      }
      result = await this.pg.query(this.sql, this.values);
    } catch (error) {
      throw error;
    }
    return result;
  }

  /**
   * 查看build sql
   * @returns sql 
   */
  async toSql() {
    // for (const join of this.joinArr) {
    //   console.log(JSON.stringify(join))
    // }
    this.compose()
    // console.log(this.sql, this.values)
    let sql = this.sql;
    let index = 1;
    for (const value of this.values) {
      sql = sql.replace(`$${index++}`, value)
    }
    return sql;
  }

  /**
   * 按照顺序组装sql：select、where、order by、limit
   */
   compose(){
    // select 
    if(!this.sql.length){
      let selectStr = `SELECT ${this.selectStr} FROM "${this.tableName}"`;
      this.sql += selectStr + this.sql;
    }
    // join compose
    if(this.joinArr.length && (this.type == -1||this.type == 0)){
      this.componse_join();
      this.sql += this.joinStr
    }

    // where
    if(this.type == -1||this.type == 0||this.type==2||this.type==3){
      this.sql += this.whereStr;
    }

    // order by
    if(this.type == 0){
      this.sql += this.orderByStr;
    }
    
    // limit
    this.sql += this.limitStr;

    //returning
    if(this.type >= 1){
      this.sql += ` ${this.returningStr}`;
    }

  }

  /**
 * where sql构建
 * @param {*} condition 
 * @returns 
 */
  where_builder() {
    let conditionStr = '=';
    if(arguments.length <= 1 ){
      let condition = arguments[0];
      for (let key in condition) {
        if (Object.hasOwnProperty.call(condition, key)) {
          let prefix = ' AND ';
          if (!this.whereStr.length) {
            prefix = ' WHERE ';
          }
          if (condition[key] instanceof Array) {
            let anyArr = [];
            for (const sub of condition[key]) {
              anyArr.push(sub)
            }
            if(this.whereSet.indexOf(key) <= -1){
              this.whereStr += `${prefix} ${key} ${conditionStr} any($${this.index++}), `;
              this.values.push(anyArr);
              this.whereSet.push(key);
            }
          } else {
            if(this.whereSet.indexOf(key) <= -1){
              this.whereStr += `${prefix} ${key} ${conditionStr} $${this.index++}, `;
              this.values.push(condition[key]);
              this.whereSet.push(key);
            }
          }
        }
      }
    }else{
      let prefix = ' AND ';
      if (!this.whereStr.length) {
        prefix = ' WHERE ';
      }
      if(arguments[arguments.length-1] instanceof Object){
        throw new Error('condition value is not allow Object');
      }
      let args = Array.from(arguments);
      if(args.length == 2 ){
        args.push(args[1]);
        args[1] = '=';
      }
      if(this.whereSet.indexOf(key) <= -1){
        this.whereStr += `${prefix} ${args[0]} ${args[1]} $${this.index++}, `;
        this.values.push(args[2]);
        this.whereSet.push(key);
      }
    }
    if(this.whereStr.length - this.whereStr.lastIndexOf(',') <= 2){
      this.whereStr = this.whereStr.slice(0, this.whereStr.lastIndexOf(','))
    }
  }
}

module.exports = PgBase;

function isJSON(str) {
  if (typeof str == 'string') {
      try {
          var obj=JSON.parse(str);
          if(typeof obj == 'object' && obj ){
              return true;
          }else{
              return false;
          }

      } catch(e) {
          console.log('error：'+str+'!!!'+e);
          return false;
      }
  }
}

