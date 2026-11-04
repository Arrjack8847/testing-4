'use strict';
const {configured,json}=require('../_rsvp.js');
module.exports=(req,res)=>{
  if(req.method!=='GET'){res.setHeader('Allow','GET');return json(res,405,{accepting:false});}
  return json(res,200,{accepting:configured(),captchaSiteKey:configured()?process.env.TURNSTILE_SITE_KEY:null});
};
