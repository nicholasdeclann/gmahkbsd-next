"use client";
import {createContext,useContext,useEffect,useState} from "react";
import translations from "@/lib/i18n/en.json";
const dictionary:Record<string,string>=translations;
const LanguageContext=createContext({language:"id",setLanguage:(_language:string)=>{},t:(text:string)=>text});
export function useLanguage(){return useContext(LanguageContext);}
export function T({text}:{text:string}){return <>{useLanguage().t(text)}</>;}
export function LanguageSwitch() {
  const {language,setLanguage}=useLanguage();
  return <select className="language-switch" aria-label="Bahasa / Language" value={language} onChange={event=>setLanguage(event.target.value)}>
    <option value="id" lang="id">ID</option>
    <option value="en" lang="en">EN</option>
  </select>;
}
export default function LanguageProvider({children}:{children:React.ReactNode}){
 const [language,update]=useState("id");
 useEffect(()=>{try{if(localStorage.getItem("gmahkbsd-language")==="en")update("en");}catch{}},[]);
 useEffect(()=>{document.documentElement.lang=language;},[language]);
 function setLanguage(value:string){update(value);try{localStorage.setItem("gmahkbsd-language",value);}catch{}}
 function t(text:string){return language==="en"?(Object.hasOwn(dictionary,text.trim())?dictionary[text.trim()]:text):text;}
 return <LanguageContext.Provider value={{language,setLanguage,t}}>{children}</LanguageContext.Provider>;
}
