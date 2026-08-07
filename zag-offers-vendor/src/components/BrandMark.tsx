import Image from 'next/image';

export default function BrandMark({
  priority = false,
  className = '',
}: {
  priority?: boolean;
  className?: string;
}) {
  return (
    <span className={`brand-mark relative block ${className}`} role="img" aria-label="Zag Offers">
      <Image
        src="/brand/zag-mark.png"
        alt=""
        fill
        priority={priority}
        className="brand-mark-light object-contain"
        sizes="96px"
      />
      <Image
        src="/brand/zag-mark-dark.png"
        alt=""
        fill
        priority={priority}
        className="brand-mark-dark object-contain"
        sizes="96px"
      />
    </span>
  );
}
