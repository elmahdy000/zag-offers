"use client";

import { useState } from "react";
import Image from "next/image";
import { CategoryIcon } from "@/components/category-icon";
import { resolveImageUrl } from "@/lib/utils";

type CategoryImageCardProps = {
  name: string;
  image?: string;
  compact?: boolean;
};

export function CategoryImageCard({ name, image, compact = false }: CategoryImageCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = resolveImageUrl(image);

  return (
    <div className={`category-image-card ${compact ? "is-compact" : ""}`}>
      {imageUrl && !imageFailed ? (
        <Image
          src={imageUrl}
          alt={`عروض قسم ${name}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes={compact ? "(max-width: 640px) 46vw, 220px" : "(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 300px"}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="category-image-fallback">
          <CategoryIcon name={name} size={compact ? 28 : 34} />
        </div>
      )}
      <div className="category-image-shade" />
      <div className="category-image-copy">
        <strong>{name}</strong>
        <span>شوف العروض</span>
      </div>
    </div>
  );
}
