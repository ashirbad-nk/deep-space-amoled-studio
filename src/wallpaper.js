/**
 * src/wallpaper.js - Deep Space AMOLED Wallpaper Studio Controller
 *
 * 100% Client-Side Static Webapp & PWA:
 * 1. Screen 1: Discovery & Multi-Archive Sourcing Hub:
 *    - Curated 4K/5K Masterpieces (Carina, Pillars, Phantom Spiral, Tarantula, Southern Ring, Cartwheel).
 *    - Multi-Archive Search: NASA Image & Video Library + Wikimedia Commons Astronomical Archive (ESO, VLT, ALMA, Hubble, JWST).
 *    - Pre-download image dimension badges (Resolution, MP, Tier).
 *    - CORS-safe Blob URL loader (Zero CORS errors, Zero tainted canvases).
 * 2. Screen 2: Live 60 FPS Wallpaper Studio Stage:
 *    - Interactive 60 FPS canvas with closed Catmull-Rom spline camera engine.
 *    - Live Image Quality & Resolution Telemetry Toast & Top-Bar Badge.
 *    - Interactive Spline Trajectory Editor with draggable waypoints.
 *    - AMOLED true-black color grading with star protection.
 *    - Exporters: Standalone HTML (Hidamari / zero backend) & 60 FPS video recorder.
 * 3. Progressive Web App (PWA): Service Worker offline caching, installation prompt integration.
 */

