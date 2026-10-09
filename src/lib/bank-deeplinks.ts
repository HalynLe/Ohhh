export interface BankAppDeepLink {
  id: string;
  name: string;
  shortName: string;
  icon: string; // emoji or brand color
  color: string;
  iosScheme: string;
  androidScheme: string;
  appStoreUrl: string;
  playStoreUrl: string;
}

export const POPULAR_BANK_APPS: BankAppDeepLink[] = [
  {
    id: 'mbbank',
    name: 'MB Bank (Quân Đội)',
    shortName: 'MB Bank',
    icon: '🔵',
    color: '#0033A0',
    iosScheme: 'mbmobile://',
    androidScheme: 'com.mbmobile://',
    appStoreUrl: 'https://apps.apple.com/vn/app/mb-bank/id1205807860',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.mbmobile',
  },
  {
    id: 'vietcombank',
    name: 'Vietcombank Digibank',
    shortName: 'Vietcombank',
    icon: '🟢',
    color: '#005C2B',
    iosScheme: 'vietcombank://',
    androidScheme: 'com.VCB://',
    appStoreUrl: 'https://apps.apple.com/vn/app/vietcombank/id561433133',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.VCB',
  },
  {
    id: 'techcombank',
    name: 'Techcombank Mobile',
    shortName: 'Techcombank',
    icon: '🔴',
    color: '#ED1C24',
    iosScheme: 'techcombank://',
    androidScheme: 'vn.com.techcombank.bb.app://',
    appStoreUrl: 'https://apps.apple.com/vn/app/techcombank-mobile/id1548623362',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=vn.com.techcombank.bb.app',
  },
  {
    id: 'vpbank',
    name: 'VPBank NEO',
    shortName: 'VPBank NEO',
    icon: '🟢',
    color: '#008542',
    iosScheme: 'vpbankneo://',
    androidScheme: 'com.vnpay.vpbankonline://',
    appStoreUrl: 'https://apps.apple.com/vn/app/vpbank-neo/id1209372509',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.vnpay.vpbankonline',
  },
  {
    id: 'bidv',
    name: 'BIDV SmartBanking',
    shortName: 'BIDV',
    icon: '🟡',
    color: '#00665C',
    iosScheme: 'bidvsmartbanking://',
    androidScheme: 'com.vnpay.bidv://',
    appStoreUrl: 'https://apps.apple.com/vn/app/bidv-smartbanking/id1061861477',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.vnpay.bidv',
  },
  {
    id: 'acb',
    name: 'ACB ONE',
    shortName: 'ACB ONE',
    icon: '🔵',
    color: '#0055A5',
    iosScheme: 'acbone://',
    androidScheme: 'mobile.acb.com.vn://',
    appStoreUrl: 'https://apps.apple.com/vn/app/acb-one/id584438238',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=mobile.acb.com.vn',
  },
  {
    id: 'tpbank',
    name: 'TPBank Mobile',
    shortName: 'TPBank',
    icon: '🟣',
    color: '#76226C',
    iosScheme: 'tpbank://',
    androidScheme: 'com.tpb.mb.gprsandroid://',
    appStoreUrl: 'https://apps.apple.com/vn/app/tpbank-mobile/id450464147',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.tpb.mb.gprsandroid',
  },
  {
    id: 'vietinbank',
    name: 'VietinBank iPay',
    shortName: 'VietinBank',
    icon: '🔵',
    color: '#00559F',
    iosScheme: 'vietinbankipay://',
    androidScheme: 'com.vietinbank.ipay://',
    appStoreUrl: 'https://apps.apple.com/vn/app/vietinbank-ipay/id689450201',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.vietinbank.ipay',
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    shortName: 'MoMo',
    icon: '🌸',
    color: '#A50064',
    iosScheme: 'momo://',
    androidScheme: 'com.mservice.momotransfer://',
    appStoreUrl: 'https://apps.apple.com/vn/app/momo-chuy%E1%BB%83n-ti%E1%BB%81n-thanh-to%C3%A1n/id918751511',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.mservice.momotransfer',
  },
  {
    id: 'zalopay',
    name: 'Ví ZaloPay',
    shortName: 'ZaloPay',
    icon: '🔵',
    color: '#0068FF',
    iosScheme: 'zalopay://',
    androidScheme: 'vn.com.vng.zalopay://',
    appStoreUrl: 'https://apps.apple.com/vn/app/zalopay-%C4%91%E1%BA%B7t-xe-giao-%C4%91%E1%BB%93-%C4%83n/id1112407520',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=vn.com.vng.zalopay',
  },
];

/**
 * Mở App Ngân hàng trên điện thoại (iOS / Android Deep Link)
 */
export function openBankingApp(bankApp: BankAppDeepLink): void {
  if (typeof window === 'undefined') return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const scheme = isIOS ? bankApp.iosScheme : bankApp.androidScheme;

  // Thử mở App qua Deep Link Protocol
  const start = Date.now();
  window.location.href = scheme;

  // Fallback sang App Store nếu máy chưa cài app
  setTimeout(() => {
    if (Date.now() - start < 1500) {
      // Nếu sau 1.5s chưa chuyển sang app, có thể chưa cài
      const storeUrl = isIOS ? bankApp.appStoreUrl : bankApp.playStoreUrl;
      window.open(storeUrl, '_blank');
    }
  }, 1000);
}
