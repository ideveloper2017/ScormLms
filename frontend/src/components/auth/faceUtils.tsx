import * as faceapi from "face-api.js";

export async function loadModels() {
    const MODEL_URL = "/models";
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
}

// Kamera ishga tushirish
export async function startCamera(videoRef: HTMLVideoElement) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.srcObject = stream;
    await videoRef.play();
}

// Rasmdan embedding olish
export async function getImageDescriptor(imageUrl: string) {
    const img = await faceapi.fetchImage(imageUrl);
    const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) throw new Error("Yuz topilmadi: " + imageUrl);
    return detection.descriptor;
}

export async function compareFace(videoRef: HTMLVideoElement, storedDescriptor: Float32Array) {
    const detection = await faceapi
        .detectSingleFace(videoRef)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) return false;

    return faceapi.euclideanDistance(detection.descriptor, storedDescriptor) < 0.6;
}

// Ko‘p odamlik baza yaratish
export async function createFaceMatcher(labeledImages: { label: string; imgUrl: string }[]) {
    const labeledDescriptors = await Promise.all(
        labeledImages.map(async person => {
            const desc = await getImageDescriptor(person.imgUrl);
            return new faceapi.LabeledFaceDescriptors(person.label, [desc]);
        })
    );

    return new faceapi.FaceMatcher(labeledDescriptors, 0.6); // threshold
}

// Kameradan real-time tekshirish
export async function recognizeFace(videoRef: HTMLVideoElement, matcher: faceapi.FaceMatcher) {
    const detection = await faceapi
        .detectSingleFace(videoRef)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) return "Yuz topilmadi";

    const bestMatch = matcher.findBestMatch(detection.descriptor);
    return bestMatch.toString(); // "Ali (distance: 0.42)" yoki "unknown"
}
