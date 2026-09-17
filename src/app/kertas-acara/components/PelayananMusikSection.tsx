import CollapsibleSection, { renderListItem } from "./CollapsibleSection";
import { ParticipantItem } from "../types";

interface PelayananMusikSectionProps {
  pelayananData: ParticipantItem[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function PelayananMusikSection({
  pelayananData,
  isExpanded,
  onToggle,
}: PelayananMusikSectionProps) {
  return (
    <CollapsibleSection
      title="Pelayanan Musik"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      {pelayananData.map((item, idx) =>
        renderListItem({
          key: String(idx),
          label: item.role,
          value: item.person,
        }),
      )}
    </CollapsibleSection>
  );
}
