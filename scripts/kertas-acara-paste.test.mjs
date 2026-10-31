import test from "node:test";
import assert from "node:assert/strict";
import { parseKertasAcaraPaste } from "../src/lib/kertasAcaraPaste.ts";

const hymns = ["21", "68", "79", "186", "421"].map(number => ({ number, title: `Lagu ${number}` }));
const parse = text => parseKertasAcaraPaste(text, hymns);

test("fills all five fields from the standard format", () => {
  const { values, warnings, recognized } = parse(`Judul Khotbah : Kasih yang Menyelamatkan
Ayat Inti : Yohanes 3:16
Ayat Bersahutan : Mazmur 23
Lagu Buka : 21
Lagu Tutup : 421`);
  assert.deepEqual(values, { sermonTitle: "Kasih yang Menyelamatkan", mainVerse: "Yohanes 3:16", responsiveReading: "Mazmur 23", openingHymn: "21", closingHymn: "421" });
  assert.equal(recognized, 5);
  assert.deepEqual(warnings, []);
});

test("accepts aliases, case, spacing and dash separators", () => {
  const { values } = parse("  judul   khotbah - Harapan\nAYAT INTI:Roma 8:28\nLagu Pembuka : 68\nlagu penutup :79");
  assert.equal(values.sermonTitle, "Harapan");
  assert.equal(values.mainVerse, "Roma 8:28");
  assert.equal(values.openingHymn, "68");
  assert.equal(values.closingHymn, "79");
});

test("joins multi-line Ayat Bersahutan and handles WhatsApp bold", () => {
  const { values } = parse("*Judul Khotbah* : Iman\n*Ayat Bersahutan* : Mazmur 23:1-3\nMazmur 23:4-6\nLagu Buka : 21");
  assert.equal(values.sermonTitle, "Iman");
  assert.equal(values.responsiveReading, "Mazmur 23:1-3\nMazmur 23:4-6");
});

test("hymn variants and unknown hymns", () => {
  assert.equal(parse("Lagu Buka : LSEL 21").values.openingHymn, "21");
  assert.equal(parse("Lagu Buka : No. 68 - Judul").values.openingHymn, "68");
  assert.equal(parse("Lagu Tutup : 68 (Reff)").values.closingHymn, "68");
  const result = parse("Lagu Buka : 999\nJudul Khotbah : Iman");
  assert.equal(result.values.openingHymn, undefined);
  assert.equal(result.values.sermonTitle, "Iman");
  assert.match(result.warnings[0], /Lagu Buka.*999.*tidak ditemukan/);
});

test("empty labels and missing labels leave fields undefined", () => {
  const { values, recognized } = parse("Judul Khotbah :\nAyat Inti : Yohanes 3:16\nLagu Buka :\n");
  assert.deepEqual(values, { mainVerse: "Yohanes 3:16" });
  assert.equal(recognized, 1);
});

test("unrecognised text produces warnings", () => {
  const result = parse("Halo pak pendeta, ini khotbahnya ya");
  assert.equal(result.recognized, 0);
  assert.match(result.warnings[0], /Format tidak dikenali/);
  assert.match(parse("Judul Khotbah : Iman\nPembicara : Ps. Budi").warnings.join(" "), /1 baris tidak dikenali/);
});

test("cleans whitespace and capitalisation", () => {
  assert.equal(parse("Judul Khotbah :   KASIH   yang   MENYELAMATKAN ").values.sermonTitle, "Kasih yang Menyelamatkan");
  assert.equal(parse("Judul Khotbah : kasih dan pengharapan").values.sermonTitle, "Kasih dan Pengharapan");
  assert.equal(parse("Judul Khotbah : Hidup di GMAHK  Bersama").values.sermonTitle, "Hidup di GMAHK Bersama");
  assert.equal(parse("Ayat Inti : yohanes 3 : 16").values.mainVerse, "Yohanes 3:16");
  assert.equal(parse("Ayat Inti : 1 korintus 13:4 - 7").values.mainVerse, "1 Korintus 13:4-7");
  assert.equal(parse("Ayat Inti : Yohanes 3:16 ,  Roma 8:28").values.mainVerse, "Yohanes 3:16, Roma 8:28");
});
