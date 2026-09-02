import { describe, expect, it } from "vitest";
import { createHubeauResultatsDisGateway } from "./createHubeauResultatsDisGateway";

describe("createHubeauResultatsDisGateway", () => {
  it("always filters by code_reseau and never by code_commune", async () => {
    const urls: string[] = [];
    const gateway = createHubeauResultatsDisGateway(async (url) => {
      urls.push(url.toString());
      return new Response(
        JSON.stringify({ count: 1, next: null, data: [] }),
        { status: 200 },
      );
    });

    await gateway.count("033001214", "2025-09-02");
    await gateway.listPage("033001214", "2025-09-02");

    expect(urls).toHaveLength(2);
    for (const url of urls) {
      expect(url).toContain("code_reseau=033001214");
      expect(url).not.toContain("code_commune");
    }
    expect(urls[0]).toContain("size=1");
    expect(urls[1]).toContain("size=1000");
  });
});
