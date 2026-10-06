// src/mocks/movies.js

const base = [
  // =========================================================
  // FEATURED / HERO
  // =========================================================

  {
    id: 1,
    title: 'The Odyssey',
    description:
      'A king spends ten years finding his way home from a war he already won, while monsters, gods, and his own restlessness make sure the return takes longer than the fighting did. By the time land comes back into view, the man arriving is not quite the one who left.',
    poster: '/images/odyssey-poster.jpg',
    backdrop: '/images/odyssey-banner.png',
    genres: ['Drama'],
    duration: 134,
    ageRating: '16+',
    formats: ['IMAX'],
    minPrice: 14,
  },

  // =========================================================
  // NOW PLAYING
  // =========================================================

  {
    id: 2,
    title: 'The Odyssey',
    description: '',
    poster: '/images/images-1.jpg',
    genres: ['Thriller'],
    duration: 102,
    ageRating: '16+',
    formats: ['2D'],
    minPrice: 14,
  },

  {
    id: 3,
    title: 'Nine Red Doors',
    description: '',
    poster: '/images/x19dchU8e38vQfW4epzOsQNLuZ2-1.png',
    genres: ['Thriller'],
    duration: 102,
    ageRating: '16+',
    formats: ['2D'],
    minPrice: 14,
  },

  {
    id: 4,
    title: 'Nine Red Doors',
    description: '',
    poster: '/images/images-4.jpg',
    genres: ['Thriller'],
    duration: 102,
    ageRating: '16+',
    formats: ['2D'],
    minPrice: 14,
  },

  {
    id: 5,
    title: 'Nine Red Doors',
    description: '',
    poster: '/images/1788807958Web_Banner_-_Avengers-Doomsday_jpg.png',
    genres: ['Thriller'],
    duration: 102,
    ageRating: '16+',
    formats: ['2D'],
    minPrice: 14,
  },

  {
    id: 6,
    title: 'Nine Red Doors',
    description: '',
    poster:
      '/images/Joker-2019-Final-Style-steps-Poster-buy-original-movie-posters-at-starstills__62518.png',
    genres: ['Thriller'],
    duration: 102,
    ageRating: '16+',
    formats: ['2D'],
    minPrice: 14,
  },

  {
    id: 7,
    title: 'Nine Red Doors',
    description: '',
    poster: '/images/images-5.jpg',
    genres: ['Thriller'],
    duration: 102,
    ageRating: '16+',
    formats: ['2D'],
    minPrice: 14,
  },

  // =========================================================
  // COMING SOON
  // =========================================================

  {
    id: 8,
    title: "The Cartographer's Wife",
    description: '',
    poster: '/images/the-cartographers-wife.jpg',
    genres: ['Drama'],
    duration: 134,
    ageRating: '12+',
    formats: ['2D'],
    minPrice: 14,
    releaseDate: '2 October',
  },

  {
    id: 9,
    title: 'Michael',
    description: '',
    poster: '/images/michael.jpg',
    genres: ['Drama'],
    duration: 134,
    ageRating: '12+',
    formats: ['2D'],
    minPrice: 14,
    releaseDate: '2 October',
  },
]

// =========================================================
// HOME PAGE DATA
// =========================================================

export const featuredMock = [
  base[0],
]

export const nowPlayingMock = [
  base[1],
  base[2],
  base[3],
  base[4],
  base[5],
  base[6],
]

export const comingSoonMock = [
  base[7],
  base[8],
]

