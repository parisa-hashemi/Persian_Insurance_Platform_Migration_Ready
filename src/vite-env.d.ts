/// <reference types="vite/client" />

// تعریف تایپ برای ایمپورت مستقیم فایل‌های تصویری (مثل آیکون‌های Leaflet)
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.jpeg' {
  const src: string;
  export default src;
}
declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