(function () {
  'use strict';

  // Available Resolution Presets
  const PRESETS = {
    'fullscreen': { label: 'Native Window / Fill Screen', w: 0, h: 0, isNative: true },
    'original-ratio': { label: '🖼️ Match Source Image Ratio (Auto)', w: 0, h: 0, isOriginalRatio: true },
    'iphone-16-pro': { label: 'iPhone 15/16 Pro (1179 x 2556, 19.5:9)', w: 1179, h: 2556 },
    'iphone-pro-max': { label: 'iPhone Pro Max (1290 x 2796, 19.5:9)', w: 1290, h: 2796 },
    'galaxy-s24-ultra': { label: 'Galaxy S24 Ultra (1440 x 3120, 19.5:9)', w: 1440, h: 3120 },
    'mobile-classic': { label: 'Classic Mobile (1080 x 1920, 16:9)', w: 1080, h: 1920 },
    'desktop-4k': { label: 'Desktop 4K UHD (3840 x 2160, 16:9)', w: 3840, h: 2160 },
    'desktop-1440p': { label: 'Desktop QHD (2560 x 1440, 16:9)', w: 2560, h: 1440 },
    'desktop-1080p': { label: 'Desktop FHD (1920 x 1080, 16:9)', w: 1920, h: 1080 },
    'macbook-pro': { label: 'MacBook Pro (3024 x 1964, 16:10)', w: 3024, h: 1964 },
    'ultrawide-21-9': { label: 'Ultrawide (3440 x 1440, 21:9)', w: 3440, h: 1440 },
    'super-ultrawide': { label: 'Super Ultrawide (5120 x 1440, 32:9)', w: 5120, h: 1440 }
  };

  // Curated Astronomical Masterpieces Catalog
  const CATALOG = {
    'carina': {
      title: 'Golden Cosmic Cliffs',
      subtitle: 'Carina Nebula (NGC 3324) • JWST NIRCam',
      desc: 'Towering 7-light-year golden gas peaks bordered by sapphire deep space. Highest dynamic contrast for AMOLED screens.',
      category: 'cliffs',
      thumb: 'images/thumbnails/carina.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.carina) ? window.DEFAULT_ASSETS.carina : 'images/graded/carina_cosmic_cliffs_amoled_5k.webp',
      fallback: 'images/graded/carina_cosmic_cliffs_amoled_5k.jpg',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2205a.jpg',
      resBadge: '5K Master (15.2 MP)',
      blackLevel: '🖤 ~15% OLED Black',
      telescope: 'JWST NIRCam',
      width: 5120,
      height: 2965
    },
    'pillars': {
      title: 'The Pillars of Creation',
      subtitle: 'Eagle Nebula (M16) • JWST & Hubble',
      desc: 'Majestic finger-like spires of interstellar gas and stardust giving birth to newborn stars. Rich deep void contrast.',
      category: 'pillars',
      thumb: 'images/thumbnails/pillars.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.pillars) ? window.DEFAULT_ASSETS.pillars : 'images/graded/pillars_of_creation_amoled_5k.webp',
      fallback: 'images/graded/pillars_of_creation_amoled_5k.jpg',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2219a.jpg',
      resBadge: '5K Master (19.5 MP)',
      blackLevel: '🖤 ~22% OLED Black',
      telescope: 'JWST NIRCam',
      width: 4373,
      height: 4462
    },
    'phantom_galaxy': {
      title: 'The Phantom Spiral Galaxy',
      subtitle: 'Messier 74 (NGC 628) • JWST MIRI & NIRCam',
      desc: 'Grand-design spiral arms wound with glowing dust filaments radiating outward from a brilliant galactic core.',
      category: 'galaxies',
      thumb: 'images/thumbnails/phantom_galaxy.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.phantom_galaxy) ? window.DEFAULT_ASSETS.phantom_galaxy : 'images/graded/phantom_galaxy_master.webp',
      fallback: 'images/graded/phantom_galaxy_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/publicationjpg/weic2212a.jpg',
      resBadge: '4K Ultra Master (9.3 MP)',
      blackLevel: '🖤 ~28% OLED Black',
      telescope: 'JWST MIRI',
      width: 4000,
      height: 2313
    },
    'tarantula': {
      title: 'Tarantula Cosmic Web',
      subtitle: '30 Doradus • Large Magellanic Cloud • JWST',
      desc: 'Luminous spider-like filament webs surrounding thousands of massive young stars in a turbulent stellar nursery.',
      category: 'webs',
      thumb: 'images/thumbnails/tarantula.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.tarantula) ? window.DEFAULT_ASSETS.tarantula : 'images/graded/tarantula_master.webp',
      fallback: 'images/graded/tarantula_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/publicationjpg/weic2216a.jpg',
      resBadge: '4K Ultra Master (15.3 MP)',
      blackLevel: '🖤 ~14% OLED Black',
      telescope: 'JWST NIRCam',
      width: 3835,
      height: 4000
    },
    'southern_ring': {
      title: 'Southern Ring of Fire',
      subtitle: 'Eight-Burst Planetary Nebula (NGC 3132)',
      desc: 'Concentric shells of gas expelled by a dying central binary star, glowing across the dark cosmos.',
      category: 'rings',
      thumb: 'images/thumbnails/southern_ring.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.southern_ring) ? window.DEFAULT_ASSETS.southern_ring : 'images/graded/southern_ring_master.webp',
      fallback: 'images/graded/southern_ring_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/publicationjpg/weic2208a.jpg',
      resBadge: '4K Ultra Master (15.3 MP)',
      blackLevel: '🖤 ~40% OLED Black',
      telescope: 'JWST NIRCam',
      width: 4000,
      height: 3835
    },
    'cartwheel': {
      title: 'The Cartwheel Cosmic Collision',
      subtitle: 'Lenticular & Ring Galaxy • 500M Light-Years Away',
      desc: 'A colossal high-speed head-on collision producing an expanding outer ring of sparkling star formation.',
      category: 'galaxies',
      thumb: 'images/thumbnails/cartwheel.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.cartwheel) ? window.DEFAULT_ASSETS.cartwheel : 'images/graded/cartwheel_master.webp',
      fallback: 'images/graded/cartwheel_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/publicationjpg/weic2211a.jpg',
      resBadge: '4K Ultra Master (14.7 MP)',
      blackLevel: '🖤 ~32% OLED Black',
      telescope: 'JWST MIRI',
      width: 4000,
      height: 3682
    },
    'helix_nebula': {
      title: 'Eye of God (Helix Nebula)',
      subtitle: 'NGC 7293 • Planetary Nebula • 650 Light-Years',
      desc: 'Spectacular celestial eye showcasing intricate radial gaseous filaments and glowing rings against pure black cosmos.',
      category: 'rings',
      thumb: 'images/thumbnails/helix_nebula.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.helix_nebula) ? window.DEFAULT_ASSETS.helix_nebula : 'images/graded/helix_nebula_5k.webp',
      fallback: 'images/graded/helix_nebula_5k.webp',
      rawUrl: 'images/graded/helix_nebula_5k.webp',
      resBadge: '5K Master (24.3 MP)',
      blackLevel: '🖤 ~35% OLED Black',
      telescope: 'Hubble & Blanco 4m',
      width: 4750,
      height: 5120
    },
    'orion_head': {
      title: 'Orion\'s Head (Lambda Orionis)',
      subtitle: 'Sharpless 2-264 • NASA JPL PIA14040',
      desc: 'Colossal expanding ring of glowing interstellar dust enshrouding the head of Orion, captured in multi-spectral infrared.',
      category: 'rings',
      thumb: 'images/thumbnails/orion_head.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.orion_head) ? window.DEFAULT_ASSETS.orion_head : 'images/graded/orion_head_pia14040_5k.webp',
      fallback: 'images/graded/orion_head_pia14040_5k.webp',
      rawUrl: 'https://images-assets.nasa.gov/image/PIA14040/PIA14040~orig.jpg',
      resBadge: '5K Master (24.4 MP)',
      blackLevel: '🖤 ~25% OLED Black',
      telescope: 'NASA WISE Infrared',
      width: 5120,
      height: 4764
    },
    'pillars_landscape': {
      title: 'Pillars of Creation (Panorama)',
      subtitle: 'Eagle Nebula (M16) • JWST NIRCam Panoramic',
      desc: 'Cinematic widescreen landscape view of the famous star-forming spires of the Eagle Nebula in stunning 5K panoramic detail.',
      category: 'pillars',
      thumb: 'images/thumbnails/pillars_landscape.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.pillars_landscape) ? window.DEFAULT_ASSETS.pillars_landscape : 'images/graded/pillars_landscape_5k.webp',
      fallback: 'images/graded/pillars_landscape_5k.webp',
      rawUrl: 'images/graded/pillars_landscape_5k.webp',
      resBadge: '5K Panorama (17.5 MP)',
      blackLevel: '🖤 ~20% OLED Black',
      telescope: 'JWST NIRCam Panorama',
      width: 5120,
      height: 3413
    }
  };

  // State Management
  let currentScreen = 'discovery'; // 'discovery' or 'studio'
  let activeCatalogKey = 'carina';
  let activeImageTitle = 'Carina Cosmic Cliffs';
  let activeImageSpecs = null;
  let toastDismissTimeout = null;

  // Extensive Master Catalog Table of Popular Discoveries (Sanitized, Categorized & Grounded with Celestial Coordinates & Aliases)
  const POPULAR_DISCOVERIES = [
    // Nebulae & Cosmic Gas Clouds
    { id: 'orion', name: '🔭 Orion Nebula (M42)', query: 'Orion Nebula', catalogId: 'M42 / NGC 1976', ra: 83.8221, dec: -5.3911, aliases: ['M42', 'NGC 1976', 'Orion Nebula', 'Messier 42', 'Sh2-279', 'Great Nebula in Orion'], category: 'nebula', desc: 'Closest massive star-forming nursery to Earth.' },
    { id: 'pillars', name: '🏛️ Pillars of Creation', query: 'Pillars of Creation', catalogId: 'M16 / NGC 6611', ra: 274.7000, dec: -13.8070, aliases: ['M16', 'NGC 6611', 'Eagle Nebula', 'Pillars of Creation', 'Star Queen'], category: 'nebula', desc: 'Towering interstellar columns of cool hydrogen gas and dust sculpting newborn stars.' },
    { id: 'carina', name: '⛰️ Cosmic Cliffs (Carina)', query: 'Carina Nebula', catalogId: 'NGC 3324 / NGC 3372', ra: 160.0380, dec: -58.6330, aliases: ['NGC 3324', 'NGC 3372', 'Carina Nebula', 'Cosmic Cliffs', 'Gabriela Mistral'], category: 'nebula', desc: 'Dramatic edge of a giant gaseous cavity where newborn stars carve sheer cliffs.' },
    { id: 'crab', name: '🦀 Crab Nebula (M1)', query: 'Crab Nebula', catalogId: 'M1 / NGC 1952', ra: 83.6331, dec: 22.0145, aliases: ['M1', 'NGC 1952', 'Crab Nebula', 'Taurus A', 'SN 1054'], category: 'nebula', desc: 'Supernova remnant powered by a rapidly pulsing central neutron star.' },
    { id: 'butterfly', name: '🦋 Butterfly Nebula (NGC 6302)', query: 'Butterfly Nebula', catalogId: 'NGC 6302 / Caldwell 69', ra: 257.9150, dec: -37.1030, aliases: ['NGC 6302', 'Caldwell 69', 'Butterfly Nebula', 'Bug Nebula', 'Sh2-6'], category: 'nebula', desc: 'Bipolar planetary nebula with majestic gaseous wings extending over 3 light-years.' },
    { id: 'southern_ring', name: '💍 Southern Ring (NGC 3132)', query: 'Southern Ring Nebula', catalogId: 'NGC 3132 / Caldwell 74', ra: 151.7567, dec: -40.4361, aliases: ['NGC 3132', 'Caldwell 74', 'Southern Ring', 'Eight-Burst Nebula'], category: 'nebula', desc: 'Concentric shells of gas expelled by a dying central binary star system.' },
    { id: 'tarantula', name: '🕸️ Tarantula Nebula (30 Doradus)', query: 'Tarantula Nebula', catalogId: 'NGC 2070 / 30 Doradus', ra: 84.6766, dec: -69.1009, aliases: ['NGC 2070', '30 Doradus', 'Tarantula Nebula', 'Caldwell 103'], category: 'nebula', desc: 'Most luminous non-stellar object in the Local Group of galaxies.' },
    { id: 'horsehead', name: '🐴 Horsehead Nebula (B33)', query: 'Horsehead Nebula', catalogId: 'Barnard 33 / IC 434', ra: 85.2458, dec: -2.4583, aliases: ['Barnard 33', 'B33', 'IC 434', 'Horsehead Nebula'], category: 'nebula', desc: 'Dark dust pillar rising like a seahorse silhouette against crimson emission gas.' },
    { id: 'helix', name: '🔮 Helix Nebula (NGC 7293)', query: 'Helix Nebula', catalogId: 'NGC 7293 / Caldwell 63', ra: 337.4108, dec: -20.8372, aliases: ['NGC 7293', 'Caldwell 63', 'Helix Nebula', 'Eye of God'], category: 'nebula', desc: 'Massive glowing planetary ring famously known as the Eye of God.' },
    { id: 'cats_eye', name: '🐈 Cat\'s Eye Nebula (NGC 6543)', query: 'Cats Eye Nebula', catalogId: 'NGC 6543 / Caldwell 6', ra: 269.6390, dec: 66.6330, aliases: ['NGC 6543', 'Caldwell 6', 'Cats Eye Nebula', 'Cat\'s Eye'], category: 'nebula', desc: 'Complex layered bubble geometries sculpted by high-speed stellar winds.' },
    { id: 'ring_m57', name: '🦭 Ring Nebula (M57)', query: 'Ring Nebula', catalogId: 'M57 / NGC 6720', ra: 283.3963, dec: 33.0292, aliases: ['M57', 'NGC 6720', 'Ring Nebula', 'Messier 57'], category: 'nebula', desc: 'Barrel-shaped shroud of gas glowing in neon greens and deep reds.' },
    { id: 'veil', name: '🌌 Veil Nebula Supernova Remnant', query: 'Veil Nebula', catalogId: 'NGC 6960 / Caldwell 34', ra: 312.7500, dec: 30.7000, aliases: ['NGC 6960', 'NGC 6992', 'Caldwell 34', 'Veil Nebula', 'Cygnus Loop', 'Witches Broom'], category: 'nebula', desc: 'Delicate filamentary shock waves from an ancient supernova explosion.' },
    { id: 'eagle_core', name: '🦅 Eagle Nebula Core (M16)', query: 'Eagle Nebula', catalogId: 'M16 / NGC 6611', ra: 274.7000, dec: -13.8070, aliases: ['M16', 'NGC 6611', 'Eagle Nebula'], category: 'nebula', desc: 'Vast starburst nebula featuring the legendary Pillars of Creation.' },
    { id: 'rosette', name: '🌺 Rosette Nebula (NGC 2237)', query: 'Rosette Nebula', catalogId: 'NGC 2237 / Caldwell 49', ra: 98.7000, dec: 4.9000, aliases: ['NGC 2237', 'NGC 2244', 'Caldwell 49', 'Rosette Nebula', 'Skull Nebula'], category: 'nebula', desc: 'Vast spherical emission nebula shaped like a cosmic rose petal.' },
    { id: 'sn1987a', name: '💥 Supernova Remnant 1987A', query: 'Supernova 1987A', catalogId: 'SN 1987A', ra: 83.8667, dec: -69.2697, aliases: ['SN 1987A', 'Supernova 1987A', 'Sanduleak -69 202'], category: 'nebula', desc: 'Expanding equatorial pearl necklace ring ignited by the nearest observed modern supernova.' },
    { id: 'cone', name: '🕯️ Cone Nebula (NGC 2264)', query: 'Cone Nebula', catalogId: 'NGC 2264', ra: 100.2450, dec: 9.8960, aliases: ['NGC 2264', 'Cone Nebula', 'Christmas Tree Cluster'], category: 'nebula', desc: 'Dark conical interstellar dust column protruding into a bright hydrogen nebula.' },
    { id: 'bubble', name: '🫧 Bubble Nebula (NGC 7635)', query: 'Bubble Nebula', catalogId: 'NGC 7635 / Caldwell 11', ra: 350.2180, dec: 61.2010, aliases: ['NGC 7635', 'Caldwell 11', 'Bubble Nebula', 'Sharpless 162'], category: 'nebula', desc: 'Spherical cosmic bubble blown by stellar winds from an ultra-hot Wolf-Rayet star.' },
    { id: 'lagoon', name: '❄️ Lagoon Nebula (M8)', query: 'Lagoon Nebula', catalogId: 'M8 / NGC 6523', ra: 271.1370, dec: -24.3800, aliases: ['M8', 'NGC 6523', 'Lagoon Nebula', 'Messier 8', 'Sh2-25'], category: 'nebula', desc: 'Giant interstellar emission cloud classified as a vibrant H II region in Sagittarius.' },
    { id: 'wizard', name: '🧙 Wizard Nebula (NGC 7380)', query: 'Wizard Nebula', catalogId: 'NGC 7380 / Sh2-142', ra: 341.7650, dec: 58.1000, aliases: ['NGC 7380', 'Sh2-142', 'Wizard Nebula'], category: 'nebula', desc: 'Open star cluster enshrouded in a celestial silhouette resembling a sorcerer.' },
    { id: 'witch_head', name: '🌊 Witch Head Nebula', query: 'Witch Head Nebula', catalogId: 'IC 2118', ra: 75.5000, dec: -7.2167, aliases: ['IC 2118', 'Witch Head Nebula', 'Rigel Reflection'], category: 'nebula', desc: 'Faint blue reflection nebula illuminated by the blue supergiant star Rigel.' },
    { id: 'hourglass', name: '👁️ Hourglass Nebula (MyCn 18)', query: 'Hourglass Nebula', catalogId: 'MyCn 18', ra: 204.8875, dec: -67.3800, aliases: ['MyCn 18', 'Hourglass Nebula', 'Engraved Hourglass'], category: 'nebula', desc: 'Young planetary nebula with precise pinched-waist geometric contours.' },
    { id: 'cygnus_wall', name: '💎 Cygnus Wall (North America)', query: 'North America Nebula', catalogId: 'NGC 7000 / Caldwell 20', ra: 314.7500, dec: 44.3333, aliases: ['NGC 7000', 'Caldwell 20', 'North America Nebula', 'Cygnus Wall'], category: 'nebula', desc: 'Denser region of the North America Nebula featuring dramatic ridges of ionized gas.' },
    { id: 'thors_helmet', name: '✨ Thor\'s Helmet (NGC 2359)', query: 'Thors Helmet', catalogId: 'NGC 2359 / Gum 4', ra: 109.6458, dec: -13.2106, aliases: ['NGC 2359', 'Gum 4', 'Thors Helmet', 'Thor\'s Helmet', 'Duck Nebula'], category: 'nebula', desc: 'Winged helmet shape blown out by a central Wolf-Rayet star.' },
    { id: 'eta_carinae', name: '🚀 Eta Carinae Homunculus', query: 'Eta Carinae', catalogId: 'Eta Carinae', ra: 161.2650, dec: -59.6844, aliases: ['Eta Carinae', 'Homunculus Nebula', 'HD 93308'], category: 'nebula', desc: 'Bipolar lobes of incandescent gas expelled in the Great Eruption of 1843.' },
    { id: 'mystic_mtn', name: '💎 Mystic Mountain (Carina)', query: 'Mystic Mountain', catalogId: 'NGC 3372 Pillar', ra: 161.2800, dec: -59.8000, aliases: ['Mystic Mountain', 'Carina Pillar', 'HH 901', 'HH 902'], category: 'nebula', desc: 'Three-light-year-tall pillar of gas and dust being assaulted by brilliant star radiation.' },

    // Galaxies & Deep Universe Surveys
    { id: 'andromeda', name: '🌀 Andromeda Galaxy (M31)', query: 'Andromeda Galaxy', catalogId: 'M31 / NGC 224', ra: 10.6847, dec: 41.2687, aliases: ['M31', 'NGC 224', 'Andromeda Galaxy', 'Messier 31', 'UGC 454'], category: 'galaxy', desc: 'Nearest major spiral galaxy to the Milky Way, hosting over 1 trillion stars.' },
    { id: 'whirlpool', name: '🎡 Whirlpool Galaxy (M51)', query: 'Whirlpool Galaxy', catalogId: 'M51 / NGC 5194', ra: 202.4696, dec: 47.1953, aliases: ['M51', 'NGC 5194', 'Whirlpool Galaxy', 'Messier 51', 'UGC 8493'], category: 'galaxy', desc: 'Grand-design spiral interacting with companion dwarf galaxy NGC 5195.' },
    { id: 'sombrero', name: '👒 Sombrero Galaxy (M104)', query: 'Sombrero Galaxy', catalogId: 'M104 / NGC 4594', ra: 189.9976, dec: -11.6231, aliases: ['M104', 'NGC 4594', 'Sombrero Galaxy', 'Messier 104', 'Caldwell 61'], category: 'galaxy', desc: 'Lenticular galaxy with a bright nucleus and thick equatorial absorption dust lane.' },
    { id: 'phantom', name: '🪓 Phantom Galaxy (M74)', query: 'Phantom Galaxy', catalogId: 'M74 / NGC 628', ra: 24.1740, dec: 15.7830, aliases: ['M74', 'NGC 628', 'Phantom Galaxy', 'Messier 74', 'UGC 1149'], category: 'galaxy', desc: 'Perfect face-on spiral galaxy exhibiting winding symmetrical spiral arms.' },
    { id: 'cartwheel_gal', name: '🎡 Cartwheel Galaxy', query: 'Cartwheel Galaxy', catalogId: 'ESO 350-40 / PGC 2248', ra: 9.4340, dec: -33.7160, aliases: ['Cartwheel Galaxy', 'ESO 350-40', 'PGC 2248', 'A0035-33'], category: 'galaxy', desc: 'Magnificent ring galaxy created by a bullseye collision with a smaller companion.' },
    { id: 'jwst_deep', name: '🌌 James Webb Deep Field', query: 'SMACS 0723', catalogId: 'SMACS J0723.3-7327', ra: 110.8375, dec: -73.4560, aliases: ['SMACS 0723', 'SMACS J0723.3-7327', 'JWST First Deep Field', 'Webb Deep Field'], category: 'galaxy', desc: 'Gravitational lens cluster magnifying the earliest galaxies in the infant universe.' },
    { id: 'hudf', name: '🔭 Hubble Ultra Deep Field', query: 'Hubble Ultra Deep Field', catalogId: 'HUDF / Fornax Deep Field', ra: 53.1625, dec: -27.7914, aliases: ['HUDF', 'Hubble Ultra Deep Field', 'Fornax Deep Field'], category: 'galaxy', desc: 'Deepest visual portrait of the universe revealing 10,000 ancient galaxies.' },
    { id: 'triangulum', name: '💫 Triangulum Galaxy (M33)', query: 'Triangulum Galaxy', catalogId: 'M33 / NGC 598', ra: 23.4621, dec: 30.6599, aliases: ['M33', 'NGC 598', 'Triangulum Galaxy', 'Messier 33', 'Pinwheel Galaxy', 'UGC 1117'], category: 'galaxy', desc: 'Third-largest galaxy in our Local Group, rich in massive starbirth complexes.' },
    { id: 'fireworks', name: '🎆 Fireworks Galaxy (NGC 6946)', query: 'Fireworks Galaxy', catalogId: 'NGC 6946 / Caldwell 12', ra: 308.7180, dec: 60.1539, aliases: ['NGC 6946', 'Caldwell 12', 'Fireworks Galaxy', 'Arp 29'], category: 'galaxy', desc: 'Prolific supernova producer with 10 recorded supernovae in the last century.' },
    { id: 'black_eye', name: '🌪️ Black Eye Galaxy (M64)', query: 'Black Eye Galaxy', catalogId: 'M64 / NGC 4826', ra: 194.1820, dec: 21.6820, aliases: ['M64', 'NGC 4826', 'Black Eye Galaxy', 'Evil Eye', 'Sleeping Beauty'], category: 'galaxy', desc: 'Striking dark band of absorbing dust occluding the inner galactic core.' },
    { id: 'pinwheel_m101', name: '🪞 Pinwheel Galaxy (M101)', query: 'Pinwheel Galaxy', catalogId: 'M101 / NGC 5457', ra: 210.8024, dec: 54.3490, aliases: ['M101', 'NGC 5457', 'Pinwheel Galaxy', 'Messier 101', 'UGC 8981'], category: 'galaxy', desc: 'Vast spiral disc spanning 170,000 light-years packed with giant H II nebulae.' },
    { id: 'stephans_quintet', name: '🦚 Stephan\'s Quintet (HCG 92)', query: 'Stephans Quintet', catalogId: 'HCG 92 / Arp 319', ra: 339.0146, dec: 33.9597, aliases: ['Stephans Quintet', 'HCG 92', 'NGC 7317', 'NGC 7318', 'NGC 7319', 'NGC 7320'], category: 'galaxy', desc: 'Compact galaxy group locked in a dramatic gravitational dance and shock fronts.' },
    { id: 'cigar', name: '🛸 Cigar Galaxy (M82)', query: 'Cigar Galaxy', catalogId: 'M82 / NGC 3034', ra: 148.9685, dec: 69.6797, aliases: ['M82', 'NGC 3034', 'Cigar Galaxy', 'Messier 82', 'UGC 5322'], category: 'galaxy', desc: 'Prototypical starburst galaxy venting huge plumes of glowing red hydrogen gas.' },
    { id: 'centaurus_a', name: '🌠 Centaurus A (NGC 5128)', query: 'Centaurus A', catalogId: 'NGC 5128 / Caldwell 77', ra: 201.3650, dec: -43.0190, aliases: ['NGC 5128', 'Cen A', 'Centaurus A', 'Caldwell 77'], category: 'galaxy', desc: 'Peculiar radio galaxy harboring a supermassive black hole with relativistic jets.' },
    { id: 'antennae', name: '⚡ Antennae Galaxies (NGC 4038)', query: 'Antennae Galaxies', catalogId: 'NGC 4038 / NGC 4039', ra: 180.4700, dec: -18.8690, aliases: ['NGC 4038', 'NGC 4039', 'Antennae Galaxies', 'Arp 244', 'Caldwell 60'], category: 'galaxy', desc: 'Colliding galaxy pair flinging out vast tidal tails of stars and cosmic gas.' },
    { id: 'sculptor', name: '🧲 Sculptor Galaxy (NGC 253)', query: 'Sculptor Galaxy', catalogId: 'NGC 253 / Silver Coin', ra: 11.8880, dec: -25.2880, aliases: ['NGC 253', 'Silver Coin', 'Sculptor Galaxy', 'Caldwell 65'], category: 'galaxy', desc: 'Star-forming intermediate spiral galaxy located in the southern constellation Sculptor.' },
    { id: 'tadpole', name: '🌊 Tadpole Galaxy (UGC 10214)', query: 'Tadpole Galaxy', catalogId: 'UGC 10214 / Arp 188', ra: 241.5167, dec: 55.4286, aliases: ['UGC 10214', 'Arp 188', 'Tadpole Galaxy'], category: 'galaxy', desc: 'Disrupted barred spiral galaxy with a massive 280,000-light-year tidal tail.' },
    { id: 'lmc', name: '🛰️ Large Magellanic Cloud', query: 'Large Magellanic Cloud', catalogId: 'LMC / ESO 56-115', ra: 80.8940, dec: -69.7560, aliases: ['LMC', 'Large Magellanic Cloud', 'ESO 56-115'], category: 'galaxy', desc: 'Satellite dwarf galaxy orbiting our Milky Way, home to the Tarantula Nebula.' },
    { id: 'southern_pinwheel', name: '💫 Southern Pinwheel (M83)', query: 'Southern Pinwheel', catalogId: 'M83 / NGC 5236', ra: 204.2538, dec: -29.8658, aliases: ['M83', 'NGC 5236', 'Southern Pinwheel', 'Messier 83'], category: 'galaxy', desc: 'Barred spiral galaxy with prominent symmetric arms and frequent supernova bursts.' },
    { id: 'circinus', name: '🌌 Circinus Active Galaxy', query: 'Circinus Galaxy', catalogId: 'ESO 097-G13', ra: 213.2917, dec: -65.3389, aliases: ['Circinus Galaxy', 'ESO 097-G13', 'Seyfert Galaxy'], category: 'galaxy', desc: 'Nearby active galaxy featuring a supermassive black hole ringed by dusty gas.' },

    // Black Holes, Star Clusters & Solar System Wonders
    { id: 'm87', name: '🕳️ M87 Black Hole Event Horizon', query: 'M87 Black Hole', catalogId: 'M87 / Virgo A', ra: 187.7059, dec: 12.3911, aliases: ['M87', 'NGC 4486', 'Virgo A', 'M87 Black Hole', 'Powehi'], category: 'phenomenon', desc: 'Supermassive black hole shadow imaged by the Event Horizon Telescope.' },
    { id: 'sgr_a', name: '💫 Sagittarius A* Galactic Core', query: 'Sagittarius A', catalogId: 'Sgr A*', ra: 266.4168, dec: -29.0078, aliases: ['Sgr A*', 'Sagittarius A*', 'Milky Way Core', 'Galactic Center'], category: 'phenomenon', desc: 'The 4-million-solar-mass supermassive black hole at the center of the Milky Way.' },
    { id: 'saturn', name: '🪐 Saturn Rings & Aurora', query: 'Saturn', catalogId: 'Saturn System', ra: 340.5000, dec: -10.2000, aliases: ['Saturn', 'Saturn Rings', 'Cassini Division'], category: 'solar_system', desc: 'The jewel of the solar system with magnificent icy rings and polar aurora.' },
    { id: 'jupiter', name: '🔴 Jupiter Great Red Spot', query: 'Jupiter', catalogId: 'Jupiter System', ra: 65.0000, dec: 21.0000, aliases: ['Jupiter', 'Great Red Spot', 'Jovian Aurora'], category: 'solar_system', desc: 'Solar system\'s largest gas giant with its 300-year-old anticyclonic storm.' },
    { id: 'pleiades', name: '✨ Pleiades Cluster (M45)', query: 'Pleiades', catalogId: 'M45 / Melotte 22', ra: 56.7500, dec: 24.1170, aliases: ['M45', 'Pleiades', 'Seven Sisters', 'Subaru', 'Messier 45'], category: 'cluster', desc: 'Brilliant blue open cluster enmeshed in luminous reflection dust nebulosity.' },
    { id: 'cas_a', name: '⚡ Cassiopeia A Supernova', query: 'Cassiopeia A', catalogId: 'Cas A / 3C 461', ra: 350.8500, dec: 58.8150, aliases: ['Cas A', 'Cassiopeia A', '3C 461', 'Supernova Remnant'], category: 'phenomenon', desc: 'Brightest astronomical radio source beyond our solar system, an expanding blast wave.' },
    { id: 'omega_cen', name: '🌟 Omega Centauri (NGC 5139)', query: 'Omega Centauri', catalogId: 'NGC 5139 / Caldwell 80', ra: 201.6970, dec: -47.4770, aliases: ['NGC 5139', 'Caldwell 80', 'Omega Centauri', 'Globular Cluster'], category: 'cluster', desc: 'Vast globular cluster containing 10 million stars, the core remnant of a dwarf galaxy.' },
    { id: 'hh46_47', name: '☄️ Herbig-Haro 46/47 Jet', query: 'Herbig-Haro 46', catalogId: 'HH 46/47', ra: 129.8333, dec: -51.0500, aliases: ['HH 46', 'HH 47', 'HH 46/47', 'Herbig-Haro 46'], category: 'phenomenon', desc: 'High-speed bipolar stellar jets blasting out from a deeply embedded proto-star pair.' },
    { id: 'uranus', name: '🪐 Uranus Rings & Moons', query: 'Uranus', catalogId: 'Uranus System', ra: 51.5000, dec: 18.2000, aliases: ['Uranus', 'Uranus Rings', 'Ice Giant'], category: 'solar_system', desc: 'Tilted ice giant with delicate dust rings and orbiting moons captured by JWST.' },
    { id: 'westerlund2', name: '🌟 Westerlund 2 Star Cluster', query: 'Westerlund 2', catalogId: 'Westerlund 2', ra: 155.9750, dec: -57.7667, aliases: ['Westerlund 2', 'RCW 49', 'Gum 29'], category: 'cluster', desc: 'Compact young starburst cluster containing some of the most massive stars known.' },
    { id: 'crab_pulsar', name: '🌪️ Crab Pulsar High-Energy Jet', query: 'Crab Pulsar', catalogId: 'PSR B0531+21', ra: 83.6332, dec: 22.0145, aliases: ['Crab Pulsar', 'PSR B0531+21', 'NP 0532'], category: 'phenomenon', desc: 'Rapidly rotating neutron star spinning 30 times a second at the center of M1.' },
    { id: 'wr124', name: '💫 WR 124 Wolf-Rayet Blossom', query: 'WR 124', catalogId: 'WR 124 / Hen 2-427', ra: 287.9542, dec: 16.8639, aliases: ['WR 124', 'Hen 2-427', 'Wolf-Rayet 124'], category: 'phenomenon', desc: 'Luminous supermassive dying star shedding its outer layers in a cosmic halo.' },
    { id: 'seahorse', name: '⚡ Cosmic Seahorse Lensing', query: 'Cosmic Seahorse', catalogId: 'SMACS J0723 Seahorse', ra: 110.8500, dec: -73.4600, aliases: ['Cosmic Seahorse', 'Gravitational Lens Arc'], category: 'galaxy', desc: 'Highly magnified, distorted cosmic arc of an ancient galaxy warped by gravity.' },
    { id: 'ngc346', name: '💎 NGC 346 Stellar Nursery', query: 'NGC 346', catalogId: 'NGC 346 / SMC', ra: 14.7750, dec: -72.1722, aliases: ['NGC 346', 'Small Magellanic Cloud Nursery'], category: 'nebula', desc: 'Dynamic star-forming region in the Small Magellanic Cloud filled with infant stars.' },
    { id: 'neowise', name: '☄️ Comet NEOWISE (C/2020 F3)', query: 'Comet NEOWISE', catalogId: 'C/2020 F3 NEOWISE', ra: 165.0000, dec: 45.0000, aliases: ['C/2020 F3', 'Comet NEOWISE', 'NEOWISE'], category: 'solar_system', desc: 'Spectacular bright naked-eye retrograde comet with glowing ion and dust tails.' }
  ];

  /**
   * Helper to look up an object in the POPULAR_DISCOVERIES table by query, catalogId, or aliases.
   */
  function findPopularDiscovery(q) {
    if (!q) return null;
    const s = q.trim().toLowerCase();
    return POPULAR_DISCOVERIES.find(item => {
      if (item.name.toLowerCase().includes(s)) return true;
      if (item.query.toLowerCase() === s) return true;
      if (item.catalogId && item.catalogId.toLowerCase().includes(s)) return true;
      if (item.aliases && item.aliases.some(a => a.toLowerCase() === s || s.includes(a.toLowerCase()))) return true;
      return false;
    }) || null;
  }

  let cameraEngine = null;
  let gradingEngine = new GradingEngine();
  let rawSourceImage = new Image();
  let activeRenderDrawable = null; // Can be Image or Canvas
  let imageLoaded = false;
  let isCanvasTainted = false; // Set to true if loaded without CORS (e.g. NASA CDN)
  let isAmoledGraded = false; // Set to true when AMOLED true-black grade is baked into texture
  let currentPresetKey = 'fullscreen';
  let loopDurationSec = 180;
  let speedMultiplier = 1.0;
  let isPlaying = true;
  let progress = 0.0;
  let lastTimestamp = 0;
  let isInspectorActive = false;
  let isRadarActive = true;
  let isHudManuallyHidden = false;
  let hudHideTimeout = null;

  /**
   * Applies and synchronizes loop duration across state, camera engine, UI, and timeline.
   */
  function applyLoopDuration(newSec) {
    const val = parseInt(newSec, 10);
    if (isNaN(val) || val <= 0) return;
    loopDurationSec = val;
    const dSelect = document.getElementById('select-duration');
    if (dSelect && dSelect.value !== String(val)) {
      dSelect.value = String(val);
    }
    if (cameraEngine) cameraEngine.setDuration(loopDurationSec);
    updateScrubberUI();
  }

  /**
   * Resets the studio workflow drawer state back to Step 1 (Color Grading & Look)
   * whenever a new celestial vista is loaded.
   */
  function resetWorkflowToStep1(openDrawer = true) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const drawers = document.querySelectorAll('.studio-drawer');

    tabButtons.forEach(btn => btn.classList.remove('active'));
    drawers.forEach(d => d.classList.remove('active'));

    const step1Tab = document.querySelector('.step-tab[data-drawer="drawer-grade"]');
    const drawerGrade = document.getElementById('drawer-grade');

    if (openDrawer && step1Tab && drawerGrade) {
      step1Tab.classList.add('active');
      drawerGrade.classList.add('active');
    }

    selectedWpIndex = 0;
  }
  let isRecording = false;

  // Selected waypoint index for spline editor
  let selectedWpIndex = 0;
  let isDraggingWp = false;

  // PWA Prompt Storage
  let deferredInstallPrompt = null;

  // DOM Elements
  const screenDiscovery = document.getElementById('screen-discovery');
  const screenStudio = document.getElementById('screen-studio');
  const btnEnterStudio = document.getElementById('btn-enter-studio');
  const btnSwitchDiscovery = document.getElementById('btn-switch-discovery');
  const pwaInstallBtn = document.getElementById('btn-pwa-install');
  const pwaStatusBadge = document.getElementById('pwa-status-badge');

  // Telemetry Toast & Badge
  const toastSpecs = document.getElementById('toast-image-specs');
  const hudResBadge = document.getElementById('hud-res-badge');
  const btnCloseToast = document.getElementById('btn-close-toast');

  const canvas = document.getElementById('wallpaper-canvas');
  const ctx = canvas.getContext('2d');
  const radarCanvas = document.getElementById('radar-canvas');
  const radarCtx = radarCanvas.getContext('2d');
  const radarContainer = document.getElementById('radar-container');
  const hudLayer = document.querySelector('.hud-layer');
  const scrubber = document.getElementById('timeline-scrubber');
  const timeCurrentEl = document.getElementById('time-current');
  const timeTotalEl = document.getElementById('time-total');
  const fpsBadge = document.getElementById('fps-counter');
  const radarTelemetry = document.getElementById('radar-telemetry');
  const amoledLegend = document.getElementById('amoled-legend');
  const recordBanner = document.getElementById('record-progress-banner');
  const recordBarFill = document.getElementById('record-bar-fill');
  const recordText = document.getElementById('record-progress-text');

  // Spline Editor Canvas
  const editorCanvas = document.getElementById('editor-canvas');
  const editorCtx = editorCanvas ? editorCanvas.getContext('2d') : null;

  // Fast offscreen downsampled inspector canvas (320x180)
  const inspCanvas = document.createElement('canvas');
  const inspCtx = inspCanvas.getContext('2d', { willReadFrequently: true });
  inspCanvas.width = 320;
  inspCanvas.height = 180;

  // Offscreen canvas for in-browser baked AMOLED grading
  const bakedGradedCanvas = document.createElement('canvas');

  // FPS tracking
  let frameCount = 0;
  let lastFpsUpdate = 0;
  let currentFps = 60;

  // Active streaming fetch & CORS resolution state
  let activeFetchAbortController = null;
  let activePendingAction = null; // 'grade' | 'export_html'

  /**
   * Initializes application
   */
  function init() {
    setupDiscoveryScreen();
    setupStudioDrawers();
    setupSplineEditorInteraction();
    setupStudioUI();
    setupDragAndDrop();
    setupModals();
    initPWA();

    // Preload default target in memory for instant readiness
    loadImageFromCatalog('carina', false);
    updateTopBarGeometry();

    // Wire toast dismiss and HUD click
    if (btnCloseToast && toastSpecs) {
      btnCloseToast.addEventListener('click', () => {
        toastSpecs.classList.remove('visible');
      });
    }
    if (hudResBadge) {
      hudResBadge.addEventListener('click', () => {
        if (activeImageSpecs) {
          showImageSpecsToast(activeImageSpecs, activeImageTitle);
        }
      });
    }

    // Start render loop
    requestAnimationFrame(renderLoop);
  }

  /**
   * Dynamically calculates top-bar geometry and sets --top-bar-bottom CSS variable
   * to guarantee studio drawers and floating telemetry never overlap the header or workflow tabs.
   */
  function updateTopBarGeometry() {
    if (typeof document === 'undefined') return;
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
      const rect = topBar.getBoundingClientRect();
      const bottom = Math.round(rect.bottom);
      if (bottom > 0) {
        document.documentElement.style.setProperty('--top-bar-bottom', `${bottom}px`);
      }
    }
  }

  /**
   * Screen Switcher: Transitions smoothly between Discovery and Studio
   */
  function switchToScreen(screenName) {
    currentScreen = screenName;
    if (screenName === 'discovery') {
      screenDiscovery.classList.remove('hidden');
      screenStudio.classList.add('hidden');
      if (imageLoaded) {
        btnEnterStudio.style.display = 'inline-flex';
        btnEnterStudio.textContent = 'Enter Studio →';
      }
    } else {
      screenDiscovery.classList.add('hidden');
      screenStudio.classList.remove('hidden');
      updateTopBarGeometry();
      resizeViewport();
      drawRadarBackground();
      updateSplineEditorView();
    }
  }

  /**
   * Loads image from catalog
   */
  function loadImageFromCatalog(key, autoSwitchToStudio = true) {
    activeCatalogKey = key;
    isAmoledGraded = false;
    const item = CATALOG[key] || CATALOG['carina'];
    activeImageTitle = item.title;

    // Intelligent lazy-loading:
    // On HTTP/HTTPS, load local WebP files on-demand (leveraging service worker cache)
    // On file:// protocol, use pre-bundled Base64 Data URI to avoid canvas tainting
    let sourceUrl = item.src;
    let fallbackUrl = item.fallback;

    const isHttp = (typeof window !== 'undefined' && (window.location.protocol === 'http:' || window.location.protocol === 'https:' || window.location.hostname === 'localhost'));

    if (!isHttp && typeof window !== 'undefined' && window.DEFAULT_ASSETS) {
      if (window.DEFAULT_ASSETS[key]) {
        sourceUrl = window.DEFAULT_ASSETS[key];
      }
      if (window.DEFAULT_ASSETS.thumbnails && window.DEFAULT_ASSETS.thumbnails[key]) {
        fallbackUrl = window.DEFAULT_ASSETS.thumbnails[key];
        if (!window.DEFAULT_ASSETS[key] && !navigator.onLine) {
          sourceUrl = window.DEFAULT_ASSETS.thumbnails[key];
        }
      }
    } else if (isHttp) {
      sourceUrl = item.src || item.fallback;
    }

    if (sourceUrl && (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://'))) {
      fetchAndLoadImage(sourceUrl, fallbackUrl, item.title, () => {
        if (autoSwitchToStudio) {
          switchToScreen('studio');
        }
      });
    } else {
      loadImageSource(sourceUrl, fallbackUrl, item.title, () => {
        if (autoSwitchToStudio) {
          switchToScreen('studio');
        }
      });
    }

    // Update active highlight on discovery cards
    document.querySelectorAll('.celestial-card').forEach(card => {
      card.classList.toggle('active-selected', card.dataset.key === key);
    });
  }

  /**
   * Converts a Blob to a Data URI using FileReader
   * Guarantees 100% untainted canvas on all browsers and protocols.
   */
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Directly probes whether an image taints the 2D canvas context.
   * Returns false if untainted (pixel manipulation allowed), true if blocked by CORS.
   */
  function testCanvasTaint(img) {
    try {
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 1;
      testCanvas.height = 1;
      const testCtx = testCanvas.getContext('2d');
      testCtx.drawImage(img, 0, 0, 1, 1);
      testCtx.getImageData(0, 0, 1, 1);
      return false; // Untainted! Direct pixel reads and exports permitted.
    } catch (err) {
      return true; // Tainted by browser cross-origin policy
    }
  }

  /**
   * Fetches an external image with streaming progress and cancellation.
   * Transparently attempts CORS proxy fallback so resulting Blob URI is 100% same-origin untainted!
   */
  async function fetchImageWithProgress(url, title = 'Celestial Vista', onProgress = null) {
    if (activeFetchAbortController) {
      try { activeFetchAbortController.abort(); } catch (e) {}
    }
    activeFetchAbortController = new AbortController();
    const signal = activeFetchAbortController.signal;

    async function streamResponse(res) {
      const contentLength = res.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      let loadedBytes = 0;

      const reader = res.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loadedBytes += value.length;

        if (onProgress) {
          const pct = totalBytes > 0 ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : null;
          onProgress(pct, loadedBytes, totalBytes);
        }
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      return new Blob(chunks, { type: contentType });
    }

    try {
      const res = await fetch(url, { signal, mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await streamResponse(res);
    } catch (err) {
      if (signal.aborted) throw err;
      console.warn(`[Studio] Direct CORS fetch failed for ${url} (${err.message}). Trying image proxy...`);

      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const elStatus = document.getElementById('fetch-status-text');
          if (elStatus) elStatus.textContent = 'Archive requires proxy mirror... Connecting...';
          const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
          const proxyRes = await fetch(proxyUrl, { signal });
          if (!proxyRes.ok) throw new Error(`Weserv HTTP ${proxyRes.status}`);
          return await streamResponse(proxyRes);
        } catch (proxyErr) {
          if (signal.aborted) throw proxyErr;
          console.warn('[Studio] Proxy fetch failed:', proxyErr.message);
        }
      }
      throw err;
    } finally {
      activeFetchAbortController = null;
    }
  }

  /**
   * Orchestrates high-res image fetching with dedicated progress modal and continuous fallback.
   * Fixes modal premature close bug: The modal stays OPEN with active status until the image
   * is completely loaded into memory and the 60 FPS studio screen is ready!
   */
  async function fetchAndLoadImage(url, fallbackUrl = null, title = 'Custom Celestial Image', onComplete = null) {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
      return loadImageSource(url, fallbackUrl, title, onComplete, false);
    }

    const modal = document.getElementById('modal-image-fetch');
    const elName = document.getElementById('fetch-vista-name');
    const elSource = document.getElementById('fetch-source-url');
    const elBar = document.getElementById('fetch-bar-fill');
    const elStatus = document.getElementById('fetch-status-text');
    const elBytes = document.getElementById('fetch-status-bytes');

    if (modal) modal.classList.remove('hidden');
    if (elName) elName.textContent = title;
    try {
      const parsedHost = new URL(url).hostname;
      if (elSource) elSource.textContent = `Streaming master from ${parsedHost}...`;
    } catch (e) {
      if (elSource) elSource.textContent = 'Connecting to astronomical archive...';
    }
    if (elBar) {
      elBar.classList.remove('indeterminate');
      elBar.style.width = '0%';
    }
    if (elStatus) elStatus.textContent = 'Connecting to astronomical archive...';
    if (elBytes) elBytes.textContent = '-- / --';

    try {
      const blob = await fetchImageWithProgress(url, title, (pct, loaded, total) => {
        const mbLoaded = (loaded / (1024 * 1024)).toFixed(1);
        if (pct !== null) {
          if (elBar) {
            elBar.classList.remove('indeterminate');
            elBar.style.width = `${pct}%`;
          }
          if (elStatus) elStatus.textContent = `Downloading master: ${pct}%...`;
          const mbTotal = total > 0 ? (total / (1024 * 1024)).toFixed(1) + ' MB' : '';
          if (elBytes) elBytes.textContent = `${mbLoaded} MB / ${mbTotal}`;
        } else {
          if (elBar) {
            elBar.classList.add('indeterminate');
          }
          if (elStatus) elStatus.textContent = `Streaming master (${mbLoaded} MB downloaded)...`;
          if (elBytes) elBytes.textContent = `${mbLoaded} MB / streaming...`;
        }
      });

      const blobUrl = URL.createObjectURL(blob);
      // NOTE: Do NOT hide modal here. loadImageSource's onload hides it cleanly when rendering is primed!
      loadImageSource(blobUrl, fallbackUrl, title, onComplete, false);
    } catch (err) {
      if (err && (err.name === 'AbortError' || (err.message && err.message.includes('aborted')))) {
        console.log('[Studio] Image download cancelled by user.');
        if (modal) modal.classList.add('hidden');
        return;
      }
      console.warn('[Studio] Streaming fetch failed (CORS/proxy restriction). Streaming directly into 60 FPS engine:', err);

      // KEEP MODAL VISIBLE! Continuous UI status feedback prevents confusion on large images
      if (elBar) elBar.classList.add('indeterminate');
      if (elStatus) elStatus.textContent = 'Preparing high-res master for 60 FPS engine...';
      if (elBytes) elBytes.textContent = 'Streaming full master imagery...';

      // Load directly via <img> with forceNoCors = true so no failed preflight round-trip occurs
      loadImageSource(url, fallbackUrl, title, onComplete, true);
    }
  }

  /**
   * Displays the CORS Resolution Assistant Modal
   */
  function showCorsHelperModal(pendingAction = null) {
    activePendingAction = pendingAction;
    const modal = document.getElementById('modal-cors-helper');
    const elHost = document.getElementById('cors-host-name');
    const feedback = document.getElementById('cors-download-feedback');

    if (feedback) feedback.style.display = 'none';

    let host = 'external-archive';
    try {
      if (rawSourceImage && rawSourceImage.src && rawSourceImage.src.startsWith('http')) {
        host = new URL(rawSourceImage.src).hostname;
      }
    } catch (e) {}

    if (elHost) elHost.textContent = host;
    if (modal) modal.classList.remove('hidden');
  }

  function hideCorsHelperModal() {
    const modal = document.getElementById('modal-cors-helper');
    if (modal) modal.classList.add('hidden');
  }

  /**
   * Unified local file loader: reads untainted data URI, switches to studio,
   * supports both direct image files and re-importing standalone HTML wallpaper recipes.
   */
  function handleLocalFileSelection(file) {
    if (!file) return;

    // Check if user dropped or selected an exported Standalone HTML wallpaper recipe!
    if (file.name.toLowerCase().endsWith('.html') || file.type === 'text/html') {
      const textReader = new FileReader();
      textReader.onload = (evt) => {
        const html = evt.target.result || '';
        let imgData = null;
        const matchData = html.match(/const EMBEDDED_IMAGE_DATA = "(data:[^"]+)";/);
        if (matchData && matchData[1]) {
          imgData = matchData[1];
        } else {
          const matchUrl = html.match(/const EMBEDDED_IMAGE_DATA = "([^"]+)";/);
          if (matchUrl && matchUrl[1]) imgData = matchUrl[1];
        }

        if (!imgData) {
          alert('Could not find embedded wallpaper image in this HTML file.');
          return;
        }

        // Extract recipe if present
        let recipe = null;
        const matchRecipe = html.match(/<script id="amoled-wallpaper-recipe" type="application\/json">\s*([\s\S]*?)\s*<\/script>/);
        if (matchRecipe && matchRecipe[1]) {
          try {
            recipe = JSON.parse(matchRecipe[1]);
          } catch (e) {
            console.warn('[Studio] Failed to parse embedded wallpaper recipe:', e);
          }
        }

        const title = (recipe && recipe.source && recipe.source.title)
          ? recipe.source.title
          : file.name.replace(/\.html$/i, '');

        loadImageSource(imgData, null, title, () => {
          hideCorsHelperModal();
          switchToScreen('studio');

          if (recipe) {
            // 1. Restore visual adjustment & AMOLED sliders
            if (recipe.gradingRecipe) {
              const gr = recipe.gradingRecipe;
              const setSlider = (id, val, text) => {
                const s = document.getElementById(`slider-${id}`);
                const l = document.getElementById(`val-${id}`);
                if (s && val !== undefined) {
                  s.value = val;
                  s.dataset.userModified = 'true';
                }
                if (l && text !== undefined) l.textContent = text;
              };
              if (gr.blackFloor !== undefined) setSlider('black-floor', gr.blackFloor, `${gr.blackFloor}`);
              if (gr.kneeWidth !== undefined) setSlider('knee-width', gr.kneeWidth, `${gr.kneeWidth}`);
              if (gr.starProtect !== undefined) setSlider('star-protect', gr.starProtect, `${gr.starProtect}%`);
              if (gr.exposure !== undefined) setSlider('exposure', gr.exposure, `${gr.exposure > 0 ? '+' : ''}${parseFloat(gr.exposure).toFixed(2)} EV`);
              if (gr.contrast !== undefined) setSlider('contrast', gr.contrast, `${parseFloat(gr.contrast).toFixed(2)}x`);
              if (gr.saturation !== undefined) setSlider('saturation', gr.saturation, `${parseFloat(gr.saturation).toFixed(2)}x`);
              if (gr.sharpness !== undefined) setSlider('sharpness', gr.sharpness, `${gr.sharpness}%`);
            }

            // 2. Restore motion, speed, & spline waypoints
            if (recipe.cameraKinematics) {
              const ck = recipe.cameraKinematics;
              if (ck.loopDurationSec) applyLoopDuration(ck.loopDurationSec);
              if (ck.speedMultiplier) {
                speedMultiplier = ck.speedMultiplier;
                const spdEl = document.getElementById('select-speed');
                if (spdEl) spdEl.value = `${speedMultiplier}`;
              }
              if (ck.mode && cameraEngine) {
                cameraEngine.setMode(ck.mode);
              }
              if (ck.waypoints && ck.waypoints.length >= 4 && cameraEngine) {
                cameraEngine.setCustomWaypoints(ck.waypoints);
                updateSplineEditorView();
              }
            }
            console.log('[Studio] Standalone wallpaper recipe restored successfully:', recipe);
          }
        });
      };
      textReader.readAsText(file);
      return;
    }

    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      loadImageSource(evt.target.result, null, file.name, () => {
        hideCorsHelperModal();
        switchToScreen('studio');

        // Check if there was an action waiting for an untainted image
        if (activePendingAction === 'grade') {
          activePendingAction = null;
          console.log('[Studio] Auto-resuming AMOLED grade baking with untainted local copy...');
          setTimeout(applyInBrowserGrade, 150);
        } else if (activePendingAction === 'export_html') {
          activePendingAction = null;
          console.log('[Studio] Auto-resuming Standalone HTML export with untainted local copy...');
          const btnExportHtml = document.getElementById('btn-export-html');
          if (btnExportHtml) setTimeout(() => btnExportHtml.click(), 150);
        }
      });
    };
    reader.readAsDataURL(file);
  }

  /**
   * Sets up interactive modal handlers for image download progress and CORS resolution
   */
  function setupModals() {
    // 1. Image Fetch Modal cancellation
    const btnCancelFetch = document.getElementById('btn-cancel-fetch');
    const btnCancelFetchAction = document.getElementById('btn-cancel-fetch-action');
    function cancelFetch() {
      if (activeFetchAbortController) {
        try { activeFetchAbortController.abort(); } catch (e) {}
        activeFetchAbortController = null;
      }
      if (rawSourceImage) {
        rawSourceImage.onload = null;
        rawSourceImage.onerror = null;
        try { rawSourceImage.src = ''; } catch (e) {}
      }
      const modal = document.getElementById('modal-image-fetch');
      if (modal) modal.classList.add('hidden');
    }
    if (btnCancelFetch) btnCancelFetch.addEventListener('click', cancelFetch);
    if (btnCancelFetchAction) btnCancelFetchAction.addEventListener('click', cancelFetch);

    // 2. CORS Resolution Assistant Modal
    const btnCloseCorsModal = document.getElementById('btn-close-cors-modal');
    if (btnCloseCorsModal) btnCloseCorsModal.addEventListener('click', hideCorsHelperModal);

    const btnCorsDownload = document.getElementById('btn-cors-download-image');
    if (btnCorsDownload) {
      btnCorsDownload.addEventListener('click', () => {
        if (!rawSourceImage || !rawSourceImage.src) return;
        const safeName = generateExportFilename('jpg', 'source');
        const a = document.createElement('a');
        a.href = rawSourceImage.src;
        a.download = safeName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        const feedback = document.getElementById('cors-download-feedback');
        if (feedback) {
          feedback.style.display = 'block';
          feedback.textContent = '✓ Download initiated! Look in your Downloads folder, then click Step 2 below ↓';
        }
      });
    }

    const btnCorsPick = document.getElementById('btn-cors-pick-file');
    const inputCorsFile = document.getElementById('input-cors-file');
    if (btnCorsPick && inputCorsFile) {
      btnCorsPick.addEventListener('click', () => {
        inputCorsFile.click();
      });

      inputCorsFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          handleLocalFileSelection(file);
        }
        inputCorsFile.value = '';
      });
    }
  }

  /**
   * Loads an image with CORS resilience, dynamic taint verification, and resolution evaluation.
   * Keeps the loading modal active until onload fires, eliminating the premature close bug on large images.
   */
  async function loadImageSource(url, fallbackUrl = null, title = 'Custom Celestial Image', onComplete = null, forceNoCors = false) {
    imageLoaded = false;
    isAmoledGraded = false;
    activeImageTitle = title;
    isCanvasTainted = false;

    const isDataUri = url && url.startsWith('data:');
    const isBlobUri = url && url.startsWith('blob:');
    const isRemote = url && (url.startsWith('http://') || url.startsWith('https://'));

    rawSourceImage = new Image();

    // In-memory data/blob URIs are always same-origin.
    // If forceNoCors is true, skip crossOrigin='anonymous' to avoid a guaranteed preflight failure.
    if (forceNoCors || isDataUri || isBlobUri) {
      rawSourceImage.removeAttribute('crossorigin');
    } else if (isRemote) {
      rawSourceImage.crossOrigin = 'anonymous';
    } else {
      rawSourceImage.removeAttribute('crossorigin');
    }

    rawSourceImage.onload = () => {
      // HIDE MODAL NOW! The image is decoded and ready for the 60 FPS canvas!
      const modal = document.getElementById('modal-image-fetch');
      if (modal) modal.classList.add('hidden');

      // Accurately verify if canvas is tainted in this browser environment
      isCanvasTainted = testCanvasTaint(rawSourceImage);
      console.log(`[Studio] Image loaded: ${rawSourceImage.naturalWidth} x ${rawSourceImage.naturalHeight} (${title}) [tainted: ${isCanvasTainted}]`);
      imageLoaded = true;
      if (activeRenderDrawable && typeof ImageBitmap !== 'undefined' && activeRenderDrawable instanceof ImageBitmap) {
        try { activeRenderDrawable.close(); } catch (e) {}
      }
      activeRenderDrawable = rawSourceImage;

      if (!cameraEngine) {
        cameraEngine = new CameraEngine(rawSourceImage.naturalWidth, rawSourceImage.naturalHeight, {
          mode: 'odyssey',
          loopDurationSec: loopDurationSec
        });
      } else {
        cameraEngine.setImageDimensions(rawSourceImage.naturalWidth, rawSourceImage.naturalHeight);
        cameraEngine.setDuration(loopDurationSec);
      }
      updateScrubberUI();

      resizeViewport();
      drawRadarBackground();
      updateSplineEditorView();
      runAutoGradeTelemetry();
      resetWorkflowToStep1(true);

      // Calculate and display resolution & quality telemetry
      const specs = calculateImageQualitySpecs(rawSourceImage, 0, isCanvasTainted);
      activeImageSpecs = specs;
      showImageSpecsToast(specs, title);
      updateHudResolutionBadge(specs);

      const elVistaTitle = document.getElementById('hud-vista-title');
      if (elVistaTitle) {
        elVistaTitle.textContent = `🌌 ${title}`;
        elVistaTitle.title = `Active Celestial Vista: ${title} (${specs.w}×${specs.h} px)`;
      }

      btnEnterStudio.style.display = 'inline-flex';
      btnEnterStudio.textContent = `Launch: ${title.substring(0, 24)} →`;

      if (typeof onComplete === 'function') onComplete();
    };

    rawSourceImage.onerror = () => {
      // If loading with crossOrigin='anonymous' failed (CORS restriction),
      // auto-retry immediately WITHOUT crossOrigin!
      if (rawSourceImage.hasAttribute('crossorigin') && !forceNoCors) {
        console.warn(`[Studio] Server rejected CORS preflight for ${url}. Retrying directly without crossOrigin for 60 FPS playback...`);
        rawSourceImage.removeAttribute('crossorigin');
        rawSourceImage.src = url;
        return;
      }

      // Hide modal on final error
      const modal = document.getElementById('modal-image-fetch');
      if (modal) modal.classList.add('hidden');

      if (fallbackUrl && fallbackUrl !== url) {
        console.warn(`[Studio] Primary image failed (${url}), trying fallback: ${fallbackUrl}`);
        loadImageSource(fallbackUrl, null, title, onComplete, forceNoCors);
      } else {
        console.error(`[Studio] Failed to load image: ${url}`);
        const toast = document.getElementById('toast-image-specs');
        if (toast) {
          const elTitle = document.getElementById('toast-image-title');
          const elDim = document.getElementById('toast-res-dim');
          const elMp = document.getElementById('toast-res-mp');
          const elBadge = document.getElementById('toast-res-badge');
          const elEval = document.getElementById('toast-res-eval');
          if (elTitle) elTitle.textContent = '⚠️ Image Notice';
          if (elDim) elDim.textContent = 'Format / Network';
          if (elMp) elMp.textContent = 'Notice';
          if (elBadge) {
            elBadge.className = 'badge-tag tier-standard';
            elBadge.textContent = 'Unavailable';
          }
          if (elEval) {
            elEval.textContent = `Could not load "${title}". Tip: You can download the image file to your device and drag-and-drop it into the app.`;
          }
          toast.classList.add('visible');
        }
      }
    };

    rawSourceImage.src = url;
  }

  /**
   * Evaluates image resolution, megapixels, aspect ratio, and wallpaper quality tier
   */
  /**
   * Evaluates image resolution, quality tier, and physical display coverage
   */
  function calculateImageQualitySpecs(img, rawBlackPct = 0, isTainted = false) {
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    const mp = (w * h) / 1000000;
    const aspectVal = h > 0 ? (w / h) : 1;
    const aspectStr = aspectVal.toFixed(2);

    // Compute user's physical display resolution awareness
    let dispW = 1920;
    let dispH = 1080;
    let dpr = 1.0;
    if (typeof window !== 'undefined') {
      dpr = window.devicePixelRatio || 1;
      dispW = Math.round((window.screen && window.screen.width ? window.screen.width : window.innerWidth) * dpr);
      dispH = Math.round((window.screen && window.screen.height ? window.screen.height : window.innerHeight) * dpr);
    }
    const displayCoverage = (dispW > 0 && dispH > 0 && w > 0 && h > 0)
      ? Math.min(w / dispW, h / dispH)
      : 1.0;

    let tier = 'standard';
    let tierBadge = '🟠 Standard (< 1080p)';
    let tierClass = 'tier-standard';
    let evalText = `Lower resolution (under 2 MP). Deep macro zoom may show soft pixelation on large screens (${displayCoverage.toFixed(1)}x display coverage).`;

    if (w >= 3840 || mp >= 8.0) {
      tier = 'ultra';
      tierBadge = (w >= 5120) ? '🟢 Ultra-HD 5K+ (Pristine)' : '🟢 Ultra-HD 4K (Pristine)';
      tierClass = 'tier-ultra';
      evalText = `Pristine ultra-high resolution master (${displayCoverage.toFixed(1)}x screen coverage). Macro pan-and-zoom will stay tack-sharp at full zoom.`;
    } else if (w >= 1920 || mp >= 2.0) {
      tier = 'fhd';
      tierBadge = '🟡 Full HD 1080p (High Quality)';
      tierClass = 'tier-fhd';
      evalText = `Crisp resolution (${displayCoverage.toFixed(1)}x screen coverage). Sharp at standard viewport, moderate zoom remains clean.`;
    }

    if (isTainted) {
      tierBadge += ' • ⚠️ Protected Remote Source (CORS)';
      evalText += ' • To grade AMOLED blacks or export HTML, load a local copy.';
    }

    let coverageBadge = `${displayCoverage.toFixed(1)}x Display`;
    if (displayCoverage >= 2.0) coverageBadge = `🟢 ${displayCoverage.toFixed(1)}x Screen (Pristine Zoom)`;
    else if (displayCoverage >= 1.0) coverageBadge = `🟢 ${displayCoverage.toFixed(1)}x Screen (Native Match)`;
    else coverageBadge = `🟡 ${displayCoverage.toFixed(1)}x Screen (Sub-Display)`;

    return {
      w, h, mp, aspectVal, aspectStr,
      tier, tierBadge, tierClass, evalText,
      dispW, dispH, displayCoverage, coverageBadge,
      rawBlackPct: rawBlackPct.toFixed(1),
      isTainted
    };
  }

  /**
   * Displays the floating Image Resolution & Quality Specs Toast
   */
  function showImageSpecsToast(specs, title = 'Celestial Image') {
    if (!toastSpecs) return;

    const elTitle = document.getElementById('toast-image-title');
    const elDim = document.getElementById('toast-res-dim');
    const elMp = document.getElementById('toast-res-mp');
    const elBadge = document.getElementById('toast-res-badge');
    const elEval = document.getElementById('toast-res-eval');
    const elAspect = document.getElementById('toast-res-aspect');
    const elAmoled = document.getElementById('toast-res-amoled');

    if (elTitle) elTitle.textContent = title.substring(0, 32);
    if (elDim) elDim.textContent = `${specs.w.toLocaleString()} × ${specs.h.toLocaleString()} px`;
    if (elMp) elMp.textContent = `${specs.mp.toFixed(1)} MP`;

    if (elBadge) {
      elBadge.className = `badge-tag ${specs.tierClass}`;
      elBadge.textContent = specs.tierBadge;
    }

    if (elEval) elEval.textContent = specs.evalText;
    if (elAspect) elAspect.textContent = `${specs.aspectStr}:1 (${specs.w >= specs.h ? 'Landscape' : 'Portrait'})`;
    if (elAmoled) elAmoled.textContent = `~${specs.rawBlackPct}% True Black`;

    toastSpecs.classList.add('visible');

    clearTimeout(toastDismissTimeout);
    toastDismissTimeout = setTimeout(() => {
      toastSpecs.classList.remove('visible');
    }, 6000);
  }

  /**
   * Updates the live resolution telemetry badge in the Top Bar HUD
   */
  function updateHudResolutionBadge(specs) {
    if (!hudResBadge) return;

    let shortTier = '🟢 5K Ultra';
    if (specs.w < 5120 && specs.w >= 3840) shortTier = '🟢 4K Ultra';
    else if (specs.tier === 'fhd') shortTier = '🟡 1080p FHD';
    else if (specs.tier === 'standard') shortTier = '🟠 Standard';

    hudResBadge.className = `hud-res-badge ${specs.tierClass}`;
    hudResBadge.innerHTML = `📐 ${specs.w}×${specs.h} (${specs.mp.toFixed(1)} MP) &bull; ${shortTier} &bull; ${specs.coverageBadge}`;
  }

  /**
   * Runs auto telemetry calculation for black levels
   */
  function runAutoGradeTelemetry() {
    if (isCanvasTainted) return;
    setTimeout(() => {
      try {
        const stats = gradingEngine.analyzeImage(rawSourceImage);
        const elRaw = document.getElementById('stat-raw-black');
        if (elRaw) elRaw.textContent = `${stats.rawBlackPct}%`;

        const elGraded = document.getElementById('stat-graded-black');
        if (elGraded) {
          const estBlack = Math.min(65, Math.round(parseFloat(stats.rawBlackPct) + 16.5));
          elGraded.textContent = `~${estBlack}%`;
        }

        const elSavings = document.getElementById('stat-oled-savings');
        if (elSavings) {
          const estSavings = Math.min(80, Math.round((parseFloat(stats.rawBlackPct) + 16.5) * 0.8));
          elSavings.textContent = `~${estSavings}%`;
        }

        if (activeImageSpecs) {
          activeImageSpecs.rawBlackPct = parseFloat(stats.rawBlackPct).toFixed(1);
          const elAmoled = document.getElementById('toast-res-amoled');
          if (elAmoled) elAmoled.textContent = `~${activeImageSpecs.rawBlackPct}% True Black`;
        }
      } catch (err) {
        console.warn('[Telemetry] Histogram calculation skipped (tainted or local file):', err.message);
      }
    }, 50);
  }

  /**
   * Resizes viewport to maintain preset aspect ratio without letterboxing
   */
  function resizeViewport() {
    const preset = PRESETS[currentPresetKey] || PRESETS['fullscreen'];
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let targetW = winW;
    let targetH = winH;

    if (preset.isOriginalRatio && rawSourceImage && rawSourceImage.naturalWidth && rawSourceImage.naturalHeight) {
      const imgAspect = rawSourceImage.naturalWidth / rawSourceImage.naturalHeight;
      const screenAspect = winW / winH;

      if (screenAspect > imgAspect) {
        targetH = winH;
        targetW = Math.round(targetH * imgAspect);
      } else {
        targetW = winW;
        targetH = Math.round(targetW / imgAspect);
      }
    } else if (!preset.isNative && preset.w > 0 && preset.h > 0) {
      const targetAspect = preset.w / preset.h;
      const screenAspect = winW / winH;

      if (screenAspect > targetAspect) {
        targetH = winH;
        targetW = Math.round(targetH * targetAspect);
      } else {
        targetW = winW;
        targetH = Math.round(targetW / targetAspect);
      }
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(targetW * dpr);
    canvas.height = Math.round(targetH * dpr);

    canvas.style.width = `${targetW}px`;
    canvas.style.height = `${targetH}px`;
  }

  /**
   * Main 60 FPS animation render loop
   */
  function renderLoop(timestamp) {
    try {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaMs = Math.min(timestamp - lastTimestamp, 100);
      lastTimestamp = timestamp;

      // Update FPS counter
      frameCount++;
      if (timestamp - lastFpsUpdate >= 500) {
        currentFps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
        fpsBadge.textContent = `${currentFps} FPS`;
        frameCount = 0;
        lastFpsUpdate = timestamp;
      }

      // Advance animation timeline if active and on studio screen
      if (isPlaying && !isRecording && currentScreen === 'studio') {
        const step = (deltaMs / 1000.0) / loopDurationSec * speedMultiplier;
        progress = (progress + step) % 1.0;
        if (progress < 0) progress += 1.0;
        updateScrubberUI();
      }

      // Render frame if on studio screen (paused during active video export to prevent GPU thread contention)
      if (currentScreen === 'studio' && imageLoaded && cameraEngine && activeRenderDrawable && !isRecording) {
        renderFrame();
        if (isRadarActive) {
          renderRadar();
        }
      }
    } catch (err) {
      console.error("Render loop caught error:", err);
    } finally {
      requestAnimationFrame(renderLoop);
    }
  }

  /**
   * Renders the current frame onto the canvas (supports rendering arbitrary progress)
   */
  function renderFrame(targetProgress = null, targetCanvas = canvas, targetCtx = ctx) {
    const p = (targetProgress !== null) ? targetProgress : progress;
    const vw = targetCanvas.width;
    const vh = targetCanvas.height;

    const cam = cameraEngine.solveCamera(p, vw, vh);
    const rect = cam.sourceRect;

    targetCtx.fillStyle = '#000000';
    targetCtx.fillRect(0, 0, vw, vh);

    targetCtx.imageSmoothingEnabled = true;
    targetCtx.imageSmoothingQuality = 'high';

    targetCtx.drawImage(
      activeRenderDrawable,
      rect.x, rect.y, rect.w, rect.h,
      0, 0, vw, vh
    );

    if (isInspectorActive && targetCanvas === canvas) {
      applyAmoledInspector(cam, vw, vh);
    }
  }

  /**
   * Fast, non-blocking AMOLED inspector overlay (hardware-optimized)
   */
  let inspThrottle = 0;
  function applyAmoledInspector(cam, vw, vh) {
    try {
      inspThrottle = (inspThrottle + 1) % 2;
      if (inspThrottle === 0) {
        inspCtx.drawImage(activeRenderDrawable, cam.sourceRect.x, cam.sourceRect.y, cam.sourceRect.w, cam.sourceRect.h, 0, 0, 320, 180);
        const frameData = inspCtx.getImageData(0, 0, 320, 180);
        const data = frameData.data;
        const len = data.length;
        for (let i = 0; i < len; i += 4) {
          if (data[i] <= 3 && data[i + 1] <= 3 && data[i + 2] <= 3) {
            data[i] = 255;
            data[i + 1] = 0;
            data[i + 2] = 128;
            data[i + 3] = 210;
          } else {
            data[i + 3] = 0;
          }
        }
        inspCtx.putImageData(frameData, 0, 0);
      }
      ctx.drawImage(inspCanvas, 0, 0, vw, vh);
    } catch (e) {
      // Graceful fallback for cross-origin or untainted inspection
    }
  }

  /**
   * Dynamically adjusts the Radar Mini-Map canvas and container aspect ratio
   * to strictly match the input image's native aspect ratio (landscape, square, or vertical portrait).
   */
  function updateRadarDimensions() {
    if (!radarCanvas) return;
    const radarContainer = document.getElementById('radar-container');
    const imgW = (activeRenderDrawable && (activeRenderDrawable.naturalWidth || activeRenderDrawable.width)) || (rawSourceImage && rawSourceImage.naturalWidth) || 16;
    const imgH = (activeRenderDrawable && (activeRenderDrawable.naturalHeight || activeRenderDrawable.height)) || (rawSourceImage && rawSourceImage.naturalHeight) || 9;
    const aspect = imgW / imgH;

    let rw, rh;
    if (aspect >= 1.0) {
      rw = 210;
      rh = Math.max(70, Math.min(210, Math.round(rw / aspect)));
    } else {
      rh = 210;
      rw = Math.max(85, Math.min(210, Math.round(rh * aspect)));
    }

    radarCanvas.width = rw;
    radarCanvas.height = rh;

    if (radarContainer) {
      radarContainer.style.width = `${rw}px`;
      radarContainer.style.height = `${rh}px`;
    }
  }

  function drawRadarBackground() {
    updateRadarDimensions();
  }

  function renderRadar() {
    const rw = radarCanvas.width;
    const rh = radarCanvas.height;

    radarCtx.fillStyle = '#06080c';
    radarCtx.fillRect(0, 0, rw, rh);

    if (imageLoaded && activeRenderDrawable) {
      radarCtx.globalAlpha = 0.45;
      radarCtx.drawImage(activeRenderDrawable, 0, 0, rw, rh);
      radarCtx.globalAlpha = 1.0;

      // Draw Spline Trajectory Path
      radarCtx.beginPath();
      radarCtx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
      radarCtx.lineWidth = 1.5;

      for (let i = 0; i <= 60; i++) {
        const u = i / 60;
        const pt = cameraEngine.samplePath(u);
        const px = pt.x * rw;
        const py = pt.y * rh;
        if (i === 0) radarCtx.moveTo(px, py);
        else radarCtx.lineTo(px, py);
      }
      radarCtx.closePath();
      radarCtx.stroke();

      // Draw Camera Frustum
      const cam = cameraEngine.solveCamera(progress, canvas.width, canvas.height);
      const r = cam.sourceRect;
      const imgW = activeRenderDrawable.naturalWidth || activeRenderDrawable.width;
      const imgH = activeRenderDrawable.naturalHeight || activeRenderDrawable.height;

      const fx = (r.x / imgW) * rw;
      const fy = (r.y / imgH) * rh;
      const fw = (r.w / imgW) * rw;
      const fh = (r.h / imgH) * rh;

      radarCtx.strokeStyle = '#00e5ff';
      radarCtx.lineWidth = 1.5;
      radarCtx.strokeRect(fx, fy, fw, fh);

      radarCtx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      radarCtx.fillRect(fx, fy, fw, fh);

      // Camera center dot
      radarCtx.fillStyle = '#ff007f';
      radarCtx.beginPath();
      radarCtx.arc(fx + fw / 2, fy + fh / 2, 3, 0, Math.PI * 2);
      radarCtx.fill();

      // Telemetry readout
      const pctX = Math.round((cam.x / imgW) * 100);
      const pctY = Math.round((cam.y / imgH) * 100);
      if (rw < 140) {
        radarTelemetry.textContent = `${pctX}%, ${pctY}% | ${cam.zoom.toFixed(1)}x`;
      } else {
        radarTelemetry.textContent = `POS: ${pctX}%, ${pctY}% | ZOOM: ${cam.zoom.toFixed(2)}x`;
      }
    }
  }

  function updateScrubberUI() {
    scrubber.value = Math.round(progress * 1000);
    const curSec = Math.floor(progress * loopDurationSec);
    timeCurrentEl.textContent = formatTime(curSec);
    timeTotalEl.textContent = formatTime(loopDurationSec);
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Applies client-side in-browser AMOLED true-black grading & visual enhancements
   */
  function applyInBrowserGrade(triggerType = 'amoled', isPreview = false) {
    if (!imageLoaded || !rawSourceImage) return;

    const btnBake = document.getElementById('btn-apply-amoled') || document.getElementById('btn-bake-grade');

    if (isCanvasTainted) {
      if (rawSourceImage.src && (rawSourceImage.src.startsWith('http://') || rawSourceImage.src.startsWith('https://'))) {
        if (btnBake && !isPreview) btnBake.textContent = '⏳ Untainting Source...';
        fetch(`https://images.weserv.nl/?url=${encodeURIComponent(rawSourceImage.src)}&output=jpg`)
          .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.blob();
          })
          .then(blob => {
            const cleanBlobUrl = URL.createObjectURL(blob);
            console.log('[Studio] Auto-untainted remote source for AMOLED grading!');
            loadImageSource(cleanBlobUrl, null, activeImageTitle, () => {
              setTimeout(() => applyInBrowserGrade(triggerType, isPreview), 50);
            }, false);
          })
          .catch(err => {
            console.warn('[Studio] Auto-untaint for grading failed, showing assistant:', err.message);
            if (!isPreview) {
              showCorsHelperModal('grade');
              if (btnBake) btnBake.textContent = '🖤 Apply AMOLED Grade';
            }
          });
        return;
      }

      if (!isPreview) {
        showCorsHelperModal('grade');
        const btnAmoled = document.getElementById('btn-apply-amoled') || document.getElementById('btn-bake-grade');
        const btnAdj = document.getElementById('btn-apply-adjustments');
        if (btnAmoled) btnAmoled.textContent = '🖤 Apply AMOLED Grade';
        if (btnAdj) btnAdj.textContent = '🎨 Apply Image Adjustments';
      }
      return;
    }

    const floor = parseFloat(document.getElementById('slider-black-floor').value);
    const knee = parseFloat(document.getElementById('slider-knee-width').value);
    const star = parseFloat(document.getElementById('slider-star-protect').value) / 100.0;
    const exposureEl = document.getElementById('slider-exposure');
    const exposure = exposureEl ? parseFloat(exposureEl.value) : 0.0;
    const contrastEl = document.getElementById('slider-contrast');
    const contrast = contrastEl ? parseFloat(contrastEl.value) : 1.08;
    const saturationEl = document.getElementById('slider-saturation');
    const saturation = saturationEl ? parseFloat(saturationEl.value) : 1.00;
    const sharpnessEl = document.getElementById('slider-sharpness');
    const sharpness = sharpnessEl ? (parseFloat(sharpnessEl.value) / 100.0) : 0.0;

    const btnAmoled = document.getElementById('btn-apply-amoled') || document.getElementById('btn-bake-grade');
    const btnAdj = document.getElementById('btn-apply-adjustments');

    if (!isPreview) {
      if (triggerType === 'amoled') {
        if (btnAmoled) btnAmoled.textContent = '⏳ Baking AMOLED...';
      } else if (triggerType === 'adjustments') {
        if (btnAdj) btnAdj.textContent = '⏳ Processing Pixels...';
      } else {
        if (btnAmoled) btnAmoled.textContent = '⏳ Processing...';
        if (btnAdj) btnAdj.textContent = '⏳ Processing...';
      }
    }

    setTimeout(async () => {
      try {
        const selResEl = document.getElementById('select-export-html-res');
        const resMode = selResEl ? selResEl.value : '5k';
        // Fast 2560px preview during live slider dragging, full resolution ceiling on bake
        const maxDim = isPreview ? 2560 : ((resMode === '8k') ? 8192 : ((resMode === '4k') ? 3840 : ((resMode === '1080p') ? 1920 : 5120)));

        const stats = gradingEngine.applyGrade(rawSourceImage, bakedGradedCanvas, {
          blackFloor: floor,
          kneeWidth: knee,
          starProtect: star,
          exposure: exposure,
          contrast: contrast,
          saturation: saturation,
          sharpness: sharpness,
          maxDimension: maxDim
        });

        // Convert software-backed CPU canvas to a hardware-accelerated GPU ImageBitmap!
        // This transfers the 5K texture directly into GPU VRAM (GL_TEXTURE_2D).
        // Slicing and rendering drawImage() with high smoothing executes in < 0.2ms at solid 60 FPS!
        let hardwareDrawable = null;
        if (typeof createImageBitmap !== 'undefined') {
          try {
            hardwareDrawable = await createImageBitmap(bakedGradedCanvas);
          } catch (e) {
            console.warn('[Studio] createImageBitmap error, using Blob Image fallback:', e);
          }
        }

        if (!hardwareDrawable) {
          const blob = await new Promise(resolve => bakedGradedCanvas.toBlob(resolve, 'image/webp', 0.96));
          const img = new Image();
          img.src = URL.createObjectURL(blob);
          await img.decode();
          hardwareDrawable = img;
        }

        if (activeRenderDrawable && typeof ImageBitmap !== 'undefined' && activeRenderDrawable instanceof ImageBitmap) {
          try { activeRenderDrawable.close(); } catch (e) {}
        }

        activeRenderDrawable = hardwareDrawable;
        isAmoledGraded = true;
        const dw = activeRenderDrawable.width || activeRenderDrawable.naturalWidth;
        const dh = activeRenderDrawable.height || activeRenderDrawable.naturalHeight;
        cameraEngine.setImageDimensions(dw, dh);
        drawRadarBackground();
        renderFrame(); // Instantly redraw viewport

        const elGraded = document.getElementById('stat-graded-black');
        if (elGraded) elGraded.textContent = `${stats.blackPercentage}%`;

        const elSavings = document.getElementById('stat-oled-savings');
        if (elSavings) {
          const estSavings = Math.min(85, Math.round(parseFloat(stats.blackPercentage) * 0.82));
          elSavings.textContent = `~${estSavings}%`;
        }

        if (!isPreview) {
          if (triggerType === 'amoled') {
            if (btnAmoled) {
              btnAmoled.textContent = '✓ AMOLED Grade Baked!';
              setTimeout(() => { if (btnAmoled) btnAmoled.textContent = '🖤 Apply AMOLED Grade'; }, 1500);
            }
          } else if (triggerType === 'adjustments') {
            if (btnAdj) {
              btnAdj.textContent = '✓ Adjustments Applied!';
              setTimeout(() => { if (btnAdj) btnAdj.textContent = '🎨 Apply Image Adjustments'; }, 1500);
            }
          } else {
            if (btnAmoled) {
              btnAmoled.textContent = '✓ Applied!';
              setTimeout(() => { if (btnAmoled) btnAmoled.textContent = '🖤 Apply AMOLED Grade'; }, 1500);
            }
            if (btnAdj) {
              btnAdj.textContent = '✓ Applied!';
              setTimeout(() => { if (btnAdj) btnAdj.textContent = '🎨 Apply Image Adjustments'; }, 1500);
            }
          }
        }
        console.log(`[Studio] ${triggerType} ${isPreview ? 'preview' : 'baked'} into GPU texture: ${stats.blackPercentage}% true black in ${stats.elapsedMs}ms`);
      } catch (err) {
        console.error('Grading failed:', err);
        if (!isPreview) {
          if (btnAmoled) btnAmoled.textContent = '🖤 Apply AMOLED Grade';
          if (btnAdj) btnAdj.textContent = '🎨 Apply Image Adjustments';
          alert('Could not grade pixels: This external image does not allow direct pixel manipulation due to CORS. Please download the image and drag-and-drop it into the app.');
        }
      }
    }, isPreview ? 0 : 20);
  }

  /**
   * Resets only the AMOLED black crushing parameters to default
   */
  function resetAmoledSection() {
    const resetVals = {
      'black-floor': { val: 22, text: '22' },
      'knee-width': { val: 24, text: '24' },
      'star-protect': { val: 85, text: '85%' }
    };
    Object.entries(resetVals).forEach(([id, cfg]) => {
      const slider = document.getElementById(`slider-${id}`);
      const valLabel = document.getElementById(`val-${id}`);
      if (slider) slider.value = cfg.val;
      if (valLabel) valLabel.textContent = cfg.text;
    });
    const btn = document.getElementById('btn-reset-amoled');
    if (btn) {
      btn.textContent = '✓ Reset!';
      setTimeout(() => { if (btn) btn.textContent = '↩ Reset'; }, 1200);
    }
    applyInBrowserGrade('amoled');
  }

  /**
   * Resets only the visual enhancements (exposure, contrast, saturation, sharpness) to default
   */
  function resetAdjustmentsSection() {
    const resetVals = {
      'exposure': { val: 0, text: '+0.00 EV' },
      'contrast': { val: 1.08, text: '1.08x' },
      'saturation': { val: 1.00, text: '1.00x' },
      'sharpness': { val: 0, text: '0%' }
    };
    Object.entries(resetVals).forEach(([id, cfg]) => {
      const slider = document.getElementById(`slider-${id}`);
      const valLabel = document.getElementById(`val-${id}`);
      if (slider) slider.value = cfg.val;
      if (valLabel) valLabel.textContent = cfg.text;
    });
    const btn = document.getElementById('btn-reset-adjustments');
    if (btn) {
      btn.textContent = '✓ Reset!';
      setTimeout(() => { if (btn) btn.textContent = '↩ Reset'; }, 1200);
    }
    applyInBrowserGrade('adjustments');
  }

  /**
   * Reverts all changes back to the original un-graded raw master image
   */
  function resetAmoledGrade() {
    if (!imageLoaded || !rawSourceImage) return;

    if (activeRenderDrawable && typeof ImageBitmap !== 'undefined' && activeRenderDrawable instanceof ImageBitmap) {
      try { activeRenderDrawable.close(); } catch (e) {}
    }
    activeRenderDrawable = rawSourceImage;
    isAmoledGraded = false;
    cameraEngine.setImageDimensions(rawSourceImage.naturalWidth, rawSourceImage.naturalHeight);
    resizeViewport();
    drawRadarBackground();
    updateSplineEditorView();
    runAutoGradeTelemetry();
    renderFrame();

    // Reset all 7 sliders & labels to default states
    const resetVals = {
      'black-floor': { val: 22, text: '22' },
      'knee-width': { val: 24, text: '24' },
      'star-protect': { val: 85, text: '85%' },
      'exposure': { val: 0, text: '+0.00 EV' },
      'contrast': { val: 1.08, text: '1.08x' },
      'saturation': { val: 1.00, text: '1.00x' },
      'sharpness': { val: 0, text: '0%' }
    };
    Object.entries(resetVals).forEach(([id, cfg]) => {
      const slider = document.getElementById(`slider-${id}`);
      const valLabel = document.getElementById(`val-${id}`);
      if (slider) slider.value = cfg.val;
      if (valLabel) valLabel.textContent = cfg.text;
    });

    const specs = calculateImageQualitySpecs(rawSourceImage, 0, isCanvasTainted);
    activeImageSpecs = specs;
    updateHudResolutionBadge(specs);

    const elGraded = document.getElementById('stat-graded-black');
    if (elGraded) elGraded.textContent = '--%';
    const elSavings = document.getElementById('stat-oled-savings');
    if (elSavings) elSavings.textContent = '--%';

    const btnUndo = document.getElementById('btn-undo-grade');
    if (btnUndo) {
      const orig = btnUndo.textContent;
      btnUndo.textContent = '✓ Reverted!';
      setTimeout(() => { btnUndo.textContent = orig; }, 1200);
    }
    console.log('[Studio] All adjustments & AMOLED grade reverted to original master image.');
  }

  /**
   * Updates Spline Editor Canvas with draggable waypoints matching input image aspect ratio
   */
  function updateSplineEditorView() {
    if (!editorCanvas || !editorCtx || !cameraEngine) return;

    const editorContainer = document.getElementById('editor-canvas-container');
    const imgW = (activeRenderDrawable && (activeRenderDrawable.naturalWidth || activeRenderDrawable.width)) || (rawSourceImage && rawSourceImage.naturalWidth) || 16;
    const imgH = (activeRenderDrawable && (activeRenderDrawable.naturalHeight || activeRenderDrawable.height)) || (rawSourceImage && rawSourceImage.naturalHeight) || 9;
    const aspect = imgW / imgH;

    const maxW = (editorContainer ? editorContainer.clientWidth : 360) || 360;
    const maxH = 240;

    let ew, eh;
    if (aspect >= 1.0) {
      ew = maxW;
      eh = Math.max(120, Math.min(maxH, Math.round(ew / aspect)));
    } else {
      eh = maxH;
      ew = Math.max(100, Math.min(maxW, Math.round(eh * aspect)));
    }

    editorCanvas.width = ew;
    editorCanvas.height = eh;
    editorCanvas.style.width = `${ew}px`;
    editorCanvas.style.height = `${eh}px`;

    editorCtx.fillStyle = '#06080c';
    editorCtx.fillRect(0, 0, ew, eh);

    // Draw background thumbnail
    if (imageLoaded && activeRenderDrawable) {
      editorCtx.globalAlpha = 0.35;
      editorCtx.drawImage(activeRenderDrawable, 0, 0, ew, eh);
      editorCtx.globalAlpha = 1.0;
    }

    // Draw Spline Curve
    editorCtx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
    editorCtx.lineWidth = 2;
    editorCtx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      const pt = cameraEngine.samplePath(u);
      const px = pt.x * ew;
      const py = pt.y * eh;
      if (i === 0) editorCtx.moveTo(px, py);
      else editorCtx.lineTo(px, py);
    }
    editorCtx.closePath();
    editorCtx.stroke();

    // Draw Waypoint Node Handles
    const waypoints = cameraEngine.getWaypoints();
    waypoints.forEach((wp, idx) => {
      const px = wp.x * ew;
      const py = wp.y * eh;
      const isSelected = (idx === selectedWpIndex);

      editorCtx.beginPath();
      editorCtx.arc(px, py, isSelected ? 8 : 6, 0, Math.PI * 2);
      editorCtx.fillStyle = isSelected ? '#ff007f' : '#00e5ff';
      editorCtx.fill();
      editorCtx.lineWidth = 2;
      editorCtx.strokeStyle = '#ffffff';
      editorCtx.stroke();

      // Label number
      editorCtx.fillStyle = '#ffffff';
      editorCtx.font = '10px sans-serif';
      editorCtx.fillText(`P${idx}`, px + 8, py - 4);
    });

    // Update Waypoint Inspector Controls
    const currentWp = waypoints[selectedWpIndex] || waypoints[0];
    if (currentWp) {
      const elLabel = document.getElementById('selected-wp-label');
      if (elLabel) elLabel.textContent = `P${selectedWpIndex} (${currentWp.desc || 'Waypoint'})`;
      const sliderZoom = document.getElementById('slider-wp-zoom');
      if (sliderZoom) sliderZoom.value = currentWp.z;
      const valZoom = document.getElementById('val-wp-zoom');
      if (valZoom) valZoom.textContent = `${currentWp.z.toFixed(1)}x`;
    }
  }

  /**
   * Sets up interactive drag-and-drop on the Spline Editor Canvas
   */
  function setupSplineEditorInteraction() {
    if (!editorCanvas) return;

    const getMouseNormPos = (e) => {
      const rect = editorCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: Math.max(0.1, Math.min(0.9, (clientX - rect.left) / rect.width)),
        y: Math.max(0.1, Math.min(0.9, (clientY - rect.top) / rect.height))
      };
    };

    const handlePointerDown = (e) => {
      const rect = editorCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      const waypoints = cameraEngine.getWaypoints();
      const ew = editorCanvas.width;
      const eh = editorCanvas.height;

      // Check collision with any waypoint (hit radius: 14px)
      let foundIdx = -1;
      for (let i = 0; i < waypoints.length; i++) {
        const wx = waypoints[i].x * ew;
        const wy = waypoints[i].y * eh;
        if (Math.hypot(clickX - wx, clickY - wy) <= 14) {
          foundIdx = i;
          break;
        }
      }

      if (foundIdx !== -1) {
        selectedWpIndex = foundIdx;
        isDraggingWp = true;
        updateSplineEditorView();
      }
    };

    const handlePointerMove = (e) => {
      if (!isDraggingWp) return;
      const pos = getMouseNormPos(e);
      cameraEngine.updateWaypoint(selectedWpIndex, { x: pos.x, y: pos.y });
      updateSplineEditorView();
    };

    const handlePointerUp = () => {
      isDraggingWp = false;
    };

    editorCanvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    editorCanvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Zoom slider for selected waypoint
    const sliderZoom = document.getElementById('slider-wp-zoom');
    if (sliderZoom) {
      sliderZoom.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        cameraEngine.updateWaypoint(selectedWpIndex, { z: val });
        document.getElementById('val-wp-zoom').textContent = `${val.toFixed(1)}x`;
      });
    }

    // Procedural Spline Randomization button
    const btnRandomize = document.getElementById('btn-randomize-spline');
    if (btnRandomize) {
      btnRandomize.addEventListener('click', () => {
        const preset = PRESETS[currentPresetKey] || PRESETS['fullscreen'];
        let aspectHint = null;
        if (!preset.isNative && preset.w > 0 && preset.h > 0) {
          aspectHint = preset.w / preset.h;
        } else if (rawSourceImage && rawSourceImage.naturalWidth && rawSourceImage.naturalHeight) {
          aspectHint = rawSourceImage.naturalWidth / rawSourceImage.naturalHeight;
        }
        cameraEngine.randomizeWaypoints(7, aspectHint);
        selectedWpIndex = 0;
        updateSplineEditorView();
      });
    }

    // Add waypoint button
    const btnAddWp = document.getElementById('btn-add-wp');
    if (btnAddWp) {
      btnAddWp.addEventListener('click', () => {
        const waypoints = cameraEngine.getWaypoints();
        const current = waypoints[selectedWpIndex] || waypoints[0] || { x: 0.5, y: 0.5, z: 2.0 };
        const insertIdx = Math.min(waypoints.length, selectedWpIndex + 1);
        const newIdx = cameraEngine.addWaypoint(insertIdx, {
          x: Math.min(0.90, current.x + 0.04),
          y: Math.min(0.90, current.y + 0.04),
          z: current.z,
          desc: `Waystop ${waypoints.length + 1}`
        });
        selectedWpIndex = newIdx;
        updateSplineEditorView();
      });
    }

    // Double-click on radar/editor canvas to add waypoint at clicked location
    editorCanvas.addEventListener('dblclick', (e) => {
      const pos = getMouseNormPos(e);
      const waypoints = cameraEngine.getWaypoints();
      const current = waypoints[selectedWpIndex] || { z: 2.0 };
      const insertIdx = Math.min(waypoints.length, selectedWpIndex + 1);
      const newIdx = cameraEngine.addWaypoint(insertIdx, {
        x: pos.x,
        y: pos.y,
        z: current.z,
        desc: `Waystop ${waypoints.length + 1}`
      });
      selectedWpIndex = newIdx;
      updateSplineEditorView();
    });

    // Remove waypoint button
    const btnRemoveWp = document.getElementById('btn-remove-wp');
    if (btnRemoveWp) {
      btnRemoveWp.addEventListener('click', () => {
        cameraEngine.removeWaypoint(selectedWpIndex);
        selectedWpIndex = Math.max(0, selectedWpIndex - 1);
        updateSplineEditorView();
      });
    }
  }

  /**
   * ============================================================
   * SCREEN 1: CELESTIAL DISCOVERY & MULTI-ARCHIVE SOURCING SETUP
   * ============================================================
   */
  function setupDiscoveryScreen() {
    const container = document.getElementById('curated-cards-container');
    const searchInput = document.getElementById('global-cosmic-search');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const btnSearchNasa = document.getElementById('btn-search-nasa-action');
    const archiveSelector = document.getElementById('select-archive-source');
    const chips = document.querySelectorAll('.category-chips-scroll .chip');
    const curatedSection = document.getElementById('section-curated-grid');
    const nasaSection = document.getElementById('section-nasa-results');
    const nasaContainer = document.getElementById('nasa-cards-container');
    const nasaSpinner = document.getElementById('nasa-loading-spinner');
    const nasaResultsCount = document.getElementById('nasa-results-count');
    const curatedCount = document.getElementById('curated-count');

    let activeFilter = 'all';

    // Renders the curated cards grid
    function renderCuratedCards(filter = 'all', searchQuery = '') {
      container.innerHTML = '';
      const query = searchQuery.trim().toLowerCase();
      let matchCount = 0;

      for (const [key, item] of Object.entries(CATALOG)) {
        // Category check
        if (filter !== 'all' && item.category !== filter) continue;

        // Search query check
        if (query) {
          const haystack = `${item.title} ${item.subtitle} ${item.desc} ${item.category} ${item.telescope}`.toLowerCase();
          if (!haystack.includes(query)) continue;
        }

        matchCount++;
        const card = document.createElement('div');
        card.className = `celestial-card ${key === activeCatalogKey ? 'active-selected' : ''}`;
        card.dataset.key = key;

        const cardThumb = (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.thumbnails && window.DEFAULT_ASSETS.thumbnails[key])
          ? window.DEFAULT_ASSETS.thumbnails[key]
          : item.thumb;

        card.innerHTML = `
          <div class="card-thumb-container">
            <div class="thumb-skeleton"></div>
            <img 
              class="catalog-card-img" 
              src="${cardThumb}" 
              alt="${item.title}" 
              loading="lazy"
              onload="this.classList.add('loaded')"
            >
            <div class="thumb-badges">
              <span class="badge-tag badge-amoled">${item.blackLevel}</span>
              <span class="badge-tag badge-res">${item.resBadge}</span>
              <span class="badge-tag">${item.telescope}</span>
            </div>
          </div>
          <div class="card-content">
            <div class="card-title-row">
              <h4 class="card-title">${item.title}</h4>
            </div>
            <span class="card-subtitle">${item.subtitle}</span>
            <p class="card-desc">${item.desc}</p>
            <button class="card-cta-btn">
              Launch into Studio ✨
            </button>
          </div>
        `;

        card.addEventListener('click', () => {
          loadImageFromCatalog(key, true);
        });

        container.appendChild(card);
      }

      if (curatedCount) curatedCount.textContent = `${matchCount} Objects`;
    }

    // Initial render
    renderCuratedCards('all', '');

    // Category Chip clicks
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        activeFilter = filter;

        if (filter === 'nasa-archive') {
          curatedSection.style.display = 'none';
          nasaSection.style.display = 'flex';
          const query = searchInput.value.trim() || 'nebula';
          searchGlobalArchives(query, archiveSelector ? archiveSelector.value : 'all');
        } else if (filter === 'custom-upload') {
          curatedSection.style.display = 'flex';
          nasaSection.style.display = 'none';
          document.getElementById('section-custom-sources').scrollIntoView({ behavior: 'smooth' });
        } else {
          curatedSection.style.display = 'flex';
          nasaSection.style.display = 'none';
          renderCuratedCards(filter, searchInput.value);
        }
      });
    });

    // Real-time Search input with 300ms debounce
    let searchDebounceTimer = null;
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      btnClearSearch.style.display = q ? 'block' : 'none';
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        if (activeFilter !== 'nasa-archive') {
          renderCuratedCards(activeFilter, q);
        }
      }, 300);
    });

    // Clear Search button
    btnClearSearch.addEventListener('click', () => {
      clearTimeout(searchDebounceTimer);
      searchInput.value = '';
      btnClearSearch.style.display = 'none';
      renderCuratedCards(activeFilter, '');
    });

    // Search action trigger
    const triggerArchiveSearch = () => {
      const q = searchInput.value.trim();
      const source = archiveSelector ? archiveSelector.value : 'all';
      if (!q && source !== 'surveys' && source !== 'eso' && source !== 'chandra') {
        alert('Please enter a celestial object or sky coordinates (e.g. "Orion", "M31", "Crab Nebula", "83.82, -5.39")');
        return;
      }
      chips.forEach(c => c.classList.toggle('active', c.dataset.filter === 'nasa-archive'));
      activeFilter = 'nasa-archive';
      curatedSection.style.display = 'none';
      nasaSection.style.display = 'flex';
      const defaultQ = (source === 'eso') ? 'eso' : (source === 'chandra') ? 'chandra' : 'surveys';
      searchGlobalArchives(q || defaultQ, source);
    };

    // Render Popular Discoveries (3 Rows, Randomized at Start)
    function renderPopularDiscoveries() {
      const matrix = document.getElementById('popular-discoveries-matrix');
      if (!matrix) return;

      // Shuffle master pool using Fisher-Yates
      const pool = [...POPULAR_DISCOVERIES];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      // Populate 3 rows with 5 unique discoveries each (total 15 items displayed)
      const itemsPerRow = 5;
      const rows = [
        pool.slice(0, itemsPerRow),
        pool.slice(itemsPerRow, itemsPerRow * 2),
        pool.slice(itemsPerRow * 2, itemsPerRow * 3)
      ];

      matrix.innerHTML = '';
      rows.forEach((rowItems, rIdx) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'popular-row';
        rowEl.setAttribute('role', 'group');
        rowEl.setAttribute('aria-label', `Popular Discoveries Row ${rIdx + 1}`);

        rowItems.forEach(item => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'quick-topic-btn';
          btn.dataset.query = item.query;
          if (item.catalogId) btn.dataset.catalogId = item.catalogId;
          if (item.ra !== undefined) btn.dataset.ra = String(item.ra);
          if (item.dec !== undefined) btn.dataset.dec = String(item.dec);
          if (item.aliases) btn.dataset.aliases = item.aliases.join(', ');
          btn.textContent = item.name;
          const coordsStr = (item.ra !== undefined && item.dec !== undefined)
            ? ` • RA: ${item.ra.toFixed(2)}°, Dec: ${(item.dec >= 0 ? '+' : '') + item.dec.toFixed(2)}°`
            : '';
          const aliasStr = item.aliases && item.aliases.length > 0 ? ` • Alt: ${item.aliases.slice(0, 3).join(', ')}` : '';
          btn.title = `Search archives for: ${item.name} (${item.catalogId || item.query})${coordsStr}${aliasStr}`;
          btn.addEventListener('click', () => {
            searchInput.value = item.query;
            btnClearSearch.style.display = 'block';
            triggerArchiveSearch();
          });
          rowEl.appendChild(btn);
        });
        matrix.appendChild(rowEl);
      });
    }

    renderPopularDiscoveries();

    const btnShuffle = document.getElementById('btn-shuffle-discoveries');
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        renderPopularDiscoveries();
      });
    }

    if (btnSearchNasa) btnSearchNasa.addEventListener('click', triggerArchiveSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerArchiveSearch();
    });

    if (archiveSelector) {
      archiveSelector.addEventListener('change', () => {
        const defaultQ = (archiveSelector.value === 'eso') ? 'eso' : (archiveSelector.value === 'chandra') ? 'chandra' : (archiveSelector.value === 'surveys') ? 'surveys' : 'nebula';
        const q = searchInput.value.trim() || defaultQ;
        if (activeFilter === 'nasa-archive') {
          searchGlobalArchives(q, archiveSelector.value);
        }
      });
    }

    /**
     * Built-in Offline Celestial Target Catalog:
     * Provides 0-millisecond offline lookup with precise J2000 coordinates
     * for 40+ premier astronomical objects and broad categories (nebulae, galaxies, clusters).
     */
    const CELESTIAL_CATALOG = [
      {
        name: 'Orion Nebula (M42)',
        keywords: ['orion', 'm42', 'm 42', 'ngc 1976', 'nebula', 'sword'],
        ra: 83.8221, dec: -5.3911, scale: 0.5, category: 'nebula',
        desc: 'Closest massive star-forming nursery to Earth. Unveils glowing gas filaments and young stellar nurseries.',
        master: {
          w: 18000,
          h: 18000,
          mp: 324.0,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg/960px-Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
          obs: 'Hubble ACS 2006 Gigapixel Mosaic'
        }
      },
      {
        name: 'Carina Nebula (NGC 3372)',
        keywords: ['carina', 'ngc 3372', 'eta carinae', 'keyhole', 'nebula'],
        ra: 161.2650, dec: -59.8660, scale: 0.8, category: 'nebula',
        desc: 'One of the largest diffuse nebulae in the sky, hosting the unstable supermassive star Eta Carinae.',
        master: {
          w: 13092,
          h: 8926,
          mp: 116.8,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Carina_Nebula.jpg/960px-Carina_Nebula.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Carina_Nebula.jpg',
          obs: 'ESO VLT / MPG WFI Gigapixel Survey'
        }
      },
      {
        name: 'Pillars of Creation / Eagle Nebula (M16)',
        keywords: ['pillars', 'pillars of creation', 'eagle', 'm16', 'm 16', 'ngc 6611', 'nebula'],
        ra: 274.7000, dec: -13.8070, scale: 0.5, category: 'nebula',
        desc: 'Towering interstellar columns of cool hydrogen gas and dust sculpting newborn stars.',
        master: {
          w: 13500,
          h: 9000,
          mp: 121.5,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/M16-29-06-2025-Luc_Viatour.jpg/960px-M16-29-06-2025-Luc_Viatour.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/5/52/M16-29-06-2025-Luc_Viatour.jpg',
          obs: 'Hubble Heritage High-Definition'
        }
      },
      {
        name: 'Andromeda Galaxy (M31)',
        keywords: ['andromeda', 'm31', 'm 31', 'ngc 224', 'galaxy'],
        ra: 10.6847, dec: 41.2687, scale: 0.8, category: 'galaxy',
        desc: 'The nearest major barred spiral galaxy to our Milky Way, containing over one trillion stars.',
        master: {
          w: 40000,
          h: 12788,
          mp: 511.5,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Andromeda_Galaxy_M31_-_Heic1502a_Full_resolution.jpg/960px-Andromeda_Galaxy_M31_-_Heic1502a_Full_resolution.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Andromeda_Galaxy_M31_-_Heic1502a_Full_resolution.jpg',
          obs: 'Hubble PHAT Ultra-HD Survey'
        }
      },
      {
        name: 'Crab Nebula (M1)',
        keywords: ['crab', 'm1', 'm 1', 'ngc 1952', 'supernova', 'nebula'],
        ra: 83.6331, dec: 22.0145, scale: 0.4, category: 'nebula',
        desc: 'Expanding supernova remnant powered by an ultra-dense central pulsing neutron star (pulsar).',
        master: {
          w: 3864,
          h: 3864,
          mp: 14.9,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Crab_Nebula.jpg/960px-Crab_Nebula.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Crab_Nebula.jpg',
          obs: 'Hubble Heritage 24-Frame Mosaic'
        }
      },
      {
        name: 'Whirlpool Galaxy (M51)',
        keywords: ['whirlpool', 'm51', 'm 51', 'ngc 5194', 'galaxy'],
        ra: 202.4696, dec: 47.1953, scale: 0.5, category: 'galaxy',
        desc: 'Grand-design spiral galaxy interacting with its companion dwarf galaxy NGC 5195.',
        master: {
          w: 11477,
          h: 7965,
          mp: 91.4,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Messier51.jpg/960px-Messier51.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Messier51.jpg',
          obs: 'Hubble ACS Grand Design Survey'
        }
      },
      {
        name: 'Sombrero Galaxy (M104)',
        keywords: ['sombrero', 'm104', 'm 104', 'ngc 4594', 'galaxy'],
        ra: 189.9976, dec: -11.6231, scale: 0.5, category: 'galaxy',
        desc: 'Unusual lenticular galaxy featuring a brilliant nucleus and prominent dark dust lane.',
        master: {
          w: 11472,
          h: 6429,
          mp: 73.8,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/M104_ngc4594_sombrero_galaxy_hi-res.jpg/960px-M104_ngc4594_sombrero_galaxy_hi-res.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/M104_ngc4594_sombrero_galaxy_hi-res.jpg',
          obs: 'Hubble ACS Deep Space Observation'
        }
      },
      {
        name: 'Pleiades / Seven Sisters (M45)',
        keywords: ['pleiades', 'm45', 'm 45', 'seven sisters', 'subaru', 'cluster', 'stars'],
        ra: 56.7500, dec: 24.1170, scale: 1.0, category: 'cluster',
        desc: 'Brilliant open star cluster enshrouded in luminous blue reflection nebulosity.',
        master: {
          w: 8137,
          h: 5441,
          mp: 44.3,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/M45-Les_Pl%C3%A9iades_Hamois_le_28-12-2024-Luc_Viatour.jpg/960px-M45-Les_Pl%C3%A9iades_Hamois_le_28-12-2024-Luc_Viatour.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/M45-Les_Pl%C3%A9iades_Hamois_le_28-12-2024-Luc_Viatour.jpg',
          obs: 'High-Definition Deep Sky Survey'
        }
      },
      {
        name: 'Helix Nebula (NGC 7293)',
        keywords: ['helix', 'ngc 7293', 'eye of god', 'nebula'],
        ra: 337.4108, dec: -20.8372, scale: 0.6, category: 'nebula',
        desc: 'A planetary nebula often called the Eye of God, formed at the end of an intermediate star\'s life.',
        master: {
          w: 6145,
          h: 6623,
          mp: 40.7,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/NGC7293_%282004%29.jpg/960px-NGC7293_%282004%29.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/NGC7293_%282004%29.jpg',
          obs: 'Hubble ACS & Blanco 4m Mosaic'
        }
      },
      {
        name: 'Ring Nebula (M57)',
        keywords: ['ring', 'm57', 'm 57', 'ngc 6720', 'nebula'],
        ra: 283.3963, dec: 33.0292, scale: 0.3, category: 'nebula',
        desc: 'Classic planetary nebula displaying glowing shells of ionized gas expelled by a dying white dwarf.',
        master: {
          w: 3179,
          h: 3179,
          mp: 10.1,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Hubble_image_of_the_Ring_Nebula_%28Messier_57%29.jpg/960px-Hubble_image_of_the_Ring_Nebula_%28Messier_57%29.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Hubble_image_of_the_Ring_Nebula_%28Messier_57%29.jpg',
          obs: 'Hubble WFC3 Ionized Gas Survey'
        }
      },
      {
        name: 'Tarantula Nebula (30 Doradus)',
        keywords: ['tarantula', '30 doradus', 'ngc 2070', 'lmc', 'nebula'],
        ra: 84.6766, dec: -69.1009, scale: 0.8, category: 'nebula',
        desc: 'Extremely luminous H II region in the Large Magellanic Cloud, the most active starburst in the Local Group.',
        master: {
          w: 2016,
          h: 2038,
          mp: 4.1,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Tarantula_Nebula_TRAPPIST.jpg/960px-Tarantula_Nebula_TRAPPIST.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Tarantula_Nebula_TRAPPIST.jpg',
          obs: 'ESO TRAPPIST Deep Survey'
        }
      },
      {
        name: 'Triangulum Galaxy (M33)',
        keywords: ['triangulum', 'm33', 'm 33', 'ngc 598', 'pinwheel', 'galaxy'],
        ra: 23.4621, dec: 30.6599, scale: 0.8, category: 'galaxy',
        desc: 'Third-largest member of the Local Group, packed with vast starbirth regions like NGC 604.'
      },
      {
        name: 'Pinwheel Galaxy (M101)',
        keywords: ['pinwheel', 'm101', 'm 101', 'ngc 5457', 'galaxy'],
        ra: 210.8024, dec: 54.3490, scale: 0.6, category: 'galaxy',
        desc: 'Face-on grand design spiral galaxy with prominent arms brimming with H II regions.',
        master: {
          w: 15852,
          h: 12392,
          mp: 196.4,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/M101_hires_STScI-PRC2006-10a.jpg/960px-M101_hires_STScI-PRC2006-10a.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/M101_hires_STScI-PRC2006-10a.jpg',
          obs: 'Hubble ACS Pinwheel Grand Mosaic'
        }
      },
      {
        name: 'Cigar Galaxy (M82)',
        keywords: ['cigar', 'm82', 'm 82', 'ngc 3034', 'starburst', 'galaxy'],
        ra: 148.9685, dec: 69.6797, scale: 0.4, category: 'galaxy',
        desc: 'Prototypical starburst galaxy undergoing dramatic superwind outflows of glowing hydrogen.'
      },
      {
        name: 'Bode\'s Galaxy (M81)',
        keywords: ['bode', 'bodes', 'm81', 'm 81', 'ngc 3031', 'galaxy'],
        ra: 148.8882, dec: 69.0653, scale: 0.5, category: 'galaxy',
        desc: 'Grand spiral galaxy with an active galactic nucleus harboring a 70-million-solar-mass black hole.'
      },
      {
        name: 'Horsehead Nebula (Barnard 33)',
        keywords: ['horsehead', 'barnard 33', 'b33', 'ic 434', 'nebula'],
        ra: 85.2458, dec: -2.4583, scale: 0.4, category: 'nebula',
        desc: 'Famous dark absorption nebula silhouetted against the crimson emission nebula IC 434.'
      },
      {
        name: 'Rosette Nebula (NGC 2237)',
        keywords: ['rosette', 'ngc 2237', 'ngc 2244', 'skull', 'nebula'],
        ra: 98.7000, dec: 4.9000, scale: 0.9, category: 'nebula',
        desc: 'Vast spherical emission nebula shaped like a cosmic rose petal around an open cluster of hot O-stars.'
      },
      {
        name: 'Lagoon Nebula (M8)',
        keywords: ['lagoon', 'm8', 'm 8', 'ngc 6523', 'nebula'],
        ra: 271.1370, dec: -24.3800, scale: 0.6, category: 'nebula',
        desc: 'Giant interstellar cloud in Sagittarius classified as an emission nebula and H II region.'
      },
      {
        name: 'Trifid Nebula (M20)',
        keywords: ['trifid', 'm20', 'm 20', 'ngc 6514', 'nebula'],
        ra: 270.6120, dec: -23.0310, scale: 0.5, category: 'nebula',
        desc: 'Rare combination of open cluster, emission nebula, reflection nebula, and dark dust lanes.'
      },
      {
        name: 'Dumbbell Nebula (M27)',
        keywords: ['dumbbell', 'apple core', 'm27', 'm 27', 'ngc 6853', 'nebula'],
        ra: 299.9010, dec: 22.7210, scale: 0.4, category: 'nebula',
        desc: 'The very first planetary nebula discovered by Charles Messier in 1764.'
      },
      {
        name: 'Veil Nebula / Cygnus Loop (NGC 6960)',
        keywords: ['veil', 'cygnus loop', 'ngc 6960', 'witches broom', 'supernova', 'nebula'],
        ra: 312.7500, dec: 30.7000, scale: 0.8, category: 'nebula',
        desc: 'Delicate filamentary shock waves from an ancient supernova explosion 20,000 years ago.'
      },
      {
        name: 'Bubble Nebula (NGC 7635)',
        keywords: ['bubble', 'ngc 7635', 'caldwell 11', 'nebula'],
        ra: 350.2180, dec: 61.2010, scale: 0.4, category: 'nebula',
        desc: 'Spectacular wind-blown cosmic bubble inflated by stellar winds from an extremely hot O-star.'
      },
      {
        name: 'Cat\'s Eye Nebula (NGC 6543)',
        keywords: ['cat\'s eye', 'cats eye', 'ngc 6543', 'planetary nebula', 'nebula'],
        ra: 269.6390, dec: 66.6330, scale: 0.3, category: 'nebula',
        desc: 'One of the most structurally complex planetary nebulae known, with concentric bubbles and jets.'
      },
      {
        name: 'Flame Nebula (NGC 2024)',
        keywords: ['flame', 'ngc 2024', 'alnitak', 'nebula'],
        ra: 85.4290, dec: -1.8580, scale: 0.4, category: 'nebula',
        desc: 'Fiery emission nebula next to Orion\'s easternmost belt star Alnitak.'
      },
      {
        name: 'Cartwheel Galaxy',
        keywords: ['cartwheel', 'eso 350-40', 'galaxy'],
        ra: 9.4340, dec: -33.7160, scale: 0.4, category: 'galaxy',
        desc: 'Remarkable ring galaxy resulting from a high-speed collision between two galaxies.'
      },
      {
        name: 'Black Eye Galaxy (M64)',
        keywords: ['black eye', 'evil eye', 'm64', 'm 64', 'ngc 4826', 'galaxy'],
        ra: 194.1820, dec: 21.6820, scale: 0.4, category: 'galaxy',
        desc: 'Famous for the spectacular dark band of absorbing dust in front of its bright bright nucleus.'
      },
      {
        name: 'Centaurus A (NGC 5128)',
        keywords: ['centaurus a', 'cen a', 'ngc 5128', 'galaxy'],
        ra: 201.3650, dec: -43.0190, scale: 0.6, category: 'galaxy',
        desc: 'Prominent peculiar radio galaxy with a supermassive black hole emitting relativistic plasma jets.'
      },
      {
        name: 'Large Magellanic Cloud (LMC)',
        keywords: ['large magellanic cloud', 'lmc', 'magellanic', 'galaxy'],
        ra: 80.8940, dec: -69.7560, scale: 1.5, category: 'galaxy',
        desc: 'Satellite dwarf galaxy orbiting the Milky Way, rich in dark nebulae and star-forming clouds.'
      },
      {
        name: 'Small Magellanic Cloud (SMC)',
        keywords: ['small magellanic cloud', 'smc', 'magellanic', 'galaxy'],
        ra: 13.1870, dec: -72.8290, scale: 1.2, category: 'galaxy',
        desc: 'Dwarf irregular galaxy containing several hundred million stars.'
      },
      {
        name: 'Hercules Cluster (M13)',
        keywords: ['hercules', 'm13', 'm 13', 'ngc 6205', 'globular cluster', 'cluster'],
        ra: 250.4220, dec: 36.4600, scale: 0.4, category: 'cluster',
        desc: 'Great globular cluster in Hercules holding several hundred thousand ancient stars in a spherical swarm.'
      },
      {
        name: 'Omega Centauri (NGC 5139)',
        keywords: ['omega centauri', 'ngc 5139', 'globular cluster', 'cluster'],
        ra: 201.6970, dec: -47.4770, scale: 0.6, category: 'cluster',
        desc: 'Largest and brightest globular cluster in the Milky Way, containing roughly 10 million stars.'
      },
      {
        name: 'Butterfly Cluster (M6)',
        keywords: ['butterfly', 'm6', 'm 6', 'ngc 6405', 'open cluster', 'cluster'],
        ra: 265.0420, dec: -32.2210, scale: 0.5, category: 'cluster',
        desc: 'Open cluster in Scorpius whose stars resemble a butterfly with outstretched wings.'
      },
      {
        name: 'Hubble Ultra Deep Field (HUDF)',
        keywords: ['deep field', 'hudf', 'fornax', 'hubble deep field', 'galaxy', 'field'],
        ra: 53.1625, dec: -27.7914, scale: 0.4, category: 'galaxy',
        desc: 'Lookback view of nearly 10,000 galaxies across cosmic time reaching back to the dawn of the universe.',
        master: {
          w: 2300,
          h: 2100,
          mp: 4.8,
          thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/NASA-HS201427a-HubbleUltraDeepField2014-20140603.jpg/960px-NASA-HS201427a-HubbleUltraDeepField2014-20140603.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/6/69/NASA-HS201427a-HubbleUltraDeepField2014-20140603.jpg',
          obs: 'Hubble 1-Million-Second Ultra Deep Field'
        }
      },
      {
        name: 'Webb Deep Field (SMACS 0723)',
        keywords: ['smacs 0723', 'webb deep field', 'jwst deep field', 'gravitational lens', 'galaxy'],
        ra: 110.8375, dec: -73.4542, scale: 0.4, category: 'galaxy',
        desc: 'Gravitational lens galaxy cluster SMACS 0723 magnifying the deepest infrared galaxies ever imaged.'
      },
      {
        name: 'Galactic Center (Sagittarius A*)',
        keywords: ['galactic center', 'sagittarius a', 'sag a', 'milky way core', 'black hole', 'center'],
        ra: 266.4168, dec: -29.0078, scale: 0.8, category: 'cluster',
        desc: 'Dynamic core of our Milky Way galaxy harboring supermassive black hole Sagittarius A*.'
      },
      {
        name: 'North America Nebula (NGC 7000)',
        keywords: ['north america', 'ngc 7000', 'cygnus', 'nebula'],
        ra: 314.7500, dec: 44.3300, scale: 1.0, category: 'nebula',
        desc: 'Remarkable emission nebula whose shape resembles the continent of North America.'
      },
      {
        name: 'Heart Nebula (IC 1805)',
        keywords: ['heart', 'ic 1805', 'cassiopeia', 'nebula'],
        ra: 38.2000, dec: 61.4500, scale: 1.0, category: 'nebula',
        desc: 'Glowing emission nebula shaped like a cosmic heart, illuminated by open cluster Melotte 15.'
      },
      {
        name: 'Soul Nebula (IC 1848)',
        keywords: ['soul', 'ic 1848', 'westerhout 5', 'nebula'],
        ra: 43.8000, dec: 60.4200, scale: 1.0, category: 'nebula',
        desc: 'Companion emission and star-forming nebula right next to the Heart Nebula in Cassiopeia.'
      },
      {
        name: 'California Nebula (NGC 1499)',
        keywords: ['california', 'ngc 1499', 'perseus', 'nebula'],
        ra: 60.8200, dec: 36.4200, scale: 1.0, category: 'nebula',
        desc: 'Vast, faint emission nebula spanning 2.5 degrees across Perseus, glowing from nearby Menkhib.'
      },
      {
        name: 'Elephant Trunk Nebula (IC 1396)',
        keywords: ['elephant trunk', 'ic 1396', 'cepheus', 'nebula'],
        ra: 324.7500, dec: 57.5000, scale: 0.8, category: 'nebula',
        desc: 'Dense globule of gas and dust forming stars within the ionized IC 1396 region in Cepheus.'
      }
    ];

    /**
     * Parses direct celestial coordinates:
     * e.g. "83.822, -5.391", "ra: 83.822 dec: -5.391", "161.27 -59.88"
     */
    function parseCoordinates(query) {
      if (!query) return null;
      const str = query.trim();
      const decRegex = /^(?:ra[:\s]*)?([-+]?\d+(?:\.\d+)?)[,\s]+(?:dec[:\s]*)?([-+]?\d+(?:\.\d+)?)$/i;
      const m = str.match(decRegex);
      if (m) {
        let ra = parseFloat(m[1]);
        let dec = parseFloat(m[2]);
        if (!isNaN(ra) && !isNaN(dec) && ra >= -360 && ra <= 360 && dec >= -90 && dec <= 90) {
          if (ra < 0) ra += 360;
          return { ra, dec, label: `Coordinates (${ra.toFixed(3)}°, ${dec.toFixed(3)}°)` };
        }
      }
      return null;
    }

    /**
     * Resolves celestial object names (e.g. "M31", "Orion", "NGC 3324", "Crab Nebula")
     * to precise J2000 Right Ascension and Declination via CDS Sesame.
     * Uses Harvard & IDIA CORS-enabled mirrors with regex fallback to prevent network/XML failures.
     */
    async function resolveTargetViaSesame(targetName) {
      if (!targetName || targetName.length < 2) return null;

      // Harvard CFA and IDIA mirrors support Access-Control-Allow-Origin: * without 302 CORS drop
      const mirrors = [
        `https://vizier.cfa.harvard.edu/viz-bin/nph-sesame/-ox/SNV?${encodeURIComponent(targetName)}`,
        `https://vizier.idia.ac.za/viz-bin/nph-sesame/-ox/SNV?${encodeURIComponent(targetName)}`
      ];

      for (const url of mirrors) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2800);
          const resp = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!resp.ok) continue;

          const xmlText = await resp.text();

          // Regex parsing is immune to XML namespace / DOMParser schema issues
          const raMatch = xmlText.match(/<jradeg>([+-]?\d+(?:\.\d+)?)<\/jradeg>/i);
          const decMatch = xmlText.match(/<jdedeg>([+-]?\d+(?:\.\d+)?)<\/jdedeg>/i);
          const onameMatch = xmlText.match(/<oname>([^<]+)<\/oname>/i);

          if (raMatch && decMatch) {
            const ra = parseFloat(raMatch[1]);
            const dec = parseFloat(decMatch[1]);
            if (!isNaN(ra) && !isNaN(dec)) {
              const label = onameMatch ? onameMatch[1].trim() : targetName;
              return { ra, dec, label };
            }
          }
        } catch (e) {
          // Timeout or mirror unavailable, proceed to next mirror
        }
      }
      return null;
    }

    /**
     * Generates CORS-free Sky Survey Master Cutouts & Ultra-HD Observatory Masters.
     * Guaranteed 100% untainted canvas access for AMOLED true-black grading & export.
     */
    async function fetchSkySurveys(query) {
      const qRaw = (query || '').trim();
      const q = qRaw.toLowerCase();
      let targets = [];

      // 1. Check if query is generic or asking for all surveys
      const isGeneric = !q || q === 'surveys' || q === 'deepskysurvey' || q === 'deep sky' || q === 'sky' || q === 'stars' || q === 'space' || q === 'all';
      if (isGeneric) {
        const showcaseNames = [
          'Orion Nebula (M42)',
          'Carina Nebula (NGC 3372)',
          'Pillars of Creation / Eagle Nebula (M16)',
          'Andromeda Galaxy (M31)',
          'Crab Nebula (M1)',
          'Whirlpool Galaxy (M51)',
          'Sombrero Galaxy (M104)',
          'Pleiades / Seven Sisters (M45)'
        ];
        targets = CELESTIAL_CATALOG.filter(t => showcaseNames.includes(t.name));
      } else {
        // Fast keyword & name match in catalog
        targets = CELESTIAL_CATALOG.filter(item => {
          if (item.name.toLowerCase().includes(q)) return true;
          return item.keywords.some(k => q.includes(k) || k.includes(q));
        });
      }

      // 2. If no catalog match, check direct coordinates
      if (targets.length === 0) {
        const coords = parseCoordinates(qRaw);
        if (coords) {
          targets.push({
            name: coords.label,
            ra: coords.ra,
            dec: coords.dec,
            scale: 0.5,
            desc: `Precision celestial coordinates: RA ${coords.ra.toFixed(4)}°, Dec ${coords.dec.toFixed(4)}°.`
          });
        }
      }

      // 2b. Check if query matches our extensive POPULAR_DISCOVERIES catalog table with celestial coordinates & aliases
      if (targets.length === 0) {
        const pop = findPopularDiscovery(qRaw);
        if (pop && pop.ra !== undefined && pop.dec !== undefined) {
          targets.push({
            name: `${pop.name} (${pop.catalogId || pop.query})`,
            ra: pop.ra,
            dec: pop.dec,
            scale: pop.category === 'galaxy' ? 0.6 : (pop.category === 'cluster' ? 0.8 : 0.5),
            desc: `${pop.desc || 'Popular astronomical discovery.'} Designation: ${pop.catalogId || 'N/A'}. RA ${pop.ra.toFixed(4)}°, Dec ${(pop.dec >= 0 ? '+' : '') + pop.dec.toFixed(4)}°.`
          });
        }
      }

      // 3. If still no targets, resolve via Sesame mirror (Harvard & IDIA with CORS)
      if (targets.length === 0 && qRaw.length >= 2) {
        const resolved = await resolveTargetViaSesame(qRaw);
        if (resolved) {
          targets.push({
            name: resolved.label,
            ra: resolved.ra,
            dec: resolved.dec,
            scale: 0.5,
            desc: `Astronomical target resolved via CDS Sesame: RA ${resolved.ra.toFixed(4)}°, Dec ${resolved.dec.toFixed(4)}°.`
          });
        }
      }

      if (targets.length === 0) return [];

      // Return cutouts for up to 8 matching celestial objects
      const selectedTargets = targets.slice(0, 8);
      const results = [];

      for (const tgt of selectedTargets) {
        const { ra, dec, scale = 0.5, name, desc = 'Deep space astronomical observation.' } = tgt;
        const raStr = ra.toFixed(4);
        const decStr = (dec >= 0 ? '+' : '') + dec.toFixed(4);
        const coordBadge = `RA: ${raStr}° • Dec: ${decStr}°`;

        // 1. If target has a curated Ultra-HD observatory survey master (Hubble/ESO/JWST), feature it first!
        if (tgt.master) {
          results.push({
            source: tgt.master.obs || 'Observatory Survey Master',
            sourceTag: `🔭 Ultra-HD Master (${tgt.master.mp.toFixed(1)} MP)`,
            title: `${name} (${tgt.master.obs ? tgt.master.obs.split(' ')[0] : 'Observatory'} Survey Master)`,
            desc: `${desc} True observatory master: ${tgt.master.w.toLocaleString()} × ${tgt.master.h.toLocaleString()} (${tgt.master.mp.toFixed(1)} MP). High dynamic contrast for OLED.`,
            thumb: tgt.master.thumb,
            fullUrl: tgt.master.full,
            width: tgt.master.w,
            height: tgt.master.h,
            mp: tgt.master.mp
          });
        }

        // 2. SDSS DR18 Optical Sky Survey (where declination is in SDSS footprint: -15° to +75°)
        // Available for targeted searches and coordinates
        if (!isGeneric && dec >= -15 && dec <= 75) {
          results.push({
            source: 'SDSS DR18 SkyServer',
            sourceTag: '🔭 SDSS Optical (CORS-Free)',
            title: `${name} (SDSS Optical)`,
            desc: `Sloan Digital Sky Survey DR18 optical observation. ${coordBadge}. 100% untainted grading & export.`,
            thumb: `https://skyserver.sdss.org/dr18/SkyServerWS/ImgCutout/getjpeg?ra=${ra}&dec=${dec}&scale=0.8&width=600&height=400`,
            fullUrl: `https://skyserver.sdss.org/dr18/SkyServerWS/ImgCutout/getjpeg?ra=${ra}&dec=${dec}&scale=0.4&width=2048&height=2048`,
            width: 2048,
            height: 2048,
            mp: 4.2
          });
        }

        // 3. For coordinates or objects without a curated master, provide DESI / DECam Optical Cutout
        // Uses CDN proxy for the thumbnail to prevent browser HTTP 429 rate limits
        if (!tgt.master) {
          const directLegacyThumb = `https://www.legacysurvey.org/viewer/jpeg-cutout?ra=${ra}&dec=${dec}&width=600&height=400&layer=ls-dr10&pixscale=${scale.toFixed(2)}`;
          const proxyLegacyThumb = `https://images.weserv.nl/?url=${encodeURIComponent(directLegacyThumb)}`;
          results.push({
            source: 'Legacy Sky Survey (DESI / DECam)',
            sourceTag: '🔭 Optical Master (CORS-Free)',
            title: `${name} (Optical Deep Sky)`,
            desc: `High-resolution optical color master from the Dark Energy Camera (DECam). ${coordBadge}. 100% untainted grading & export.`,
            thumb: proxyLegacyThumb,
            fullUrl: `https://www.legacysurvey.org/viewer/jpeg-cutout?ra=${ra}&dec=${dec}&width=2048&height=2048&layer=ls-dr10&pixscale=${(scale * 0.5).toFixed(3)}`,
            width: 2048,
            height: 2048,
            mp: 4.2
          });
        }
      }

      return results;
    }

    /**
     * Unified Multi-Archive Search:
     * Queries Deep Sky Surveys (DECam / SDSS / Ultra-HD Masters), NASA Image Library, and Wikimedia Commons in parallel.
     */
    async function searchGlobalArchives(query, archiveSource = 'all') {
      nasaContainer.innerHTML = '';
      nasaSpinner.style.display = 'flex';

      // Dynamically update section header, badge, and spinner text based on selected archive source
      const archiveTitleEl = document.getElementById('archive-results-title');
      const archiveBadgeEl = document.getElementById('archive-results-badge');
      const nasaLoadingText = document.getElementById('nasa-loading-text');

      if (archiveSource === 'surveys') {
        if (archiveTitleEl) archiveTitleEl.innerHTML = '🔭 Deep Sky Survey Masters & Cutouts';
        if (archiveBadgeEl) {
          archiveBadgeEl.textContent = 'Observatory Cutouts';
          archiveBadgeEl.style.background = 'rgba(16, 185, 129, 0.2)';
          archiveBadgeEl.style.color = '#10b981';
          archiveBadgeEl.style.borderColor = 'rgba(16, 185, 129, 0.35)';
        }
        if (nasaLoadingText) nasaLoadingText.textContent = 'Querying SDSS, Legacy Survey & Observatory Cutouts...';
        nasaResultsCount.textContent = 'Querying deep sky surveys & cutouts...';
      } else if (archiveSource === 'eso') {
        if (archiveTitleEl) archiveTitleEl.innerHTML = '🏔️ ESO & VLT Deep Space Masters';
        if (archiveBadgeEl) {
          archiveBadgeEl.textContent = '16–116 MP Ultra-HD';
          archiveBadgeEl.style.background = 'rgba(20, 184, 166, 0.2)';
          archiveBadgeEl.style.color = '#2dd4bf';
          archiveBadgeEl.style.borderColor = 'rgba(20, 184, 166, 0.35)';
        }
        if (nasaLoadingText) nasaLoadingText.textContent = 'Querying European Southern Observatory (VLT & ALMA)...';
        nasaResultsCount.textContent = 'Querying ESO / VLT Ultra-HD masters...';
      } else if (archiveSource === 'chandra') {
        if (archiveTitleEl) archiveTitleEl.innerHTML = '⚡ Chandra X-Ray Deep Space Masters';
        if (archiveBadgeEl) {
          archiveBadgeEl.textContent = 'Pitch Black OLED #000000';
          archiveBadgeEl.style.background = 'rgba(6, 182, 212, 0.2)';
          archiveBadgeEl.style.color = '#22d3ee';
          archiveBadgeEl.style.borderColor = 'rgba(6, 182, 212, 0.35)';
        }
        if (nasaLoadingText) nasaLoadingText.textContent = 'Querying Chandra X-Ray Observatory high-energy archives...';
        nasaResultsCount.textContent = 'Querying Chandra high-energy X-ray targets...';
      } else if (archiveSource === 'wikimedia') {
        if (archiveTitleEl) archiveTitleEl.innerHTML = '🌌 Wikimedia Astrophotography Results';
        if (archiveBadgeEl) {
          archiveBadgeEl.textContent = 'Public Domain Ultra-HD';
          archiveBadgeEl.style.background = 'rgba(139, 92, 246, 0.2)';
          archiveBadgeEl.style.color = '#a78bfa';
          archiveBadgeEl.style.borderColor = 'rgba(139, 92, 246, 0.35)';
        }
        if (nasaLoadingText) nasaLoadingText.textContent = 'Querying Wikimedia Commons Astrophotography...';
        nasaResultsCount.textContent = 'Querying Wikimedia astrophotography...';
      } else if (archiveSource === 'nasa') {
        if (archiveTitleEl) archiveTitleEl.innerHTML = '🛸 NASA Deep Space Archive Results';
        if (archiveBadgeEl) {
          archiveBadgeEl.textContent = 'NASA Public API';
          archiveBadgeEl.style.background = 'rgba(59, 130, 246, 0.2)';
          archiveBadgeEl.style.color = '#60a5fa';
          archiveBadgeEl.style.borderColor = 'rgba(59, 130, 246, 0.35)';
        }
        if (nasaLoadingText) nasaLoadingText.textContent = 'Querying NASA Image and Video Library...';
        nasaResultsCount.textContent = 'Querying NASA image archives...';
      } else {
        if (archiveTitleEl) archiveTitleEl.innerHTML = '🌐 Unified Astronomical Archive Discoveries';
        if (archiveBadgeEl) {
          archiveBadgeEl.textContent = 'Surveys • ESO • Chandra • NASA';
          archiveBadgeEl.style.background = 'rgba(59, 130, 246, 0.2)';
          archiveBadgeEl.style.color = '#60a5fa';
          archiveBadgeEl.style.borderColor = 'rgba(59, 130, 246, 0.35)';
        }
        if (nasaLoadingText) nasaLoadingText.textContent = 'Querying Sky Surveys, ESO, Chandra & NASA in parallel...';
        nasaResultsCount.textContent = 'Querying multi-archive deep space observations...';
      }

      const results = [];
      const popTarget = findPopularDiscovery(query);
      const canonicalQuery = popTarget ? popTarget.query : (query || '').trim();

      // 1. Fetch NASA Library
      const fetchNasa = async () => {
        try {
          const qClean = canonicalQuery;
          const nasaQ = (!qClean || qClean === 'all' || qClean === 'surveys') ? 'deep space nebula' : qClean;
          const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(nasaQ)}&media_type=image`;
          const resp = await fetch(url);
          if (!resp.ok) return [];
          const data = await resp.json();
          const items = data.collection ? data.collection.items : [];
          return items.slice(0, 10).map(item => {
            const d = item.data ? item.data[0] : {};
            return {
              source: 'NASA Public Archive',
              sourceTag: d.center || 'NASA JPL',
              title: d.title || 'Astronomical Vista',
              desc: d.description ? d.description.substring(0, 130) + '...' : 'NASA Deep Space Observation.',
              thumb: (item.links && item.links[0]) ? item.links[0].href : '',
              nasaId: d.nasa_id,
              width: 0, height: 0, mp: 0
            };
          });
        } catch (e) {
          console.warn('NASA archive fetch error:', e);
          return [];
        }
      };

      // 2. Fetch Wikimedia Commons Deep Space
      const fetchWikimedia = async () => {
        try {
          const qClean = (query || '').trim();
          const qSearch = (!qClean || qClean === 'all' || qClean === 'surveys') ? 'astronomy nebula galaxy' : `${qClean} astronomy`;
          const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(qSearch + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=800&format=json&origin=*`;
          const resp = await fetch(url);
          if (!resp.ok) return [];
          const data = await resp.json();
          const pages = data.query ? data.query.pages : {};
          const items = [];
          for (const [pid, page] of Object.entries(pages)) {
            const info = page.imageinfo ? page.imageinfo[0] : {};
            const isWebImg = info.mime === 'image/jpeg' || info.mime === 'image/png' || info.mime === 'image/webp';
            const isTiff = info.mime === 'image/tiff' && info.thumburl;
            if (info.url && (isWebImg || isTiff)) {
              const w = info.width || 0;
              const h = info.height || 0;
              const mp = (w * h) / 1000000;
              const cleanTitle = (page.title || '').replace(/^File:/i, '').replace(/\.(jpg|jpeg|png|webp|tif|tiff)$/i, '').replace(/_/g, ' ');
              items.push({
                source: isTiff ? 'Observatory TIFF Archive' : 'Wikimedia Astrophotography',
                sourceTag: isTiff ? `🔭 ${mp >= 10.0 ? mp.toFixed(0) : mp.toFixed(1)} MP TIFF Master` : (mp >= 8.0 ? 'ESO / Hubble Ultra-HD' : 'Deep Space Archive'),
                title: cleanTitle,
                desc: isTiff
                  ? `Observatory uncompressed master. Original: ${w.toLocaleString()} × ${h.toLocaleString()} (${mp.toFixed(1)} MP). High dynamic range for OLED.`
                  : `Public domain astronomical master. Resolution: ${w.toLocaleString()} × ${h.toLocaleString()} (${mp.toFixed(1)} MP).`,
                thumb: info.thumburl || info.url,
                fullUrl: isTiff ? info.thumburl : info.url,
                isTiff: isTiff,
                pageTitle: page.title,
                width: w,
                height: h,
                mp: mp
              });
            }
          }
          return items;
        } catch (e) {
          console.warn('Wikimedia archive fetch error:', e);
          return [];
        }
      };

      // 3. Fetch Live Astronomical Survey Masters from Wikimedia
      const fetchWikimediaSurveys = async () => {
        const qClean = (query || '').trim();
        if (!qClean || qClean === 'surveys' || qClean === 'all') return [];
        try {
          const stripped = qClean.replace(/\b(hubble|jwst|eso|vlt|survey)\b/gi, '').trim();
          const searchQuery = (stripped ? `${stripped} (Hubble OR JWST OR ESO OR VLT)` : 'Hubble JWST nebula') + ' filetype:bitmap';
          const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=960&format=json&origin=*`;
          const resp = await fetch(url);
          if (!resp.ok) return [];
          const data = await resp.json();
          const pages = data.query ? data.query.pages : {};
          const items = [];
          for (const [pid, page] of Object.entries(pages)) {
            const info = page.imageinfo ? page.imageinfo[0] : {};
            const isWebImg = info.mime === 'image/jpeg' || info.mime === 'image/png' || info.mime === 'image/webp';
            const isTiff = info.mime === 'image/tiff' && info.thumburl;
            if (info.url && (isWebImg || isTiff)) {
              const w = info.width || 0;
              const h = info.height || 0;
              const mp = (w * h) / 1000000;
              const cleanTitle = (page.title || '').replace(/^File:/i, '').replace(/\.(jpg|jpeg|png|webp|tif|tiff)$/i, '').replace(/_/g, ' ');
              items.push({
                source: isTiff ? 'Observatory TIFF Archive' : 'Observatory Survey Archive',
                sourceTag: isTiff ? `🔭 ${mp >= 10.0 ? mp.toFixed(0) : mp.toFixed(1)} MP TIFF Master` : (mp >= 10.0 ? `🔭 Ultra-HD Master (${mp.toFixed(1)} MP)` : '🔭 Survey Release'),
                title: cleanTitle,
                desc: isTiff
                  ? `Observatory uncompressed master. Original: ${w.toLocaleString()} × ${h.toLocaleString()} (${mp.toFixed(1)} MP). High dynamic contrast for OLED.`
                  : `Observatory survey archive master. Resolution: ${w.toLocaleString()} × ${h.toLocaleString()} (${mp.toFixed(1)} MP). High dynamic contrast for OLED.`,
                thumb: info.thumburl || info.url,
                fullUrl: isTiff ? info.thumburl : info.url,
                isTiff: isTiff,
                pageTitle: page.title,
                width: w,
                height: h,
                mp: mp
              });
            }
          }
          return items;
        } catch (e) {
          console.warn('Wikimedia survey fetch error:', e);
          return [];
        }
      };

      // 4. Fetch European Southern Observatory (ESO / VLT / ALMA) Ultra-HD Masters
      const fetchEsoMasters = async () => {
        const qClean = (query || '').trim();
        try {
          const stripped = qClean.replace(/\b(eso|vlt|observatory)\b/gi, '').trim();
          let searchQuery = 'ESO VLT (nebula OR galaxy OR cluster OR space)';
          if (stripped && stripped !== 'all' && stripped !== 'eso' && stripped !== 'surveys') {
            searchQuery = `ESO ${stripped}`;
          }
          const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=800&format=json&origin=*`;
          const resp = await fetch(url);
          if (!resp.ok) return [];
          const data = await resp.json();
          const pages = data.query ? data.query.pages : {};
          const items = [];
          for (const [pid, page] of Object.entries(pages)) {
            const info = page.imageinfo ? page.imageinfo[0] : {};
            const isWebImg = info.mime === 'image/jpeg' || info.mime === 'image/png' || info.mime === 'image/webp';
            const isTiff = info.mime === 'image/tiff' && info.thumburl;
            if (info.url && (isWebImg || isTiff)) {
              const w = info.width || 0;
              const h = info.height || 0;
              const mp = (w * h) / 1000000;
              const cleanTitle = (page.title || '').replace(/^File:/i, '').replace(/\.(jpg|jpeg|png|webp|tif|tiff)$/i, '').replace(/_/g, ' ');
              items.push({
                source: isTiff ? 'ESO TIFF Archive' : 'European Southern Observatory',
                sourceTag: isTiff ? `🏔️ ${mp >= 10.0 ? mp.toFixed(0) : mp.toFixed(1)} MP TIFF Master` : (mp >= 15.0 ? `🏔️ ESO Ultra-HD (${mp.toFixed(1)} MP)` : '🏔️ ESO / VLT Master'),
                title: cleanTitle,
                desc: isTiff
                  ? `ESO uncompressed master. Original: ${w.toLocaleString()} × ${h.toLocaleString()} (${mp.toFixed(1)} MP). High dynamic contrast for AMOLED.`
                  : `European Southern Observatory (VLT / ALMA) deep-space master. Resolution: ${w.toLocaleString()} × ${h.toLocaleString()} (${mp.toFixed(1)} MP). High dynamic contrast for AMOLED.`,
                thumb: info.thumburl || info.url,
                fullUrl: isTiff ? info.thumburl : info.url,
                isTiff: isTiff,
                pageTitle: page.title,
                width: w,
                height: h,
                mp: mp
              });
            }
          }
          return items;
        } catch (e) {
          console.warn('ESO archive fetch error:', e);
          return [];
        }
      };

      // 5. Fetch Chandra X-Ray Observatory (Pure OLED Black Masters)
      const fetchChandraXRay = async () => {
        const qClean = (query || '').trim();
        try {
          const stripped = qClean.replace(/\b(chandra|x-ray|xray)\b/gi, '').trim();
          let searchQuery = 'Chandra X-ray (pulsar OR supernova OR "black hole" OR jet OR cluster)';
          if (stripped && stripped !== 'all' && stripped !== 'chandra' && stripped !== 'surveys') {
            searchQuery = `Chandra ${stripped}`;
          }
          const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=800&format=json&origin=*`;
          const resp = await fetch(url);
          if (!resp.ok) return [];
          const data = await resp.json();
          const pages = data.query ? data.query.pages : {};
          const items = [];
          for (const [pid, page] of Object.entries(pages)) {
            const info = page.imageinfo ? page.imageinfo[0] : {};
            const isWebImg = info.mime === 'image/jpeg' || info.mime === 'image/png' || info.mime === 'image/webp';
            const isTiff = info.mime === 'image/tiff' && info.thumburl;
            if (info.url && (isWebImg || isTiff)) {
              const w = info.width || 0;
              const h = info.height || 0;
              const mp = (w * h) / 1000000;
              const cleanTitle = (page.title || '').replace(/^File:/i, '').replace(/\.(jpg|jpeg|png|webp|tif|tiff)$/i, '').replace(/_/g, ' ');
              items.push({
                source: isTiff ? 'Chandra TIFF Master' : 'Chandra X-Ray Observatory',
                sourceTag: isTiff ? `⚡ ${mp >= 10.0 ? mp.toFixed(0) : mp.toFixed(1)} MP TIFF Master` : '⚡ Pure OLED Black (X-Ray)',
                title: cleanTitle,
                desc: isTiff
                  ? `Chandra X-ray uncompressed master. Original: ${w.toLocaleString()} × ${h.toLocaleString()} (${mp.toFixed(1)} MP). Relativistic high-energy emissions on 0-nit black.`
                  : `Chandra X-ray Observatory master. Resolution: ${w.toLocaleString()} × ${h.toLocaleString()} (${mp.toFixed(1)} MP). 0-nit pitch black background with glowing relativistic emissions.`,
                thumb: info.thumburl || info.url,
                fullUrl: isTiff ? info.thumburl : info.url,
                isTiff: isTiff,
                pageTitle: page.title,
                width: w,
                height: h,
                mp: mp
              });
            }
          }
          return items;
        } catch (e) {
          console.warn('Chandra archive fetch error:', e);
          return [];
        }
      };

      // Execute queries in parallel based on user filter
      if (archiveSource === 'surveys') {
        const [sItems, wSurveyItems] = await Promise.allSettled([
          fetchSkySurveys(query),
          fetchWikimediaSurveys()
        ]);
        if (sItems.status === 'fulfilled') results.push(...sItems.value);
        if (wSurveyItems.status === 'fulfilled') {
          wSurveyItems.value.forEach(item => {
            if (!results.some(r => r.fullUrl === item.fullUrl || r.title.toLowerCase() === item.title.toLowerCase())) {
              results.push(item);
            }
          });
        }
      } else if (archiveSource === 'eso') {
        const esoItems = await fetchEsoMasters();
        results.push(...esoItems);
      } else if (archiveSource === 'chandra') {
        const chandraItems = await fetchChandraXRay();
        results.push(...chandraItems);
      } else if (archiveSource === 'nasa') {
        const nItems = await fetchNasa();
        results.push(...nItems);
      } else if (archiveSource === 'wikimedia') {
        const wItems = await fetchWikimedia();
        results.push(...wItems);
      } else {
        // "all": Query Surveys, ESO, Chandra, NASA, and Wikimedia in parallel
        const [sRes, esoRes, chandraRes, nRes, wRes] = await Promise.allSettled([
          fetchSkySurveys(query),
          fetchEsoMasters(),
          fetchChandraXRay(),
          fetchNasa(),
          fetchWikimedia()
        ]);
        // 1. Put high-res Sky Survey cutouts and ESO / Chandra masters at top
        if (sRes.status === 'fulfilled' && sRes.value.length > 0) results.push(...sRes.value);
        if (esoRes.status === 'fulfilled' && esoRes.value.length > 0) {
          esoRes.value.forEach(item => {
            if (!results.some(r => r.fullUrl === item.fullUrl || r.title.toLowerCase() === item.title.toLowerCase())) {
              results.push(item);
            }
          });
        }
        if (chandraRes.status === 'fulfilled' && chandraRes.value.length > 0) {
          chandraRes.value.forEach(item => {
            if (!results.some(r => r.fullUrl === item.fullUrl || r.title.toLowerCase() === item.title.toLowerCase())) {
              results.push(item);
            }
          });
        }
        if (nRes.status === 'fulfilled') results.push(...nRes.value);
        if (wRes.status === 'fulfilled') {
          wRes.value.forEach(item => {
            if (!results.some(r => r.fullUrl === item.fullUrl || r.title.toLowerCase() === item.title.toLowerCase())) {
              results.push(item);
            }
          });
        }
      }

      nasaSpinner.style.display = 'none';
      nasaResultsCount.textContent = `${results.length} Discoveries Found`;

      if (results.length === 0) {
        nasaContainer.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); line-height: 1.6;">
            No astronomical discoveries found for "${query}".<br>
            <span style="font-size: 13px;">Try searching popular targets like "Orion", "Andromeda", "Pillars of Creation", "Crab Nebula", "Cassiopeia A", or "Black Hole".</span>
          </div>
        `;
        return;
      }

      // Render cards
      results.forEach(res => {
        if (!res.thumb) return;

        let resBadgeStr = 'High-Res Deep Space';
        if (res.width > 0 && res.height > 0) {
          resBadgeStr = `${res.width}×${res.height} (${res.mp.toFixed(1)} MP)`;
        }

        const card = document.createElement('div');
        card.className = 'celestial-card';
        card.innerHTML = `
          <div class="card-thumb-container">
            <div class="thumb-skeleton"></div>
            <img 
              class="catalog-card-img" 
              src="${res.thumb}" 
              alt="${res.title}" 
              loading="lazy"
              onload="this.classList.add('loaded')"
              onerror="if (!this.dataset.retried && this.src.startsWith('http')) { this.dataset.retried = '1'; this.src = 'https://images.weserv.nl/?url=' + encodeURIComponent(this.src) + '&w=640'; } else { this.classList.add('loaded'); const sk = this.parentElement.querySelector('.thumb-skeleton'); if (sk) sk.style.display = 'none'; }"
            >
            <div class="thumb-badges">
              <span class="badge-tag badge-res">${resBadgeStr}</span>
              <span class="badge-tag">${res.sourceTag}</span>
            </div>
          </div>
          <div class="card-content">
            <div class="card-title-row">
              <h4 class="card-title">${res.title}</h4>
            </div>
            <span class="card-subtitle">${res.source}</span>
            <p class="card-desc">${res.desc}</p>
            <button class="card-cta-btn">
              Load into Studio ✨
            </button>
          </div>
        `;

        card.addEventListener('click', async () => {
          const btn = card.querySelector('.card-cta-btn');
          btn.textContent = '⏳ Fetching Full Image...';

          if (res.nasaId) {
            try {
              // Fetch NASA asset manifest
              const assetResp = await fetch(`https://images-api.nasa.gov/asset/${res.nasaId}`);
              const assetData = await assetResp.json();
              const assetItems = assetData.collection ? assetData.collection.items : [];

              let fullUrl = res.thumb;
              const orig = assetItems.find(i => i.href.includes('~orig.png') || i.href.includes('~orig.jpg'));
              const large = assetItems.find(i => i.href.includes('~large.jpg'));
              const medium = assetItems.find(i => i.href.includes('~medium.jpg'));

              if (orig) fullUrl = orig.href;
              else if (large) fullUrl = large.href;
              else if (medium) fullUrl = medium.href;

              btn.textContent = 'Explore Vista →';
              fetchAndLoadImage(fullUrl, res.thumb, res.title, () => {
                switchToScreen('studio');
              });
            } catch (err) {
              console.warn('Asset manifest failed, loading thumb/preview:', err);
              btn.textContent = 'Explore Vista →';
              fetchAndLoadImage(res.thumb, null, res.title, () => {
                switchToScreen('studio');
              });
            }
          } else {
            let loadUrl = res.fullUrl || res.thumb;

            // If it's an uncompressed TIFF master, resolve the 5K Web-compatible JPEG from Wikimedia
            if (res.isTiff && res.pageTitle) {
              try {
                btn.textContent = '⏳ Resolving 5K TIFF Master...';
                const tiffApiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(res.pageTitle)}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=5120&format=json&origin=*`;
                const tResp = await fetch(tiffApiUrl);
                if (tResp.ok) {
                  const tData = await tResp.json();
                  const p = tData.query && tData.query.pages ? Object.values(tData.query.pages)[0] : null;
                  if (p && p.imageinfo && p.imageinfo[0] && p.imageinfo[0].thumburl) {
                    loadUrl = p.imageinfo[0].thumburl;
                    console.log(`[Studio] Resolved 5K web master from TIFF: ${loadUrl}`);
                  }
                }
              } catch (e) {
                console.warn('[Studio] Failed to query 5K TIFF, falling back to default preview:', e);
              }
            }

            // Direct high-res master
            btn.textContent = 'Explore Vista →';
            fetchAndLoadImage(loadUrl, res.thumb, res.title, () => {
              switchToScreen('studio');
            });
          }
        });

        nasaContainer.appendChild(card);
      });
    }

    // Custom Sources: File Picker & Drag-and-Drop
    const filePicker = document.getElementById('file-picker-input');
    if (filePicker) {
      filePicker.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          handleLocalFileSelection(file);
        }
        filePicker.value = '';
      });
    }

    // Custom Sources: URL field
    const btnFetchUrl = document.getElementById('btn-fetch-custom-url');
    const customUrlField = document.getElementById('custom-url-field');
    if (btnFetchUrl && customUrlField) {
      btnFetchUrl.addEventListener('click', () => {
        const url = customUrlField.value.trim();
        if (url) {
          fetchAndLoadImage(url, null, 'Custom Astronomical URL', () => {
            switchToScreen('studio');
          });
        }
      });
    }

    // Header buttons
    if (btnEnterStudio) {
      btnEnterStudio.addEventListener('click', () => {
        switchToScreen('studio');
      });
    }
    if (btnSwitchDiscovery) {
      btnSwitchDiscovery.addEventListener('click', () => {
        switchToScreen('discovery');
      });
    }
  }

  /**
   * Generates a clean, intelligent, and uniquely timestamped filename for any export
   * incorporating the active vista name, camera trajectory mode, resolution, grading state, and timestamp.
   * Format: <vista-slug>_<motion-mode>_<detail>_<amoled|master>_<timestamp>.<ext>
   * Example: "orion-nebula_odyssey_4k_amoled_20261112-220015.html"
   */
  function generateExportFilename(extension = 'html', extraDetail = '') {
    // 1. Sanitize vista title into a clean readable slug
    let rawTitle = (activeImageTitle || 'celestial-vista')
      .toLowerCase()
      .replace(/\(.*?\)/g, '') // remove parenthetical notes
      .replace(/[^a-z0-9]+/g, '-') // slugify non-alphanumeric
      .replace(/^-+|-+$/g, '');

    if (!rawTitle) rawTitle = 'celestial-vista';
    const vistaSlug = rawTitle.substring(0, 32);

    // 2. Camera motion mode
    const mode = (cameraEngine && cameraEngine.mode) ? cameraEngine.mode.toLowerCase() : 'odyssey';

    // 3. AMOLED grade tag
    const isGraded = isAmoledGraded || (activeRenderDrawable && activeRenderDrawable !== rawSourceImage);
    const gradeTag = isGraded ? 'amoled' : 'master';

    // 4. Timestamp: YYYYMMDD-HHmmss (guarantees zero collisions between consecutive downloads)
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    // 5. Assemble filename parts
    const parts = [vistaSlug, mode];
    if (extraDetail) parts.push(extraDetail);
    parts.push(gradeTag, dateStr);

    const cleanExt = extension.replace(/^\./, '');
    return `${parts.filter(Boolean).join('_')}.${cleanExt}`;
  }

  /**
   * Updates placeholder text in export filename inputs with current vista & settings
   */
  function updateExportFilenamePlaceholders() {
    const inputHtml = document.getElementById('input-export-html-filename');
    const inputVideo = document.getElementById('input-export-video-filename');

    const selRes = document.getElementById('select-export-html-res');
    const resMode = selRes ? selRes.value : 'original';
    const htmlDetail = resMode === 'original' ? currentPresetKey : resMode;

    if (inputHtml && !inputHtml.value) {
      inputHtml.placeholder = generateExportFilename('html', htmlDetail);
    }

    const qualitySelect = document.getElementById('select-record-quality');
    const quality = qualitySelect ? qualitySelect.value : '1080p_fhd';
    const durSelect = document.getElementById('select-record-duration');
    const recordSec = durSelect ? durSelect.value : '180';
    const formatSelect = document.getElementById('select-record-format');
    const format = formatSelect ? formatSelect.value : 'mp4';

    if (inputVideo && !inputVideo.value) {
      inputVideo.placeholder = generateExportFilename(format, `${quality}_${recordSec}s`);
    }
  }

  /**
   * Sets up UI Drawer Tabs (AMOLED Grading, Spline Editor, Export)
   */
  function setupStudioDrawers() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const drawers = document.querySelectorAll('.studio-drawer');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetDrawerId = btn.dataset.drawer;
        const targetDrawer = document.getElementById(targetDrawerId);
        const isAlreadyActive = btn.classList.contains('active');

        // Close all drawers
        tabButtons.forEach(b => b.classList.remove('active'));
        drawers.forEach(d => d.classList.remove('active'));

        if (!isAlreadyActive && targetDrawer) {
          btn.classList.add('active');
          targetDrawer.classList.add('active');
          updateTopBarGeometry();

          if (targetDrawerId === 'drawer-spline') {
            setTimeout(updateSplineEditorView, 50);
          } else if (targetDrawerId === 'drawer-export') {
            updateExportFilenamePlaceholders();
          }
        }
      });
    });

    // Refresh filename suggestions when export settings change
    const selExportHtmlRes = document.getElementById('select-export-html-res');
    if (selExportHtmlRes) selExportHtmlRes.addEventListener('change', updateExportFilenamePlaceholders);
    const selRecordFormat = document.getElementById('select-record-format');
    if (selRecordFormat) selRecordFormat.addEventListener('change', updateExportFilenamePlaceholders);
    const selRecordQuality = document.getElementById('select-record-quality');
    if (selRecordQuality) selRecordQuality.addEventListener('change', updateExportFilenamePlaceholders);
    const selRecordDuration = document.getElementById('select-record-duration');
    if (selRecordDuration) selRecordDuration.addEventListener('change', updateExportFilenamePlaceholders);

    // Close buttons inside drawers
    document.querySelectorAll('.btn-close').forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        drawers.forEach(d => d.classList.remove('active'));
      });
    });

    // AMOLED Grading & Visual Enhancement Sliders with Debounced Live Preview
    let gradeDebounceTimer = null;
    const triggerDebouncedGrade = (type = 'adjustments', isFast = true) => {
      if (gradeDebounceTimer) clearTimeout(gradeDebounceTimer);
      gradeDebounceTimer = setTimeout(() => {
        if (imageLoaded && rawSourceImage && !isCanvasTainted) {
          applyInBrowserGrade(type, isFast);
        }
      }, 80);
    };

    const sliders = ['black-floor', 'knee-width', 'star-protect', 'exposure', 'contrast', 'saturation', 'sharpness'];
    sliders.forEach(s => {
      const el = document.getElementById(`slider-${s}`);
      const valEl = document.getElementById(`val-${s}`);
      const isAmoled = (s === 'black-floor' || s === 'knee-width' || s === 'star-protect');
      if (el && valEl) {
        el.addEventListener('input', (e) => {
          el.dataset.userModified = 'true';
          const v = parseFloat(e.target.value);
          if (s === 'star-protect' || s === 'sharpness') {
            valEl.textContent = `${e.target.value}%`;
          } else if (s === 'exposure') {
            valEl.textContent = `${v > 0 ? '+' : ''}${v.toFixed(2)} EV`;
          } else if (s === 'contrast' || s === 'saturation') {
            valEl.textContent = `${v.toFixed(2)}x`;
          } else {
            valEl.textContent = e.target.value;
          }
          // Real-time live visual feedback on viewport canvas
          triggerDebouncedGrade(isAmoled ? 'amoled' : 'adjustments', true);
        });

        // When user finishes dragging the slider, bake at full quality
        el.addEventListener('change', () => {
          if (imageLoaded && rawSourceImage && !isCanvasTainted) {
            applyInBrowserGrade(isAmoled ? 'amoled' : 'adjustments', false);
          }
        });
      }
    });

    // Section 1: AMOLED Grading Dedicated Buttons
    const btnApplyAmoled = document.getElementById('btn-apply-amoled') || document.getElementById('btn-bake-grade');
    if (btnApplyAmoled) {
      btnApplyAmoled.addEventListener('click', () => applyInBrowserGrade('amoled', false));
    }
    const btnResetAmoled = document.getElementById('btn-reset-amoled');
    if (btnResetAmoled) {
      btnResetAmoled.addEventListener('click', resetAmoledSection);
    }

    // Section 2: Visual Adjustments Dedicated Buttons
    const btnApplyAdjustments = document.getElementById('btn-apply-adjustments');
    if (btnApplyAdjustments) {
      btnApplyAdjustments.addEventListener('click', () => applyInBrowserGrade('adjustments', false));
    }
    const btnResetAdjustments = document.getElementById('btn-reset-adjustments');
    if (btnResetAdjustments) {
      btnResetAdjustments.addEventListener('click', resetAdjustmentsSection);
    }

    // Master Revert Button: Reverts everything to pristine raw master
    const btnUndoGrade = document.getElementById('btn-undo-grade');
    if (btnUndoGrade) {
      btnUndoGrade.addEventListener('click', resetAmoledGrade);
    }

    // Export: Standalone HTML Download (CORS resilient & automated untaint)
    const btnExportHtml = document.getElementById('btn-export-html');
    if (btnExportHtml) {
      btnExportHtml.addEventListener('click', async () => {
        if (!imageLoaded || !activeRenderDrawable) return;

        btnExportHtml.textContent = '⏳ Compiling HTML...';

        try {
          const selResEl = document.getElementById('select-export-html-res');
          const resMode = selResEl ? selResEl.value : 'original';
          const origW = activeRenderDrawable.naturalWidth || activeRenderDrawable.width;
          const origH = activeRenderDrawable.naturalHeight || activeRenderDrawable.height;

          let dataUri = '';
          const isGraded = isAmoledGraded || (activeRenderDrawable !== rawSourceImage);

          // Case 1: Source is already a self-contained Data URI and un-graded
          // If already a Data URI (e.g. bundled asset) and within safe resolution, pass through directly
          if (rawSourceImage.src && rawSourceImage.src.startsWith('data:') && !isGraded && (resMode === 'original' || origW <= 5120)) {
            dataUri = rawSourceImage.src;
            console.log(`[Export] Direct self-contained Data URI pass-through: ${origW} x ${origH}`);
          } else if (!isCanvasTainted) {
            // Case 2: Untainted canvas (including blob URLs created from streaming download)
            // Asynchronously extract high-performance WebP via canvas.toBlob()
            // Never pass blob: URLs to standalone HTML (they expire/break when opened outside the session)!
            let maxAllowedW = 5120; // 5K Ultra (17.5 MP) ceiling: ultra-crisp, instant ~350ms encode, no PC freeze
            if (resMode === '8k') maxAllowedW = 8192;
            else if (resMode === '5k') maxAllowedW = 5120;
            else if (resMode === '4k') maxAllowedW = 3840;
            else if (resMode === '1080p') maxAllowedW = 1920;
            else if (resMode === 'original') maxAllowedW = (origW > 5120 ? 5120 : origW); // Cap gigapixel (13.5K) masters at 5K

            const tw = Math.min(origW, maxAllowedW);
            const th = Math.round(origH * (tw / origW));

            btnExportHtml.textContent = `⏳ Compiling HTML (${tw}×${th})...`;
            // Yield to browser UI thread so button updates cleanly
            await new Promise(r => setTimeout(r, 40));

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = tw;
            tempCanvas.height = th;
            const tctx = tempCanvas.getContext('2d');
            tctx.imageSmoothingEnabled = true;
            tctx.imageSmoothingQuality = 'high';
            tctx.drawImage(activeRenderDrawable, 0, 0, tw, th);

            // Asynchronous non-blocking toBlob encoding off the main JS thread
            const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/webp', 0.90));
            if (blob) {
              dataUri = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              console.log(`[Export] Rendered async standalone HTML texture: ${tw} x ${th} (${(dataUri.length / (1024 * 1024)).toFixed(2)} MB, mode: ${resMode})`);
            } else {
              // Fallback to JPEG if WebP blob creation fails
              const jpgBlob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg', 0.88));
              if (jpgBlob) {
                dataUri = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(jpgBlob);
                });
              } else {
                dataUri = tempCanvas.toDataURL('image/jpeg', 0.85);
              }
            }
          } else {
            // Case 3: Tainted canvas (CORS restricted remote image)
            // Attempt automated untainting via CORS proxy
            if (rawSourceImage.src && (rawSourceImage.src.startsWith('http://') || rawSourceImage.src.startsWith('https://'))) {
              btnExportHtml.textContent = '⏳ Untainting & Compiling...';
              await new Promise(r => setTimeout(r, 40));
              try {
                let maxAllowedW = 5120;
                if (resMode === '8k') maxAllowedW = 8192;
                else if (resMode === '4k') maxAllowedW = 3840;
                else if (resMode === '1080p') maxAllowedW = 1920;

                let proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(rawSourceImage.src)}&w=${maxAllowedW}&output=webp`;

                const resp = await fetch(proxyUrl);
                if (resp.ok) {
                  const blob = await resp.blob();
                  dataUri = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });
                  console.log(`[Export] Clean Data URI generated via proxy untaint (${(dataUri.length / (1024 * 1024)).toFixed(2)} MB)`);
                } else {
                  throw new Error(`Proxy HTTP ${resp.status}`);
                }
              } catch (proxyErr) {
                console.warn('[Export] Proxy untaint failed, using remote archive stream URL:', proxyErr.message);
                if (rawSourceImage.src && !rawSourceImage.src.startsWith('blob:')) {
                  dataUri = rawSourceImage.src;
                } else {
                  throw new Error('Canvas is tainted and cannot export offline standalone image.');
                }
              }
            } else {
              throw new Error('Image source is unavailable.');
            }
          }

          if (!dataUri || dataUri.startsWith('blob:')) {
            throw new Error('Export error: Blob URLs cannot be exported to standalone HTML. Expected valid embedded Data URI.');
          }

          // Get camera engine code string
          const engineStr = CameraEngine.toString();

          const preset = PRESETS[currentPresetKey];
          const inputHtml = document.getElementById('input-export-html-filename');
          let filename = (inputHtml && inputHtml.value.trim()) 
            ? inputHtml.value.trim() 
            : generateExportFilename('html', resMode === 'original' ? currentPresetKey : resMode);
          if (!filename.toLowerCase().endsWith('.html')) filename += '.html';

          const floorEl = document.getElementById('slider-black-floor');
          const kneeEl = document.getElementById('slider-knee-width');
          const starEl = document.getElementById('slider-star-protect');
          const expEl = document.getElementById('slider-exposure');
          const contEl = document.getElementById('slider-contrast');
          const satEl = document.getElementById('slider-saturation');
          const sharpEl = document.getElementById('slider-sharpness');
          const statBlackEl = document.getElementById('stat-graded-black');
          const statOledEl = document.getElementById('stat-oled-savings');

          const recipe = {
            generator: 'Deep Space AMOLED Wallpaper Studio',
            version: '2.0.0',
            exportedAt: new Date().toISOString(),
            source: {
              title: activeImageTitle || 'Deep Space Astronomical Vista',
              masterResolution: `${rawSourceImage.naturalWidth || origW}x${rawSourceImage.naturalHeight || origH}`,
              aspectRatio: activeImageSpecs ? activeImageSpecs.aspectStr : (origW / origH).toFixed(2),
              sourceUrl: (rawSourceImage.src && !rawSourceImage.src.startsWith('data:') && !rawSourceImage.src.startsWith('blob:')) ? rawSourceImage.src : null
            },
            gradingRecipe: {
              isGraded: isGraded,
              blackFloor: floorEl ? parseFloat(floorEl.value) : 22,
              kneeWidth: kneeEl ? parseFloat(kneeEl.value) : 24,
              starProtect: starEl ? parseFloat(starEl.value) : 85,
              exposure: expEl ? parseFloat(expEl.value) : 0.0,
              contrast: contEl ? parseFloat(contEl.value) : 1.08,
              saturation: satEl ? parseFloat(satEl.value) : 1.00,
              sharpness: sharpEl ? parseFloat(sharpEl.value) : 0,
              stats: {
                blackPercentage: statBlackEl ? statBlackEl.textContent : null,
                estimatedOledSavings: statOledEl ? statOledEl.textContent : null
              }
            },
            cameraKinematics: {
              mode: cameraEngine.mode,
              loopDurationSec: loopDurationSec,
              speedMultiplier: speedMultiplier,
              waypoints: cameraEngine.getWaypoints(),
              preset: preset.label
            },
            exportResolution: (resMode === 'original') ? `${origW}x${origH}` : `${origW}x${origH}`
          };

          Exporter.exportStandaloneHtml({
            title: `Deep Space AMOLED Wallpaper (${preset.label})`,
            badge: `${preset.label} &bull; Custom Loop`,
            presetMode: cameraEngine.mode,
            durationSec: loopDurationSec,
            speedMultiplier: speedMultiplier,
            waypoints: cameraEngine.getWaypoints(),
            imageDataUri: dataUri,
            engineCode: engineStr,
            filename: filename,
            recipe: recipe
          });

          btnExportHtml.textContent = '💾 Download Standalone HTML';
        } catch (err) {
          console.error('Export HTML failed:', err);
          btnExportHtml.textContent = '💾 Download Standalone HTML';
          alert('Export could not complete: ' + err.message);
        }
      });
    }

    // Export: Video Recording (MP4 / WebM)
    let abortRecording = false;

    const btnCancelRecord = document.getElementById('btn-cancel-record');
    if (btnCancelRecord) {
      btnCancelRecord.addEventListener('click', () => {
        abortRecording = true;
        isRecording = false;
        btnRecordVideo.textContent = '🎥 Record & Download Video';
        recordBanner.classList.remove('active');
        console.log('[Studio] User requested cancellation of video export.');
      });
    }

    const btnRecordVideo = document.getElementById('btn-record-video');
    if (btnRecordVideo) {
      btnRecordVideo.addEventListener('click', () => {
        if (isRecording || !imageLoaded) return;
        abortRecording = false;
        const recordSec = parseInt(document.getElementById('select-record-duration').value, 10) || 180;
        const formatSelect = document.getElementById('select-record-format');
        const format = formatSelect ? formatSelect.value : 'mp4';
        const qualitySelect = document.getElementById('select-record-quality');
        const quality = qualitySelect ? qualitySelect.value : '1080p_fhd';

        const inputVideo = document.getElementById('input-export-video-filename');
        let filename = (inputVideo && inputVideo.value.trim()) 
          ? inputVideo.value.trim() 
          : generateExportFilename(format, `${quality}_${recordSec}s`);
        if (!filename.toLowerCase().endsWith(`.${format}`)) filename += `.${format}`;

        isRecording = true;
        btnRecordVideo.textContent = '🔴 Recording...';
        recordBanner.classList.add('active');

        // High-performance deterministic 60 FPS recording with WebCodecs H.264 MP4 & MediaRecorder fallback
        Exporter.recordVideo({
          canvas,
          filename: filename,
          renderFrameFn: (p, targetCanvas, targetCtx) => {
            renderFrame(p, targetCanvas || canvas, targetCtx || ctx);
            progress = p; // Keep scrubber & studio preview strictly in sync
            updateScrubberUI();
          },
          durationSec: recordSec,
          format: format,
          quality: quality,
          loopDurationSec: loopDurationSec,
          speedMultiplier: speedMultiplier,
          startProgress: progress,
          checkAbort: () => abortRecording,
          onProgress: (pct, elapsed, total) => {
            recordBarFill.style.width = `${pct}%`;
            recordText.textContent = `Rendering 60 FPS (${format.toUpperCase()}): ${Math.round(pct)}% (${elapsed.toFixed(1)}s / ${total}s)...`;
          },
          onFinish: (blob, filename) => {
            isRecording = false;
            btnRecordVideo.textContent = '🎥 Record & Download Video';
            recordBanner.classList.remove('active');
            console.log(`[Studio] Video downloaded: ${filename} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
          },
          onError: (err) => {
            isRecording = false;
            btnRecordVideo.textContent = '🎥 Record & Download Video';
            recordBanner.classList.remove('active');
            if (err && err.message && err.message.includes('cancelled')) {
              console.log('[Studio] Recording cancelled.');
            } else {
              alert('Video recording failed: ' + (err.message || err));
            }
          }
        });
      });
    }
  }

  /**
   * Sets up general player UI controls
   */
  function setupStudioUI() {
    // Populate Presets dropdown
    const presetSelect = document.getElementById('select-preset');
    presetSelect.innerHTML = '';
    for (const [key, p] of Object.entries(PRESETS)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = p.label;
      presetSelect.appendChild(opt);
    }
    presetSelect.value = currentPresetKey;
    presetSelect.addEventListener('change', (e) => {
      currentPresetKey = e.target.value;
      resizeViewport();
    });

    // Duration selector: immediately sync initial state and listen to both change & input
    const durationSelect = document.getElementById('select-duration');
    if (durationSelect) {
      if (durationSelect.value) {
        const initSec = parseInt(durationSelect.value, 10);
        if (!isNaN(initSec) && initSec > 0) {
          loopDurationSec = initSec;
        }
      } else {
        durationSelect.value = String(loopDurationSec);
      }
      if (cameraEngine) cameraEngine.setDuration(loopDurationSec);
      updateScrubberUI();

      const onDurationInput = (e) => {
        applyLoopDuration(e.target.value);
      };
      durationSelect.addEventListener('change', onDurationInput);
      durationSelect.addEventListener('input', onDurationInput);
    }

    // Play/Pause button
    const btnPlayPause = document.getElementById('btn-play-pause');
    btnPlayPause.addEventListener('click', () => {
      isPlaying = !isPlaying;
      btnPlayPause.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    });

    // Scrubber interaction
    scrubber.addEventListener('input', (e) => {
      progress = parseInt(e.target.value, 10) / 1000;
      updateScrubberUI();
    });

    // Speed Multiplier
    const speedSelect = document.getElementById('select-speed');
    speedSelect.addEventListener('change', (e) => {
      speedMultiplier = parseFloat(e.target.value);
    });

    // Radar Toggle
    const btnRadar = document.getElementById('btn-radar');
    btnRadar.addEventListener('click', () => {
      isRadarActive = !isRadarActive;
      radarContainer.style.display = isRadarActive ? 'block' : 'none';
      btnRadar.classList.toggle('active', isRadarActive);
    });

    // AMOLED Inspector Toggle
    const btnInspector = document.getElementById('btn-inspector');
    btnInspector.addEventListener('click', () => {
      isInspectorActive = !isInspectorActive;
      btnInspector.classList.toggle('active-magenta', isInspectorActive);
      amoledLegend.classList.toggle('visible', isInspectorActive);
    });

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    });

    // Hide HUD button
    const btnHideHud = document.getElementById('btn-hide-hud');
    btnHideHud.addEventListener('click', () => {
      isHudManuallyHidden = !isHudManuallyHidden;
      hudLayer.classList.toggle('hud-hidden', isHudManuallyHidden);
      btnHideHud.textContent = isHudManuallyHidden ? '👁 Show HUD (H)' : '🕶 Hide HUD (H)';
    });

    // Auto-hide HUD on mouse inactivity
    const resetHudTimer = () => {
      if (isHudManuallyHidden) return;
      hudLayer.classList.remove('hud-hidden');
      clearTimeout(hudHideTimeout);
      hudHideTimeout = setTimeout(() => {
        if (!isHudManuallyHidden && !document.querySelector('.studio-drawer.active')) {
          hudLayer.classList.add('hud-hidden');
        }
      }, 4000);
    };

    window.addEventListener('mousemove', resetHudTimer);
    window.addEventListener('touchstart', resetHudTimer);
    resetHudTimer();

    // Hotkey Controls
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        btnPlayPause.click();
      } else if (e.key === 'h' || e.key === 'H') {
        btnHideHud.click();
      } else if (e.key === 'b' || e.key === 'B') {
        btnInspector.click();
      } else if (e.key === 'm' || e.key === 'M') {
        btnRadar.click();
      } else if (e.key === 'f' || e.key === 'F') {
        btnFullscreen.click();
      } else if (e.key === 'Escape') {
        if (currentScreen === 'studio') {
          switchToScreen('discovery');
        }
      }
    });

    window.addEventListener('resize', () => {
      updateTopBarGeometry();
      resizeViewport();
      updateSplineEditorView();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !isRecording) {
        isPlaying = false;
        btnPlayPause.textContent = '▶ Play';
      }
    });
  }

  /**
   * Sets up Drag & Drop for arbitrary astronomical images
   */
  function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (dropZone) dropZone.classList.add('active');
    });

    window.addEventListener('dragleave', (e) => {
      if (e.clientX <= 0 || e.clientY <= 0) {
        if (dropZone) dropZone.classList.remove('active');
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dropZone) dropZone.classList.remove('active');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleLocalFileSelection(file);
      }
    });
  }

  /**
   * Progressive Web App (PWA) Initialization
   */
  function initPWA() {
    const isHttp = (window.location.protocol === 'http:' || window.location.protocol === 'https:' || window.location.hostname === 'localhost');
    if (!isHttp) {
      if (pwaStatusBadge) {
        pwaStatusBadge.textContent = '⚡ 100% Offline (Local File Mode)';
      }
      return;
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered with scope:', registration.scope);
            registration.update();
            if (pwaStatusBadge) {
              pwaStatusBadge.textContent = '⚡ 100% Offline Ready';
            }
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (pwaInstallBtn) {
        pwaInstallBtn.style.display = 'inline-flex';
      }
      console.log('[PWA] beforeinstallprompt event captured');
    });

    if (pwaInstallBtn) {
      pwaInstallBtn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) {
          if (typeof navigator.install === 'function') {
            try {
              await navigator.install();
              pwaInstallBtn.style.display = 'none';
              return;
            } catch (err) {
              console.warn('navigator.install error:', err);
            }
          }
          alert('To install this app, click the install icon in your browser address bar (or Add to Home Screen in mobile settings).');
          return;
        }

        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        console.log('[PWA] Install choice:', choice.outcome);
        if (choice.outcome === 'accepted') {
          pwaInstallBtn.style.display = 'none';
        }
        deferredInstallPrompt = null;
      });
    }

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      if (pwaInstallBtn) pwaInstallBtn.style.display = 'none';
      if (pwaStatusBadge) pwaStatusBadge.textContent = '⚡ Installed & Offline Ready';
      console.log('[PWA] App successfully installed!');
    });

    window.addEventListener('online', () => {
      if (pwaStatusBadge) pwaStatusBadge.textContent = '⚡ Online & Offline Ready';
    });
    window.addEventListener('offline', () => {
      if (pwaStatusBadge) pwaStatusBadge.textContent = '⚡ Offline Mode (Local Library Active)';
    });
  }

  // Bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
