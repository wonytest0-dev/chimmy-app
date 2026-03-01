const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const FormData = require("form-data");
const fs = require("fs");

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const WIDTH = 1080;
const MAX_HEIGHT = 1700;
const ROW_HEIGHT = 90;
const STORE_FILE = "rank_store.json";

const CITY_LIST = [
  "seoul","tokyo","new-york","los-angeles",
  "london","paris","bangkok","singapore","jakarta"
];

async function safeGet(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 15000
    });
    return data;
  } catch {
    return null;
  }
}

function loadStore() {
  if (!fs.existsSync(STORE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STORE_FILE));
}

function saveStore(data) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
}

function movement(oldRank, newRank) {
  if (!oldRank) return "NEW";
  if (newRank < oldRank) return `+${oldRank - newRank}`;
  if (newRank > oldRank) return `-${newRank - newRank}`;
  return "=";
}

async function getCountries() {
  const data = await safeGet(
    "https://rss.applemarketingtools.com/api/v2/storefronts.json"
  );
  if (!data?.storefronts) return ["us"];
  return data.storefronts.map(s => s.code);
}

async function getAppleMusicChart(country) {
  const data = await safeGet(
    `https://rss.applemarketingtools.com/api/v2/${country}/music/most-played/200/songs.json`
  );

  if (!data?.feed?.results) return [];

  return data.feed.results.map(song => ({
    name: song.name,
    artist: song.artistName,
    rank: song.rank
  }));
}

function filterJimin(list, prefix, store, newStore) {
  let result = [];

  list.forEach(song => {
    if (!song.artist.toLowerCase().includes("jimin")) return;

    const key = `${prefix}_${song.name}`;
    const move = movement(store[key], song.rank);

    newStore[key] = song.rank;

    result.push({
      title: song.name,
      rank: song.rank,
      move,
      prefix
    });
  });

  return result;
}

async function drawFlag(ctx, code, x, y) {
  try {
    const img = await loadImage(`https://flagcdn.com/w40/${code}.png`);
    ctx.drawImage(img, x, y, 48, 32);
  } catch {}
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, currentY);
  return currentY;
}

async function createPoster(allData) {
  const perPage = Math.floor((MAX_HEIGHT - 450) / ROW_HEIGHT);
  const totalPages = Math.ceil(allData.length / perPage);
  let pages = [];

  for (let page = 0; page < totalPages; page++) {

    const canvas = createCanvas(WIDTH, MAX_HEIGHT);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#f2f2f2";
    ctx.fillRect(0, 0, WIDTH, MAX_HEIGHT);

    ctx.fillStyle = "#f4c63d";
    ctx.fillRect(0, 0, WIDTH, 250);

    const chimmy = await loadImage("./chimmy.png");
    ctx.drawImage(chimmy, 60, 40, 180, 180);

    ctx.fillStyle = "#000";
    ctx.font = "bold 60px Arial";
    ctx.fillText("CHIMMY", 300, 110);

    ctx.font = "40px Arial";
    ctx.fillText("Apple Music Update", 300, 170);

    ctx.font = "28px Arial";
    ctx.fillText(new Date().toLocaleString(), 300, 210);

    let y = 320;
    const slice = allData.slice(page * perPage, (page + 1) * perPage);

    ctx.font = "36px Arial";

    for (let item of slice) {

      let label = `#${item.rank} ${item.title}`;

      if (item.rank === 1) {
        ctx.fillStyle = "#d4af37";
        label += " 🏆";
      } else {
        ctx.fillStyle = "#000";
      }

      y = wrapText(ctx, label, 120, y, WIDTH - 300, 38);

      ctx.fillStyle = "#666";
      ctx.fillText(item.move, WIDTH - 160, y - 10);

      if (item.prefix.length === 2) {
        await drawFlag(ctx, item.prefix.toLowerCase(), WIDTH - 230, y - 40);
      }

      y += ROW_HEIGHT;
    }

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#f39c12";
    ctx.font = "bold 120px Arial";
    ctx.fillText("@jiminbloom13", 200, MAX_HEIGHT / 2);

    pages.push(canvas.toBuffer("image/png"));
  }

  return pages;
}

async function send(buffer) {
  const form = new FormData();
  form.append("chat_id", CHAT_ID);
  form.append("photo", buffer, "chart.png");

  await axios.post(
    `https://api.telegram.org/bot${TOKEN}/sendPhoto`,
    form,
    { headers: form.getHeaders() }
  );
}

async function run() {
  if (!TOKEN || !CHAT_ID) return;

  const store = loadStore();
  const newStore = {};

  const countries = await getCountries();

  let allData = [];

  for (let c of countries) {
    const raw = await getAppleMusicChart(c);
    allData.push(...filterJimin(raw, c, store, newStore));
  }

  if (!allData.length) return;

  const pages = await createPoster(allData);

  for (let p of pages) {
    await send(p);
  }

  saveStore(newStore);
}

run();
