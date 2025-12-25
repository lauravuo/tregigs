import { addDays, subDays } from "date-fns";
import { describe, expect, it, vi } from "vitest";
import { formatGigs } from "./build.js";
import type { Concert } from "./scraper.js";

describe("build", () => {
  describe("formatGigs", () => {
    it("returns empty message if no concerts", () => {
      const html = formatGigs([]);
      expect(html).toContain("No upcoming gigs found");
    });

    it("generates html with date headers", () => {
      const concerts: Concert[] = [
        { date: new Date(2023, 11, 15), artist: "Artist A", venue: "Venue A" },
        { date: new Date(2023, 11, 15), artist: "Artist B", venue: "Venue A" },
        { date: new Date(2023, 11, 16), artist: "Artist C", venue: "Venue B" },
      ];

      const html = formatGigs(concerts);
      // Should have 2 date headers
      expect(html.match(/class="date-header"/g)).toHaveLength(2);
      // Should have 3 items
      expect(html.match(/class="artist"/g)).toHaveLength(3);
    });

    it("wraps venue in link if venueUrl is present", () => {
      const concerts: Concert[] = [
        {
          date: new Date(2023, 11, 15),
          artist: "Artist A",
          venue: "Venue A",
          venueUrl: "http://example.com",
        },
      ];
      const html = formatGigs(concerts);
      expect(html).toContain('<a href="http://example.com"');
    });

    it("does not wrap venue in link if venueUrl is missing", () => {
      const concerts: Concert[] = [
        { date: new Date(2023, 11, 15), artist: "Artist A", venue: "Venue A" },
      ];
      const html = formatGigs(concerts);
      expect(html).not.toContain('<a href="');
    });
  });

  describe("build execution", () => {
    it("fetches data, generates html, and writes to file", async () => {
      // Mock fs
      const fs = await import("node:fs/promises");
      const scraper = await import("./scraper.js");
      const { build } = await import("./build.js");

      // Setup mocks
      vi.mock("node:fs/promises", async () => {
        return {
          readFile: vi.fn(),
          writeFile: vi.fn(),
          access: vi.fn(),
          mkdir: vi.fn(),
          constants: {},
        };
      });

      vi.mock("./scraper.js", async () => {
        return {
          fetchHtml: vi.fn(),
          parseConcerts: vi.fn(),
          parseDate: vi.fn(), // needed if imported
        };
      });

      // Define behaviors
      vi.mocked(scraper.fetchHtml).mockResolvedValue("<html>mock</html>");
      vi.mocked(scraper.parseConcerts).mockReturnValue([
        {
          date: addDays(new Date(), 30),
          artist: "Test Artist",
          venue: "Test Venue",
        },
      ]);
      vi.mocked(fs.readFile).mockResolvedValue(
        "<div>{{CONTENT}}</div><footer>{{UPDATED_AT}}</footer>",
      );
      vi.mocked(fs.access).mockResolvedValue(undefined); // Dir exists

      // Spy on console to avoid noise
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await build();

      // Verify interactions
      expect(scraper.fetchHtml).toHaveBeenCalled();
      expect(scraper.parseConcerts).toHaveBeenCalledWith("<html>mock</html>");
      expect(fs.readFile).toHaveBeenCalled(); // Should read template

      // Verify file write
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("public/index.html"),
        expect.stringContaining("Test Artist"),
      );

      consoleSpy.mockRestore();
      vi.resetModules();
      vi.restoreAllMocks();
    });
    it("filters out past concerts", async () => {
      // Mock fs
      const fs = await import("node:fs/promises");
      const scraper = await import("./scraper.js");
      const { build } = await import("./build.js");

      vi.mock("node:fs/promises", async () => {
        return {
          readFile: vi.fn(),
          writeFile: vi.fn(),
          access: vi.fn(),
          mkdir: vi.fn(),
          constants: {},
        };
      });

      vi.mock("./scraper.js", async () => {
        return {
          fetchHtml: vi.fn(),
          parseConcerts: vi.fn(),
          parseDate: vi.fn(),
        };
      });

      const yesterday = subDays(new Date(), 1);
      const tomorrow = addDays(new Date(), 1);

      // Define behaviors
      vi.mocked(scraper.fetchHtml).mockResolvedValue("<html>mock</html>");
      vi.mocked(scraper.parseConcerts).mockReturnValue([
        { date: yesterday, artist: "Past Artist", venue: "Past Venue" },
        { date: tomorrow, artist: "Future Artist", venue: "Future Venue" },
      ]);
      vi.mocked(fs.readFile).mockResolvedValue("{{CONTENT}}");
      vi.mocked(fs.access).mockResolvedValue(undefined);

      await build();

      // Verify file write
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("public/index.html"),
        expect.stringContaining("Future Artist"),
      );

      // Should NOT contain the past artist
      expect(fs.writeFile).not.toHaveBeenCalledWith(
        expect.stringContaining("public/index.html"),
        expect.stringContaining("Past Artist"),
      );

      vi.resetModules();
      vi.restoreAllMocks();
    });
  });
});
