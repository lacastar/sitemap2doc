![CircleCI](https://img.shields.io/circleci/build/github/a6b8/sitemap2doc/main)

# Repos 2 Doc


> Designed for AI Embedding Generation

## Quickstart

### Node.js

**Terminal**
```bash
npm init -y && npm i sitemap2doc
```

**Node**
index.mjs

```js
import { Sitemap2Doc } from 'sitemap2doc'

const s2d = new Sitemap2Doc()
await s2d.getDocument( {
    'projectName': 'test',
    'sitemapUrl': 'https://...'
} )
```

**Terminal**
```bash
node index.mjs
```

## Table of Contents

- [Repos 2 Doc](#repos-2-doc)
  - [Quickstart](#quickstart)
    - [Node.js](#nodejs)
  - [Table of Contents](#table-of-contents)
  - [Methods](#methods)
    - [getDocument()](#getdocument)
    - [getConfig()](#getconfig)
    - [setConfig()](#setconfig)
  - [License](#license)

## Methods

### getDocument()

| Key              | Type                  | Description                                           | Required | Default  |
| ---------------- | --------------------- | ----------------------------------------------------- | -------- | -------- |
| projectName      | `String`              | Set project name                                       | `true`   |       |
| sitemapUrl       | `String`              | Set sitemap source                                    | `true`   |       |
| silent           | `Boolean`             | Control terminal output                               | `false`  | `false`      |


**Example**

```js
import { Sitemap2Doc } from 'sitemap2doc'

const s2d = new Sitemap2Doc()
await s2d.getDocument( {
    'projectName': 'test',
    'sitemapUrl': 'https://...'
} )
```

```terminal
  Get Sitemap     https://...
  Get Pages       0 1 2 3 4 5 6 7 8 9  
  Merge           0 
```

### getConfig()

Get current config, the default config you can find here: [./src/data/config.mjs](./src/data/config.mjs)

 ```js
import { Sitemap2Doc } from 'sitemap2doc'

const s2d = new Sitemap2Doc()
let config = s2d.getConfig()
config['download']['chunkSize'] = 4

s2d
    .setConfig( { config } )
    .getDocument( { ... } )
```


### setConfig()

All module settings are stored in a config file, see [./src/data/config.mjs](./src/data/config.mjs). This file can be completely overridden by passing an object during initialization.

 ```js
import { Sitemap2Doc } from 'sitemap2doc'

const s2d = new Sitemap2Doc()
let config = s2d.getConfig()
config['download']['chunkSize'] = 4

s2d
    .setConfig( { config } )
    .getDocument( { ... } )
```


## License

The module is available as open source under the terms of the [MIT License](https://github.com/a6b8/repos2doc/blob/main/LICENSE).