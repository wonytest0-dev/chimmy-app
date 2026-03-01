const { createCanvas, loadImage } = require("canvas");

const MAX_HEIGHT = 1700;
const ROW = 90;
const WATERMARK = "@jiminbloom13";

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

          const line = `${entry.country.toUpperCase()}  #${entry.rank}`;

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
