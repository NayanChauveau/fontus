import { mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createFileDisImport } from "./createFileDisImport";

describe("createFileDisImport", () => {
  it("parses DIS files from a directory and ignores a missing folder", async () => {
    const directory = await mkdtemp(join(tmpdir(), "eau-dis-"));
    await writeFile(
      join(directory, "DIS_UDI_COM.txt"),
      "cdreseau;inseecommune\n033001214;33063\n",
    );
    await writeFile(
      join(directory, "DIS_PLV.txt"),
      "cdreseau;referenceprel;dateprel\n033001214;P1;2026-06-18\n",
    );
    await writeFile(
      join(directory, "DIS_RESULT.txt"),
      "referenceprel;cdparametre;libmajparametre;rqana\nP1;1340;Nitrates;8\n",
    );

    const samples = await createFileDisImport(directory).listByNetwork(
      "033001214",
      "2025-09-02",
    );
    expect(samples).toHaveLength(1);
    expect(samples[0]?.measurements[0]?.rawText).toBe("8");

    expect(await createFileDisImport("").listByNetwork("033001214", "2025-09-02")).toEqual(
      [],
    );
    expect(
      await createFileDisImport("/tmp/eau-dis-missing").listByNetwork(
        "033001214",
        "2025-09-02",
      ),
    ).toEqual([]);
  });

  it("returns nothing when PLV or RESULT is missing", async () => {
    const directory = await mkdtemp(join(tmpdir(), "eau-dis-"));
    await writeFile(join(directory, "DIS_PLV.txt"), "cdreseau;referenceprel\n");
    expect(
      await createFileDisImport(directory).listByNetwork("033001214", "2025-09-02"),
    ).toEqual([]);
  });

  it("ignores files that are not the exact DIS names", async () => {
    const directory = await mkdtemp(join(tmpdir(), "eau-dis-"));
    await writeFile(join(directory, "notes.txt"), "not a dis file\n");
    await writeFile(join(directory, "national.zip"), "zip");
    expect(
      await createFileDisImport(directory).listByNetwork("033001214", "2025-09-02"),
    ).toEqual([]);
  });

  it("ignores a DIS file that resolves outside the import directory", async () => {
    const directory = await mkdtemp(join(tmpdir(), "eau-dis-"));
    const outside = await mkdtemp(join(tmpdir(), "eau-dis-out-"));
    await writeFile(
      join(outside, "DIS_PLV.txt"),
      "cdreseau;referenceprel;dateprel\n033001214;P1;2026-06-18\n",
    );
    await writeFile(
      join(outside, "DIS_RESULT.txt"),
      "referenceprel;cdparametre;libmajparametre;rqana\nP1;1340;Nitrates;8\n",
    );
    await symlink(join(outside, "DIS_PLV.txt"), join(directory, "DIS_PLV.txt"));
    await symlink(
      join(outside, "DIS_RESULT.txt"),
      join(directory, "DIS_RESULT.txt"),
    );
    expect(
      await createFileDisImport(directory).listByNetwork("033001214", "2025-09-02"),
    ).toEqual([]);
  });

  it("ignores an oversized DIS file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "eau-dis-"));
    await writeFile(join(directory, "DIS_UDI_COM.txt"), "cdreseau;inseecommune\n");
    await writeFile(join(directory, "DIS_PLV.txt"), "x".repeat(8_000_001));
    await writeFile(
      join(directory, "DIS_RESULT.txt"),
      "referenceprel;cdparametre;libmajparametre;rqana\n",
    );
    expect(
      await createFileDisImport(directory).listByNetwork("033001214", "2025-09-02"),
    ).toEqual([]);
  });
});
