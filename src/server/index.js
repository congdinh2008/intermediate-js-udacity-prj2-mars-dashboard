require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/", express.static(path.join(__dirname, "../public")));

// your API calls

// example API call
app.get("/apod", async (req, res) => {
  try {
    let image = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`
    ).then((res) => res.json());
    res.send({ image });
  } catch (err) {
    console.log("error:", err);
  }
});

// Rover API call to get the latest photos from rover by rover name with query params page, camera and earth_date
app.get("/rover/:roverName", async (req, res) => {
  const roverName = req.params.roverName.toLowerCase();
  console.log("params:", req.query);
  const { pageNumber, camera, earthDate } = req.query;

  console.log("params:", roverName, pageNumber, camera, earthDate);

  if (!roverName) {
    res.status(400).send("Rover name is required");
  }

  if (
    roverName !== "curiosity" &&
    roverName !== "opportunity" &&
    roverName !== "spirit"
  ) {
    res.status(400).send("Invalid rover name");
  }

  let url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/photos?sol=1000&page=${pageNumber}&api_key=${process.env.API_KEY}`;

  if (camera) {
    url = `${url}&camera=${camera}`;
  }

  if (earthDate) {
    url = `${url}&earth_date=${earthDate}`;
  }

  console.log("url:", url);

  try {
    let rover = await fetch(url).then((res) => res.json());

    if (rover.photos.length === 0) {
      res.status(404).send("No photos found");
    }
    roverData = rover?.photos[0]?.rover;
    photos = rover?.photos;
    res.send({ roverData, photos });
  } catch (err) {
    console.log("error:", err);
    res.status(500).send("An error occurred");
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
