export const givingAccounts = [
  { bank: "Mandiri", number: "1180002301611", display: "118 000 230 1611", holder: "Gereja Masehi Advent", logo: "giving/mandiri.png", width: 3840, height: 1121 },
  { bank: "BCA", number: "1394514317", display: "1394 514 317", holder: "Agus Prianto", logo: "giving/bca-cropped.png", width: 288, height: 120 },
] as const;
export function givingWhatsAppUrl(purpose: "persembahan" | "perpuluhan") {
  const message = `Shalom Bapak Agus Prianto, saya menghubungi melalui website GMAHK BSD. Saya sudah melakukan transfer untuk ${purpose}.\n\nNama: \nTanggal transfer: \nNominal: Rp \nMelalui (Mandiri / BCA / QR): \n\nSaya akan melampirkan bukti transfer. Terima kasih.`;
  return `https://wa.me/6281395277058?text=${encodeURIComponent(message)}`;
}
