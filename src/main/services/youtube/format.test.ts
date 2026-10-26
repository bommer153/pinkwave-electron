// Run: node src/main/services/youtube/format.test.ts
import assert from 'node:assert/strict'
import { cleanArtist, decodeEntities, parseDuration } from './format.ts'

assert.equal(parseDuration('PT3M45S'), 225)
assert.equal(parseDuration('PT1H2M3S'), 3723)
assert.equal(parseDuration('PT45S'), 45)
assert.equal(parseDuration('PT2H'), 7200)
assert.equal(parseDuration('P1DT1S'), 86401)
assert.equal(parseDuration('P0D'), undefined) // live streams
assert.equal(parseDuration(undefined), undefined)
assert.equal(parseDuration('garbage'), undefined)

assert.equal(decodeEntities('Rock &amp; Roll &quot;Live&quot; &#39;99'), `Rock & Roll "Live" '99`)
assert.equal(decodeEntities('&#x2665; &unknown;'), '♥ &unknown;')

assert.equal(cleanArtist('Daft Punk - Topic'), 'Daft Punk')
assert.equal(cleanArtist('Tom &amp; Jerry'), 'Tom & Jerry')

console.log('format.test: ok')
