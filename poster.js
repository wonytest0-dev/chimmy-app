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

async function renderPoster(globalData, countryData, cityData) {

  const totalRows = globalData.length + countryData.length + cityData.length + 10;
  const baseHeight = 700;
  const height = Math.min(baseHeight + totalRows * ROW, MAX_HEIGHT);

  const W = 1080;
  const canvas = createCanvas(W, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#E6E9EE";
  ctx.fillRect(0, 0, W, height);

  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 60, 80, 960, height - 140, 40);
  ctx.fill();

  const bannerY = 140;
  const gradient = ctx.createLinearGradient(0, bannerY, 0, bannerY + 280);
  gradient.addColorStop(0, "#F9E27D");
  gradient.addColorStop(1, "#F4C430");

  ctx.fillStyle = gradient;
  roundRect(ctx, 100, bannerY, 880, 280, 35);
  ctx.fill();

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

  function drawSection(title, data) {
    if (!data.length) return;

    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText(title, 150, y);
    y += ROW;

    data.forEach(item => {

      if (item.rank === 1) {
        ctx.fillStyle = "#FFE066";
        roundRect(ctx, 120, y - 50, 840, 70, 20);
        ctx.fill();
      }

      ctx.fillStyle = "#000";
      ctx.font = "bold 32px Arial";

      const text =
        item.rank === 1
          ? `#1 🏆 ${item.title} ${item.prefix || ""}`
          : `#${item.rank} ${item.title} ${item.prefix || ""}`;

      ctx.fillText(text, 150, y);

      ctx.font = "26px Arial";

      if (item.change === "NEW") {
        ctx.fillStyle = "#FF8A00";
        ctx.fillText("NEW", 880, y);
      } else if (item.change.startsWith("+")) {
        ctx.fillStyle = "#1DB954";
        ctx.fillText("▲ " + item.change.replace("+",""), 880, y);
      } else if (item.change.startsWith("-")) {
        ctx.fillStyle = "#D62828";
        ctx.fillText("▼ " + item.change.replace("-",""), 880, y);
      } else {
        ctx.fillStyle = "#666";
        ctx.fillText("=", 920, y);
      }

      y += ROW;
    });

    y += ROW;
  }

  drawSection("🌍 GLOBAL", globalData);
  drawSection("🌎 COUNTRIES", countryData);
  drawSection("🏙 CITY", cityData);

  ctx.globalAlpha = 0.15;
  ctx.font = "bold 120px Arial";
  ctx.textAlign = "center";
  ctx.fillText(WATERMARK, W / 2, height / 2);
  ctx.globalAlpha = 1;

  return canvas.toBuffer("image/png");
}

module.exports = { renderPoster };
