// src/mocks/movies.js

const base = [
  {
    id: 1,
    title: 'The Odyssey',
    description:
      'A king spends ten years finding his way home from a war he already won, while monsters, gods, and his own restlessness make sure the return takes longer than the fighting did.',
    poster: '/images/odyssey-poster.jpg',
    backdrop: '/images/odyssey-banner.png',
    genres: ['Drama'],
    duration: 134,
    ageRating: '16+',
    formats: ['IMAX'],
    minPrice: 14,
  },

  {
    id: 2,
    title: 'Nine Red Doors',
    description: '',
    poster: '/images/nine-red-doors.jpg',
    backdrop: '/images/nine-red-doors-banner.jpg',
    genres: ['Thriller'],
    duration: 102,
    ageRating: '16+',
    formats: ['2D'],
    minPrice: 14,
  },

  {
    id: 3,
    title: "The Cartographer's Wife",
    description: '',
    poster: '/images/the-cartographers-wife.jpg',
    backdrop: '/images/the-cartographers-wife-banner.jpg',
    genres: ['Drama'],
    duration: 134,
    ageRating: '16+',
    formats: ['2D'],
    minPrice: 14,
    releaseDate: '2 October',
  },

  {
    id: 4,
    title: 'Michael',
    description: '',
    poster: '/images/michael.jpg',
    backdrop: '/images/michael-banner.jpg',
    genres: ['Drama'],
    duration: 134,
    ageRating: '16+',
    formats: ['2D'],
    minPrice: 14,
    releaseDate: '2 October',
  },
]

export const featuredMock = [
  base[0],
  base[1],
  base[2],
  base[3],
]

export const nowPlayingMock = [
  base[0],
  base[1],
]

export const comingSoonMock = [
  base[2],
  base[3],
]
