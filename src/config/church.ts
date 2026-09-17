/**
 * ============================================================================
 *  CHURCH CONFIGURATION
 * ============================================================================
 *
 *  This is the ONLY file most churches need to edit when forking this template.
 *
 *  Fill in your church's details below. For assets (logo, images), replace the
 *  files inside `public/assets/images/` keeping the same filenames, or update
 *  the filenames here.
 *
 *  For the deployment base path (used by GitHub Pages), set the
 *  `NEXT_PUBLIC_BASE_PATH` environment variable instead of editing this file.
 *  See README.md and SETUP.md for full instructions.
 * ============================================================================
 */

export interface ServiceSchedule {
  /** Display name of the service, e.g. "Kebaktian Sabat (Hybrid)" */
  name: string;
  /** Display time of the service, e.g. "09.00 WIB" */
  time: string;
}

export interface ChurchConfig {
  /** Full church name shown in the browser tab, footer, navbar, etc. */
  name: string;
  /** Short/brand name shown in the navbar. Often the same as `name`. */
  shortName: string;
  /** Meta description used for SEO in the <head>. */
  description: string;

  /** Homepage hero heading, e.g. "Selamat Datang di <church>". */
  welcomeHeading: string;
  /** Homepage hero subtitle text. */
  welcomeSubtitle: string;

  /** Asset filenames located in `public/assets/images/`. */
  assets: {
    logo: string;
    zoomLogo: string;
    birthdayHeader: string;
  };

  /** Homepage worship service schedule cards. */
  services: ServiceSchedule[];

  /** Zoom / online meeting details. */
  zoom: {
    /** Human-readable meeting id, e.g. "987 654 1988". */
    id: string;
    /** Meeting password. */
    password: string;
    /** Full join URL. */
    url: string;
  };

  /** Social media (Instagram). */
  instagram: {
    /** Handle as displayed, e.g. "@gmahkbsd". */
    handle: string;
    /** Full profile URL. */
    url: string;
  };

  /** Google Maps embed URL (the `src` of the embed iframe). */
  mapsEmbedUrl: string;

  /** Announcements: Canva design embed URL for the pengumuman page. */
  pengumumanEmbedUrl: string;

  /** Google Sheets data sources. */
  sheets: {
    /**
     * Worship schedule (jadwal pelayanan) — the sheet that lists who serves
     * in which role for each Saturday. A new spreadsheet is used each quarter,
     * so update both `sheetId` and `gid` (the participants tab) accordingly.
     */
    schedule: {
      sheetId: string;
      /** gid of the participants tab within the quarter's spreadsheet. */
      gid: string;
    };
    /**
     * Kertas Acara / Lagu Sion sheet — holds the worship order details and
     * the hymnal (Lagu Sion) number-to-title lookup. These live in two tabs
     * of the same spreadsheet, identified by their gid.
     */
    liturgy: {
      sheetId: string;
      /** gid of the "kertas acara" tab. */
      kertasAcaraGid: string;
      /** gid of the "Lagu Sion" (hymnal lookup) tab. */
      laguSionGid: string;
    };
    /**
     * Birthday (ulang tahun) sheet — congregation member birthdays. The data
     * is split across multiple tabs (roughly one per month, though rows are
     * not strictly grouped by birth month). All tabs are fetched and merged;
     * each person's birth month/day is read from their own row columns.
     */
    birthdays: {
      sheetId: string;
      /** gids of every tab that holds birthday rows. */
      tabGids: string[];
    };
  };

  /**
   * Kertas Acara liturgy configuration. This is tightly coupled to your
   * church's own worship order and the structure of your schedule sheet.
   * See SETUP.md for the expected sheet layout.
   */
  kertasAcara: {
    /**
     * Prefix used when displaying a hymn, e.g. "LSEL" for
     * "Lagu Sion Edisi Lengkap". Rendered as "<prefix> <number> | <title>".
     */
    hymnalPrefix: string;
    /** Fixed hymn numbers used at set points in the worship order. */
    fixedHymns: {
      laguPartisipanKhotbah: string;
      laguSambutan1: string;
      laguSambutanKhotbah: string;
      laguSambutan2: string;
    };
    /** Static text shown for the "Pengumuman" slot in Sekolah Sabat. */
    pengumumanRole: string;
    /**
     * Keywords used to classify rows in the schedule sheet into sections.
     * All comparisons are case-insensitive. Adjust these to match the exact
     * role labels used in your church's schedule spreadsheet.
     */
    parsing: {
      /** Rows whose role contains any of these are skipped entirely. */
      skipRoleKeywords: string[];
      /** A row whose role contains this marks the start of the SS section. */
      ssSectionMarker: string;
      /** A row whose role contains this marks the start of the Khotbah section. */
      khotbahSectionMarker: string;
      /** Role keywords that classify a row into the Diakonia section. */
      diakoniaKeywords: string[];
      /** Role keywords that classify a row into the Pelayanan Musik section. */
      pelayananKeywords: string[];
      /** Role keywords that mark a role as filled by two people. */
      multiPersonKeywords: string[];
      /**
       * The rotating "Dorongan" role. When a role matches `matchKeyword` AND
       * any of `subKeywords`, its display label rotates by the Saturday number
       * of the month according to `rotation`.
       */
      dorongan: {
        matchKeyword: string;
        subKeywords: string[];
        /** Map of Saturday-of-month number (1-5) to display label. */
        rotation: Record<number, string>;
      };
    };
  };
}

