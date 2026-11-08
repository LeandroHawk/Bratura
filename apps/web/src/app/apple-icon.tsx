import { brandIconImageFromSize } from '@/features/common/components/share-art/brand-icon';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return brandIconImageFromSize(size.width);
}
