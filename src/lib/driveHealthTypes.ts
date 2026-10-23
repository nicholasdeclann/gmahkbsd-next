export type DriveHealthCode = "connected" | "demo" | "not_configured" | "not_connected" | "authorization_expired" | "client_invalid" | "access_denied" | "folder_unavailable" | "temporary_failure";
export interface DriveHealth {
  code: DriveHealthCode; source: "shared" | "browser"; configured: boolean;
  message: string; checkedAt: string; lastSuccessfulCheck: string | null;
  browserExpiresAt: number | null; refreshTokenExpiresAt: number | null;
}
export function driveFailureCode(error: unknown): DriveHealthCode {
  const value = error as {response?:{status?:number;data?:{error?:string|{status?:string}}};code?:number|string};
  const detail = value?.response?.data?.error;
  if(detail === "invalid_grant") return "authorization_expired";
  if(detail === "invalid_client" || detail === "unauthorized_client") return "client_invalid";
  const status = value?.response?.status ?? value?.code;
  if(status === 401) return "authorization_expired";
  if(status === 403) return "access_denied";
  if(status === 404) return "folder_unavailable";
  return "temporary_failure";
}
export const driveHealthMessages: Record<DriveHealthCode,string> = {
  connected:"Koneksi Google Drive tersedia. Akses folder berhasil diperiksa.",
  demo:"Mode latihan lokal. Koneksi Google tidak digunakan.",
  not_configured:"Konfigurasi Google Drive belum lengkap.",
  not_connected:"Belum ada koneksi Google pada browser ini, atau cookie koneksi sudah berakhir.",
  authorization_expired:"Google menolak otorisasi. Token mungkin kedaluwarsa, dicabut, atau tidak lagi valid.",
  client_invalid:"Google menolak identitas aplikasi. Client ID atau client secret perlu diperiksa.",
  access_denied:"Akun Google tidak memiliki izin yang diperlukan untuk mengakses folder.",
  folder_unavailable:"Folder Google Drive tidak ditemukan atau tidak dapat diakses oleh akun ini.",
  temporary_failure:"Google belum dapat dihubungi atau pemeriksaan mengalami gangguan sementara. Coba periksa kembali.",
};
