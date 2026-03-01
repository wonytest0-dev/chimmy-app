const { createCanvas, loadImage } = require("canvas");

const MAX_HEIGHT = 1700;
const ROW = 90;
const WATERMARK = "@jiminbloom13";
const COUNTRY_MAP = {
  ae: "United Arab Emirates",
  ag: "Antigua and Barbuda",
  ai: "Anguilla",
  al: "Albania",
  am: "Armenia",
  ao: "Angola",
  ar: "Argentina",
  at: "Austria",
  au: "Australia",
  az: "Azerbaijan",
  bb: "Barbados",
  be: "Belgium",
  bf: "Burkina Faso",
  bg: "Bulgaria",
  bh: "Bahrain",
  bj: "Benin",
  bm: "Bermuda",
  bn: "Brunei",
  bo: "Bolivia",
  br: "Brazil",
  bs: "Bahamas",
  bw: "Botswana",
  by: "Belarus",
  bz: "Belize",
  ca: "Canada",
  ch: "Switzerland",
  cl: "Chile",
  cn: "China",
  co: "Colombia",
  cr: "Costa Rica",
  cv: "Cape Verde",
  cy: "Cyprus",
  cz: "Czech Republic",
  de: "Germany",
  dk: "Denmark",
  dm: "Dominica",
  do: "Dominican Republic",
  dz: "Algeria",
  ec: "Ecuador",
  ee: "Estonia",
  eg: "Egypt",
  es: "Spain",
  fi: "Finland",
  fj: "Fiji",
  fm: "Micronesia",
  fr: "France",
  gb: "United Kingdom",
  gd: "Grenada",
  gh: "Ghana",
  gm: "Gambia",
  gr: "Greece",
  gt: "Guatemala",
  gw: "Guinea-Bissau",
  gy: "Guyana",
  hk: "Hong Kong",
  hn: "Honduras",
  hr: "Croatia",
  hu: "Hungary",
  id: "Indonesia",
  ie: "Ireland",
  il: "Israel",
  in: "India",
  is: "Iceland",
  it: "Italy",
  jm: "Jamaica",
  jo: "Jordan",
  jp: "Japan",
  ke: "Kenya",
  kg: "Kyrgyzstan",
  kh: "Cambodia",
  kn: "Saint Kitts and Nevis",
  kr: "South Korea",
  kw: "Kuwait",
  ky: "Cayman Islands",
  kz: "Kazakhstan",
  la: "Laos",
  lb: "Lebanon",
  lc: "Saint Lucia",
  lk: "Sri Lanka",
  lr: "Liberia",
  lt: "Lithuania",
  lu: "Luxembourg",
  lv: "Latvia",
  md: "Moldova",
  mg: "Madagascar",
  mk: "North Macedonia",
  ml: "Mali",
  mn: "Mongolia",
  mo: "Macau",
  mr: "Mauritania",
  ms: "Montserrat",
  mt: "Malta",
  mu: "Mauritius",
  mw: "Malawi",
  mx: "Mexico",
  my: "Malaysia",
  mz: "Mozambique",
  na: "Namibia",
  ne: "Niger",
  ng: "Nigeria",
  ni: "Nicaragua",
  nl: "Netherlands",
  no: "Norway",
  np: "Nepal",
  nz: "New Zealand",
  om: "Oman",
  pa: "Panama",
  pe: "Peru",
  pg: "Papua New Guinea",
  ph: "Philippines",
  pk: "Pakistan",
  pl: "Poland",
  pt: "Portugal",
  pw: "Palau",
  py: "Paraguay",
  qa: "Qatar",
  ro: "Romania",
  rs: "Serbia",
  ru: "Russia",
  sa: "Saudi Arabia",
  sb: "Solomon Islands",
  sc: "Seychelles",
  se: "Sweden",
  sg: "Singapore",
  si: "Slovenia",
  sk: "Slovakia",
  sl: "Sierra Leone",
  sn: "Senegal",
  sr: "Suriname",
  st: "Sao Tome and Principe",
  sv: "El Salvador",
  sz: "Eswatini",
  tc: "Turks and Caicos Islands",
  td: "Chad",
  th: "Thailand",
  tj: "Tajikistan",
  tm: "Turkmenistan",
  tn: "Tunisia",
  tr: "Turkey",
  tt: "Trinidad and Tobago",
  tw: "Taiwan",
  tz: "Tanzania",
  ua: "Ukraine",
  ug: "Uganda",
  us: "United States",
  uy: "Uruguay",
  uz: "Uzbekistan",
  vc: "Saint Vincent and the Grenadines",
  ve: "Venezuela",
  vg: "British Virgin Islands",
  vn: "Vietnam",
  za: "South Africa",
  zm: "Zambia",
  zw: "Zimbabwe"
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function nowDate() {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ========= WORD WRAP ========= */

function drawWrappedText(ctx, text, x, y, maxWidth) {
  const words = text.split(" ");
  let line = "";
  let lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  lines.forEach(l => {
    ctx.fillText(l.trim(), x, y);
    y += ROW;
  });

  return y;
}

/* ========= GROUP COUNTRY PER SONG ========= */

function groupBySong(data) {
  const grouped = {};
  data.forEach(item => {
    if (!grouped[item.title]) grouped[item.title] = [];
    grouped[item.title].push(item);
  });
  return grouped;
}

async function renderPoster(globalData, countryData, cityData) {

  const W = 1080;
  const pages = [];

  let canvas = createCanvas(W, MAX_HEIGHT);
  let ctx = canvas.getContext("2d");

  function drawBaseLayout() {

    ctx.fillStyle = "#E6E9EE";
    ctx.fillRect(0, 0, W, MAX_HEIGHT);

    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, 60, 80, 960, MAX_HEIGHT - 140, 40);
    ctx.fill();

    const bannerY = 140;
    const gradient = ctx.createLinearGradient(0, bannerY, 0, bannerY + 280);
    gradient.addColorStop(0, "#F9E27D");
    gradient.addColorStop(1, "#F4C430");

    ctx.fillStyle = gradient;
    roundRect(ctx, 100, bannerY, 880, 280, 35);
    ctx.fill();

    return bannerY;
  }

  let bannerY = drawBaseLayout();

  const chimmy = await loadImage("./chimmy.png");
  ctx.drawImage(chimmy, 130, bannerY + 30, 230, 230);

  ctx.fillStyle = "#000";
  ctx.font = "bold 60px Arial";
  ctx.fillText("CHIMMY", 420, bannerY + 110);

  ctx.font = "bold 38px Arial";
  ctx.fillText("Apple Music Update", 420, bannerY + 170);

  ctx.font = "26px Arial";
  ctx.fillText(nowDate(), 420, bannerY + 210);

  let y = bannerY + 350;

  function newPage() {
    pages.push(canvas.toBuffer("image/png"));
    canvas = createCanvas(W, MAX_HEIGHT);
    ctx = canvas.getContext("2d");
    bannerY = drawBaseLayout();
    y = bannerY + 350;
  }

  function checkOverflow() {
    if (y > MAX_HEIGHT - 150) {
      newPage();
    }
  }

  function drawSection(title, data, isCountry = false) {

    if (!data.length) return;

    checkOverflow();
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText(title, 150, y);
    y += ROW;

    if (isCountry) {

      const grouped = groupBySong(data);

      Object.keys(grouped).forEach(song => {

        checkOverflow();

        ctx.font = "bold 32px Arial";
        ctx.fillStyle = "#000";
        y = drawWrappedText(ctx, song.toUpperCase(), 150, y, 700);

        ctx.font = "26px Arial";

        grouped[song].forEach(entry => {

          checkOverflow();
const line = `${(entry.prefix || "").toUpperCase()}`

          ctx.fillStyle = "#000";
          ctx.fillText(line, 200, y);

          ctx.fillStyle = entry.change === "NEW"
            ? "#FF8A00"
            : entry.change.startsWith("+")
            ? "#1DB954"
            : entry.change.startsWith("-")
            ? "#D62828"
            : "#666";

          ctx.fillText(entry.change, 880, y);

          y += ROW;
        });

        y += ROW;
      });

    } else {

      data.forEach(item => {

        checkOverflow();

        ctx.fillStyle = "#000";
        ctx.font = "bold 32px Arial";

        const text =
          item.rank === 1
            ? `#1 🏆 ${item.title}`
            : `#${item.rank} ${item.title}`;

        y = drawWrappedText(ctx, text, 150, y, 700);

        ctx.font = "26px Arial";

        ctx.fillStyle =
          item.change === "NEW"
            ? "#FF8A00"
            : item.change.startsWith("+")
            ? "#1DB954"
            : item.change.startsWith("-")
            ? "#D62828"
            : "#666";

        ctx.fillText(item.change, 880, y - ROW);
      });

      y += ROW;
    }
  }

  drawSection("🌍 GLOBAL", globalData);
  drawSection("🌎 COUNTRIES", countryData, true);
  drawSection("🏙 CITY", cityData);

  ctx.globalAlpha = 0.15;
  ctx.font = "bold 120px Arial";
  ctx.textAlign = "center";
  ctx.fillText(WATERMARK, W / 2, MAX_HEIGHT / 2);
  ctx.globalAlpha = 1;

  pages.push(canvas.toBuffer("image/png"));

  return pages;
}

module.exports = { renderPoster };
