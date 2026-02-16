import { PluginPhase, PluginPriority, type TransformPlugin, type PluginContext } from "../base";

interface AnchorInfo {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex: number;
}

export function createAnchorCollisionPlugin(): TransformPlugin {
  return {
    name: "anchorCollision",
    version: "1.0.0",
    description: "Detects potential anchor collisions based on position data",
    phases: [PluginPhase.TRANSFORM],
    priority: PluginPriority.NORMAL,

    init() {},
    execute() {},

    transform(html: string, context: PluginContext): string {
      if (!context.config.features.anchors) return html;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const anchors = doc.querySelectorAll("img[data-word-anchor='1']");

      if (anchors.length < 2) return html;

      const anchorInfos: AnchorInfo[] = [];
      anchors.forEach((img, index) => {
        const style = img.getAttribute("style") || "";
        const leftMatch = style.match(/left:([\d.]+)px/);
        const topMatch = style.match(/top:([\d.]+)px/);
        const widthMatch = style.match(/width:([\d.]+)px/);
        const heightMatch = style.match(/height:([\d.]+)px/);
        const zIndexMatch = style.match(/z-index:(\d+)/);

        const left = leftMatch ? parseFloat(leftMatch[1]) : 0;
        const top = topMatch ? parseFloat(topMatch[1]) : 0;
        const width = widthMatch ? parseFloat(widthMatch[1]) : 100;
        const height = heightMatch ? parseFloat(heightMatch[1]) : 100;
        const zIndex = zIndexMatch ? parseInt(zIndexMatch[1], 10) : 0;

        anchorInfos.push({
          id: `anchor-${index}`,
          left,
          top,
          width,
          height,
          zIndex
        });
      });

      const collisions = detectCollisions(anchorInfos);

      let result = html;
      collisions.forEach(collision => {
        const imgMatches = result.match(/<img([^>]*)data-word-anchor="1"([^>]*)>/g);
        if (imgMatches && imgMatches[collision.index]) {
          const oldTag = imgMatches[collision.index];
          const newTag = oldTag.replace(
            />$/,
            ` data-word-anchor-collision="${collision.collidesWith.join(",")}">`
          );
          result = result.replace(oldTag, newTag);
        }
      });

      return result;
    }
  };
}

function detectCollisions(anchors: AnchorInfo[]): Array<{ index: number; collidesWith: number[] }> {
  const collisions: Array<{ index: number; collidesWith: number[] }> = [];

  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    const collidesWith: number[] = [];

    for (let j = 0; j < anchors.length; j++) {
      if (i === j) continue;
      const b = anchors[j];

      if (a.zIndex !== b.zIndex) continue;

      const horizontalOverlap = a.left < b.left + b.width && a.left + a.width > b.left;
      const verticalOverlap = a.top < b.top + b.height && a.top + a.height > b.top;

      if (horizontalOverlap && verticalOverlap) {
        collidesWith.push(j);
      }
    }

    if (collidesWith.length > 0) {
      collisions.push({ index: i, collidesWith });
    }
  }

  return collisions;
}
