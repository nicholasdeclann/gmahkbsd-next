export interface ParticipantItem {
  role: string;
  person: string;
  person2?: string;
}

export interface LaguSionMap {
  [key: string]: string;
}

export interface ParticipantData {
  [key: string]: ParticipantItem;
}

export interface RowCell {
  v?: string;
  f?: string;
}

export interface Row {
  c?: RowCell[];
}
