// Validate the exact bytes of locally authorized Section 4 source artwork.
// Hashes only; this script does not download/stage/write original image files.
// Requires Node 20+ and network access to the public reference URLs.
// Usage: node tools/section4-source-hashes.mjs
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const files=[
  {name:'paper.webp',url:'https://undangankahwin.com/images/concierge/packs/tasik-kayangan/paper.webp'},
  {name:'arch_event.svg',url:'https://undangankahwin.com/images/concierge/packs/tasik-kayangan/arch_event.svg'},
  {name:'bfly_white.webp',url:'https://undangankahwin.com/images/concierge/packs/anggerik-nirmala/bfly_white.webp'}
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const results=[];
for(const file of files) {
  const result={filename:file.name,sourceUrl:file.url,localPath:'assets/reference-dev/'+file.name};
  let local=null;
  try{
    local=await readFile(join('assets','reference-dev',file.name));
    result.localBytes=local.length;
    result.localSha256=hash(local);
  }catch(error){
    result.localError=error.code||String(error);
  }
  let remote=null;
  try{
    const response=await fetch(file.url,{
      signal:AbortSignal.timeout(20000),
      headers:{'user-agent':'Mozilla/5.0 (compatible; Section4-local-hash-audit/1.0)'}
    });
    result.sourceStatus=response.status;
    if(!response.ok)throw Error('HTTP '+response.status);
    remote=Buffer.from(await response.arrayBuffer());
    result.sourceBytes=remote.length;
    result.sourceSha256=hash(remote);
  }catch(error){
    result.sourceError=String(error);
  }
  result.exactMatch=Boolean(local&&remote&&
    result.localBytes===result.sourceBytes&&
    result.localSha256===result.sourceSha256);
  result.status=result.exactMatch?'EXACT_MATCH':
    (!local||!remote)?'UNVERIFIED':'BYTE_MISMATCH';
  results.push(result);
  console.log(result.status+': '+file.name+
    (result.localSha256?' local='+result.localSha256:'')+
    (result.sourceSha256?' source='+result.sourceSha256:'')+
    (result.localError?' localError='+result.localError:'')+
    (result.sourceError?' sourceError='+result.sourceError:''));
}
await mkdir('section4-exact-audit',{recursive:true});
await writeFile('section4-exact-audit/section4-source-hashes.json',
  JSON.stringify({checkedAt:new Date().toISOString(),note:'Hash comparison only; does not prove licensing, full asset inventory, or visual parity.',results},null,2)+'\n');
const mismatches=results.filter(x=>x.status==='BYTE_MISMATCH');
const unverified=results.filter(x=>x.status==='UNVERIFIED');
if(mismatches.length){console.error('Source/local bytes differ. Do not claim exact original assets.');process.exitCode=1;}
else if(unverified.length){console.error('Source/local identity could not be verified. No 1:1 claim.');process.exitCode=2;}
else console.log('All three identified Section 4 source assets match byte-for-byte. Check missing artwork and visual parity separately.');
