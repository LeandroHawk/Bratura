import { brandIconImageFromSize } from '@/features/common/components/share-art/brand-icon';

/** Browser tab icon; 64px so it stays sharp on high-density screens. */
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return brandIconImageFromSize(size.width);
}
