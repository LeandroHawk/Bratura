/** Fetches a Google Font as TrueType, subset to `text`, at build time. */
export async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const query = `family=${family}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`Google Font not found: ${family}`);
  return (await fetch(url)).arrayBuffer();
}
