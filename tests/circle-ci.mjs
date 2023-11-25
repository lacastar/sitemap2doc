import { Sitemap2Doc } from './src/Sitemap2Doc.mjs'

try {
    const s2d = new Sitemap2Doc()
    const config = s2d.getConfig()

    if( config['download']['chunkSize'] === 2 ) {
        console.log( 'Success!' )
        process.exit( 0 )
    } else {
        console.log( 'Error! Wrong value.' )
        process.exit( 1 )
    }
} catch( e ) {
    console.log( 'Error!' )
    process.exit( 1 )
}

