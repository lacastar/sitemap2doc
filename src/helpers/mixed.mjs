function keyPathToValue( { data, keyPath, separator='__' } ) {
    if( typeof keyPath !== 'string' ) {
        return undefined
    }

    const result = keyPath
        .split( separator )
        .reduce( ( acc, key, index ) => {
            if( !acc ) return undefined
            if( !acc.hasOwnProperty( key ) ) return undefined
            acc = acc[ key ]
            return acc
        }, data )

    return result
}


function printValidation( { messages, comments } ) {
    comments
        .forEach( ( msg ) => {
            console.log( `${msg}`)
        } )

    messages
        .forEach( ( msg, index, all ) => {
            if( index === 0 ) {
                console.log( `Error${all.length > 1 ? 's': ''}: `)
            }

            console.log( `  - ${msg}`)

            if( all.length - 1 === index ) {
                process.exit( 1 )
            } 
        } )

    return true
}


export { keyPathToValue, printValidation }