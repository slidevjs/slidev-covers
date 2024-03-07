import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import fg from 'fast-glob'
import sharp from 'sharp'

const files = await fg('downloads/*.png', { onlyFiles: true })

await fs.mkdir('./assets', { recursive: true })
await fs.writeFile('./assets/index.json', JSON.stringify(files.map(i => basename(i, '.png')), null, 2), 'utf8')

for (const file of files) {
  const targetFile = join('assets', `${basename(file, '.png')}.webp`)
  if (existsSync(targetFile)) {
    console.log('Skipping:', targetFile)
    continue
  }

  // read the image file, resize it to 1920x1080, compress it, and save it to `assets/` folder
  const info = await sharp(file)
    .resize(1920, 1080)
    .toFormat('webp', { quality: 80 })
    .toFile(targetFile)

  console.log('Processed:', targetFile, `(${bytesToHumanReadable(info.size)})`)
}

function bytesToHumanReadable(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes > 1024) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(2)} ${units[i]}`
}
