import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const DATA = path.join(__dirname, "data");
const WAITLIST = path.join(DATA, "waitlist.json");
const VISITS = path.join(DATA, "visits.json");
const PORT = Number(process.env.PORT) || 3456;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function ensureData() {
  fs.mkdirSync(DATA, { recursive: true });
  if (!fs.existsSync(WAITLIST)) fs.writeFileSync(WAITLIST, "[]\n");
  if (!fs.existsSync(VISITS)) fs.writeFileSync(VISITS, '{"count":0}\n');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), "application/json; charset=utf-8");
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath);
    send(res, 200, buf, MIME[ext] || "application/octet-stream");
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

const JOBS = new Set([
  "taxi",
  "order",
  "hospital",
  "train",
  "scam-check",
]);

function validateSignup(body) {
  const name = String(body.name || "").trim();
  const contact = String(body.contact || "").trim();
  const role = body.role === "self" ? "self" : body.role === "child" ? "child" : "";
  const jobs = Array.isArray(body.jobs)
    ? [...new Set(body.jobs.map(String).filter((j) => JOBS.has(j)))]
    : [];

  if (name.length < 1 || name.length > 40) return { error: "이름을 입력해 주세요." };
  if (contact.length < 8 || contact.length > 80) {
    return { error: "전화번호 또는 이메일을 입력해 주세요." };
  }
  if (!role) return { error: "부탁 대상을 선택해 주세요." };
  if (jobs.length < 1) return { error: "필요한 도움을 하나 이상 골라 주세요." };

  return {
    signup: {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      name,
      contact,
      role,
      jobs,
    },
  };
}

ensureData();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/api/visit") {
    const visits = readJson(VISITS);
    visits.count = Number(visits.count || 0) + 1;
    writeJson(VISITS, visits);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/waitlist") {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      return sendJson(res, 400, { error: "요청을 읽지 못했습니다." });
    }
    const result = validateSignup(body);
    if (result.error) return sendJson(res, 400, { error: result.error });
    const list = readJson(WAITLIST);
    list.push(result.signup);
    writeJson(WAITLIST, list);
    return sendJson(res, 201, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/stats") {
    const list = readJson(WAITLIST);
    const visits = readJson(VISITS);
    const byRole = { child: 0, self: 0 };
    const byJob = {};
    for (const row of list) {
      byRole[row.role] = (byRole[row.role] || 0) + 1;
      for (const job of row.jobs || []) {
        byJob[job] = (byJob[job] || 0) + 1;
      }
    }
    return sendJson(res, 200, {
      visits: Number(visits.count || 0),
      signups: list.length,
      conversion:
        visits.count > 0 ? Math.round((list.length / visits.count) * 1000) / 10 : 0,
      byRole,
      byJob,
      signupsDetail: list,
    });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method not allowed");
  }

  const file =
    url.pathname === "/"
      ? path.join(PUBLIC, "index.html")
      : path.join(PUBLIC, path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ""));

  if (!file.startsWith(PUBLIC)) {
    return send(res, 403, "Forbidden");
  }

  serveFile(res, file);
});

server.listen(PORT, () => {
  console.log(`다해드림 waitlist → http://localhost:${PORT}`);
});
