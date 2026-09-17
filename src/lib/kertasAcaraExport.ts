interface ExportConfig {
  sheetId: string;
  gid: string;
  range: string;
}

/**
 * Build Google Sheets' native PDF-export URL for a specific range of a public
 * spreadsheet. The parameters mirror the options in File → Download → PDF and
 * preserve the sheet's exact formatting (merged cells, colors, images).
 */
export function buildSheetExportUrl({
  sheetId,
  gid,
  range,
}: ExportConfig): string {
  const params = new URLSearchParams({
    format: "pdf",
    gid,
    range,
    portrait: "false", // landscape
    fitw: "true", // fit to page width
    gridlines: "false",
    printtitle: "false",
    sheetnames: "false",
    pagenumbers: "false",
    scale: "2", // "Fit to width"
    top_margin: "0.25",
    bottom_margin: "0.25",
    left_margin: "0.25",
    right_margin: "0.25",
  });

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?${params.toString()}`;
}
