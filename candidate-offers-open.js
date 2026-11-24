/* Native details is intentionally responsible for opening/closing. No navigation or click cancellation. */
(()=>{'use strict';
function revealHash(){const id=location.hash.slice(1);if(!['hnCandidateOffersAdmin','hnCandidateOffersAccount','hnCandidateOffersRecruit'].includes(id))return;const host=document.getElementById(id),details=host?.querySelector('[data-co-details]');if(details)details.open=true}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',revealHash,{once:true});else revealHash();
window.addEventListener('hashchange',revealHash);
})();