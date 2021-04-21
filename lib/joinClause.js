/**
 * join class
 */
// TODO: 简单joinon 实现二级on条件，二级以上暂未实现
const _ = require('lodash');
const joinObjSchema = {
  tableName:'',
  joinType:'inner',
  on: [{
    type:1, // 1 first 2 or 3 and
    first:'',
    condition:'',
    last:'',
  }]
}
// join on 合并条件数据结构
const onTmpObjSchema = {
  type:1, // 1 first 2 or 3 and
  on:[]
}

class JoinClause {
  constructor(){
    // join
    this.joinStr = '';
    this.joinArr = [];
    this.joinOn = [];
    this.joinOnTmpStatus = false;   // 合并条件开启
    this.joinOnTmpType = 1;   // 1 on 2 or 3 and
    this.joinOnTmp = _.cloneDeep(onTmpObjSchema);
  }

  join(...args){
    if(args.length <= 1){
      throw new Error(`The number of arguments must be greater than 1`);
    }
    let schema = _.cloneDeep(joinObjSchema);
    schema.tableName = args[0];
    if(_.isFunction(args[1])){
      args[1].call(this);
    }else{
      this.on(args[0], '=', args[1])
    }
    let lastArgs = _.last(args);
    schema.joinType = _.indexOf(['left','inner','right'], lastArgs) > -1? lastArgs : 'inner';
    schema.on = this.joinOn;
    this.joinArr.push(schema)
    this.joinOn = [];
    return this;
  }

  leftJoin(...args){
    if(args.length <= 1){
      throw new Error(`The number of arguments must be greater than 1`);
    }
    this.join(...args, 'left');
    return this;
  }

  innerJoin(...args){
    if(args.length <= 1){
      throw new Error(`The number of arguments must be greater than 1`);
    }
    this.join(...args, 'inner');
    return this;
  }

  rightJoin(...args){
    if(args.length <= 1){
      throw new Error(`The number of arguments must be greater than 1`);
    }
    this.join(...args, 'right');
    return this;
  }

  on(...args){
    if(_.isFunction(args[0])){
      let lastArgs = _.last(args);
      this.joinOnTmpType = _.indexOf([1,2,3], lastArgs) > -1? lastArgs : 1;
      
      this.joinOnTmpStatus = true;
      args[0].call(this);
      this.joinOn.push(this.joinOnTmp);
      this.joinOnTmp = _.cloneDeep(onTmpObjSchema);
      this.joinOnTmpStatus = false;
      this.joinOnTmpType = 1;
    }else{
      let first = args[0];
      let condition = args[1];
      let last = args[2];
      if(args.length <= 2 ){
        last = args[1];
        condition = '=';
      }
      let onSchema = _.cloneDeep(joinObjSchema.on[0]);
      let lastArgs = _.last(args);
      onSchema.type = _.indexOf([1,2,3], lastArgs) > -1? lastArgs : 1;
      onSchema.first = first;
      onSchema.condition = condition;
      onSchema.last = last;
      
      if(this.joinOnTmpStatus){
        this.joinOnTmp.type = this.joinOnTmpType;
        this.joinOnTmp.on.push(onSchema);
      }else{
        this.joinOn.push(onSchema);
      }
    }
    return this;
  }
  orOn(...args){
    this.on(...args, 2);
    return this;
  }
  andOn(...args){
    this.on(...args, 3);
    return this;
  }

  // 生成 join sql
  componse_join(){
    for (const join of this.joinArr) {
      let str = ` ${join.joinType} JOIN ${join.tableName} `;
      let onStr = '';
      for (const on of join.on) {
        let onCondition = '';
        if(_.has(on, 'on')){
          let joinTmpType = 'ON';
          if(onStr.length > 2){
            if(on.type == 3){
              joinTmpType = 'AND';
            }else if(on.type == 2){
              joinTmpType = 'OR';
            }
          }
          onStr += ` ${joinTmpType} (`;
          for (const sub_on of on.on) {
            if(sub_on.type == 3){
              onCondition = 'AND';
            }else if(sub_on.type == 2){
              onCondition = 'OR';
            }
            onStr += ` ${onCondition} ${sub_on.first} ${sub_on.condition} ${sub_on.last}`;
          }
          onStr += ')';
        }else{
          if(on.type == 3){
            onCondition = 'AND';
          }else if(on.type == 2){
            onCondition = 'OR';
          }else if(on.type == 1){
            onCondition = 'ON';
            if(onStr.length > 0){
              onCondition = 'AND';
            }
          }
          onStr += ` ${onCondition} ${on.first} ${on.condition} ${on.last}`
        }
      }
      str += onStr
      // console.log(str);
      this.joinStr += str;
    }
  }
}

module.exports = JoinClause;