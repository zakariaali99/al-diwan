import { useEffect, useRef, useState } from "react";

import type { ImageAsset } from "@/assets/generated/manifest";

/**
 * Image with a blur-up placeholder and reserved space.
 *
 * The tiny base64 LQIP renders instantly as a background, so the slot is never
 * blank while the real file loads, and the intrinsic width/height stop the
 * layout shifting when it arrives.
 */
export default function SmartImage({
  asset,
  alt,
  sizes,
  className = "",
  imgClassName = "",
  priority = false,
  rounded = "rounded-2xl",
}: {
  asset: ImageAsset;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  rounded?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached image can finish loading before React attaches onLoad, in which
  // case that event never fires and the photo would stay invisible behind its
  // placeholder forever. Check .complete once mounted to cover that race.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  // Hard cap at the largest generated variant. The company's photos are small
  // originals, and stretching one past its processed width is what made the
  // gallery look soft — enforcing it here means no layout can reintroduce that.
  return (
    <div
      className={`relative mx-auto w-full overflow-hidden bg-slate-100 ${rounded} ${className}`}
      style={{ aspectRatio: asset.aspect, maxWidth: asset.width }}
    >
      <span
        aria-hidden
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundImage: `url("${asset.lqip}")`, filter: "blur(12px)", transform: "scale(1.1)" }}
      />
      <img
        ref={imgRef}
        src={asset.src}
        srcSet={asset.srcSet}
        sizes={sizes}
        alt={alt}
        width={asset.width}
        height={asset.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        {...(priority ? { fetchPriority: "high" as const } : {})}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
      />
    </div>
  );
}
