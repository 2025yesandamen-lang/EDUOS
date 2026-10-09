// Central Authentication & Tenancy Utilities

export const SUPER_ADMIN_EMAILS = [
  "adebayosamuel015@gmail.com",
  "admin@eduos.com",
  "sasinnovationgroup@gmail.com"
];

export const RENDER_LIVE_HOST = "https://eduos-zf0v.onrender.com";

/**
 * Checks if a user is a platform-wide Super Admin.
 * School/tenant admins return false.
 */
export function isUserSuperAdmin(user: any): boolean {
  if (!user || user.role !== "ADMIN") return false;
  if (user.tenantId === "super-admin") return true;
  const email = (user.email || "").toLowerCase().trim();
  return SUPER_ADMIN_EMAILS.includes(email);
}

/**
 * Automatically detects tenant subdomain from the current browser location:
 * 1. Query parameter (?tenant=slug, ?school=slug, ?subdomain=slug, ?tenant_id=slug)
 * 2. URL path (/school/slug, /tenant/slug, /tenants/slug, or root-level /:slug)
 * 3. Hostname subdomain (e.g. jide.eduos.com, jide.eduos-zf0v.onrender.com, jide.localhost)
 */
export function detectSubdomainFromLocation(): string | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Check URL Query Parameters: ?tenant=jide or ?school=jide or ?subdomain=jide or ?tenant_id=jide
    const urlParams = new URLSearchParams(window.location.search);
    const querySubdomain = urlParams.get("tenant") || urlParams.get("school") || urlParams.get("subdomain") || urlParams.get("tenant_id");
    if (querySubdomain && querySubdomain.trim() && querySubdomain !== "default") {
      return querySubdomain.toLowerCase().trim();
    }

    // 2. Check URL Path: /school/:slug or /tenant/:slug or /tenants/:slug
    const path = window.location.pathname;
    if (path.startsWith("/school/") || path.startsWith("/tenant/") || path.startsWith("/tenants/")) {
      const parts = path.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[1] && parts[1] !== "default") {
        return parts[1].toLowerCase().trim();
      }
    }

    // 3. Check single-segment path: e.g. /jide or /ten-jide
    const singleParts = path.split("/").filter(Boolean);
    if (singleParts.length === 1) {
      const candidate = singleParts[0].toLowerCase().trim();
      const reservedPaths = [
        "api", "assets", "static", "login", "admin", "super-admin", "student", 
        "teacher", "parent", "cbt", "exam", "exams", "dashboard", "settings", 
        "health", "favicon.ico", "manifest.json", "index.html", "default"
      ];
      if (!reservedPaths.includes(candidate)) {
        return candidate;
      }
    }

    // 4. Check Hostname: e.g. jide.eduos.com, jide.eduos-zf0v.onrender.com, jide.localhost
    const hostname = window.location.hostname.toLowerCase();
    
    // Ignore direct IP addresses and standard root hostnames
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (!isIp && hostname !== "localhost" && hostname !== "127.0.0.1") {
      const parts = hostname.split(".");
      
      // Case A: Custom Domain *.eduos.com (e.g. jide.eduos.com)
      if (hostname.endsWith("eduos.com") && parts.length === 3 && parts[0] !== "www") {
        return parts[0].trim();
      }

      // Case B: Render wildcard/subdomain *.onrender.com (e.g. jide.eduos-zf0v.onrender.com)
      if (hostname.endsWith(".onrender.com") && parts.length === 4 && parts[0] !== "www") {
        return parts[0].trim();
      }

      // Case C: Local dev subdomain (e.g. jide.localhost)
      if (hostname.endsWith(".localhost") && parts.length === 2) {
        return parts[0].trim();
      }

      // Case D: Any other 3+ part domain where first part isn't www or root
      if (parts.length >= 3 && parts[0] !== "www" && parts[0] !== "app" && parts[0] !== "eduos-zf0v") {
        return parts[0].trim();
      }
    }
  } catch (err) {
    console.error("Error detecting tenant from location:", err);
  }

  return null;
}

/**
 * Returns structured live links for a given tenant subdomain.
 */
export function getSchoolLiveLinks(subdomain: string) {
  const cleanSubdomain = (subdomain || "").toLowerCase().trim();
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : RENDER_LIVE_HOST;
  
  // Prefer current origin if already on Render or custom host, else use RENDER_LIVE_HOST
  const baseLiveOrigin = currentOrigin.includes("onrender.com") ? currentOrigin : RENDER_LIVE_HOST;

  return {
    renderPathUrl: `${baseLiveOrigin}/school/${cleanSubdomain}`,
    renderDirectUrl: `${baseLiveOrigin}/${cleanSubdomain}`,
    renderQueryUrl: `${baseLiveOrigin}/?tenant=${cleanSubdomain}`,
    customDomainUrl: `https://${cleanSubdomain}.eduos.com`,
    localPathUrl: `${currentOrigin}/school/${cleanSubdomain}`
  };
}
