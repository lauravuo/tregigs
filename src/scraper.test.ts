import { describe, expect, it } from "vitest";
import { parseConcerts, parseDate } from "./scraper";

describe("scraper", () => {
  describe("parseDate", () => {
    it("parses valid date in current year", () => {
      const now = new Date(2023, 10, 1); // Nov 2023
      const result = parseDate("15.11.", now);
      expect(result?.getDate()).toBe(15);
      expect(result?.getMonth()).toBe(10); // 0-indexed
      expect(result?.getFullYear()).toBe(2023);
    });

    it("handles year rollover (Dec -> Jan)", () => {
      const now = new Date(2023, 11, 20); // Dec 20 2023
      const result = parseDate("5.1.", now); // Jan 5
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0);
    });
  });

  describe("parseConcerts", () => {
    it("extracts concerts from html", () => {
      const html = `
        <h1>Konsertit | Tampere</h1>
        <h3>Venue A</h3>
        <p>
          10.12. Artist One<br/>
          12.12. Artist Two
        </p>
        <h3>Venue B</h3>
        <p>15.12. Artist Three</p>
      `;

      const concerts = parseConcerts(html);
      expect(concerts).toHaveLength(3);
      expect(concerts[0].artist).toBe("Artist One");
      expect(concerts[0].venue).toBe("Venue A");
      expect(concerts[0].venueUrl).toBeUndefined();

      // Sorted by date
      expect(concerts[0].date.getDate()).toBe(10);
      expect(concerts[1].date.getDate()).toBe(12);
      expect(concerts[2].date.getDate()).toBe(15);
    });

    it('extracts venue url', () => {
      const html = `
        <h1>Konsertit | Tampere</h1>
        <h3>Venue With Link</h3>
        <p>Missä? Osoite | <a href="https://example.com">Täältä</a></p>
        <p>20.12. Artist</p>
      `;
      const concerts = parseConcerts(html);
      expect(concerts[0].venueUrl).toBe('https://example.com');
    });

    it('handles invalid structure gracefully', () => {
      const html = '<div>No proper content</div>';
      const concerts = parseConcerts(html);
      expect(concerts).toEqual([]);
    });

    it('handles missing date match', () => {
      const html = `
        <h1>Konsertit | Tampere</h1>
        <h3>Venue A</h3>
        <p>Some random text without date</p>
        `;
      const concerts = parseConcerts(html);
      expect(concerts).toEqual([]);
    });
  });
});
