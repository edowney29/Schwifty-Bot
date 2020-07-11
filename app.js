require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");

const discord = require("./app/discord");

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, "index.html");

express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

discord();

setInterval(() => {
  // pingServer("http://www.copsandrobert.com/");
  // pingServer("http://www.ericdowney.com/");
  // pingServer("http://www.dankcellarstudio.com/");
}, 60000);

function pingServer(string) {
  http
    .get(string, (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });
      resp.on("end", () => {
        // console.log(data);
      });
    })
    .on("error", (err) => {
      console.warn(err);
    });
}
