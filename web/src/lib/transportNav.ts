export const TRANSPORT_NAV = [
  { to: '/ulasim-agi', hash: '', label: 'Merkez', auth: false },
  { to: '/hatlar', hash: '', label: 'Hatlar', auth: false },
  { to: '/ulasim-agi', hash: '#harita', label: 'Harita', auth: false },
  { to: '/ulasim', hash: '', label: 'Kartlarım', auth: true },
  { to: '/binis', hash: '', label: 'Biniş', auth: true },
  { to: '/vezne', hash: '', label: 'Vezne', auth: true },
] as const

export const TRANSPORT_CONTINUE = [
  { to: '/hatlar', kicker: 'Keşif', title: 'Hatlar', hint: 'Güzergâh uçlarını ve İETT kaydını görün.' },
  { to: '/ulasim', kicker: 'Kart', title: 'Kartlarım', hint: 'Demo bakiye yükleyin, hareketleri izleyin.' },
  { to: '/binis', kicker: 'Simülasyon', title: 'Biniş', hint: 'Kart okutma denemesi — gerçek tarife değil.' },
  { to: '/vezne', kicker: 'Ödeme', title: 'Dijital vezne', hint: 'Borç ve kart yükleme girişleri.' },
] as const
