import { useEffect, useRef, useState } from "react";
import { loadModels, startCamera, getImageDescriptor, compareFace } from "./faceUtils";

export default function FaceCheck() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState("Loading...");
    const [storedDescriptor, setStoredDescriptor] = useState<Float32Array | null>(null);

    useEffect(() => {
        (async () => {
            await loadModels();
            if (videoRef.current) await startCamera(videoRef.current);

            // oldindan saqlangan rasm yuklanadi
            const desc = await getImageDescriptor("/known_face.jpg");
            setStoredDescriptor(desc);
            setStatus("Ready");
        })();
    }, []);

    async function handleCheck() {
        if (videoRef.current && storedDescriptor) {
            const match = await compareFace(videoRef.current, storedDescriptor);
            setStatus(match ? "✅ Yuz mos keldi!" : "❌ Mos kelmadi");
        }
    }

    return (
        <div>
            <video ref={videoRef} width="320" height="240" autoPlay muted />
            <p>{status}</p>
            <button onClick={handleCheck}>Check Face</button>
        </div>
    );
}
