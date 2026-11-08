import { LIGHT_THEME_COLORS as C } from '@bratura/ui';
import { ImageResponse } from 'next/og';
import { loadGoogleFont } from '../../utils/load-google-font';
import { SplatArt } from './share-art';

/** The artwork is drawn on a 180px square (the Apple home-screen size) and scaled from it. */
const BASE = 180;

/**
 * The logo's "B" on its splat, on the parchment background: the browser tab icon and the
 * home-screen icon are the same drawing at two sizes, so they cannot drift apart.
 */
export async function brandIconImageFromSize(px: number): Promise<ImageResponse> {
  const scale = px / BASE;
  const logo = await loadGoogleFont('Titan+One', 'B');
  const stroke = C['logo-outline'];
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: C.background,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', position: 'absolute', left: -110 * scale, top: 28 * scale }}>
        <SplatArt width={400 * scale} />
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: 'Titan One',
          fontSize: 120 * scale,
          color: C['logo-green'],
          WebkitTextStroke: `${7 * scale}px ${stroke}`,
          textShadow: `${6 * scale}px ${8 * scale}px 0 ${stroke}`,
          transform: 'rotate(-6deg)',
          marginTop: -6 * scale,
        }}
      >
        B
      </div>
    </div>,
    { width: px, height: px, fonts: [{ name: 'Titan One', data: logo, weight: 400 }] },
  );
}
