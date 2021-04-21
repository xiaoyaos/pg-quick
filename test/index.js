const Pgq = require('../index');
const pgq = new Pgq({
  "host": "127.0.0.1",
  "port": 5432,
  "user": "postgres",
  "password": "123456",
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
  rows = await pgq('student').transacting(trx).select("id", "name")
  // .leftJoin('classs', 'student.id', 'classs.s_id')
  .rightJoin('dorm',function(){
    this.on('dorm.s_id','=', 'student.id').on('dorm.s_id0','=', 'student.id0')
  })
  .leftJoin('classs',function(){
    this.on(function(){
      this.on('classs.s_id4','student.id4').andOn('classs.s_id1','=', 'student.id1')
    }).andOn(function(){
      this.on('classs.s_id2','student.id2').orOn('classs.s_id3','=', 'student.id3')
    }).orOn(function(){
      this.on('classs.s_id5','student.id5').orOn('classs.s_id6','=', 'student.id6')
    })
  })
  .where({id:46}).where({id:49}).toSql()
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