import { resolveImageUrl } from "../lib/api";

export default function Thumb({
  src,
  alt,
  label,
  className,
}: {
  src?: string | null;
  alt: string;
  label?: string;
  className?: string;
}) {
  const url = resolveImageUrl(src);
  if (!url) {
    const letter = (label || alt).trim().charAt(0).toUpperCase() || "•";
    return (
      <span className={`thumb-fallback ${className ?? ""}`} aria-hidden>
        {letter}
      </span>
    );
  }
  return <img className={className} src={url} alt={alt} />;
}
