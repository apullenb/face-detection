const video = document.getElementById("video");
let predictedAges = [];

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models")
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => console.error(err));
}

video.addEventListener("playing", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    const expressionList = document.getElementById("expression-list");
    expressionList.innerHTML = ""; // Clear previous entries

    resizedDetections.forEach(det => {
      Object.entries(det.expressions).forEach(([emotion, prob]) => {
        const emotionCount = Math.round(prob * 10); // Scale for better visibility
        const emotionEntry = document.createElement("div");
        emotionEntry.textContent = `${emotion}: ${emotionCount}`;
        expressionList.appendChild(emotionEntry);
      });
    });

    if (resizedDetections[0]) {
      const age = resizedDetections[0].age;
      const interpolatedAge = interpolateAgePredictions(age);

      const averageAgeValue = document.getElementById("average-age-value");
      averageAgeValue.textContent = `${faceapi.utils.round(
        interpolatedAge,
        0
      )} years`;
    }
  }, 100);
});


function interpolateAgePredictions(age) {
  predictedAges = [age].concat(predictedAges).slice(0, 30);
  const avgPredictedAge =
    predictedAges.reduce((total, a) => total + a) / predictedAges.length;
  return avgPredictedAge;
}
