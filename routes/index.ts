import ids from '../assets/index.json'

export default defineEventHandler((event) => {
  const index = Math.floor(Math.random() * ids.length)
  const id = ids[index]
  sendRedirect(event, `https://www.google.com?q=${id}`, 302)
})
