"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Registrar el service worker en la raíz
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registrado con éxito:", registration.scope);
        })
        .catch((error) => {
          console.error("Fallo al registrar el Service Worker:", error);
        });
    }
  }, []);

  return null;
}
