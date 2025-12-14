import * as fs from "node:fs/promises";
import * as path from "node:path";
import { format, isSameDay } from "date-fns";
import { type Concert, fetchHtml, parseConcerts } from "./scraper.js";

const ensureDir = async (dir: string) => {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
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

        const cardContent = `
        <div class="gig-card">
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
    const concerts = parseConcerts(html);
    console.log(`Found ${concerts.length} concerts.`);

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
import { fileURLToPath } from 'node:url';
if (import.meta.url === `file://${process.argv[1]}`) {
    build().catch(err => {
        console.error('Build failed:', err);
        process.exit(1);
    });
}
