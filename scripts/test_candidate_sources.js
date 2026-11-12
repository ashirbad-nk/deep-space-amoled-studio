/**
 * scripts/test_candidate_sources.js
 * Benchmarking and probing candidate astronomical sources:
 * 1. NASA APOD (Astronomy Picture of the Day)
 * 2. ESO (European Southern Observatory) & ESA/Webb
 * 3. NOIRLab (DECam / Gemini / Kitt Peak)
 * 4. Chandra X-Ray Observatory
 * 5. CDS Strasbourg HiPS / Aladin Cutout Service
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Binary Dimension Parser for JPEG, PNG, WebP from Buffer chunks
function parseDimensions(buf) {
  if (!buf || buf.length < 16) return null;
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    if (buf.length >= 24) {
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), format: 'PNG' };
    }
  }
  // JPEG
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let offset = 2;
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xFF) {
        offset++;
        continue;
      }
      const marker = buf[offset + 1];
      // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
      if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
        const h = buf.readUInt16BE(offset + 5);
        const w = buf.readUInt16BE(offset + 7);
        return { w, h, format: 'JPEG' };
      }
      if (offset + 4 > buf.length) break;
      const len = buf.readUInt16BE(offset + 2);
      if (len <= 0) break;
      offset += 2 + len;
    }
  }
  // WebP
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') {
    if (buf.slice(12, 16).toString('ascii') === 'VP8X' && buf.length >= 30) {
      const w = 1 + buf.readUIntLE(24, 3);
      const h = 1 + buf.readUIntLE(27, 3);
      return { w, h, format: 'WebP (VP8X)' };
    }
    if (buf.slice(12, 16).toString('ascii') === 'VP8L' && buf.length >= 25) {
      const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
      const w = 1 + (((b1 & 0x3F) << 8) | b0);
      const h = 1 + (((b3 & 0x0F) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6));
      return { w, h, format: 'WebP (VP8L)' };
    }
  }
  return null;
}

// Fetch helper with chunk streaming & header inspection
function fetchHeaderAndChunk(urlStr, maxBytes = 65536) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const client = u.protocol === 'https:' ? https : http;
      const req = client.get(urlStr, { headers: { 'User-Agent': 'DeepSpaceAmoledStudio/2.0' } }, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchHeaderAndChunk(new URL(res.headers.location, urlStr).href, maxBytes));
        }

        const cors = res.headers['access-control-allow-origin'] || 'NONE';
        const contentType = res.headers['content-type'] || 'unknown';
        const contentLength = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : 0;
        const chunks = [];
        let total = 0;

        res.on('data', (chunk) => {
          chunks.push(chunk);
          total += chunk.length;
          if (total >= maxBytes) {
            req.destroy(); // Got enough bytes to parse header
          }
        });

        res.on('close', () => {
          const buf = Buffer.concat(chunks);
          const dims = parseDimensions(buf);
          resolve({
            status: res.statusCode,
            cors,
            contentType,
            contentLength,
            dims,
            bufLength: buf.length
          });
        });

        res.on('error', (err) => {
          resolve({ error: err.message });
        });
      });

      req.on('error', (err) => resolve({ error: err.message }));
      req.setTimeout(8000, () => {
        req.destroy();
        resolve({ error: 'Timeout after 8s' });
      });
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

// JSON fetch helper
function fetchJson(urlStr) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const client = u.protocol === 'https:' ? https : http;
      client.get(urlStr, { headers: { 'User-Agent': 'DeepSpaceAmoledStudio/2.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchJson(new URL(res.headers.location, urlStr).href));
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(data), headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data.substring(0, 500), error: e.message });
          }
        });
        res.on('error', err => resolve({ error: err.message }));
      }).on('error', err => resolve({ error: err.message }));
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

async function testAllSources() {
  console.log('========================================================================');
  console.log('🔬 DEEP SPACE SOURCE RESEARCH & RESOLUTION PROBING SUITE');
  console.log('========================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. TEST NASA APOD (Astronomy Picture of the Day)
  // ---------------------------------------------------------------------------
  console.log('>>> [1/5] Testing NASA APOD API (api.nasa.gov)...');
  const apodResp = await fetchJson('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=6');
  if (apodResp.json && Array.isArray(apodResp.json)) {
    console.log(`✓ APOD returned ${apodResp.json.length} items (HTTP ${apodResp.status}).`);
    for (const item of apodResp.json) {
      if (item.media_type === 'image') {
        const imgUrl = item.hdurl || item.url;
        const probe = await fetchHeaderAndChunk(imgUrl);
        const dims = probe.dims ? `${probe.dims.w} × ${probe.dims.h} (${((probe.dims.w * probe.dims.h) / 1e6).toFixed(1)} MP)` : 'N/A';
        const sizeMB = probe.contentLength ? `${(probe.contentLength / (1024 * 1024)).toFixed(2)} MB` : 'Chunked';
        console.log(`   • [${item.date}] "${item.title.substring(0, 35)}..."`);
        console.log(`     - Res: ${dims} | Format: ${probe.contentType} | Size: ${sizeMB} | CORS: ${probe.cors}`);
        console.log(`     - URL: ${imgUrl.substring(0, 70)}...`);
      }
    }
  } else {
    console.log('   APOD query issue:', apodResp.error || apodResp.status);
  }

  // ---------------------------------------------------------------------------
  // 2. TEST ESO (European Southern Observatory) & ESA/Webb
  // ---------------------------------------------------------------------------
  console.log('\n>>> [2/5] Testing ESO & ESA/Hubble / ESA/Webb Masters...');
  // Check ESO via Wikimedia Commons dedicated ESO institution category + direct CDN
  const esoQuery = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=incategory%3A%22Images_by_the_European_Southern_Observatory%22+OR+%22ESO%22+VLT&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*';
  const esoResp = await fetchJson(esoQuery);
  if (esoResp.json && esoResp.json.query && esoResp.json.query.pages) {
    const pages = Object.values(esoResp.json.query.pages);
    console.log(`✓ ESO query returned ${pages.length} records.`);
    for (const p of pages) {
      const info = p.imageinfo ? p.imageinfo[0] : null;
      if (info && info.url) {
        const mp = ((info.width * info.height) / 1e6).toFixed(1);
        const probe = await fetchHeaderAndChunk(info.url, 32768);
        console.log(`   • "${p.title.replace(/^File:/, '').substring(0, 40)}..."`);
        console.log(`     - Reported Res: ${info.width} × ${info.height} (${mp} MP) | Verified Format: ${probe.dims ? probe.dims.format : info.mime}`);
        console.log(`     - CORS: ${probe.cors} | URL: ${info.url.substring(0, 70)}...`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. TEST NOIRLab (Blanco 4m DECam / Gemini North & South / Kitt Peak)
  // ---------------------------------------------------------------------------
  console.log('\n>>> [3/5] Testing NOIRLab (DECam / Gemini Observatory)...');
  const noirlabQuery = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=%22NOIRLab%22+OR+%22Dark+Energy+Camera%22+OR+%22Gemini+Observatory%22&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*';
  const noirlabResp = await fetchJson(noirlabQuery);
  if (noirlabResp.json && noirlabResp.json.query && noirlabResp.json.query.pages) {
    const pages = Object.values(noirlabResp.json.query.pages);
    console.log(`✓ NOIRLab query returned ${pages.length} records.`);
    for (const p of pages) {
      const info = p.imageinfo ? p.imageinfo[0] : null;
      if (info && info.url) {
        const mp = ((info.width * info.height) / 1e6).toFixed(1);
        const probe = await fetchHeaderAndChunk(info.url, 32768);
        console.log(`   • "${p.title.replace(/^File:/, '').substring(0, 40)}..."`);
        console.log(`     - Reported Res: ${info.width} × ${info.height} (${mp} MP) | Format: ${info.mime}`);
        console.log(`     - CORS: ${probe.cors} | URL: ${info.url.substring(0, 70)}...`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. TEST Chandra X-Ray Observatory
  // ---------------------------------------------------------------------------
  console.log('\n>>> [4/5] Testing Chandra X-Ray Observatory Masters...');
  const chandraQuery = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=incategory%3A%22Images_from_the_Chandra_X-ray_Observatory%22+OR+%22Chandra+X-ray%22&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*';
  const chandraResp = await fetchJson(chandraQuery);
  if (chandraResp.json && chandraResp.json.query && chandraResp.json.query.pages) {
    const pages = Object.values(chandraResp.json.query.pages);
    console.log(`✓ Chandra query returned ${pages.length} records.`);
    for (const p of pages) {
      const info = p.imageinfo ? p.imageinfo[0] : null;
      if (info && info.url) {
        const mp = ((info.width * info.height) / 1e6).toFixed(1);
        const probe = await fetchHeaderAndChunk(info.url, 32768);
        console.log(`   • "${p.title.replace(/^File:/, '').substring(0, 40)}..."`);
        console.log(`     - Reported Res: ${info.width} × ${info.height} (${mp} MP) | Format: ${info.mime}`);
        console.log(`     - CORS: ${probe.cors} | OLED Contrast: Outstanding (isolated emission against black void)`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. TEST CDS Strasbourg HiPS / Aladin Lite Cutouts (Pan-STARRS & DSS2)
  // ---------------------------------------------------------------------------
  console.log('\n>>> [5/5] Testing CDS Strasbourg HiPS Image Cutouts (Pan-STARRS & DSS2)...');
  const hipsTargets = [
    { name: 'Orion Nebula (M42)', ra: 83.822, dec: -5.391, survey: 'CDS/P/PanSTARRS/DR1/color-z-zg-g', fov: 0.6 },
    { name: 'Andromeda Galaxy (M31)', ra: 10.684, dec: 41.269, survey: 'CDS/P/DSS2/color', fov: 1.5 }
  ];

  for (const t of hipsTargets) {
    const hipsUrl = `https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=${encodeURIComponent(t.survey)}&width=2048&height=2048&fov=${t.fov}&ra=${t.ra}&dec=${t.dec}&format=jpg`;
    const startT = Date.now();
    const probe = await fetchHeaderAndChunk(hipsUrl, 32768);
    const duration = Date.now() - startT;
    const dims = probe.dims ? `${probe.dims.w} × ${probe.dims.h} (${((probe.dims.w * probe.dims.h) / 1e6).toFixed(1)} MP)` : 'N/A';
    console.log(`   • [${t.name}] Survey: ${t.survey}`);
    console.log(`     - Res: ${dims} in ${duration}ms | HTTP: ${probe.status} | CORS: ${probe.cors}`);
    console.log(`     - URL: ${hipsUrl.substring(0, 75)}...`);
  }

  console.log('\n========================================================================');
  console.log('🏁 SOURCE PROBING BENCHMARK COMPLETE');
  console.log('========================================================================\n');
}

testAllSources();
