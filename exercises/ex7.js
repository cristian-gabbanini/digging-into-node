#!/usr/bin/env node
'use strict'

var util = require('util')
var childProc = require('child_process')

// ************************************

const HTTP_PORT = 8039
const MAX_CHILDREN = 1500

var delay = util.promisify(setTimeout)

main().catch(console.error)

// ************************************

async function main() {
    console.log(`Load testing http://localhost:${HTTP_PORT}...`)
    while (true) {
        let children = []
        process.stdout.write(`Sending ${MAX_CHILDREN} requests... `)

        for (let i = 0; i <= MAX_CHILDREN; i++) {
            let child = newChildProcess()
            children.push(child)
        }

        try {
            await Promise.all(children)
            console.log('Success!')
            return
        } catch (e) {
            console.error('Something went wrong')
        }

        await delay(3000)
    }
}

async function newChildProcess() {
    return new Promise((res, rej) => {
        let child = childProc.spawn('node', ['ex7-child.js'])
        child.on('exit', function(code) {
            if (code === 0) {
                res(code)
            } else rej(code)
        })
    })
}
