import assert from 'node:assert/strict';
import test from 'node:test';
import worker, {DownloadCounter} from '../worker/index.js';
function storage() {
 const data=new Map(); let queue=Promise.resolve();
 return {async get(k){return data.get(k)},async put(k,v){data.set(k,v)},transaction(fn){const task=queue.then(()=>fn(this));queue=task.catch(()=>{});return task}};
}
test('aggregate increments atomically and survives a new object instance',async()=>{
 const state={storage:storage()}, c=new DownloadCounter(state);
 assert.equal((await (await c.fetch(new Request('https://counter/stats'))).json()).downloads,0);
 await Promise.all(Array.from({length:40},()=>c.fetch(new Request('https://counter/increment',{method:'POST'}))));
 assert.deepEqual(await (await new DownloadCounter(state).fetch(new Request('https://counter/stats'))).json(),{downloads:40,since:'2026-10-02'});
 assert.equal((await c.fetch(new Request('https://counter/increment'))).status,404);
});
test('only permitted download events affect the public count',async()=>{
 globalThis.caches={default:{async match(){return null},async put(){}}};
 const c=new DownloadCounter({storage:storage()}), pending=[];
 const env={DOWNLOADS:{idFromName(){return 'counter'},get(){return {fetch:(url,init)=>c.fetch(new Request(url,init))}}}};
 const ctx={waitUntil(p){pending.push(p)}};
 async function log(t,page,origin='https://graphican.online') {
   await worker.fetch(new Request('https://graphican.online/api/log',{method:'POST',headers:{origin,'content-type':'text/plain'},body:JSON.stringify({t,page})}),env,ctx);
   await Promise.all(pending);
 }
 await log('dl','/slides/');await log('err','/slides/');await log('dl','/random/');await log('dl','/slides/','https://example.com');
 const response=await worker.fetch(new Request('https://graphican.online/api/stats'),env,ctx);
 assert.equal(response.status,200);assert.equal((await response.json()).downloads,1);
 assert.equal((await worker.fetch(new Request('https://graphican.online/api/stats'),{},ctx)).status,503);
 assert.equal((await worker.fetch(new Request('https://graphican.online/api/stats',{method:'POST'}),env,ctx)).status,405);
});
