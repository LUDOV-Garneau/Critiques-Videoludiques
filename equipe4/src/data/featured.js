export const featuredGames = [
  {
    title: "Marvel's Spider-Man : Miles Morales",
    platform: 'PS4/PS5',
    score: 85,
    excerpt: "Un spin-off nerveux et spectaculaire, axé sur l’élan et le style.",
    cover: '/src/assets/featuredgames/spiderman.avif',
  },
  {
    title: "Assassin's Creed Valhalla",
    platform: 'PC/PS/Xbox',
    score: 84,
    excerpt: 'Un RPG viking massif, exploration nordique et raids épiques.',
    cover: '/src/assets/featuredgames/valhalla.jpg',
  },
  {
    title: 'Wattam',
    platform: 'PC/PS',
    score: 75,
    excerpt: 'Jeu d’auteur délirant et poétique, célébrant la joie et l’absurde.',
    cover: '/src/assets/featuredgames/wattam.jpg',
  },
]

export function pickDailyFeatured(count = 3) {
  const n = featuredGames.length
  if (!n) return []
  const today = new Date()
  const dayIndex = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000)
  const start = dayIndex % n
  const result = []
  for (let i = 0; i < Math.min(count, n); i++) {
    result.push(featuredGames[(start + i) % n])
  }
  return result
}


