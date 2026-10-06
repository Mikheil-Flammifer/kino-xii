// src/mocks/movies.js
const base = [
  {
    id: 1,
    title: 'The Odyssey',
    description: 'A king spends ten years finding his way home from a war he already won.',
    poster: '/images/odyssey-poster.jpg',
    backdrop: '/public/images/odyssey-banner.png',
    genres: ['Adventure'],
    duration: 134,
    ageRating: '16+',
    formats: ['IMAX'],
    minPrice: 14,
  },
  // add more movies here
];

export const featuredMock = base;
export const nowPlayingMock = base;
export const comingSoonMock = base;