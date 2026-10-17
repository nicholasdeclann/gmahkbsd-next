"use client";
import { useState } from "react";
import Image from "next/image";
import WhatsApp from "@mui/icons-material/WhatsApp";
import ContentCopy from "@mui/icons-material/ContentCopy";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import { imageAsset } from "@/lib/asset";
import { givingAccounts, givingWhatsAppUrl } from "@/lib/giving";
import { T, useLanguage } from "./LanguageProvider";

export default function GivingSection() {
  const {t} = useLanguage();
  const [copyMessage, setCopyMessage] = useState("");
  async function copyAccount(number: string, bank: string) {
    try { await navigator.clipboard.writeText(number); setCopyMessage(`${t("Nomor rekening disalin")}: ${bank}.`); }
    catch { setCopyMessage(t("Belum dapat menyalin. Silakan salin nomor rekening di atas.")); }
  }
  return <section id="persembahan" className="giving-section section-space" aria-labelledby="giving-title">
    <div className="site-width">
      <header className="giving-heading"><p className="eyebrow"><T text="MEMBERI DENGAN SYUKUR"/></p><h2 className="section-title" id="giving-title"><T text="Persembahan & Perpuluhan"/></h2><p className="section-description"><T text="Pindai kode QR atau transfer ke salah satu rekening jemaat berikut."/></p></header>
      <div className="giving-layout">
        <div className="giving-accounts" aria-label={t("Rekening jemaat")}>
          {givingAccounts.map(account => <article className="giving-account" key={account.bank}>
            <div className="giving-bank-logo"><Image src={imageAsset(account.logo)} alt={account.bank} width={account.width} height={account.height} className={account.bank === "BCA" ? "giving-logo-bca" : "giving-logo-mandiri"}/></div>
            <p className="giving-account-number">{account.display}</p><p className="giving-account-holder">a/n {account.holder}</p>
            <button type="button" className="giving-copy" onClick={() => void copyAccount(account.number, account.bank)} aria-label={`${t("Salin nomor rekening")} ${account.bank}`}><ContentCopy fontSize="small"/><T text="Salin nomor rekening"/></button>
          </article>)}
          <p role="status" aria-live="polite" className="giving-copy-status">{copyMessage}</p>
        </div>
        <figure className="giving-qr"><div className="giving-qr-image"><Image src={imageAsset("giving/qris-jemaat.png")} alt="Kode QR rekening jemaat GMAHK BSD untuk persembahan dan perpuluhan" width={738} height={738} unoptimized sizes="(max-width: 760px) 80vw, 340px"/></div><figcaption><strong><T text="Kode QR Rekening Jemaat"/></strong><a href={imageAsset("giving/qris-jemaat.png")} download="QR-Rekening-GMAHK-BSD.png"><DownloadOutlined fontSize="small"/><T text="Simpan gambar QR"/></a></figcaption></figure>
      </div>
      <div className="giving-confirmation">
        <div><p className="eyebrow"><T text="SETELAH TRANSFER"/></p><h3><T text="Konfirmasi kepada bendahara"/></h3><p><T text="Hubungi Agus Prianto untuk menjelaskan tujuan transfer: persembahan atau perpuluhan. Sertakan nama, nominal, tanggal, dan bukti transfer agar pencatatan sesuai."/></p><p className="giving-treasurer">Agus Prianto · +62 813-9527-7058</p></div>
        <div className="giving-whatsapp-actions"><a className="site-button giving-whatsapp" href={givingWhatsAppUrl("persembahan")} target="_blank" rel="noopener noreferrer"><WhatsApp/><T text="Konfirmasi Persembahan"/></a><a className="site-button giving-whatsapp secondary" href={givingWhatsAppUrl("perpuluhan")} target="_blank" rel="noopener noreferrer"><WhatsApp/><T text="Konfirmasi Perpuluhan"/></a><p><T text="WhatsApp akan membuka pesan yang sudah disiapkan. Lengkapi dan kirim pesan kepada bendahara."/></p></div>
      </div>
    </div>
  </section>;
}
