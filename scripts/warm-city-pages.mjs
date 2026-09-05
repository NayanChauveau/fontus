#!/usr/bin/env node

const DEFAULT_ORIGIN = "http://localhost:3100";
const DEFAULT_PAUSE_MS = 1500;

function parseArgs(argv) {
  const options = {
    origin: DEFAULT_ORIGIN,
    quality: false,
    pauseMs: DEFAULT_PAUSE_MS,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--quality") {
      options.quality = true;
    } else if (arg === "--origin") {
      options.origin = argv[i + 1] ?? options.origin;
      i += 1;
    } else if (arg === "--pause") {
      options.pauseMs = Number(argv[i + 1] ?? options.pauseMs);
      i += 1;
    }
  }
  return options;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function collectHrefs(html, origin) {
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  return [...new Set(hrefs)].map((href) => {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return href;
    }
    return new URL(href, origin).pathname;
  });
}

function cityPaths(hrefs) {
  return hrefs.filter((href) => /^\/eau-robinet\/[a-z0-9-]+$/.test(href));
}

function udiPaths(hrefs) {
  return hrefs.filter((href) => /^\/eau-robinet\/[a-z0-9-]+\/\d{9}$/.test(href));
}

async function fetchPage(origin, path) {
  const url = new URL(path, origin).href;
  const response = await fetch(url);
  const html = await response.text();
  return { url, status: response.status, html };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const hub = await fetchPage(options.origin, "/eau-robinet");
  if (hub.status !== 200) {
    throw new Error(`Hub ${hub.status} ${hub.url}`);
  }
  console.log(`hub ${hub.status} ${hub.url}`);

  const cities = cityPaths(collectHrefs(hub.html, options.origin));
  if (cities.length === 0) {
    throw new Error("No city links found on /eau-robinet");
  }

  let udiCount = 0;
  for (const path of cities) {
    await sleep(options.pauseMs);
    const city = await fetchPage(options.origin, path);
    console.log(`city ${city.status} ${city.url}`);
    if (city.status !== 200) {
      continue;
    }
    if (!options.quality) {
      continue;
    }
    for (const udiPath of udiPaths(collectHrefs(city.html, options.origin))) {
      await sleep(options.pauseMs);
      const udi = await fetchPage(options.origin, udiPath);
      udiCount += 1;
      console.log(`udi ${udi.status} ${udi.url}`);
    }
  }

  console.log(
    options.quality
      ? `done ${cities.length} cities, ${udiCount} UDI pages`
      : `done ${cities.length} cities (pass --quality to warm UDI pages)`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
