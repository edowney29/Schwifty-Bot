const fs = require('fs');
const _ = require('lodash');
const axios = require('axios');
const ytdl = require('ytdl-core');
const { google } = require('googleapis');

const { GOOGLE_KEY } = process.env;

const youtube = google.youtube({
  version: 'v3',
  auth: GOOGLE_KEY,
});

module.exports.searchVideos = videoTitle => new Promise((resolve, reject) => {
  youtube.search.list(
    {
      part: 'snippet',
      q: videoTitle,
      maxResults: 1,
      type: 'video',
    },
    (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res.data.items);
    },
  );
});

module.exports.listVideos = videos => new Promise((resolve, reject) => {
  const ids = [];
  _.forEach(videos, (video) => {
    ids.push(video.id.videoId);
  });

  const idstring = _.join(ids, ',');
  youtube.videos.list(
    {
      id: idstring,
      part: 'snippet,contentDetails,statistics',
    },
    (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res.data.items);
    },
  );
});

module.exports.sortSongSearch = (index, videoTitle, items) => new Promise((resolve, reject) => {
  let score = 0;
  let id;
  let name;
  _.forEach(items, (item) => {
    const s = parseInt(item.statistics.viewCount, 10);
    if (s > score) {
      score = s;
      id = item.id;
      name = item.snippet.localized.title;
    }
  });

  if (score > 0) {
    const obj = {
      id,
      name,
      score,
    };
    resolve(obj);
  } else {
    reject(new Error('No score'));
  }
});

module.exports.getInfo = url => new Promise((resolve, reject) => {
  ytdl.getInfo(
    url,
    {
      quality: '360p',
    },
    (err, info) => {
      if (err) reject(err);
      resolve(info.formats);
    },
  );
});

module.exports.downloadSong = (guildID, audioFormats) => new Promise((resolve, reject) => {
  const fileurl = audioFormats[0].url;
  axios({
    method: 'get',
    url: fileurl,
    responseType: 'stream',
  })
    .then((res) => {
      res.data
        .pipe(
          fs.createWriteStream(
            `./public/${guildID}.${audioFormats[0].container}`,
          ),
        )
        .on('finish', () => {
          resolve(audioFormats[0].container);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
});
