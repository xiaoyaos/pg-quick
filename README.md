# pg-quick

## recommend

Build query SQL statements based on node-postgres

``` js
const Pgq = require('pg-quick');
const pgq = new Pgq({
    "host": "",
    "port": 5432,
    "user": "",
    "password": "",
    "database": "database",
    "max": 500
});

(async () => {
    // SELECT
    let rows = await pgq('tablename').query();
    console.log(rows)
    // INSERT
    var rows = await pgq('tablename').insert({
        domain_id: 999,
        merchant_name: 'ceshi'
    }).query()
    // UPDATE
    rows = await pgq('tablename').update().where({
        a: 1
    }).where('b', 2).where('c', '>', 3).query()
    console.log(rows)
    // DELETE
    rows = await pgq('tablename').update({
        merchant_name: 999
    }).where({
        a: 1
    }).where('b', 'as').where('c', '>', 3).orderBy("a").query()
    console.log(rows)
})()
```

## Installation

``` sh
$ npm install pg-quick
```

# Overview

## Creating pgq

``` js
const Pgq = require('pg-quick');
const pgq = new Pgq({
    "host": "",
    "port": 5432,
    "user": "",
    "password": "",
    "database": "database",
    "max": 500
});
```

# API

## SELECT

``` js
await pgq('tablename').select('field1', 'field2', 'field3').query();
```

## INSERT

``` js
await pgq('tablename').insert({
    field1: 'value',
    field2: 'value'
}).query();
```

## UPDATE

``` js
await pgq('tablename').update({
    field1: 'value',
    field2: 'value'
}).where({
    id: 1
}).query();
```

## REMOVE [DELETE]

``` js
await pgq('tablename').remove({
    id: 1
}).query();
```

## WHERE

``` js
await pgq('tablename').select('*').where('field', '=', 'value');
await pgq('tablename').update({
    field1: 'value'
}).where('field', 'value').query();

await pgq('tablename').select('*').where({
    field: 'value'
}).query();
```

## RETURNING

``` js
await pgq('tablename').insert({
    field1: 'value',
    field2: 'value'
}).returning(['id', 'name']).query();

await pgq('tablename').update({
    field1: 'value'
}).where('field', 'value').returning(['id', 'name']).query();

await pgq('tablename').remove({
    field1: 'value'
}).where({
    field2: 'value'
}).returning(['id', 'name']).query();
```
## ORDER BY
```js
await pgq('tablename').select('field1', 'field2', 'field3').orderBy(['id','name'], 'DESC').query();
```

## query
all operation is require call .query() perform
```js
await pgq('tablename').select('field1', 'field2', 'field3').query();
```

## toSql()
return build sql, is not require call .query()
```js
await pgq('tablename').select('field1', 'field2', 'field3').toSql();
```
# JOIN
left、inner、right
## .join、.leftJoin、.innerJoin、.rightJoin
## .on、.orON、andOn
```js
await pgq('student').transacting(trx).select("id", "name")
    // simple join
  .leftJoin('classs', 'student.id', 'classs.s_id')
  .innerJoin('classs', 'student.id', 'classs.s_id')
  .leftJoin('classs', 'student.id', 'classs.s_id')
  .rightJoin('classs', 'student.id', 'classs.s_id')
// raw sql: inner JOIN classs  ON classs = student.id inner JOIN classs  ON classs = student.id left JOIN classs  ON classs = student.id right JOIN classs  ON classs = student.id

// callback is on
  .rightJoin('dorm',function(){
    this.on('dorm.s_id','=', 'student.id').on('dorm.s_id0', 'student.id0')
  })
// raw sql:right JOIN dorm  ON dorm.s_id = student.id AND dorm.s_id0 = student.id0

// second callbacl on  目前只支持二级回调，也就是on方法里面只允许一级回调，二级回调无法正常运行
  .leftJoin('classs',function(){
    this.on(function(){
      this.on('classs.s_id4','student.id4').andOn('classs.s_id1','=', 'student.id1')
    }).andOn(function(){
      this.on('classs.s_id2','student.id2').orOn('classs.s_id3','=', 'student.id3')
    }).orOn(function(){
      this.on('classs.s_id5','student.id5').orOn('classs.s_id6','=', 'student.id6')
    })
  })
// raw sql: left JOIN classs  ON (  classs.s_id4 = student.id4 AND classs.s_id1 = student.id1) AND (  classs.s_id2 = student.id2 OR classs.s_id3 = student.id3) OR (  classs.s_id5 = student.id5 OR classs.s_id6 = student.id6)

```

# TRANSACTIONS
``` js
const Pgq = require('pg-quick');
const pgq = new Pgq({
    "host": "",
    "port": 5432,
    "user": "",
    "password": "",
    "database": "database",
    "max": 500
});

(async () => {
    const trx = pgq.transaction();
    // INSERT
    var rows = await pgq('tablename').transacting(trx).insert({
        domain_id: 999,
        merchant_name: 'ceshi'
    }).query()
    // UPDATE
    rows = await pgq('tablename').transacting(trx).update().where({
        a: 1
    }).where('b', 2).where('c', '>', 3).query()
    console.log(rows)
    // DELETE
    rows = await pgq('tablename').transacting(trx).update({
        merchant_name: 999
    }).where({
        a: 1
    }).where('b', 'as').where('c', '>', 3).orderBy("a").query()
    console.log(rows)

    trx.commit();// or trx.rollback();
})()
```
## transaction
创建化一个事务对象，在后续指定的sql查询中注入该事务对象，这本次sql查询会挂载到此事务上，只有rollback或者commit才会产生最终结果并释放该事务对应的client

## transacting
该方法为给指定sql查询挂载指定事务对象，被挂载的sql查询隶属于此事务