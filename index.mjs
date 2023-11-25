import { Sitemap2Doc } from './src/Sitemap2Doc.mjs'

const s2d = new Sitemap2Doc()
await s2d.getDocument( { 
    'projectName': 'dede',
    'sitemapUrl': 'https://docs.minaprotocol.com/sitemap.xml' 
} )