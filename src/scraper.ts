import axios from "axios";
import * as cheerio from "cheerio";
import { addYears, isValid, parse } from "date-fns";

export interface Concert {
  date: Date;
  artist: string;
  venue: string;
  venueUrl?: string;
  url?: string;
  time?: string;
}

export interface VenueData {
  name: string;
  url?: string;
  content: string[];
}

const TARGET_URL = "https://kulttuuritoimitus.fi/konsertit-pirkanmaa/";

export const fetchHtml = async (): Promise<string> => {
  const { data } = await axios.get(TARGET_URL);
  return data;
};

export const parseDate = (
  dateStr: string,
  currentRefDate: Date = new Date(),
): Date | null => {
  // Format is usually "dd.MM."
  // We assume the date is in the current year.

  const currentYear = currentRefDate.getFullYear();
  let parsedDate = parse(`${dateStr}${currentYear}`, "d.M.yyyy", new Date());

  if (!isValid(parsedDate)) {
    return null;
  }

  // Logic to handle year rollover:
  // If we are currently in December (month 11) and the parsed date is in January (month 0),
  // assume the concert is next year.
  if (currentRefDate.getMonth() === 11 && parsedDate.getMonth() === 0) {
    parsedDate = addYears(parsedDate, 1);
  }

  return parsedDate;
};

export const parseConcerts = (html: string): Concert[] => {
  const $ = cheerio.load(html);
  const concerts: Concert[] = [];

  // Find the content div - usually in article or main content.
  // Based on previous read, headers are h3.
  const contentStart = $('h1:contains("Konsertit | Tampere")').first();

  if (contentStart.length === 0) {
    console.warn("Could not find main header");
    return [];
  }

  // Structure: h3 (Venue) -> p (Content with <br> separated lines)

  $("h3").each((_, el) => {
    const venueName = $(el).text().trim();

    // Check if this paragraph has the link (usually first p)
    // Format: "Missä? ... | Tapahtumakalenteriin <a href="...">täältä</a>."
    const link = $(el).nextUntil("h3", "p").find("a").first().attr("href");
    let currentVenueUrl = link;

    // Find all 'p' elements until the next 'h3'
    // This covers cases where there is a "Missä?" paragraph followed by gig paragraphs
    $(el)
      .nextUntil("h3", "p")
      .each((_, p) => {
        const text = $(p).html() || "";
        // Try to find a link in this paragraph if we don't have one yet
        if (!currentVenueUrl) {
          const foundLink = $(p).find("a").first().attr("href");
          if (foundLink) currentVenueUrl = foundLink;
        }

        // Split by <br> or newlines, case insensitive
        const lines = text.split(/<br\s*\/?>/gi);

        for (const line of lines) {
          const cleanLine = $(cheerio.load(line).root()).text().trim();
          if (!cleanLine) continue;

          const match = cleanLine.match(/^(\d{1,2}\.\d{1,2}\.)/);

          if (match) {
            const datePart = match[1];
            const artistPart = cleanLine.substring(datePart.length).trim();

            const date = parseDate(datePart);
            if (date) {
              concerts.push({
                date,
                artist: artistPart,
                venue: venueName,
                venueUrl: currentVenueUrl,
              });
            }
          }
        }
      });
  });

  // Sort by date
  return concerts.sort((a, b) => a.date.getTime() - b.date.getTime());
};
