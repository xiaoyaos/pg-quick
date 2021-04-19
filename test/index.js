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
  // let rows =  await pgq('tb_merchant_list').query();
  // console.log(rows)
  const trx = await pgq.transaction();
  
  // add
  // var rows = await pgq('tb_merchant_list')
  // // .transacting(trx)
  // .insert({domain_id:100,merchant_name:'ceshi'}).query()
  // console.log(rows)
  // //delete 
  rows =  await pgq('tb_merchant_list').transacting(trx).update({merchant_name:"666"}).where({id:46}).query()
  rows =  await pgq('tb_merchant_list').update({merchant_name:"666"}).where({id:55}).query()
  rows =  await pgq('tb_merchant_list').transacting(trx).remove({id:56}).query()
  setTimeout(()=>{
    trx.commit();
  },5000)
  //
  // rows =  await pgq('tb_merchant_list').update({merchant_name:999}).where({a:1}).where('b','as').where('c', '>', 3).orderBy("a").toSql()
  // console.log(rows)
})()