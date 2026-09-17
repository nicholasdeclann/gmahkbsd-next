import CollapsibleSection, { renderListItem } from "./CollapsibleSection";
import { formatLaguSion } from "../utils";
import { churchConfig } from "@/config/church";
import { LaguSionMap, ParticipantData } from "../types";

interface SekolahSabatSectionProps {
  ssData: ParticipantData;
  doronganItem?: { role?: string; person?: string };
  showSongs: boolean;
  laguBukaSSNum: string;
  laguTutupSSNum: string;
  laguSionMap: LaguSionMap;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function SekolahSabatSection({
  ssData,
  doronganItem,
  showSongs,
  laguBukaSSNum,
  laguTutupSSNum,
  laguSionMap,
  isExpanded,
  onToggle,
}: SekolahSabatSectionProps) {
  return (
    <CollapsibleSection
      title="Sekolah Sabat"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      {ssData["pemimpin"]?.person &&
        renderListItem({
          key: "sambutan-pemimpin",
          label: "Sambutan Pemimpin",
          value: ssData["pemimpin"]?.person || "",
        })}
      {showSongs &&
        renderListItem({
          key: "lagu-pembuka",
          label: "Lagu Pembuka",
          value: formatLaguSion(laguBukaSSNum, laguSionMap),
          isLagu: true,
        })}
      {ssData["ayat inti/doa buka ss"]?.person &&
        renderListItem({
          key: "ayat-inti-doa",
          label: "Ayat Inti & Doa Bertelut",
          value: ssData["ayat inti/doa buka ss"]?.person || "",
        })}
      {ssData["berita mission"]?.person &&
        renderListItem({
          key: "berita-mission",
          label: "Berita Mission",
          value: ssData["berita mission"]?.person || "",
        })}
      {ssData["kuis sekolah sabat"]?.person &&
        renderListItem({
          key: "kuis",
          label: "Kuis",
          value: ssData["kuis sekolah sabat"]?.person || "",
        })}
      {ssData["diskusi sekolah sabat"]?.person &&
        renderListItem({
          key: "diskusi",
          label: "Diskusi Pelajaran SS",
          value: ssData["diskusi sekolah sabat"]?.person || "",
        })}
      {ssData["lagu pujian"]?.person &&
        renderListItem({
          key: "lagu-pujian",
          label: "Lagu Pujian",
          value: ssData["lagu pujian"]?.person || "",
        })}
      {doronganItem?.person &&
        renderListItem({
          key: "dorongan",
          label: doronganItem.role || "Dorongan PP",
          value: doronganItem.person,
        })}
      {showSongs &&
        renderListItem({
          key: "lagu-penutup",
          label: "Lagu Penutup",
          value: formatLaguSion(laguTutupSSNum, laguSionMap),
          isLagu: true,
        })}
      {doronganItem?.person &&
        renderListItem({
          key: "doa-penutup",
          label: "Doa Penutup",
          value: doronganItem.person,
        })}
      {showSongs &&
        renderListItem({
          key: "pengumuman",
          label: "Pengumuman",
          value: churchConfig.kertasAcara.pengumumanRole,
        })}
    </CollapsibleSection>
  );
}
