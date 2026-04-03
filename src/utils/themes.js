export const themes = {
  oeteldonk: {
    name: 'Oeteldonk',
    months: [2], // February - Carnival season
    coinImages: [
      'assets/oeteldonk-mode/frog-coin.png',
      'assets/oeteldonk-mode/carnival-coin.png',
      'assets/oeteldonk-mode/confetti-coin.png',
      'assets/oeteldonk-mode/mask-coin.png',
    ],
    gifs: {
      beer: 'assets/default-mode/beer-drinking.gif',
      cat: 'assets/oeteldonk-mode/oeteldonk-cat.gif',
      fish: 'assets/default-mode/fish.mp4',
    },
    videos: {
      subway: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264_opt.mp4',
      subwayWebm: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_vp9.webm',
    },
    audio: { background: 'assets/oeteldonk-mode/oeteldonk-music.mp3' },
    partyImages: [
      'assets/oeteldonk-mode/oeteldonk-heineken.png',
      'assets/oeteldonk-mode/oeteldonk-hertog.png',
      'assets/oeteldonk-mode/oeteldonk-lays.png',
      'assets/oeteldonk-mode/oeteldonk-boonekamp.png',
    ],
    icon: 'assets/oeteldonk-mode/oeteldonk-cart.png',
    fullCart: 'assets/oeteldonk-mode/oeteldonk-full-cart.png',
    cssClass: 'oeteldonk-theme',
  },
  halloween: {
    name: 'Halloween',
    months: [10], // October
    coinImages: [
      'assets/spooktober-mode/pumpkin-coin.png',
      'assets/spooktober-mode/ghost-coin.png',
      'assets/spooktober-mode/bat-coin.png',
      'assets/spooktober-mode/skull-coin.png',
    ],
    gifs: {
      beer: 'assets/default-mode/beer-drinking.gif',
      cat: 'assets/default-mode/cat.gif',
      fish: 'assets/default-mode/fish.mp4',
    },
    videos: {
      subway: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264_opt.mp4',
      subwayWebm: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_vp9.webm',
    },
    audio: { background: 'assets/default-mode/fish-music.mp3' },
    partyImages: [
      'assets/default-mode/heineken.png',
      'assets/default-mode/hertog_jan.png',
      'assets/default-mode/lays.png',
      'assets/default-mode/boonekamp.png',
    ],
    icon: 'assets/spooktober-mode/halloween-cart.png',
    fullCart: 'assets/spooktober-mode/halloween-full-cart.png',
    cssClass: 'halloween-theme',
  },
  christmas: {
    name: 'Christmas',
    months: [12], // December
    coinImages: [
      'assets/christmas-mode/snowflake-coin.png',
      'assets/christmas-mode/gift-coin.png',
      'assets/christmas-mode/star-coin.png',
      'assets/christmas-mode/ornament-coin.png',
    ],
    gifs: {
      beer: 'assets/christmas-mode/beer-drinking.gif',
      cat: 'assets/christmas-mode/christmas-cat.gif',
      fish: 'assets/christmas-mode/christmas-fish.gif',
    },
    videos: {
      subway: 'assets/christmas-mode/christmas-subway.mp4',
      subwayWebm: null,
    },
    audio: { background: 'assets/christmas-mode/Funkytown (Christmas).mp3' },
    partyImages: [
      'assets/christmas-mode/christmas-heineken.png',
      'assets/christmas-mode/christmas-hertog.png',
      'assets/christmas-mode/christmas-lays.png',
      'assets/christmas-mode/christmas-boonekamp.png',
    ],
    icon: 'assets/christmas-mode/empty_cart.png',
    fullCart: 'assets/christmas-mode/christmas-full-cart.jpg',
    cssClass: 'christmas-theme',
  },
  wintersport: {
    name: 'Wintersport',
    months: [3], // March - Ski season
    coinImages: [
      'assets/wintersport-mode/ski-coin.svg',
      'assets/wintersport-mode/snowboard-coin.svg',
      'assets/wintersport-mode/gondel-coin.svg',
      'assets/wintersport-mode/snowflake-coin.svg',
    ],
    gifs: {
      beer: 'assets/default-mode/beer-drinking.gif',
      cat: 'assets/wintersport-mode/vallendeskiboy.gif',
      fish: 'assets/default-mode/fish.mp4',
    },
    videos: {
      subway: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264_opt.mp4',
      subwayWebm: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_vp9.webm',
    },
    audio: {
      background: 'assets/wintersport-mode/DJ Ötzi - Anton aus Tirol (Not Barocka Remix).mp3',
    },
    partyImages: [
      'assets/default-mode/heineken.png',
      'assets/default-mode/hertog_jan.png',
      'assets/default-mode/lays.png',
      'assets/default-mode/boonekamp.png',
    ],
    icon: 'assets/wintersport-mode/wintersport-empty-cart.png',
    fullCart: 'assets/wintersport-mode/wintersport-full-cart.png',
    cssClass: 'wintersport-theme',
  },
  default: {
    name: 'Default',
    months: [],
    coinImages: ['assets/default-mode/coin.png', 'assets/default-mode/coin2.png'],
    gifs: {
      beer: 'assets/default-mode/beer-drinking.gif',
      cat: 'assets/default-mode/cat.gif',
      fish: 'assets/default-mode/fish.mp4',
    },
    videos: {
      subway: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_h264_opt.mp4',
      subwayWebm: 'assets/default-mode/youtube_RbVMiu4ubT0_480x854_vp9.webm',
    },
    audio: { background: 'assets/default-mode/fish-music.mp3' },
    partyImages: [
      'assets/default-mode/heineken.png',
      'assets/default-mode/hertog_jan.png',
      'assets/default-mode/lays.png',
      'assets/default-mode/boonekamp.png',
    ],
    icon: 'assets/default-mode/empty_cart.png',
    fullCart: 'assets/default-mode/full_cart.jpg',
    cssClass: 'default-theme',
  },
};

export function detectCurrentTheme() {
  const currentMonth = new Date().getMonth() + 1;
  for (const [themeName, theme] of Object.entries(themes)) {
    if (theme.months.includes(currentMonth)) {
      return themeName;
    }
  }
  return 'default';
}

export function isSpecialMonth() {
  const currentMonth = new Date().getMonth() + 1;
  for (const [themeName, theme] of Object.entries(themes)) {
    if (themeName !== 'default' && theme.months.includes(currentMonth)) {
      return true;
    }
  }
  return false;
}

