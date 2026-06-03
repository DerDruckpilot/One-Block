export const isPortraitViewport = ({ width, height }) => height > width;

export const updateOrientationState = ({
  root = globalThis.document?.documentElement,
  viewport = globalThis.window
} = {}) => {
  const width = viewport?.innerWidth || 0;
  const height = viewport?.innerHeight || 0;
  const isPortrait = isPortraitViewport({ width, height });
  root?.classList?.toggle('is-portrait', isPortrait);
  root?.classList?.toggle('is-landscape', !isPortrait);
  return isPortrait ? 'portrait' : 'landscape';
};
