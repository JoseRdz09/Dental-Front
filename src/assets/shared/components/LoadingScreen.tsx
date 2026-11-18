
import { useEffect, useRef } from "react";
import lottie from "lottie-web";

import loadingAnimation from "../../../assets/animations/lottieflow-loading.json";

import "./LoadingScreen.css";

export default function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const animation = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: loadingAnimation,
    });

    return () => {
      animation.destroy();
    };
  }, []);

  return (
    <div className="loading-screen">
      <div
        ref={containerRef}
        className="loading-screen__animation"
        aria-hidden="true"
      />

      <p className="loading-screen__text" role="status">
        Cargando...
      </p>
    </div>
  );
}
