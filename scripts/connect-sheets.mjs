import { readFile, writeFile, rename } from "node:fs/promises";
import { createPrivateKey } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { google } from "googleapis";
import { churchConfig } from "../src/config/church.ts";

// Import a downloaded key without printing it, then check the exact workbook before saving config.
// This command never writes spreadsheet cells and leaves live writes disabled.
async function main() {
  const keyPath = process.argv[2];
  if (!keyPath || process.argv.length !== 3) {
    console.log('Usage: npm run connect:sheets -- "C:\\path\\to\\downloaded-key.json"');
    process.exitCode = 1;
    return;
  }
  let credentials;
  try {
    const raw = JSON.parse(await readFile(resolve(keyPath), "utf8"));
    if (raw.type !== "service_account" || typeof raw.client_email !== "string"
      || !/^[a-zA-Z0-9_-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(raw.client_email) || typeof raw.private_key !== "string"
      || typeof raw.project_id !== "string" || !/^[a-z0-9-]+$/.test(raw.project_id)) throw new Error();
    const privateKey = createPrivateKey(raw.private_key).export({ type: "pkcs8", format: "pem" }).toString();
    credentials = { type: raw.type, project_id: raw.project_id, client_email: raw.client_email, private_key: privateKey };
  } catch {
    console.error("Could not read a valid service-account JSON key. No configuration was changed.");
    process.exitCode = 1;
    return;
  }
  const root = fileURLToPath(new URL("../", import.meta.url));
  const envPath = resolve(root, ".env.development.local");
  let env;
  try { env = await readFile(envPath, "utf8"); }
  catch {
    console.error("Create .env.development.local with the local admin password and secret first.");
    process.exitCode = 1;
    return;
  }
  try {
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    const result = await google.sheets({ version: "v4", auth }).spreadsheets.get({
      spreadsheetId: churchConfig.sheets.liturgy.sheetId,
      fields: "spreadsheetId,properties(title),sheets(properties(sheetId,title))",
    }, { timeout: 20000 });
    const tabs = result.data.sheets ?? [];
    const expected = churchConfig.sheets.liturgy;
    if (!tabs.some(tab => String(tab.properties?.sheetId) === expected.kertasAcaraGid && tab.properties?.title === "Kertas Acara")
      || !tabs.some(tab => String(tab.properties?.sheetId) === expected.laguSionGid && tab.properties?.title === "Lagu Sion")) {
      console.error("The workbook tabs do not match the configured Kertas Acara and Lagu Sion sources. No configuration was changed.");
      process.exitCode = 1;
      return;
    }
    const values = {
      GOOGLE_SERVICE_ACCOUNT_JSON: `'${JSON.stringify(credentials)}'`,
      GOOGLE_SHEETS_LIVE_MODE: "true",
      GOOGLE_SHEETS_WRITES_ENABLED: "false",
    };
    for (const [key, value] of Object.entries(values)) {
      const pattern = new RegExp(`^${key}=.*$`, "m");
      env = pattern.test(env) ? env.replace(pattern, () => `${key}=${value}`) : `${env.trimEnd()}\n${key}=${value}\n`;
    }
    // Preserve other dashboard settings; keep prayer/photos in their existing mode.
    await writeFile(`${envPath}.tmp`, env, { mode: 0o600 });
    await rename(`${envPath}.tmp`, envPath);
    console.log(`Verified workbook: ${result.data.properties?.title}`);
    console.log(`Service account: ${credentials.client_email}`);
    console.log("Credentials saved only in ignored .env.development.local. No spreadsheet content was changed.");
    console.log("Restart the local server and open /admin/kertas-acara. Live saves remain disabled until verified.");
  } catch (error) {
    const status = error?.response?.status;
    console.error(`Google Sheets connection failed${typeof status === "number" ? ` (HTTP ${status})` : ""}. No configuration was changed.`);
    console.error("Check that the Sheets API is enabled in the key's project and the workbook is shared with the service account.");
    process.exitCode = 1;
  }
}

await main();
