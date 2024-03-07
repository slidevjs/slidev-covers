/* eslint-disable no-console */
import 'dotenv/config'
import process from 'node:process'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Buffer } from 'node:buffer'
import { $fetch } from 'ofetch'

const BASE_URL = 'https://api.unsplash.com'
const COLLECTION_ID = '94734566'
const DIR_DOWNLOADS = 'downloads'
const USE_CACHE = true

if (!process.env.UNSPLASH_ACCESS_KEY)
  throw new Error('UNSPLASH_ACCESS_KEY is required')

const perPage = 30
const photos: Photo[] = []

if (USE_CACHE && existsSync(join(DIR_DOWNLOADS, 'raw.json'))) {
  console.log('Reading cache...')
  const raw = await fs.readFile(join(DIR_DOWNLOADS, 'raw.json'), 'utf8')
  photos.push(...JSON.parse(raw))
}
else {
  for (let page = 1; page <= 10; page++) {
    console.log('Page:', page)
    const newPhotos = await $fetch(
    `${BASE_URL}/collections/${COLLECTION_ID}/photos`,
    {
      query: {
        client_id: process.env.UNSPLASH_ACCESS_KEY,
        per_page: perPage,
        page: page.toString(),
      },
    },
    ) as Photo[]
    photos.push(...newPhotos)
    if (newPhotos.length < perPage)
      break
  }
}

await fs.mkdir(DIR_DOWNLOADS, { recursive: true })

console.log(photos)
console.log('Collection:', `https://unsplash.com/collections/${COLLECTION_ID}`)
console.log('Total photos:', photos.length)

await fs.writeFile(join(DIR_DOWNLOADS, 'raw.json'), JSON.stringify(photos, null, 2), 'utf8')

for (const photo of photos) {
  await fs.writeFile(join(DIR_DOWNLOADS, `${photo.id}.md`), [
    `Photo by [${photo.user.name}](${photo.user.links.html})`,
    '',
    photo.description,
    '',
    `[![${photo.id}](./${photo.id}.png)](${photo.links.html})`,
  ].join('\n'), 'utf8')
}

for (const photo of photos) {
  if (existsSync(join(DIR_DOWNLOADS, `${photo.id}.png`))) {
    console.log(`Skip: ${photo.id}`)
    continue
  }
  console.log(`Download: ${photo.id}`)
  try {
    const blob = await $fetch(photo.urls.full, { responseType: 'blob' })
    const buffer = await blob.arrayBuffer()
    await fs.writeFile(join(DIR_DOWNLOADS, `${photo.id}.png`), Buffer.from(buffer))
  }
  catch (error) {
    console.error(`Failed to download: ${photo.id}`)
    console.error(error)
  }
}

export interface Photo {
  id: string
  created_at: Date
  updated_at: Date
  width: number
  height: number
  color: string
  blur_hash: string
  likes: number
  liked_by_user: boolean
  description: string
  user: User
  urls: Urls
  links: Links
}

export interface Urls {
  raw: string
  full: string
  regular: string
  small: string
  thumb: string
}

export interface User {
  id: string
  username: string
  name: string
  portfolio_url: string
  bio: string
  location: string
  total_likes: number
  total_photos: number
  total_collections: number
  instagram_username: string
  twitter_username: string
  profile_image: ProfileImage
  links: Links
}

export interface Links {
  self: string
  html: string
  photos: string
  likes: string
  portfolio: string
}

export interface ProfileImage {
  small: string
  medium: string
  large: string
}
