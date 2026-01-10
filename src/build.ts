import * as fs from "node:fs/promises";
import * as path from "node:path";
import { format, isSameDay, startOfToday } from "date-fns";
import { type Concert, fetchHtml, parseConcerts } from "./scraper.js";

const ensureDir = async (dir: string) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

const BAR_ICONS: Record<string, string> = {
  "Nokia Arena":
    "https://nokiaarena.fi/wp-content/uploads/2023/02/cropped-favicon-192x192.png",
  "TTT-Klubi": "https://ttt-teatteri.fi/favicon.svg",
  "G Livelab Tampere":
    "https://glivelab.fi/wp-content/themes/glivelab/favicons/favicon.ico",
  "Vastavirta-klubi":
    "https://vastavirta.net/wp-content/uploads/vv-favicon.png",
  "Tavara-asema":
    "https://tavara-asema.fi/wp-content/themes/tavara-asema/img/favicon.png?v=2",
  Olympia:
    "https://olympiakortteli.fi/wp-content/uploads/2020/06/cropped-olymia-favico-192x192.png",
  "Tampere-talo":
    "https://www.tampere-talo.fi/wp-content/uploads/2022/05/cropped-TampereTalo_Favicon_512x512.png",
  "Ravintola Telakka":
    "https://www.telakka.eu/wp-content/uploads/2017/01/cropped-logo512x512-192x192.gif",
  "Bar Kotelo": "https://barkotelo.fi/gallery/Kotelo_neg.jpg?ts=1767886429", // Source: https://barkotelo.fi
  "Kangasala-talo":
    "https://kangasala-talo.fi/wp-content/themes/kangasalatalo/images/logo-kangasala-talo.png", // Source: https://www.kangasalatalo.fi/
  "Museo Milavida":
    "https://www.museomilavida.fi/uploads/sites/82/2023/09/023b090d-m_site_logo_512x512.jpg", // Source: https://www.museomilavida.fi/
  Pethaus:
    "https://www.pethaus.fi/wp-content/uploads/2024/04/cropped-pethaus-logo-180x180.jpg", // Source: https://www.pethaus.fi/
  "Pub Kujakolli":
    "https://kujakolli.fi/wordpress/wp-content/uploads/2019/03/logo.png", // Source: https://kujakolli.fi/
  "Tahmelan huvila":
    "https://www.tahmelanhuvila.fi/wp-content/uploads/2022/06/huvila_vaaka_punainen_testi3105.png.webp", // Source: https://www.tahmelanhuvila.fi/
  "Katubaari Axu":
    "https://www.katubaariaxu.fi/.cm4all/uproc.php/0/.Tampereen%20ratikka.PNG/picture-1200?_=187147e0198", // Source: https://www.katubaariaxu.fi/
  "Kulttuurikeskus Maanalainen":
    "https://maanalainen.net/wp-content/uploads/2023/06/Maanalainen_logo_orig2-ILMAN-TAUSTAA-non-interlaced.png", // Source: https://maanalainen.net
};

export const formatGigs = (concerts: Concert[]): string => {
  if (concerts.length === 0) {
    return '<div style="text-align:center; padding: 20px; color: #b3b3b3;">No upcoming gigs found.</div>';
  }

  let html = "";
  let lastDate: Date | null = null;

  for (const gig of concerts) {
    // Check if new date group
    if (!lastDate || !isSameDay(lastDate, gig.date)) {
      const dateStr = format(gig.date, "EEEE, d MMM");
      html += `<div class="date-header">${dateStr}</div>`;
      lastDate = gig.date;
    }

    const iconUrl =
      BAR_ICONS[gig.venue] ||
      `https://placehold.co/50?text=${gig.venue[0].toUpperCase()}`;

    const cardContent = `
        <div class="gig-card">
            <img src="${iconUrl}" class="gig-icon" alt="${gig.venue}" />
            <div class="time">${gig.time || ""}</div>
            <div class="details">
                <div class="artist">${gig.artist}</div>
                <div class="venue">${gig.venue}</div>
            </div>
        </div>
        `;

    if (gig.venueUrl) {
      html += `<a href="${gig.venueUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-decoration: none; color: inherit;">${cardContent}</a>`;
    } else {
      html += cardContent;
    }
  }

  return html;
};

export const build = async () => {
  console.log("Fetching data...");
  const html = await fetchHtml();

  console.log("Parsing concerts...");
  console.log("Parsing concerts...");
  const allConcerts = parseConcerts(html);

  // Filter out past concerts
  const today = startOfToday();
  const concerts = allConcerts.filter((c) => c.date >= today); // Keep today's gigs

  // Log all unique venues for icons check
  const allVenues = new Set(allConcerts.map((c) => c.venue));
  console.log("--- ALL VENUES FOUND ---");
  [...allVenues].sort().forEach((v) => {
    console.log(v);
  });
  console.log("------------------------");

  console.log(
    `Found ${allConcerts.length} total concerts, ${concerts.length} upcoming.`,
  );

  console.log("Generating HTML...");
  const gigsHtml = formatGigs(concerts);

  const template = await fs.readFile(
    path.join(process.cwd(), "src", "template.html"),
    "utf-8",
  );
  const finalHtml = template
    .replace("{{CONTENT}}", gigsHtml)
    .replace("{{UPDATED_AT}}", new Date().toLocaleString());

  await ensureDir(path.join(process.cwd(), "public"));
  await fs.writeFile(
    path.join(process.cwd(), "public", "index.html"),
    finalHtml,
  );

  console.log("Build complete: public/index.html");
};

// Only run build if file is being executed directly
// ESM alternative to require.main === module
import { fileURLToPath } from "node:url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build().catch((err) => {
    console.error("Build failed:", err);
    process.exit(1);
  });
}
