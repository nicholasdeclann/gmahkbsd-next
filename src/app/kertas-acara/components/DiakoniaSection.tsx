import { renderListItem } from "./CollapsibleSection";
import CollapsibleSection from "./CollapsibleSection";
import { ParticipantItem } from "../types";

interface DiakoniaSectionProps {
  diakoniaData: ParticipantItem[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function DiakoniaSection({
  diakoniaData,
  isExpanded,
  onToggle,
}: DiakoniaSectionProps) {
  return (
    <CollapsibleSection
      title="Diakonia"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      {diakoniaData.map((item, idx) =>
        renderListItem({
          key: String(idx),
          label: item.role,
          value: item.person2 ? (
            <>
              {item.person}
              <br />
              {item.person2}
            </>
          ) : (
            item.person
          ),
        }),
      )}
    </CollapsibleSection>
  );
}
