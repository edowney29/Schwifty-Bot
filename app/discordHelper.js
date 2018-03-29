const fs = require('fs')
const ytdl = require('ytdl-core')
const axios = require('axios')
const _ = require('lodash')
const {
  google
} = require('googleapis');

const GOOGLE_KEY = process.env.GOOGLE_KEY

const youtube = google.youtube({
  version: 'v3',
  auth: GOOGLE_KEY
})

module.exports.searchVideos = (videoTitle) => {
  return new Promise((resolve, reject) => {
    youtube.search.list({
      part: 'snippet',
      q: videoTitle,
      maxResults: 1,
      type: 'video'
    }, (err, res) => {
      err ? reject(err) : resolve(res.data.items)
    })
  })
}

module.exports.listVideos = (videos) => {
  return new Promise((resolve, reject) => {
    var ids = []
    _.forEach(videos, video => {
      ids.push(video.id.videoId)
    })

    var idstring = _.join(ids, ',')
    youtube.videos.list({
      id: idstring,
      part: 'snippet,contentDetails,statistics'
    }, (err, res) => {
      err ? reject(err) : resolve(res.data.items)
    })
  })
}

module.exports.sortSongSearch = (index, videoTitle, items) => {
  return new Promise((resolve, reject) => {
    var score = 0,
      id = '',
      name = ''
    _.forEach(items, item => {
      var s = parseInt(item.statistics.viewCount)
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
    } else {
      reject('No score')
    }

  })
}

module.exports.getInfo = (url) => {
  return new Promise((resolve, reject) => {
    ytdl.getInfo(url, {
      quality: '360p'
    }, (err, info) => {
      err ? reject(err) : resolve(info.formats)
    })
  })
}

module.exports.downloadSong = (guildID, audioFormats) => {
  return new Promise((resolve, reject) => {
    var fileurl = audioFormats[0].url
    axios({
        method: 'get',
        url: fileurl,
        responseType: 'stream'
      })
      .then(res => {
        res.data.pipe(fs.createWriteStream(`./public/${guildID}.${audioFormats[0].container}`))
          .on('finish', () => {
            resolve(audioFormats[0].container)
          })
      })
      .catch(err => console.log(err))
  })
}