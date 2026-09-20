import {buildQualityReview} from "../src/quality-review.mjs";
const base=String(process.argv[2]||process.env.SUPER_DRAIN_URL||"http://127.0.0.1:4317").replace(/\/$/,"");
const response=await fetch(new URL("/api/outtake?limit=100&evidenceLimit=25",base),{headers:{accept:"application/json"}});
if(!response.ok){console.log(JSON.stringify({status:"BLOCKED",http_status:response.status},null,2));process.exit(2)}
const outtake=await response.json(),review=buildQualityReview(outtake,{sampleSize:Math.min(25,outtake.recovered_work||0)});
console.log(JSON.stringify(review,null,2));
if(!review.structurally_valid||review.invalid_classifications)process.exit(4);
