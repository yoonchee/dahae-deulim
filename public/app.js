fetch("/api/visit", { method: "POST" }).catch(() => {});

const form = document.getElementById("form");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  msg.className = "";
  msg.textContent = "";

  const data = new FormData(form);
  const jobs = data.getAll("jobs");
  const payload = {
    name: String(data.get("name") || ""),
    contact: String(data.get("contact") || ""),
    role: String(data.get("role") || ""),
    jobs,
  };

  const button = form.querySelector("button");
  button.disabled = true;
  try {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      msg.className = "error";
      msg.textContent = json.error || "부탁을 접수하지 못했습니다.";
      return;
    }
    msg.className = "ok";
    msg.textContent =
      "접수했습니다. 곧 이 연락처로 전화드리겠습니다. 급하시면 010-3990-0935로 바로 걸어 주세요.";
    form.reset();
  } catch {
    msg.className = "error";
    msg.textContent = "서버에 연결하지 못했습니다. npm start 후 다시 시도해 주세요.";
  } finally {
    button.disabled = false;
  }
});
