/* eldjay1337 bio — live Discord presence via Lanyard (https://lanyard.rest) */

const DISCORD_ID = "1426335709333291048";

const STATUS_LABELS = {
  online: "online",
  idle: "idle",
  dnd: "do not disturb",
  offline: "offline",
};

/* ---------- presence ---------- */

function setStatus(status) {
  const dot = document.getElementById("status-dot");
  dot.className = "status-dot " + (STATUS_LABELS[status] ? status : "offline");
  document.getElementById("presence-text").textContent =
    STATUS_LABELS[status] || "offline";
}

function avatarUrl(user) {
  const ext = user.avatar && user.avatar.startsWith("a_") ? "gif" : "png";
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(user.id) >> 22n) % 6}.png`;
}

function renderActivity(d) {
  const box = document.getElementById("activity");
  const img = document.getElementById("activity-img");
  const label = document.getElementById("activity-label");
  const title = document.getElementById("activity-title");
  const sub = document.getElementById("activity-sub");

  // Spotify first — it has cover art
  if (d.listening_to_spotify && d.spotify) {
    box.classList.remove("hidden");
    img.classList.remove("hidden");
    img.src = d.spotify.album_art_url;
    label.textContent = "listening to spotify";
    title.textContent = d.spotify.song;
    sub.textContent = "by " + d.spotify.artist;
    return;
  }

  // then any game / other activity (skip custom status, type 4)
  const act = (d.activities || []).find((a) => a.type !== 4);
  if (act) {
    box.classList.remove("hidden");
    label.textContent = act.type === 0 ? "playing" : act.name;
    title.textContent = act.name;
    sub.textContent = [act.details, act.state].filter(Boolean).join(" — ");

    const appId = act.application_id;
    const asset = act.assets && (act.assets.large_image || act.assets.small_image);
    if (appId && asset && !asset.startsWith("mp:")) {
      img.classList.remove("hidden");
      img.src = `https://cdn.discordapp.com/app-assets/${appId}/${asset}.png`;
    } else {
      img.classList.add("hidden");
    }
    return;
  }

  box.classList.add("hidden");
}

function render(d) {
  if (d.discord_user) {
    document.getElementById("avatar").src = avatarUrl(d.discord_user);
    const name = d.discord_user.global_name || d.discord_user.username;
    if (name) document.querySelector(".name").textContent = name;
  }
  setStatus(d.discord_status);
  renderActivity(d);
}

/* ---------- lanyard websocket ---------- */

function connect() {
  let ws;
  try {
    ws = new WebSocket("wss://api.lanyard.rest/socket");
  } catch {
    document.getElementById("presence-text").textContent = "discord status unavailable";
    return;
  }

  let heartbeat = null;

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.op === 1) {
      // hello — subscribe and start heartbeat
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
      heartbeat = setInterval(
        () => ws.readyState === 1 && ws.send(JSON.stringify({ op: 3 })),
        msg.d.heartbeat_interval
      );
    } else if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
      render(msg.d);
    }
  };

  ws.onclose = () => {
    clearInterval(heartbeat);
    // not monitored yet or network drop — retry quietly
    setTimeout(connect, 10000);
  };

  ws.onerror = () => ws.close();
}

connect();

/* if lanyard never answers (user not monitored), stop showing "connecting…" */
setTimeout(() => {
  const el = document.getElementById("presence-text");
  if (el.textContent === "connecting to discord…") el.textContent = "";
}, 5000);

/* ---------- subtle card tilt ---------- */

const card = document.getElementById("card");

document.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * 2;
  card.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${y * -5}deg)`;
});

document.addEventListener("mouseleave", () => {
  card.style.transform = "";
});
