import { iconImage } from "@/lib/icon-art";

export function generateImageMetadata() {
  return [32, 192, 512].map((n) => ({ id: String(n), size: { width: n, height: n }, contentType: "image/png" }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  return iconImage(Number(await id));
}
