import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3100";
const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? "admin@openads.local";
const adminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe123";
const demoEmail = "demo.user@openads.local";
const demoPassword = "DemoPass123";

const screenshotsDir = path.resolve("screenshots");

const jsonRequest = async (url, input = {}) => {
  const response = await fetch(url, {
    method: input.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(input.cookie ? { cookie: input.cookie } : {}),
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { response, payload };
};

const cookieFromResponse = (response) => {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const firstPart = setCookie.split(";")[0] ?? "";
  return firstPart;
};

const requireOk = (result, context) => {
  if (!result.response.ok) {
    const detail = result.payload && typeof result.payload === "object" ? JSON.stringify(result.payload) : "";
    throw new Error(`${context} failed: ${result.response.status} ${detail}`);
  }
};

const login = async (email, password) => {
  const result = await jsonRequest(`${baseUrl}/api/auth/login`, {
    method: "POST",
    body: { email, password },
  });
  requireOk(result, `login ${email}`);

  const cookie = cookieFromResponse(result.response);
  if (!cookie) {
    throw new Error(`missing session cookie after login for ${email}`);
  }

  return cookie;
};

const ensureDemoData = async () => {
  const adminCookie = await login(adminEmail, adminPassword);

  const registrationOpen = await jsonRequest(`${baseUrl}/api/admin/registration`, {
    method: "PUT",
    cookie: adminCookie,
    body: { isRegistrationOpen: true },
  });
  requireOk(registrationOpen, "enable registration");

  let demoCookie = "";
  const registerDemo = await jsonRequest(`${baseUrl}/api/auth/register`, {
    method: "POST",
    body: { email: demoEmail, password: demoPassword },
  });

  if (registerDemo.response.ok) {
    demoCookie = cookieFromResponse(registerDemo.response);
  } else {
    demoCookie = await login(demoEmail, demoPassword);
  }

  if (!demoCookie) {
    throw new Error("missing demo session cookie");
  }

  const createApp = async (name, bundleId) => {
    const result = await jsonRequest(`${baseUrl}/api/apps`, {
      method: "POST",
      cookie: demoCookie,
      body: { name, bundleId },
    });

    if (result.response.ok && result.payload?.app?.id) {
      return result.payload.app.id;
    }

    if (result.response.status !== 409) {
      throw new Error(`create app ${bundleId} failed`);
    }

    const list = await jsonRequest(`${baseUrl}/api/apps`, { cookie: demoCookie });
    requireOk(list, "list apps");
    const existing = list.payload?.apps?.find((app) => app.bundleId === bundleId);
    if (!existing?.id) {
      throw new Error(`app ${bundleId} not found after duplicate response`);
    }

    return existing.id;
  };

  const alphaId = await createApp("Alpha Rewards", "com.openads.alpha");
  await createApp("Beta Arcade", "com.openads.beta");

  const createAd = async (body) => {
    const result = await jsonRequest(`${baseUrl}/api/apps/${alphaId}/ads`, {
      method: "POST",
      cookie: demoCookie,
      body,
    });

    if (result.response.ok || result.response.status === 409) {
      return;
    }

    throw new Error(`create ad failed: ${result.response.status}`);
  };

  await createAd({
    title: "Alpha Video",
    mediaType: "VIDEO",
    mediaUrl: "https://cdn.example.com/alpha.mp4",
    clickUrl: "https://example.com/alpha",
    scope: "APP_ONLY",
    rewardSeconds: 15,
    priority: 10,
  });

  await createAd({
    title: "Global Image",
    mediaType: "IMAGE",
    mediaUrl: "https://cdn.example.com/global.png",
    clickUrl: "https://example.com/global",
    scope: "ALL_APPS",
    rewardSeconds: 30,
    priority: 5,
  });

  for (let i = 0; i < 6; i += 1) {
    await jsonRequest(`${baseUrl}/api/sdk/init`, {
      method: "POST",
      body: { bundleId: "com.openads.alpha", platform: "ios", appVersion: "1.0.0" },
    });
  }

  const sendEvent = async (eventType) => {
    const result = await jsonRequest(`${baseUrl}/api/sdk/event`, {
      method: "POST",
      body: { bundleId: "com.openads.alpha", eventType, platform: "ios" },
    });
    requireOk(result, `sdk event ${eventType}`);
  };

  await sendEvent("SHOWN");
  await sendEvent("SHOWN");
  await sendEvent("CANCELED");
  await sendEvent("REWARDED");
  await sendEvent("CLICKED");

  return { alphaBundleId: "com.openads.alpha" };
};

const capture = async () => {
  await mkdir(screenshotsDir, { recursive: true });

  const { alphaBundleId } = await ensureDemoData();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1512, height: 980 } });
  const page = await context.newPage();
  const errors = [];

  page.on("pageerror", (err) => {
    errors.push(`pageerror @ ${page.url()} :: ${err.message}`);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`console.error @ ${page.url()} :: ${msg.text()}`);
    }
  });

  const shot = async (file, fullPage = false) => {
    await page.screenshot({ path: path.join(screenshotsDir, file), fullPage });
  };

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await shot("01-landing.png");

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', demoEmail);
  await page.fill('input[name="password"]', demoPassword);
  await shot("02-login.png");

  await page.click('button[type="submit"]');
  await page.waitForURL(`${baseUrl}/dashboard`);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("03-dashboard.png");

  await page.click('button:has-text("Manage")');
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 230));
  await page.waitForTimeout(250);
  await shot("04-dashboard-with-ad.png");

  await page.fill('input[placeholder="Search by app, bundle, or owner"]', "alpha");
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("08-dashboard-stats.png");

  await page.click('button:has-text("Clear")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Sign out")');
  await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/login");

  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
  await shot("07-register-open.png", false);

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', adminEmail);
  await page.fill('input[name="password"]', adminPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${baseUrl}/dashboard`);
  await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  await shot("05-admin.png");

  await page.fill('input[placeholder="com.company.product"]', alphaBundleId);
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(400);
  await shot("06-admin-search.png");

  await context.close();
  await browser.close();

  if (errors.length > 0) {
    throw new Error(`Runtime errors found during capture:\n${errors.join("\n")}`);
  }
};

capture().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
