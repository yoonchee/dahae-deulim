// ---------------------------------------------------------------------------
// Google Form wiring. Replace the two placeholders below — see README.
//
// FORM_ID   the long id in the form's live URL:
//           https://docs.google.com/forms/d/e/<FORM_ID>/viewform
// FIELDS    each question's entry id, read off the form's prefill link.
//
// The ROLE_ANSWER / JOB_ANSWER values must match the Google Form's option
// labels character for character, or Google silently drops the answer.
// ---------------------------------------------------------------------------
const FORM_ID = "1FAIpQLSdt9HuWipBs81DxcwTbReMPe8lClawTvzUSwgcnvxJGSeahbw";

const FIELDS = {
  name: "entry.1891375967",
  contact: "entry.1260938964",
  role: "entry.825097858",
  jobs: "entry.1482517810",
};

const ROLE_ANSWER = {
  child: "부모님을 위해 (자녀)",
  self: "나를 위해 (본인)",
};

const JOB_ANSWER = {
  taxi: "택시",
  order: "주문·가격확인",
  hospital: "병원 예약",
  train: "기차표",
  "scam-check": "사기 확인",
};

const PHONE = "010-3990-0935";

// --- analytics -------------------------------------------------------------

function track(path, title) {
  if (window.goatcounter && typeof window.goatcounter.count === "function") {
    window.goatcounter.count({ path, title, event: true });
  }
}

for (const link of document.querySelectorAll('a[href^="tel:"]')) {
  link.addEventListener("click", () => track("phone-cta", "전화 걸기 클릭"));
}

// --- form ------------------------------------------------------------------

const form = document.getElementById("form");
const msg = document.getElementById("msg");

function fail(text) {
  msg.className = "error";
  msg.textContent = text;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  msg.className = "";
  msg.textContent = "";

  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const contact = String(data.get("contact") || "").trim();
  const role = String(data.get("role") || "");
  const jobs = data.getAll("jobs").map(String);

  // The Node server used to enforce these. Nothing is server-side any more,
  // so they run here; the messages are what the visitor sees.
  if (name.length < 1 || name.length > 40) return fail("이름을 입력해 주세요.");
  if (contact.length < 8 || contact.length > 80) {
    return fail("전화번호 또는 이메일을 입력해 주세요.");
  }
  if (!ROLE_ANSWER[role]) return fail("부탁 대상을 선택해 주세요.");
  if (jobs.length < 1) return fail("필요한 도움을 하나 이상 골라 주세요.");

  const body = new URLSearchParams();
  body.append(FIELDS.name, name);
  body.append(FIELDS.contact, contact);
  body.append(FIELDS.role, ROLE_ANSWER[role]);
  for (const job of jobs) {
    if (JOB_ANSWER[job]) body.append(FIELDS.jobs, JOB_ANSWER[job]);
  }

  const button = form.querySelector("button");
  button.disabled = true;
  try {
    // no-cors is forced here: Google does not send CORS headers on
    // formResponse. The upshot is that the response is opaque — a submission
    // that Google rejects looks exactly like one it accepts. So the success
    // message below always offers the phone number as a way through.
    await fetch(`https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    track("signup", "부탁 접수");
    msg.className = "ok";
    msg.textContent =
      `접수했습니다. 곧 이 연락처로 전화드리겠습니다. 급하시면 ${PHONE}로 바로 걸어 주세요.`;
    form.reset();
  } catch {
    fail(`지금은 접수가 되지 않습니다. ${PHONE}로 전화 주시면 바로 도와드리겠습니다.`);
  } finally {
    button.disabled = false;
  }
});
