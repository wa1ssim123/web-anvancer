/* HORENOVA staged performance probe - intentionally will NOT target production.
 * Install k6 (https://grafana.com/docs/k6/latest/) and run:
 *   k6 run -e BASE_URL=https://your-isolated-staging-host qa/load-staging.js
 * NEVER run against horenova.com or the production Render origin.
 * Uses public GETs only and synthetic users, no real member data.
 */
import http from 'k6/http';
import {check,sleep} from 'k6';
export const options={
 stages:[{duration:'20s',target:5},{duration:'35s',target:20},
         {duration:'35s',target:50},{duration:'15s',target:0}],
 thresholds:{
  http_req_failed:['rate<0.01'],
  http_req_duration:['p(95)<2500']
 }
};
const host=String(__ENV.BASE_URL||'').replace(/\/+$/,'');
const production=['https://horenova.com','https://www.horenova.com',
 'https://horenova-site-officiel.onrender.com','https://horenova-hub-api.onrender.com'];
if(!host||production.includes(host)||!/^https:\/\//i.test(host))
 throw Error('Set BASE_URL to a dedicated HTTPS staging environment, NEVER production');
export default function(){
 const response=http.get(host+'/api/jobs/public',{timeout:'12s',tags:{endpoint:'public_jobs'}});
 check(response,{'approved jobs respond 200':r=>r.status===200,
  'json content returned':r=>(r.headers['Content-Type']||'').includes('application/json')});
 sleep(1+Math.random()*2);
}
