const fs = require('fs')
const googleapis = require('googleapis')
const levenshtein = require('fast-levenshtein')
const ytdl = require('ytdl-core')
const request = require('request')
const _ = require('lodash')

const GOOGLE_KEY = process.env.GOOGLE_KEY

const youtube = googleapis.youtube({
    version: 'v3',
    auth: GOOGLE_KEY
})

module.exports.searchVideos = (videoTitle) => {
    return new Promise((resolve, reject) => {
        youtube.search.list({
            part: 'snippet',
            q: videoTitle,
            maxResults: 10,
            type: 'video'
        }, (err, res) => {
            err ? reject(err) : resolve(res)
        })
    })
}

module.exports.listVideos = (videos) => {
    return new Promise((resolve, reject) => {
        var ids = []
        _.forEach(videos.items, item => {
            ids.push(item.id.videoId)
        })
        var idstring = _.join(ids, ',')

        youtube.videos.list({
            id: idstring,
            part: 'snippet,contentDetails,statistics'
        }, (err, res) => {
            err ? reject(err) : resolve(res)
        })
    })
}

module.exports.sortSongSearch = (index, videoTitle, list) => {
    return new Promise((resolve, reject) => {
        var score = 0, id = '', name = ''
        _.forEach(list.items, item => {
            //var s = levenshtein.get(videoTitle, item.snippet.localized.title)
            var s = item.statistics.viewCount            
            if (s > score) {
                score = s
                id = item.id
                name = item.snippet.localized.title
            }
        })

        if (score > 0) {
            var obj = {
                id,
                name,
                score
            }
            resolve(obj)
        }
        else {
            reject()
        }

    })
}

module.exports.getInfo = (url) => {
    return new Promise((resolve, reject) => {
        ytdl.getInfo(url, (err, info) => {
            err ? reject(err) : resolve(ytdl.filterFormats(info.formats, 'audioonly'))
        })
    })
}

module.exports.downloadSong = (guildID, audioFormats) => {
    return new Promise((resolve, reject) => {
        var fileurl = audioFormats[0].url
        request
            .get(fileurl)
            .on('error', error => {
                console.log(error)
                reject(error)
            })
            .pipe(fs.createWriteStream(`./public/${guildID}.${audioFormats[0].container}`)
                .on('finish', () => {
                    resolve(audioFormats[0].container)
                }))
    })
}