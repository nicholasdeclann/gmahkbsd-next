import { NextResponse } from "next/server";
import { getSheetSources } from "@/lib/sheetSettings";
import { buildSabbathSummary, summaryRows } from "@/lib/sabbathSummary";

export const dynamic = "force-dynamic";
let saved: {key:string;details:string;participants:string;at:number} | undefined;
let pending: {key:string;request:Promise<{details:string;participants:string}>} | undefined;
function url(sheetId:string,gid:string,range:string) {
  const value=new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
  value.search=new URLSearchParams({gid,range,headers:"0",tqx:"out:json"}).toString();return value.toString();
}
async function read(url:string) {
  for(let attempt=0;attempt<2;attempt++) {
    try {const response=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error("Unavailable");const text=await response.text();summaryRows(text);return text;}
    catch(error){if(attempt===1)throw error;}
  }
  throw new Error("Unavailable");
}
export async function GET() {
  try {
    const {liturgy,schedule}=await getSheetSources();
    const key=JSON.stringify({liturgy,schedule});let source=saved?.key===key?saved:undefined;let stale=false;
    if(!source || Date.now()-source.at>300000) {
      if(pending?.key!==key) {
        const request=Promise.all([read(url(liturgy.sheetId,liturgy.kertasAcaraGid,"B2:C4")),read(url(schedule.sheetId,schedule.gid,"A1:N40"))]).then(([details,participants])=>{
          const result={details,participants};saved={key,...result,at:Date.now()};return result;
        });pending={key,request};void request.finally(()=>{if(pending?.request===request)pending=undefined;}).catch(()=>{});
      }
      try {source={key,...await pending.request,at:Date.now()};}
      catch(error){if(!source || Date.now()-source.at>3600000)throw error;stale=true;}
    }
    return NextResponse.json({...buildSabbathSummary(summaryRows(source.details),summaryRows(source.participants)),stale},{headers:{"Cache-Control":"no-store"}});
  } catch {return NextResponse.json({error:"Informasi Sabat belum dapat dimuat."},{status:502});}
}
