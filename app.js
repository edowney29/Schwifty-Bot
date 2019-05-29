require("dotenv").config();
const express = require("express");
const path = require("path");

const discord = require("./app/discord");

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, "index.html");

express()
  .use((req, res) => res.sendFile(INDEX))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

discord();
