/*
    Disclaimer:
    The use of this software is governed by the terms and conditions of the Apache License 2.0. Please review the license agreement carefully before downloading or using this software.
    Furthermore, downloading content from websites using this software is subject to compliance with the rules and permissions set forth in the websites' robots.txt files. Prior to any downloading activity, ensure that you have obtained necessary permissions and that your actions align with the guidelines specified in the robots.txt file of the respective website.
    By downloading and using this software, you acknowledge and agree to abide by both the terms of the Apache License 2.0 and any applicable rules outlined in robots.txt files. Unauthorized downloading and use may be in violation of legal and ethical standards.
*/


import { config as cfg } from './data/config.mjs'
import moment from 'moment'
import { keyPathToValue, printValidation } from './helpers/mixed.mjs' 
import axios from 'axios'
import xml2js from 'xml2js'
import fs from 'fs'
import path from 'path'


export class Sitemap2Doc {
    #config
    #silent


    constructor() {
        this.setConfig( { 'config': cfg } )
        return true
    }


    async getDocument( { projectName, sitemapUrl, silent=false } ) {

       // const [ m, c ] = this.#validateStart( { projectName, sitemapUrl, silent } )
       // printValidation( { 'messages': m, 'comments': c } )

        this.#silent = silent
        const cmd = this.#prepareCmd( { projectName, sitemapUrl } )
        this.#prepareFolders( { cmd } )

        !this.#silent ? console.log( `  Get Sitemap     ${sitemapUrl}` ) : ''
        await this.#getSitemap( { cmd } )

        !this.#silent ? process.stdout.write( `  Get Pages       ` ) : ''
        await this.#getPages( { cmd } )
        !this.#silent ? console.log() : ''

        !this.#silent ? process.stdout.write( `  Merge           ` ) : ''
        this.#getDocuments( { cmd } )
        !this.#silent ? console.log() : ''

        return true
    }


    getConfig() {
        return this.#config
    }


    setConfig( { config } ) {
        config['path'] = Object
            .entries( config['path'] )
            .reduce( ( acc, a, index ) => {                
                const[ key, value ] = a
                console.log('value ', value)
                switch( key ) {
                    case 'root':
                        acc[ key ] = value
                            .replaceAll( '{{data__unix}}', moment().unix() )
                        break
                    case 'sitemap': 
                        acc[ key ] = Object
                            .entries( value )
                            .reduce( ( abb, b, rindex ) => {
                                const [ k, v ] = b
                                abb[ k ] = v
                                    .replaceAll( '{{data__root}}', acc['root'] )
                                return abb
                            }, {} )
                        break
                }
                return acc
            }, {} )
        this.#config = config
        return this
    }


    #prepareCmd( { projectName, sitemapUrl } ) {
        const template = JSON.parse(
            JSON.stringify( this.#config['path']['sitemap'] )
        )

        const cmd = Object
            .entries( template )
            .reduce( ( acc, a, index ) => {
                if( index === 0 ) {
                    acc['sitemapUrl'] = sitemapUrl
                }
                const [ key, value ] = a
                acc[ key ] = value
                    .replaceAll( 
                        '{{data__project__name}}',
                        projectName
                    )
                return acc
            }, {} )

        return cmd
    }


