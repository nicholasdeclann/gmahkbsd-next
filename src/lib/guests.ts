import {google,type drive_v3} from "googleapis";
import {Readable} from "node:stream";
import {randomUUID} from "node:crypto";
import {createOAuthClient} from "./drive";
import {isLocalDemo,readDemo,updateDemo} from "./localDemo";
import {isSaturday,guestDetails,type GuestEntry} from "./guestTypes";

const kind="gmahkbsd-guest";
export class GuestError extends Error {constructor(message:string,public status=503){super(message);}}
export function guestsConfigured(){return isLocalDemo()||Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.GOOGLE_DRIVE_REFRESH_TOKEN);}
function driveService(){
  if(!guestsConfigured())throw new GuestError("Koneksi bersama akun gereja belum tersedia. Hubungi pengelola website.");
  // This password-free feature must never depend on an usher's browser Google session.
  const client=createOAuthClient();client.setCredentials({refresh_token:process.env.GOOGLE_DRIVE_REFRESH_TOKEN});
  return google.drive({version:"v3",auth:client});
}
const validId=(id:string)=>/^[a-zA-Z0-9_-]{10,200}$/.test(id);
const pendingFolders=new Map<string,Promise<string|null>>();
async function folder(drive:drive_v3.Drive,parent:string|null,key:string,name:string,create:boolean):Promise<string|null>{
  async function find(make:boolean):Promise<string|null>{
    const query=`trashed=false and mimeType='application/vnd.google-apps.folder' and properties has {key='guestFolder' and value='${key}'}${parent?` and '${parent}' in parents`:" and 'root' in parents"}`;
    const result=await drive.files.list({q:query,fields:"files(id)",pageSize:100,orderBy:"createdTime"});
    const existing=result.data.files?.[0]?.id;if(existing||!make)return existing||null;
    const created=await drive.files.create({requestBody:{name,mimeType:"application/vnd.google-apps.folder",...(parent?{parents:[parent]}:{}),properties:{guestFolder:key}},fields:"id"});
    if(!created.data.id)throw new GuestError("Folder daftar tamu belum berhasil dibuat.");
    return (await find(false))||created.data.id;
  }
  if(!create)return find(false);
  const identity=`${parent}:${key}`;const pending=pendingFolders.get(identity);if(pending)return pending;
  const operation=find(true);pendingFolders.set(identity,operation);
  try{return await operation;}finally{pendingFolders.delete(identity);}
}
async function weekFolder(drive:drive_v3.Drive,date:string,create=false){
  if(!isSaturday(date))throw new GuestError("Pilih tanggal hari Sabtu.",400);
  // Create a private root in church My Drive; do not inherit the announcement folder's sharing.
  const root=await folder(drive,null,"root","Daftar Tamu",create);if(!root)return null;
  const year=await folder(drive,root,date.slice(0,4),date.slice(0,4),create);if(!year)return null;
  return folder(drive,year,date,`Sabat ${date}`,create);
}
function decode(file:drive_v3.Schema$File):GuestEntry {
  try {
    const data=JSON.parse(file.description||"") as GuestEntry;
    const details=guestDetails(data);
    if(file.properties?.kind!==kind||file.properties.date!==details.date||typeof data.revision!=="string"||typeof data.createdAt!=="string"||typeof data.updatedAt!=="string")throw new Error();
    return {...details,id:file.id!,revision:data.revision,createdAt:data.createdAt,updatedAt:data.updatedAt};
  }catch{throw new GuestError("Satu catatan tamu tidak dapat dibaca. Hubungi pengelola website.",502);}
}
async function listFiles(drive:drive_v3.Drive,parent:string){
  const files:drive_v3.Schema$File[]=[];let pageToken:string|undefined;
  do{
    const result=await drive.files.list({q:`'${parent}' in parents and trashed=false and properties has {key='kind' and value='${kind}'}`,fields:"nextPageToken,files(id,description,properties,createdTime)",pageSize:100,pageToken,orderBy:"createdTime"});
    files.push(...result.data.files||[]);pageToken=result.data.nextPageToken||undefined;
  }while(pageToken);
  return files;
}
export async function listGuests(date:string):Promise<GuestEntry[]>{
  if(!isSaturday(date))throw new GuestError("Pilih tanggal hari Sabtu.",400);
  if(isLocalDemo())return ((await readDemo()).guests||[]).filter(g=>g.date===date).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
  const drive=driveService(),parent=await weekFolder(drive,date);if(!parent)return [];
  return (await listFiles(drive,parent)).map(decode).filter(entry=>entry.date===date);
}
async function checked(drive:drive_v3.Drive,id:string,date:string){
  if(!validId(id)||!isSaturday(date))throw new GuestError("Catatan tamu tidak ditemukan.",404);
  const response=await drive.files.get({fileId:id,fields:"id,description,properties,parents,trashed,mimeType"});
  const file=response.data;
  if(file.trashed||file.properties?.kind!==kind||file.properties.date!==date||file.mimeType!=="application/json")throw new GuestError("Catatan tamu tidak ditemukan.",404);
  const parent=await weekFolder(drive,date);if(!parent)throw new GuestError("Catatan tamu tidak ditemukan.",404);
  if(!file.parents?.includes(parent)&&!(await listFiles(drive,parent)).some(f=>f.id===id))throw new GuestError("Catatan tamu tidak ditemukan.",404);
  return {entry:decode(file),etag:(response.headers as Record<string,string>).etag};
}
type Details=Pick<GuestEntry,"date"|"name"|"church"|"type"|"pax">;
function retryEntry(entry:GuestEntry,details:Details){
  if(entry.date!==details.date||entry.name!==details.name||entry.church!==details.church||entry.type!==details.type||entry.pax!==details.pax)throw new GuestError("Catatan dari percobaan sebelumnya sudah tersimpan. Perbarui daftar untuk melihatnya sebelum mengedit.",409);
  return entry;
}
export async function createGuest(details:Details,requestId:string):Promise<GuestEntry>{
  if(isLocalDemo())return updateDemo(data=>{
    const guests=data.guests??=[];const previous=guests.find(g=>g.id===`local-${requestId}`);
    if(previous)return retryEntry(previous,details);
    const now=new Date().toISOString();const entry={...details,id:`local-${requestId}`,revision:randomUUID(),createdAt:now,updatedAt:now};guests.push(entry);return entry;
  });
  const drive=driveService(),parent=await weekFolder(drive,details.date,true);
  // Stable request IDs avoid duplicating a group if a successful save's response is lost.
  const existing=await drive.files.list({q:`'${parent}' in parents and trashed=false and properties has {key='requestId' and value='${requestId}'} and properties has {key='kind' and value='${kind}'}`,fields:"files(id,description,properties)",pageSize:100});
  if(existing.data.files?.[0])return retryEntry(decode(existing.data.files[0]),details);
  const now=new Date().toISOString(),entry={...details,id:"",revision:randomUUID(),createdAt:now,updatedAt:now};
  const json=JSON.stringify(entry);
  const result=await drive.files.create({requestBody:{name:`${requestId}.json`,parents:[parent!],description:json,properties:{kind,date:details.date,requestId}},media:{mimeType:"application/json",body:Readable.from(Buffer.from(json))},fields:"id,description,properties"});
  if(!result.data.id)throw new GuestError("Google Drive belum mengonfirmasi penyimpanan.",502);
  return decode(result.data);
}
const edits=new Map<string,Promise<unknown>>();
async function serialize<T>(id:string,operation:()=>Promise<T>):Promise<T>{
  const previous=edits.get(id)||Promise.resolve();const pending=previous.catch(()=>undefined).then(operation);edits.set(id,pending);
  try{return await pending;}finally{if(edits.get(id)===pending)edits.delete(id);}
}
export async function updateGuest(id:string,details:Details,revision:string):Promise<GuestEntry>{
  if(isLocalDemo())return updateDemo(data=>{
    const entry=data.guests?.find(g=>g.id===id&&g.date===details.date);if(!entry)throw new GuestError("Catatan tamu tidak ditemukan.",404);
    if(entry.revision!==revision)throw new GuestError("Catatan ini sudah diubah petugas lain. Muat ulang sebelum menyimpan.",409);
    Object.assign(entry,details,{revision:randomUUID(),updatedAt:new Date().toISOString()});return entry;
  });
  return serialize(id,async()=>{
    const drive=driveService(),current=await checked(drive,id,details.date);
    if(current.entry.revision!==revision)throw new GuestError("Catatan ini sudah diubah petugas lain. Muat ulang sebelum menyimpan.",409);
    const entry={...current.entry,...details,revision:randomUUID(),updatedAt:new Date().toISOString()},json=JSON.stringify(entry);
    const result=await drive.files.update({fileId:id,requestBody:{description:json},media:{mimeType:"application/json",body:Readable.from(Buffer.from(json))},fields:"id,description,properties"},current.etag?{headers:{"If-Match":current.etag}}:{});
    return decode(result.data);
  });
}
export async function deleteGuest(id:string,date:string,revision:string):Promise<void>{
  if(isLocalDemo())return updateDemo(data=>{
    const entry=data.guests?.find(g=>g.id===id&&g.date===date);if(!entry)throw new GuestError("Catatan tamu tidak ditemukan.",404);
    if(entry.revision!==revision)throw new GuestError("Catatan ini sudah diubah petugas lain. Muat ulang sebelum menghapus.",409);
    data.guests=data.guests!.filter(g=>g.id!==id);
  });
  return serialize(id,async()=>{
    const drive=driveService(),current=await checked(drive,id,date);
    if(current.entry.revision!==revision)throw new GuestError("Catatan ini sudah diubah petugas lain. Muat ulang sebelum menghapus.",409);
    await drive.files.update({fileId:id,requestBody:{trashed:true}},current.etag?{headers:{"If-Match":current.etag}}:{});
  });
}
