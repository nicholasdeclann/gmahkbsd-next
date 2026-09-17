import CollapsibleSection, { renderListItem } from "./CollapsibleSection";
import { formatLaguSion } from "../utils";
import { churchConfig } from "@/config/church";
import { LaguSionMap, ParticipantData } from "../types";

const { fixedHymns } = churchConfig.kertasAcara;

interface KhotbahSectionProps {
  khotbahData: ParticipantData;
  bacaanPersembahan: string;
  pembicara: string;
  ayatBersahutan: string;
  showSongs: boolean;
  laguBukaNum: string;
  laguTutupNum: string;
  laguSionMap: LaguSionMap;
  judulKhotbah: string;
  ayatInti: string;
  ayatBersahutanText: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function KhotbahSection({
  khotbahData,
  bacaanPersembahan,
  pembicara,
  ayatBersahutan,
  showSongs,
  laguBukaNum,
  laguTutupNum,
  laguSionMap,
  judulKhotbah,
  ayatInti,
  ayatBersahutanText,
  isExpanded,
  onToggle,
}: KhotbahSectionProps) {
  return (
    <CollapsibleSection title="Khotbah" isExpanded={isExpanded} onToggle={onToggle}>
      {showSongs &&
        renderListItem({
          key: "lagu-partisipan-khotbah",
          label: "Lagu Partisipan Khotbah",
          value: formatLaguSion(fixedHymns.laguPartisipanKhotbah, laguSionMap),
          isLagu: true,
        })}
      {showSongs &&
        renderListItem({
          key: "lagu-pembuka",
          label: "Lagu Pembuka",
          value: formatLaguSion(laguBukaNum, laguSionMap),
          isLagu: true,
        })}
      {khotbahData["doa syafaat"]?.person &&
        renderListItem({
          key: "doa-syafaat",
          label: "Doa Syafaat",
          value: khotbahData["doa syafaat"]?.person || "",
        })}
      {bacaanPersembahan &&
        renderListItem({
          key: "bacaan-persembahan",
          label: "Bacaan Persembahan",
          value: bacaanPersembahan,
        })}
      {showSongs &&
        renderListItem({
          key: "lagu-persembahan",
          label: "Lagu Persembahan",
          value: "Instrumental",
          isLagu: true,
        })}
      {showSongs &&
        renderListItem({
          key: "lagu-sambutan-1",
          label: "Lagu Sambutan",
          value: formatLaguSion(fixedHymns.laguSambutan1, laguSionMap),
          isLagu: true,
        })}
      {bacaanPersembahan &&
        renderListItem({
          key: "doa-persembahan",
          label: "Doa Persembahan",
          value: bacaanPersembahan,
        })}
      {(khotbahData["lagu pujian"]?.person ||
        khotbahData["lagu pujian 1"]?.person) &&
        renderListItem({
          key: "lagu-pujian-1",
          label: "Lagu Pujian",
          value:
            khotbahData["lagu pujian"]?.person ||
            khotbahData["lagu pujian 1"]?.person ||
            "",
        })}
      {khotbahData["cerita anak"]?.person &&
        renderListItem({
          key: "cerita-anak",
          label: "Cerita Anak",
          value: khotbahData["cerita anak"]?.person || "",
        })}
      {khotbahData["lagu pujian 2"]?.person &&
        renderListItem({
          key: "lagu-pujian-2",
          label: "Lagu Pujian",
          value: khotbahData["lagu pujian 2"]?.person || "",
        })}
      {ayatBersahutan &&
        renderListItem({
          key: "ayat-bersahutan",
          label: "Ayat Bersahutan",
          value: ayatBersahutan,
          middleValue: showSongs ? ayatBersahutanText : undefined,
        })}
      {ayatBersahutan &&
        renderListItem({
          key: "ayat-inti",
          label: "Ayat Inti",
          value: ayatBersahutan,
          middleValue: showSongs ? ayatInti : undefined,
        })}
      {showSongs &&
        renderListItem({
          key: "lagu-sambutan-khotbah",
          label: "Lagu Sambutan Khotbah",
          value: formatLaguSion(fixedHymns.laguSambutanKhotbah, laguSionMap),
          isLagu: true,
        })}
      {pembicara &&
        renderListItem({
          key: "doa-pendek",
          label: "Doa Pendek",
          value: pembicara,
        })}
      {(khotbahData["khotbah"]?.person || pembicara) &&
        renderListItem({
          key: "khotbah",
          label: "Khotbah",
          value: khotbahData["khotbah"]?.person || pembicara,
          middleValue: showSongs ? judulKhotbah : undefined,
        })}
      {showSongs &&
        renderListItem({
          key: "lagu-penutup",
          label: "Lagu Penutup",
          value: formatLaguSion(laguTutupNum, laguSionMap),
          isLagu: true,
        })}
      {pembicara &&
        renderListItem({
          key: "doa-penutup",
          label: "Doa Penutup",
          value: pembicara,
        })}
      {showSongs &&
        renderListItem({
          key: "lagu-sambutan-2",
          label: "Lagu Sambutan",
          value: formatLaguSion(fixedHymns.laguSambutan2, laguSionMap),
          isLagu: true,
        })}
    </CollapsibleSection>
  );
}
