const video = document.getElementById('video');
const statusText = document.getElementById('status');
const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

let ageHistory = [];
let genderHistory = { male: 0, female: 0 };

async function startApp() {
    statusText.innerText = "Connecting to Mini Pro 2 AI...";
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
        ]);
        statusText.innerText = "AI Online! Accessing Camera...";
        startVideo();
    } catch (error) {
        statusText.innerText = "Connection Error. Please check internet.";
        console.error(error);
    }
}

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => { video.srcObject = stream; })
        .catch(err => console.error("Camera access denied:", err));
}

startApp();

video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.querySelector('.video-wrap').append(canvas);
    
    // Match canvas size to the ACTUAL video size on screen
    const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withAgeAndGender(); // Removed landmarks to speed it up
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resizedDetections);

        resizedDetections.forEach(detection => {
            ageHistory.push(detection.age);
            genderHistory[detection.gender]++;

            const box = detection.detection.box;
            // FIX: Using backticks (`) instead of single quotes (') for dynamic text
            new faceapi.draw.DrawTextField(
                [
                    `Age: ${Math.round(detection.age)} yrs`,
                    `Gender: ${detection.gender.toUpperCase()}`
                ],
                box.bottomLeft
            ).draw(canvas);
        });
    }, 100); 
});

function showFinalReport() {
    if (ageHistory.length === 0) {
        alert("No face detected! Please look at the camera.");
        return;
    }
    const avgAge = ageHistory.reduce((a, b) => a + b, 0) / ageHistory.length;
    const finalGender = genderHistory.male > genderHistory.female ? "Male" : "Female";
    
    // FIX: Using backticks here too for the alert message
    alert(`MINI PRO 2 - SUMMARY\n--------------------------\nAverage Age: ${Math.round(avgAge)}\nFinal Result: ${finalGender}`);
}