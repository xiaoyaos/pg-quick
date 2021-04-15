const Pgq = require('../index');
const pgq = new Pgq({
  "host": "118.31.78.162",
  "port": 5432,
  "user": "postgres",
  "password": "siot@201709",
  "database": "siot",
  "max":500
});

(async ()=>{
  let rows =  await pgq('tb_merchant_list').where({a:1}).where('b',2).where('c', '>', 3).orderBy("a", 'desc').toSql()
  console.log(rows)
  // add
  // var rows = await pgq('tb_merchant_list').insert({domain_id:999,merchant_name:'ceshi'}).toSql()
  // //delete 
  rows =  await pgq('tb_merchant_list').update().where({a:1}).where('b',2).where('c', '>', 3).toSql()
  // console.log(rows)
  //
  // rows =  await pgq('tb_merchant_list').update({merchant_name:999}).where({a:1}).where('b','as').where('c', '>', 3).orderBy("a").toSql()
  console.log(rows)
})()