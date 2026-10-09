import assert from "node:assert/strict";
import { before, test } from "node:test";

const baseUrl = `http://127.0.0.1:3000`;
let superAdminToken;
let tenantAdminToken;

async function waitForServer() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // server starting up
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Server did not become healthy within 15 seconds");
}

before(async () => {
  await waitForServer();

  // 1. Authenticate as Super Admin (admin@eduos.com)
  const superRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@eduos.com", password: "admin123" })
  });
  assert.equal(superRes.status, 200, "Super admin login failed");
  const superBody = await superRes.json();
  superAdminToken = superBody.token;

  // 2. Authenticate as School Admin for ten-jide (jide@eduos)
  const tenantRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "jide@eduos", password: "jide@eduos" })
  });
  assert.equal(tenantRes.status, 200, "Tenant admin login failed");
  const tenantBody = await tenantRes.json();
  tenantAdminToken = tenantBody.token;
});

// POSITIVE TESTS
test("POSITIVE: Super Admin can view all platform tenants", async () => {
  const res = await fetch(`${baseUrl}/api/tenants`, {
    headers: { Authorization: `Bearer ${superAdminToken}` }
  });
  assert.equal(res.status, 200);
  const tenants = await res.json();
  assert(Array.isArray(tenants), "Tenants should be an array");
  assert(tenants.length >= 2, "Super admin should see multiple tenants");
});

test("POSITIVE: School Admin sees ONLY their own school in tenant list", async () => {
  const res = await fetch(`${baseUrl}/api/tenants`, {
    headers: { Authorization: `Bearer ${tenantAdminToken}` }
  });
  assert.equal(res.status, 200);
  const tenants = await res.json();
  assert(Array.isArray(tenants), "Tenants should be an array");
  assert.equal(tenants.length, 1, "Tenant admin must only see their 1 school");
  assert.equal(tenants[0].id, "ten-jide", "Tenant must be ten-jide");
});

test("POSITIVE: Public school live link endpoint resolves tenant jide directly", async () => {
  const res = await fetch(`${baseUrl}/api/public/tenants/jide`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.subdomain, "jide");
  assert.equal(data.id, "ten-jide");
});

test("POSITIVE: School Admin can view users strictly within their own tenant", async () => {
  const res = await fetch(`${baseUrl}/api/user-management/users`, {
    headers: { Authorization: `Bearer ${tenantAdminToken}` }
  });
  assert.equal(res.status, 200);
  const users = await res.json();
  assert(Array.isArray(users));
  // Every user must belong to ten-jide and not be super admin
  for (const u of users) {
    assert.equal(u.tenantId, "ten-jide", `User ${u.id} belongs to another tenant`);
  }
});

// NEGATIVE TESTS (Privilege separation & Security guards)
test("NEGATIVE: School Admin CANNOT access another tenant profile directly", async () => {
  const res = await fetch(`${baseUrl}/api/tenants/default`, {
    headers: { Authorization: `Bearer ${tenantAdminToken}` }
  });
  assert.equal(res.status, 403, "Should be forbidden from accessing default tenant");
});

test("NEGATIVE: School Admin CANNOT create a new tenant instance", async () => {
  const res = await fetch(`${baseUrl}/api/tenants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tenantAdminToken}`
    },
    body: JSON.stringify({
      name: "Rogue School",
      subdomain: "rogue",
      adminName: "Rogue Admin",
      adminEmail: "rogue@admin.com",
      adminPassword: "password123"
    })
  });
  assert.equal(res.status, 403, "Tenant admin must not be able to provision new tenants");
});

test("NEGATIVE: School Admin CANNOT delete tenants", async () => {
  const res = await fetch(`${baseUrl}/api/tenants/ten-cxwcub5`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tenantAdminToken}` }
  });
  assert.equal(res.status, 403, "Tenant admin must not be able to delete other tenants");
});

test("NEGATIVE: School Admin CANNOT execute bulk operations on tenants", async () => {
  const res = await fetch(`${baseUrl}/api/tenants/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tenantAdminToken}`
    },
    body: JSON.stringify({
      ids: ["default", "ten-cxwcub5"],
      action: "suspend"
    })
  });
  assert.equal(res.status, 403, "Tenant admin must not execute bulk operations");
});

test("NEGATIVE: School Admin CANNOT impersonate another tenant", async () => {
  const res = await fetch(`${baseUrl}/api/tenants/default/impersonate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tenantAdminToken}` }
  });
  assert.equal(res.status, 403, "Tenant admin must not impersonate other schools");
});

test("NEGATIVE: School Admin CANNOT create a Super Admin account", async () => {
  const res = await fetch(`${baseUrl}/api/user-management/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tenantAdminToken}`
    },
    body: JSON.stringify({
      name: "Fake Super Admin",
      email: "fake-super@eduos.com",
      password: "password123",
      role: "SUPER_ADMIN",
      tenantId: "default"
    })
  });
  assert.equal(res.status, 403, "Tenant admin must not create Super Admin accounts");
});

test("NEGATIVE: School Admin CANNOT delete Super Admin accounts", async () => {
  const res = await fetch(`${baseUrl}/api/user-management/users/u-1`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tenantAdminToken}` }
  });
  assert.equal(res.status, 403, "Tenant admin must not delete super admin accounts");
});

test("NEGATIVE: School Admin CANNOT modify Super Admin profile", async () => {
  const res = await fetch(`${baseUrl}/api/user-management/users/u-1`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tenantAdminToken}`
    },
    body: JSON.stringify({ name: "Hacked Super Admin" })
  });
  assert.equal(res.status, 403, "Tenant admin must not edit super admin account");
});

test("POSITIVE: Direct browser live link host header (jide.eduos.com) resolves to tenant landing page", async () => {
  const res = await fetch(`${baseUrl}/api/public/tenants/jide`, {
    headers: { "x-forwarded-host": "jide.eduos.com" }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.subdomain, "jide");
  assert.equal(data.id, "ten-jide");
});

test("POSITIVE: Direct browser live link host header (jide.eduos-zf0v.onrender.com) resolves to tenant landing page", async () => {
  const res = await fetch(`${baseUrl}/api/public/tenants/jide`, {
    headers: { "x-forwarded-host": "jide.eduos-zf0v.onrender.com" }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.subdomain, "jide");
  assert.equal(data.id, "ten-jide");
});

