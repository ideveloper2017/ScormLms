import { useEffect, useRef, useState } from "react";
import { loadModels, startCamera, createFaceMatcher, recognizeFace } from "./faceUtils";

export default function FaceCheck() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState("Loading...");
    const [matcher, setMatcher] = useState<any>(null);

    useEffect(() => {
        (async () => {
            await loadModels();
            if (videoRef.current) await startCamera(videoRef.current);

            // Bu yerda bazadagi odamlar rasm ro‘yxati
            const matcherInstance = await createFaceMatcher([
                { label: "Ali", imgUrl: "/img.png" },
                { label: "Vali", imgUrl: "/photo_2019-12-02_15-23-16.jpg" },
                { label: "Aziza", imgUrl: "/img_1.png" },
            ]);

            setMatcher(matcherInstance);
            setStatus("Ready ✅");
        })();
    }, []);

    async function handleCheck() {
        if (videoRef.current && matcher) {
            const result = await recognizeFace(videoRef.current, matcher);
            setStatus(result);
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
