'use strict';
const {credentials,json,supabaseRequest}=(()=>{
  const value=require('./_rsvp.js');return {...value};
})();
module.exports=async(req,res)=>{
  if(req.method!=='GET'){res.setHeader('Allow','GET');return json(res,405,{error:'Method not allowed.'});}
  try{
    const rows=await supabaseRequest('rsvp_submissions?select=guest_name,wish,created_at&approval=eq.approved&consent=eq.true&order=created_at.desc&limit=20');
    if(!Array.isArray(rows))throw Error('Invalid response');
    return json(res,200,{wishes:rows.map(r=>({name:r.guest_name,wish:r.wish,createdAt:r.created_at}))});
  }catch(_){return json(res,503,{error:'Guest wishes are currently unavailable.',wishes:[]});}
};
