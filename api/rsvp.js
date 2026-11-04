'use strict';
const {configured,allowedOrigin,json,validate,supabaseRequest}=require('./_rsvp.js');
module.exports=async (req,res)=>{
  if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{ok:false,error:'Method not allowed.'});}
  if(!configured())return json(res,503,{ok:false,error:'Online RSVP is not configured.'});
  if(!allowedOrigin(req))return json(res,403,{ok:false,error:'Origin not allowed.'});
  if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))
    return json(res,415,{ok:false,error:'JSON required.'});
  let data;
  try{
    data=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(JSON.stringify(data).length>2048)throw Error('Too much data.');
    data=validate(data);
  }catch(e){return json(res,400,{ok:false,error:e.message||'Invalid RSVP.'});}
  // A verified Cloudflare Turnstile response is mandatory for public writes.
  const token=typeof req.body==='string'?JSON.parse(req.body).captchaToken:req.body?.captchaToken;
  if(typeof token!=='string'||!token||token.length>2048)
    return json(res,403,{ok:false,error:'Please complete the anti-spam verification.'});
  try{
    const check=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',body:new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY,response:token})
    });
    const outcome=await check.json();
    if(!check.ok||!outcome.success)
      return json(res,403,{ok:false,error:'Verification failed. Please try again.'});
    const rows=await supabaseRequest('rsvp_submissions?on_conflict=receipt',{
      method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(data)
    });
    if(!Array.isArray(rows))throw Error('Unexpected database response');
    return json(res,rows.length?201:200,{ok:true,saved:true,duplicate:rows.length===0,receipt:data.receipt});
  }catch(_){
    return json(res,503,{ok:false,error:'Unable to save RSVP. Please try again.'});
  }
};
