'use strict';
// Vercel server-only helpers. Never return the service-role key to browsers.
const credentials=()=>{
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url))return null;
  return {url:url.replace(/\/$/,''),key};
};
const configured=()=>Boolean(credentials()&&process.env.TURNSTILE_SECRET_KEY&&process.env.TURNSTILE_SITE_KEY&&process.env.ALLOWED_ORIGINS);
const allowedOrigin=req=>{
  const origin=req.headers.origin||'';
  const allowed=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  return allowed.includes(origin);
};
const json=(res,status,data)=>{
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(data));
};
const validate=data=>{
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid RSVP data.');
  const id=data.requestId;
  if(typeof id!=='string'||!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(id))throw Error('Invalid receipt.');
  if(typeof data.name!=='string')throw Error('Enter your name.');
  const name=data.name.trim().replace(/\s+/g,' ');
  if(!name||name.length>60||/[\x00-\x1f]/.test(name))throw Error('Name must be 1–60 characters.');
  const attendance=data.attendance;
  if(!['yes','no'].includes(attendance))throw Error('Choose attendance.');
  const guests=data.guests;
  if(!Number.isInteger(guests)||((attendance==='yes'&&(guests<1||guests>5))||(attendance==='no'&&guests!==0)))throw Error('Invalid guest count.');
  const wish=typeof data.wish==='string'?data.wish.trim():null;
  if(wish===null||wish.length>300||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(wish))throw Error('Wish must be 300 characters or fewer.');
  if(typeof data.shareWish!=='boolean')throw Error('Invalid sharing choice.');
  return {receipt:id.toLowerCase(),guest_name:name,attendance,guests,wish,
    consent:!!(wish&&data.shareWish),approval:'pending'};
};
const supabaseRequest=async(route,options={})=>{
  const c=credentials();
  if(!c)throw Error('Missing storage configuration');
  const response=await fetch(c.url+'/rest/v1/'+route,{
    ...options,headers:{'apikey':c.key,'Authorization':'Bearer '+c.key,
      'Content-Type':'application/json',...(options.headers||{})}
  });
  if(!response.ok)throw Error('Storage request failed: HTTP '+response.status);
  return response.json();
};
module.exports={configured,allowedOrigin,json,validate,supabaseRequest};
