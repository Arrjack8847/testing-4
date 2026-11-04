const test=require('node:test');
const assert=require('node:assert/strict');
const rsvp=require('../api/rsvp.js');
const statusRoute=require('../api/rsvp/status.js');
const wishesRoute=require('../api/wishes.js');

function response(){
  const headers={};
  return {statusCode:200,headers,setHeader(k,v){headers[k]=v;},
    end(v){this.body=JSON.parse(v||'{}');}};
}
test('unconfigured public API refuses to claim a saved RSVP',async()=>{
  const names=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY','ALLOWED_ORIGINS'];
  const original=Object.fromEntries(names.map(n=>[n,process.env[n]]));
  try{
    for(const n of names)delete process.env[n];
    const res=response();
    await rsvp({method:'POST',headers:{'content-type':'application/json'},body:{
      requestId:'acb7ac40-3a6f-48d9-a55a-3c8e8ffae993',name:'Test Guest',attendance:'yes',
      guests:2,wish:'Hello',shareWish:false
    }},res);
    assert.equal(res.statusCode,503);
    assert.equal(res.body.ok,false);
    const state=response();
    statusRoute({method:'GET'},state);
    assert.equal(state.body.accepting,false);
    assert.equal(state.body.captchaSiteKey,null);
  }finally{
    for(const n of names)if(original[n]===undefined)delete process.env[n];else process.env[n]=original[n];
  }
});
