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
    // Zero margins so the exported content is as tight as Google allows; any
    // residual whitespace is trimmed client-side by an exact pixel crop.
    top_margin: "0",
    bottom_margin: "0",
    left_margin: "0",
    right_margin: "0",
  });

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?${params.toString()}`;
}