export const churchConfig: ChurchConfig = {
  name: "GMAHK BSD",
  shortName: "GMAHK BSD",
  description: "A simple homepage built with Next.js and TypeScript",

  welcomeHeading: "Selamat Datang di GMAHK BSD",
  welcomeSubtitle:
    "Bergabunglah dengan kami dalam perjalanan iman, komunitas, dan pelayanan.",

  assets: {
    logo: "logo.png",
    zoomLogo: "zoom-logo.png",
    birthdayHeader: "balloons.jpg",
  },

  services: [
    { name: "Rabu Malam & Vesper (Online)", time: "07.00 WIB" },
    { name: "Kebaktian Sabat (Hybrid)", time: "09.00 WIB" },
  ],

  zoom: {
    id: "987 654 1988",
    password: "1988",
    url: "https://us02web.zoom.us/j/9876541988?pwd=L21vRW5sV3RpZmI3d2lHOVNUWGJldz09",
  },

  instagram: {
    handle: "@gmahkbsd",
    url: "https://www.instagram.com/gmahkbsd/",
  },

  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d540.1432901599097!2d106.68286777096924!3d-6.303682256829734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69e52cb2eef9f1%3A0xec9eb7343cb6b8cd!2sGMAHK%20Bumi%20Serpong%20Damai!5e0!3m2!1sen!2sid!4v1770132548503!5m2!1sen!2sid",

  pengumumanEmbedUrl:
    "https://www.canva.com/design/DAG-9nAgcSE/Ri8PyLxmRovXS8iWkST9aQ/view?embed",

  sheets: {
    schedule: {
      sheetId: "1w8vGDDRyVWuxm44WY1nxPS7REU_XGCYN09IB5or8bJY",
      gid: "636950867",
    },
    liturgy: {
      sheetId: "1uW-CwZxGJ9Jfqv78pUc-4iE9fqgrV17eV9Ws_FEE5Ns",
      kertasAcaraGid: "1587228396",
      laguSionGid: "1174681408",
    },
    birthdays: {
      sheetId: "1S5mpra2WiQDO_-pM0nhD71Af5UYEalbh",
      tabGids: [
        "2436171",
        "244569119",
        "344878463",
        "626197923",
        "671069382",
        "1069981365",
        "1083107201",
        "1199476514",
        "1564874483",
        "1617354717",
        "1920719344",
        "1963630498",
        "2108089331",
      ],
    },
  },

  kertasAcara: {
    hymnalPrefix: "LSEL",
    fixedHymns: {
      laguPartisipanKhotbah: "421",
      laguSambutan1: "21",
      laguSambutanKhotbah: "524",
      laguSambutan2: "168",
    },
    pengumumanRole: "Dept. Komunikasi, Ketua Jemaat",
    parsing: {
      skipRoleKeywords: ["penyedia potluck", "koordinator"],
      ssSectionMarker: "DEWASA",
      khotbahSectionMarker: "KHOTBAH",
      diakoniaKeywords: ["diakon", "diakones", "bwa"],
      pelayananKeywords: ["pelayanan musik", "pianist", "keyboardist"],
      multiPersonKeywords: ["diakon persembahan", "diakones", "bwa"],
      dorongan: {
        matchKeyword: "dor",
        subKeywords: ["pp", "rt", "kesehatan"],
        rotation: {
          1: "Dorongan PP",
          2: "Rumah Tangga",
          3: "Dorongan PP",
          4: "Kesehatan",
          5: "Dorongan PP",
        },
      },
    },
  },
};

export default churchConfig;
