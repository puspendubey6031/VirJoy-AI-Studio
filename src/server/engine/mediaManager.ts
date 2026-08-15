import type { GranularSceneSpec, MediaAssetSpec } from './types.js';
import { generateImageWithFallback } from '../providers/imageProvider.js';

interface MediaManagerCacheItem {
  cacheKey: string;
  asset: MediaAssetSpec;
  timestamp: number;
}

class MediaManager {
  private cache: Map<string, MediaManagerCacheItem> = new Map();
  private maxCacheSize = 200;

  // Primary Priority: User Upload (1) > AI Generated (2)
  public async collectMediaAssetsForScenes(
    scenes: GranularSceneSpec[],
    userUploads?: string[]
  ): Promise<{ mediaAssets: MediaAssetSpec[]; updatedScenes: GranularSceneSpec[] }> {
    const tasks = scenes.map(async (scene, i) => {
      const visualPrompt = scene.visualPrompt?.trim();
      if (!visualPrompt) {
        throw new Error(`MISSING_VISUAL_PROMPT scene=${i + 1}`);
      }

      const cacheKey = this.generateCacheKey(visualPrompt, i);

      // Check Cache System first
      if (this.cache.has(cacheKey)) {
        const cachedItem = this.cache.get(cacheKey)!;
        console.log(`[MediaManager] Scene ${i + 1}
visualPrompt=${visualPrompt}
cacheKey=${cacheKey}
provider=Cached (${cachedItem.asset.source})
imageUrl=${cachedItem.asset.url}
validation=PASS`);

        return {
          asset: cachedItem.asset,
          updatedScene: {
            ...scene,
            assignedAssetUrl: cachedItem.asset.url,
            assignedAssetSource: 'cached' as const
          }
        };
      }

      let chosenAsset: MediaAssetSpec | null = null;

      // Priority 1: User Uploads if provided
      if (userUploads && userUploads.length > i && userUploads[i]) {
        const userUploadUrl = userUploads[i];
        const isValidUserUpload = await this.validateImageResource(userUploadUrl);
        if (isValidUserUpload) {
          chosenAsset = {
            id: `asset_user_${i}_${Date.now()}`,
            source: 'user_upload',
            assetType: 'image',
            url: userUploadUrl,
            thumbnailUrl: userUploadUrl,
            cacheKey,
            priority: 1
          };
          console.log(`[MediaManager] Scene ${i + 1}
visualPrompt=${visualPrompt}
cacheKey=${cacheKey}
provider=UserUpload
imageUrl=${chosenAsset.url}
validation=PASS`);
        }
      }

      // Priority 2: Real AI Image Generation
      if (!chosenAsset) {
        let aiImageResult: any = null;
        let isValid = false;

        try {
          aiImageResult = await generateImageWithFallback({
            prompt: visualPrompt,
            aspectRatio: '16:9'
          });

          if (aiImageResult && aiImageResult.imageUrl && aiImageResult.imageUrl.trim().length > 0) {
            isValid = await this.validateImageResource(aiImageResult.imageUrl);
          }
        } catch (err: any) {
          console.warn(`[MediaManager] AI image generation exception for scene ${i + 1}:`, err?.message || err);
        }

        console.log(`[MediaManager] Scene ${i + 1}
visualPrompt=${visualPrompt}
cacheKey=${cacheKey}
provider=${aiImageResult?.providerUsed || 'None'}
imageUrl=${aiImageResult?.imageUrl || 'None'}
validation=${isValid ? 'PASS' : 'FAIL'}`);

        if (!isValid || !aiImageResult || !aiImageResult.imageUrl) {
          throw new Error(
            `IMAGE_GENERATION_FAILED scene=${i + 1} prompt="${visualPrompt}"`
          );
        }

        chosenAsset = {
          id: `asset_ai_${i}_${Date.now()}`,
          source: 'ai_generated',
          assetType: 'image',
          url: aiImageResult.imageUrl,
          thumbnailUrl: aiImageResult.imageUrl,
          cacheKey,
          priority: 2,
          attribution: `AI Generated via ${aiImageResult.providerUsed} (${aiImageResult.modelUsed})`
        };
      }

      // Store in Cache Engine
      this.storeInCache(cacheKey, chosenAsset);

      return {
        asset: chosenAsset,
        updatedScene: {
          ...scene,
          assignedAssetUrl: chosenAsset.url,
          assignedAssetSource: chosenAsset.source
        }
      };
    });

    const results = await Promise.all(tasks);
    const collectedAssets = results.map(r => r.asset);
    const updatedScenes = results.map(r => r.updatedScene);

    return { mediaAssets: collectedAssets, updatedScenes };
  }

  private generateCacheKey(visualPrompt: string, index?: number): string {
    const normalized = (visualPrompt || '')
      .trim()
      .toLowerCase();

    let hash = 2166136261;

    for (let i = 0; i < normalized.length; i++) {
      hash ^= normalized.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return `scene_${index ?? 0}_${(hash >>> 0).toString(16)}`;
  }

  private async validateImageResource(url: string): Promise<boolean> {
    if (!url || typeof url !== 'string') return false;

    // Base64 data URL validation
    if (url.startsWith('data:')) {
      const match = url.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/);
      if (!match || !match[1] || match[1].trim().length === 0) {
        return false;
      }
      return true;
    }

    // HTTP / HTTPS URL validation
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'image/*' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) return false;
        const contentType = res.headers.get('content-type') || '';
        const isImage =
          contentType.startsWith('image/') ||
          contentType.includes('octet-stream') ||
          url.includes('pollinations.ai') ||
          url.includes('unsplash.com');

        const contentLength = res.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) === 0) {
          return false;
        }
        return isImage;
      } catch (e) {
        console.warn('[MediaManager] Validation check error for URL:', url, e);
        return false;
      }
    }

    return false;
  }

  // Preserved for legacy product workflows if needed
  public resolveStockMediaUrl(prompt: string, index: number): string {
    const pLower = prompt.toLowerCase();
    if (pLower.includes('rain') || pLower.includes('storm') || pLower.includes('wet') || pLower.includes('drop')) {
      return `https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=1200&auto=format&fit=crop&q=80`;
    } else if (pLower.includes('fly') || pLower.includes('flying') || pLower.includes('wing') || pLower.includes('sky')) {
      return `https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1200&auto=format&fit=crop&q=80`;
    } else if (pLower.includes('bird') || pLower.includes('pond') || pLower.includes('lake') || pLower.includes('nature')) {
      return `https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=1200&auto=format&fit=crop&q=80`;
    } else if (pLower.includes('watch') || pLower.includes('tech') || pLower.includes('cyber')) {
      return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80`;
    } else if (pLower.includes('perfume') || pLower.includes('splash') || pLower.includes('gold')) {
      return `https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&auto=format&fit=crop&q=80`;
    } else if (pLower.includes('coffee') || pLower.includes('roast') || pLower.includes('bean')) {
      return `https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&auto=format&fit=crop&q=80`;
    } else if (pLower.includes('saas') || pLower.includes('chart') || pLower.includes('analytics')) {
      return `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80`;
    } else if (pLower.includes('car') || pLower.includes('speed') || pLower.includes('highway')) {
      return `https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80`;
    }
    const fallbacks = [
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80'
    ];
    return fallbacks[index % fallbacks.length];
  }

  private storeInCache(cacheKey: string, asset: MediaAssetSpec): void {
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(cacheKey, {
      cacheKey,
      asset,
      timestamp: Date.now()
    });
  }
}

export const mediaManager = new MediaManager();
