/** Fijne scheidingslijn met een klein ruitje in het midden, in champagnetint. */
export default function Ornament({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center gap-4 ${className}`}>
      <span className="hairline h-px w-full max-w-[12rem]" />
      <span className="h-1.5 w-1.5 rotate-45 border border-taupe" />
      <span className="hairline h-px w-full max-w-[12rem]" />
    </div>
  );
}
