type BrandLogoProps = {
  className?: string
  title?: string
}

/** Portföy markası — resmi kurum arması değildir. */
export function BrandLogo({ className = 'brand-logo', title }: BrandLogoProps) {
  return (
    <img
      className={className}
      src="/brand/arnavutkoy-mark-128.png"
      srcSet="/brand/arnavutkoy-mark-128.png 1x, /brand/arnavutkoy-mark-256.png 2x"
      alt={title ?? ''}
      width={128}
      height={128}
      decoding="async"
      aria-hidden={title ? undefined : true}
    />
  )
}
