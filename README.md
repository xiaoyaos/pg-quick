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
