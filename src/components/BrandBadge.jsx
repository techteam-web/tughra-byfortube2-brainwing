/**
 * "Powered by Brainwing Innovations", fixed in the bottom-right corner of every page
 * (just above the menu bar on phones). Pages keep a little space free for it.
 */
export default function BrandBadge() {
  return (
    <img
      src="/media/brainwing-logo.webp"
      alt="Powered by Brainwing Innovations"
      width={480}
      height={129}
      className="brand-badge pointer-events-none fixed bottom-[calc(var(--nav-h)+3px)] right-2 z-[45] h-[18px] w-auto select-none opacity-90 drop-shadow-[0_1px_2px_rgb(0_0_0/0.75)] lg:bottom-2 lg:right-4 lg:h-6"
    />
  )
}
