/**
 * Recommendation Engine for Book Exchange
 * Handles personalization logic for the For You feed
 */

/**
 * Calculate recommendation score for a book based on user preferences
 * @param {Object} book - Book object with id, title, genre, created_at, etc.
 * @param {Object} user - User object with favorite_genres, read_books, interactions
 * @returns {Object} - Book with score property added
 */
export function scoreBook(book, user) {
  let score = 0

  if (!user || !book) {
    return { ...book, score }
  }

  // Genre matching (highest priority)
  const userGenres = Array.isArray(user.favorite_genres)
    ? user.favorite_genres.map(g => g.toLowerCase())
    : user.favorite_genres
      ? [user.favorite_genres.toLowerCase()]
      : []

  const bookGenre = book.genre?.toLowerCase() || ""
  userGenres.forEach((genre) => {
    if (bookGenre.includes(genre)) {
      score += 15
    }
  })

  // Recency boost (recent books get slight boost)
  if (book.created_at) {
    const daysSinceCreated =
      (new Date() - new Date(book.created_at)) / (1000 * 60 * 60 * 24)
    if (daysSinceCreated < 7) {
      score += 3
    } else if (daysSinceCreated < 30) {
      score += 1
    }
  }

  // Author preferences (if available)
  if (user.favorite_authors && book.author) {
    const favoriteAuthors = Array.isArray(user.favorite_authors)
      ? user.favorite_authors.map(a => a.toLowerCase())
      : [user.favorite_authors.toLowerCase()]

    if (
      favoriteAuthors.some((author) =>
        book.author.toLowerCase().includes(author)
      )
    ) {
      score += 12
    }
  }

  // Rating boost
  if (book.rating && book.rating >= 4.5) {
    score += 2
  } else if (book.rating && book.rating >= 4.0) {
    score += 1
  }

  return { ...book, score }
}

/**
 * Apply personalization to a list of books
 * @param {Array} books - Array of book objects
 * @param {Object} user - User object
 * @param {Number} limit - Max number of books to return
 * @returns {Array} - Sorted and filtered books
 */
export function personalizeFeed(books, user, limit = 20) {
  if (!Array.isArray(books)) {
    return []
  }

  const scored = books.map((book) => scoreBook(book, user))
  return scored
    .filter((book) => book.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Get books by genre
 * @param {Array} books - Array of book objects
 * @param {String|Array} genres - Genre(s) to filter by
 * @returns {Array} - Books matching the genres
 */
export function getBooksByGenre(books, genres) {
  if (!Array.isArray(books)) return []

  const genreList = Array.isArray(genres) ? genres : [genres]
  return books.filter((book) =>
    genreList.some((g) =>
      book.genre?.toLowerCase().includes(g.toLowerCase())
    )
  )
}

/**
 * Get books by author
 * @param {Array} books - Array of book objects
 * @param {String|Array} authors - Author(s) to filter by
 * @returns {Array} - Books by the authors
 */
export function getBooksByAuthor(books, authors) {
  if (!Array.isArray(books)) return []

  const authorList = Array.isArray(authors) ? authors : [authors]
  return books.filter((book) =>
    authorList.some((a) =>
      book.author?.toLowerCase().includes(a.toLowerCase())
    )
  )
}

/**
 * Get similar books to a given book
 * @param {Object} referenceBook - The book to find similar books for
 * @param {Array} allBooks - Pool of books to search from
 * @returns {Array} - Books similar to the reference
 */
export function getSimilarBooks(referenceBook, allBooks) {
  if (!Array.isArray(allBooks) || !referenceBook) return []

  return allBooks
    .filter((book) => book.id !== referenceBook.id)
    .filter(
      (book) =>
        book.genre?.toLowerCase() === referenceBook.genre?.toLowerCase() ||
        book.author?.toLowerCase() === referenceBook.author?.toLowerCase()
    )
    .slice(0, 10)
}

/**
 * Get trending books (recently added with good ratings)
 * @param {Array} books - Array of book objects
 * @param {Number} limit - Max number of books to return
 * @returns {Array} - Trending books
 */
export function getTrendingBooks(books, limit = 10) {
  if (!Array.isArray(books)) return []

  return books
    .filter((book) => book.rating >= 3.5)
    .sort((a, b) => {
      // Score based on recency and rating
      const aRecency =
        (new Date() - new Date(a.created_at)) / (1000 * 60 * 60 * 24)
      const bRecency =
        (new Date() - new Date(b.created_at)) / (1000 * 60 * 60 * 24)

      const aScore = (5 - (aRecency / 30)) * a.rating
      const bScore = (5 - (bRecency / 30)) * b.rating

      return bScore - aScore
    })
    .slice(0, limit)
}

/**
 * Log recommendation metrics (for debugging)
 * @param {Array} books - Books with scores
 */
export function logRecommendationMetrics(books) {
  if (!Array.isArray(books)) return

  const withScore = books.filter((b) => b.score !== undefined)
  const avgScore = withScore.reduce((sum, b) => sum + b.score, 0) / withScore.length

  console.group("%c📊 Recommendation Metrics", "color: #2196F3; font-weight: bold; font-size: 12px;")
  console.log("Total books:", books.length)
  console.log("Scored books:", withScore.length)
  console.log("Average score:", avgScore.toFixed(2))
  console.log("Top scorer:", withScore[0]?.title, `(score: ${withScore[0]?.score})`)
  console.groupEnd()
}
