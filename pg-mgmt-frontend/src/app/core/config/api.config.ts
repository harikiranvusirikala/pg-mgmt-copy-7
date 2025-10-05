import { environment } from '../../../environments/environment';

const normalizeBaseUrl = (url: string | undefined): string => {
  if (!url) {
    return '';
  }

  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const base = normalizeBaseUrl(environment.apiBaseUrl);

export const ApiConfig = {
  base,
  tenants: `${base}/api/tenants`,
  rooms: `${base}/api/rooms`,
  dashboard: `${base}/api/admin/dashboard`,
  authTenant: `${base}/auth/google`,
  authAdmin: `${base}/auth/admin/google`,
};
