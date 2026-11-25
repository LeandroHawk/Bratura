import { LogoSplat } from '../Logo/Logo';

/**
 * Something on its way: the tab icon's "B" breathing over the visible `label`, a status for screen
 * readers; still under reduced motion. `inline` sets it small beside the label ("loading more").
 */
export function Loading({
  label,
  inline = false,
  className = '',
}: {
  label: string;
  inline?: boolean;
  className?: string;
}) {
  return (
    <div role="status" className={`bt-loading ${inline ? 'is-inline' : ''} ${className}`}>
      <span className="bt-loading-mark" aria-hidden="true">
        <LogoSplat className="bt-loading-splat" />
        <span className="bt-logo-word">
          <span className="text-logo-green">B</span>
        </span>
      </span>
      <span className="bt-loading-label">{label}</span>
    </div>
  );
}
