const axios = require("axios");
const fs = require("fs");
const { renderPoster } = require("./poster");
const { sendToTelegram } = require("./send");

const TARGET = "jimin";

const COUNTRIES = [
"us","ae","ag","ai","al","am","ao","ar","at","au","az",
"bb","bd","be","bf","bg","bh","bj","bm","bn","bo","br","bs","bt","bw",
"by","bz","ca","cg","ch","ci","cl","cm","cn","co","cr","cv","cy","cz",
"de","dk","dm","do","dz","ec","ee","eg","es","et",
"fi","fj","fm","fr","ga","gb","gd","gh","gm","gr","gt","gw",
"hk","hn","hr","hu","id","ie","il","in","iq","is","it",
"jm","jo","jp","ke","kg","kh","kn","kr","kw","ky","kz",
"la","lb","lc","lk","lr","lt","lu","lv","md","mg","mk","ml",
"mn","mo","mr","mt","mu","mw","mx","my","na","ne","ng","ni",
"nl","no","np","nz","om","pa","pe","pg","ph","pk",
"pl","pt","py","qa","ro","ru","rw","sa","sb","sc",
"se","sg","si","sk","sl","sn","sr","st","sv","sz",
"tc","td","th","tj","tm","tn","tr","tt","tw","tz",
"ua","ug","uy","uz","vc","ve","vg","vn","za","zm","zw"
];

const CITY_CANDIDATES = [
"seoul","tokyo","new-york","los-angeles","london",
"paris","bangkok","singapore","jakarta"
];

const STORE_FILE = "rank_store.json";
const SNAPSHOT_FILE = "chart_snapshot.json";

function loadJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function movement(oldRank, newRank) {
  if (!oldRank) return "NEW";
  if (newRank < oldRank) return `+${oldRank - newRank}`;
  if (newRank > oldRank) return `-${newRank - oldRank}`;
  return "=";
}

function flagEmoji(code) {
  return code.toUpperCase()
    .replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt()));
}

async function fetchRSS(url) {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch {
    return null;
  }
}

function normalizeEntries(rss) {
  if (!rss?.feed?.entry) return [];
  return Array.isArray(rss.feed.entry)
    ? rss.feed.entry
    : [rss.feed.entry];
}

async function run() {

  const isManual = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";

  const oldStore = loadJSON(STORE_FILE);
  const oldSnapshot = loadJSON(SNAPSHOT_FILE);

  let newStore = {};
  let globalData = [];
  let countryData = [];
  let cityData = [];
  let newTimestamp = null;

  // ======================
  // GLOBAL
  // ======================

  const globalRSS = await fetchRSS("https://itunes.apple.com/rss/topsongs/limit=100/json");

  const globalEntries = normalizeEntries(globalRSS);

  if (globalEntries.length > 0) {
    newTimestamp = globalRSS.feed.updated?.label || null;

    globalEntries.forEach((song, i) => {

      if (!song["im:artist"]) return;

      if (song["im:artist"].label.toLowerCase().includes(TARGET)) {

        const key = `global_${song["im:name"].label}`;
        const move = movement(oldStore[key], i + 1);

        newStore[key] = i + 1;

        globalData.push({
          rank: i + 1,
          title: song["im:name"].label,
          change: move
        });
      }
    });
  }

  // ======================
  // COUNTRIES
  // ======================

  for (const c of COUNTRIES) {

    const rss = await fetchRSS(`https://itunes.apple.com/${c}/rss/topsongs/limit=100/json`);
    const entries = normalizeEntries(rss);

    if (entries.length === 0) continue;

    entries.forEach((song, i) => {

      if (!song["im:artist"]) return;

      if (song["im:artist"].label.toLowerCase().includes(TARGET)) {

        const key = `${c}_${song["im:name"].label}`;
        const move = movement(oldStore[key], i + 1);

        newStore[key] = i + 1;

        countryData.push({
          rank: i + 1,
          title: song["im:name"].label,
          prefix: flagEmoji(c),
          change: move
        });
      }
    });
  }

  // ======================
  // CITY SCAN
  // ======================

  for (const city of CITY_CANDIDATES) {

    const rss = await fetchRSS(`https://itunes.apple.com/rss/topsongs/limit=100/${city}.json`);
    const entries = normalizeEntries(rss);

    if (entries.length === 0) continue;

    entries.forEach((song, i) => {

      if (!song["im:artist"]) return;

      if (song["im:artist"].label.toLowerCase().includes(TARGET)) {

        const key = `${city}_${song["im:name"].label}`;
        const move = movement(oldStore[key], i + 1);

        newStore[key] = i + 1;

        cityData.push({
          rank: i + 1,
          title: song["im:name"].label,
          prefix: city,
          change: move
        });
      }
    });
  }

  // ======================
  // STOP IF NO DATA
  // ======================

  if (!globalData.length && !countryData.length && !cityData.length) {
    console.log("No Jimin data found.");
    return;
  }

  // ======================
  // AUTO MODE TIMESTAMP CHECK
  // ======================

  if (!isManual && oldSnapshot.timestamp === newTimestamp) {
    console.log("Chart not updated yet.");
    return;
  }

  // ======================
  // SAVE STATE
  // ======================

  saveJSON(STORE_FILE, newStore);
  saveJSON(SNAPSHOT_FILE, { timestamp: newTimestamp });

  // ======================
  // RENDER POSTER
  // ======================

  const poster = await renderPoster(globalData, countryData, cityData);

// ======================
// RENDER POSTER
// ======================

const posters = await renderPoster(globalData, countryData, cityData);

// ======================
// SEND TELEGRAM
// ======================

for (const page of posters) {
  await sendToTelegram(
    process.env.TELEGRAM_TOKEN,
    process.env.TELEGRAM_CHAT_ID,
    page,
    "🍎 Apple Music Jimin Update"
  );
}

console.log("Sent successfully.");
}

run();
