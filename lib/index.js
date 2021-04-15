const Pool = require('pg').Pool;
const SQLTYPE = {
  '-1': "SELECT",
  '0': "SELECT",
  '1': "INSERT",
  '2': "UPDATE",
  '3': "DELETE"
}

class PgBase {
  /**
   * insert
   * @param {*} tableName 
   * @param {*} data 
   * @param {*} returning 
   */
  constructor(config) {
    this.config = config;
    this.pool = new Pool(this.config)
    this.init();
    return this.table.bind(this);
  }

  table(tableName) {
    this.init()
    this.tableName = tableName;
    return this
  }

  init() {
    this.type = -1; // 0 select 1 add 2 update 3 delete
    this.sql = '';
    this.field = '';
    this.valueStr = '';
    this.whereStr = '';
    this.returningStr = '';
    this.setStr = '';
    this.index = 1;
    this.values = [];
    this.limitStr = '';
    this.selectStr = '*';

    this.orderByStr = '';
  }


  /**
   * insert
   * @param {*} data 
   * @param {*} returning 
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
    return this
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
    return this
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
    return this
  }

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

  where(){
    this.where_builder(...arguments);
    return this
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
    return this
  }

  limit(count){
    this.limitStr(`limit ${count}`);
    return this
  }

  returning(returning = []){
    this.returning = returning;
    if (this.returning.length) {
      this.returningStr = 'RETURNING ' + returning.join(",");
    }
    this.sql += ` ${this.returningStr}`;
    return this
  }

  transform(type = 0){
    if(this.type <= -1){
      this.type = type;
    }else{
      throw new Error(`build sql error-> ${SQLTYPE[this.type]} not transform ${SQLTYPE[type]}`);
    }
  }

  async query() {
    this.commpose()
    console.log(this.sql, this.values)
    return new Promise((resolve, reject) => {
      this.pool.query(this.sql, this.values, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    })
  }

  /**
   * 查看build sql
   * @returns sql 
   */
  async toSql() {
    this.commpose()
    // console.log(this.sql, this.values)
    let sql = this.sql;
    let index = 1;
    for (const value of this.values) {
      sql = sql.replace(`$${index++}`, value)
    }
    return sql;
  }

  commpose(){
    // select 
    if(!this.sql.length){
      let selectStr = `SELECT ${this.selectStr} FROM`;
      this.sql = selectStr + this.sql;
    }
    // where
    this.sql += this.whereStr;

    // order by
    if(this.type == 0){
      this.sql += this.orderByStr;
    }
    
    // limit
    this.sql += this.limitStr;
    return this;
  }

  /**
 * 条件sql构建
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
            this.whereStr += `${prefix} ${key} ${conditionStr} any($${this.index++}), `;
            this.values.push(anyArr);
          } else {
            this.whereStr += `${prefix} ${key} ${conditionStr} $${this.index++}, `;
            this.values.push(condition[key]);
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
      this.whereStr += `${prefix} ${args[0]} ${args[1]} $${this.index++}, `;
      this.values.push(args[2]);
    }
    this.whereStr = this.whereStr.slice(0, this.whereStr.lastIndexOf(','))
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