    #prepareFolders( { cmd } ) {
        console.log("cmd: ", JSON.stringify(cmd))
        Object
            .values( cmd )
            .map( value => {
                if( value.startsWith( './' ) ) {
                    if( value
                            .split( '/' )
                            .slice( -1 )[ 0 ]
                            .indexOf( '.' ) === -1 
                    ) {
                        return value
                    } else {
                        value = path.dirname( value )
                        return value
                    }
                } else {
                    return ''
                }
            } )
            .filter( a => a !== '' )
            .filter( ( v, i, a ) => a.indexOf( v ) === i )
            .forEach( path => {
                if( !fs.existsSync( path ) ) {
                    fs.mkdirSync( path, { 'recursive': true } )
                } else {
                    console.log("Current directory:", process.cwd())
                    console.log( `Path ${path} does exist, for security delete content, manually.` )
                    //if(path!==".") process.exit( 1 )
                }
            } )
        return true
    }


    #validateStart( { projectName, sitemapUrl, silent } ) {
        const messages = []
        const comments = []

        const tmp = [
            [ 'projectName', projectName ],
            [ 'sitemapUrl', sitemapUrl ] 
        ]
            .forEach( a => {
                const [ key, value ] = a
                if( typeof value !== 'string' ) {
                    messages.push( `Key '${key}' with the value '${value}' is not type of 'string'.` )
                } else if( !this.#config['validations'][ key ]['regex'].test( value ) ) {
                    messages.push( `Key '${key}' with the value '${value}' is not allowed. ${this.#config['validations'][ key ]['description']}` )
                }
            } )

        if( typeof silent !== 'boolean' ) {
            messages.push( `Key 'silent' is not type of 'boolean'.` )
        }

        return [ messages, comments ]
    } 


    async #getSitemap( { cmd } ) {
        const json = { 
            'data': null
        }

        try {
            const entries = await this.#getSitemapEntries( { cmd } )
            json['data'] = entries
            fs.writeFileSync( 
                cmd['source'], 
                JSON.stringify( json, null, 4 ), 
                'utf-8' 
            )
        } catch( err ) {
            console.error( 'Error fetching or parsing the sitemap:', err )
        }

        return true
    }


    async #getPages( { cmd } ) {
        const raw = fs.readFileSync( cmd['source'] )
        const sitemaps = JSON.parse( raw )
        const data = sitemaps['data']

        const chunkSize = this.#config['download']['chunkSize']
        const groups = sitemaps['data']
            .map( ( a, i ) => i % chunkSize === 0 ? data.slice( i, i + chunkSize ) : null )
            .filter( a => a )
        let _index = 0
        for( let i = 0; i < groups.length; i++ ) {
            !this.#silent ? process.stdout.write( `${i} ` ) : ''
            await Promise.all(
                groups[ i ]
                    .map( async( url, index ) => {
                        console.log("url ", url)
                        const content = await this.#getPage( { url } )
                        console.log("content ", JSON.stringify(content))
                        
                        let fileName = ''
                        fileName += cmd['content']
                        fileName += `${i}.html`

                        console.log("filename ", JSON.stringify(fileName))
                        fs.writeFileSync(
                            fileName,
                            content,
                            'utf-8'
                        )
                        _index ++
                    } )
            )
        }

        return true
    }


    async #getPage( { url } ) {
        const html = await this.#download( { url } )
        return html
    }


    async #download( { url } ) {
        if(url.startsWith("http")) {
          const dat = await axios.get( url )
          return dat.data
        }
        
        const data = fs.readFileSync( url, 'utf-8' )
        return data
    }


    async #parseSitemap( { xmlContent } ) {
        const parser = new xml2js.Parser()
        const parsedData = await parser.parseStringPromise( xmlContent )
        return parsedData
    }


    async #getSitemapEntries( { cmd } ) {
        const xmlContent = await this.#download( { 
            'url': cmd['sitemapUrl']
        } )
        const parsedData = await this.#parseSitemap( { xmlContent } )

        const entries = parsedData.urlset.url
            .map( entry => entry.loc[ 0 ] )

        return entries
    }


    #getDocuments( { cmd } ) {
        const files = fs
            .readdirSync( cmd['content'] )
            .filter( ( fileName ) => {
                return path.extname( fileName ) === '.html'
            } )

        files
            .reduce( ( acc, fileName, index, all ) => {
                const filePath = path.join( cmd['content'], fileName )
                const fileStats = fs.statSync( filePath )

                const size = fileStats.size + Buffer.byteLength( acc['content'], 'utf8' )
                if( size > this.#config['download']['maxFileSizeBytes'] ) {
                    let name = ''
                    name += `${cmd['merge']}`
                    name +=  `doc${acc['index']}--`
                    name += `${acc['lastIndex']}-${index}`
                    name += '.html'

                    fs.writeFileSync( name, acc['content'], 'utf-8' )
                    !this.#silent ? process.stdout.write( `${acc['index']} ` ) : ''

                    acc['index']++
                    acc['content'] = ''
                    acc['lastIndex'] = index
                }

                const content = fs.readFileSync( filePath, 'utf8' )
                acc['content'] += content + '\n\n'

                if( all.length-1 === index ) {
                    let name = ''
                    name += `${cmd['merge']}`
                    name +=  `doc${acc['index']}--`
                    name += `${acc['lastIndex']}-${index}`
                    name += '.html'

                    fs.writeFileSync( name, acc['content'], 'utf-8' )
                    console.log( `${acc['index']} ` )
                }
                return acc
            }, { 'content': '', 'index': 0, 'lastIndex': 0 } )

        return true
    }
}