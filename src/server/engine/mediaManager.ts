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

  // Primary Priority: User Upload (1) > AI Generated (2) > Stock Fallback (3)
  public async collectMediaAssetsForScenes(
    scenes: GranularSceneSpec[],
    userUploads?: string[]
  ): Promise<{ mediaAssets: MediaAssetSpec[]; updatedScenes: GranularSceneSpec[] }> {
    const tasks = scenes.map(async (scene, i) => {
      const cacheKey = this.generateCacheKey(scene.visualPrompt, i);

      // Check Cache System first
      if (this.cache.has(cacheKey)) {
        const cachedItem = this.cache.get(cacheKey)!;
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
      if (userUploads && userUploads.length > i) {
        chosenAsset = {
          id: `asset_user_${i}_${Date.now()}`,
          source: 'user_upload',
          assetType: 'image',
          url: userUploads[i],
          cacheKey,
          priority: 1
        };
      }

      // Priority 2: Real AI Image Generation
      if (!chosenAsset) {
        try {
          const aiImageResult = await generateImageWithFallback({
            prompt: scene.visualPrompt || scene.narrationText,
            aspectRatio: '16:9'
          });

          if (aiImageResult && aiImageResult.imageUrl) {
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
        } catch (e) {
          console.warn(`[MediaManager] AI image generation for scene ${i + 1} failed, using stock fallback:`, e);
        }
      }

      // Priority 3: Stock Media Collection Fallback
      if (!chosenAsset) {
        const stockUrl = this.resolveStockMediaUrl(scene.visualPrompt, i);
        chosenAsset = {
          id: `asset_stock_${i}_${Date.now()}`,
          source: i % 2 === 0 ? 'pexels' : 'pixabay',
          assetType: 'image',
          url: stockUrl,
          thumbnailUrl: stockUrl,
          cacheKey,
          priority: 3,
          attribution: 'Stock Media provided via VirJoy AI Media Engine'
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
    const cleaned = visualPrompt.toLowerCase().replace(/[^a-z0-9]/g, '');
    let hash = 0;
    for (let i = 0; i < cleaned.length; i++) {
      hash = ((hash << 5) - hash) + cleaned.charCodeAt(i);
      hash |= 0;
    }
    return `cache_key_s${index ?? 0}_${Math.abs(hash)}_${cleaned.substring(0, 20)}`;
  }

  private resolveStockMediaUrl(prompt: string, index: number): string {
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
    // General fallback cinematic images
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
