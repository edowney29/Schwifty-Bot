require("dotenv").config();
const express = require("express");
const path = require("path");
const https = require("https");

const discord = require("./app/discord");

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, "index.html");

express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

discord();

const { COPS_AND_ROBERT } = process.env;
setInterval(() => {
  pingServer(COPS_AND_ROBERT);
}, 60000);

function pingServer(string) {
  https
    .get(string, (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });
      resp.on("end", () => {
      });
    })
    .on("error", (err) => {
    });
}
