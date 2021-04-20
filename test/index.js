const Pgq = require('../index');
const pgq = new Pgq({
  "host": "127.0.0.1",
  "port": 5432,
  "user": "postgres",
  "password": "",
  "database": "test",
  "max":500
});
(async ()=>{
  // let rows =  await pgq('tb_name').query();
  // console.log(rows)
  const trx = await pgq.transaction();
  
  // add
  // var rows = await pgq('tb_name')
  // // .transacting(trx)
  // .insert({domain_id:100,name:'ceshi'}).query()
  // console.log(rows)
  // //delete 
  rows =  await pgq('tb_name').transacting(trx).update({name:"666"}).where({id:46}).where({id:49}).toSql()
  console.log(rows)
  // rows =  await pgq('tb_name').update({name:"666"}).where({id:55}).query()
  // rows =  await pgq('tb_name').transacting(trx).remove({id:56}).query()
  // setTimeout(()=>{
  //   trx.commit();
  // },5000)
  //
  // rows =  await pgq('tb_name').update({name:999}).where({a:1}).where('b','as').where('c', '>', 3).orderBy("a").toSql()
  // console.log(rows)
})()