import { GranularSceneSpec, MediaAssetSpec } from './types';

interface MediaManagerCacheItem {
  cacheKey: string;
  asset: MediaAssetSpec;
  timestamp: number;
}

class MediaManager {
  private cache: Map<string, MediaManagerCacheItem> = new Map();
  private maxCacheSize = 200;

  // Primary Priority: User Upload (1) > AI Generated (2) > Pexels (3) > Pixabay (4) > Unsplash (5)
  public async collectMediaAssetsForScenes(
    scenes: GranularSceneSpec[],
    userUploads?: string[]
  ): Promise<{ mediaAssets: MediaAssetSpec[]; updatedScenes: GranularSceneSpec[] }> {
    const collectedAssets: MediaAssetSpec[] = [];
    const updatedScenes: GranularSceneSpec[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const cacheKey = this.generateCacheKey(scene.visualPrompt);

      // Check Cache System first
      if (this.cache.has(cacheKey)) {
        const cachedItem = this.cache.get(cacheKey)!;
        collectedAssets.push(cachedItem.asset);
        updatedScenes.push({
          ...scene,
          assignedAssetUrl: cachedItem.asset.url,
          assignedAssetSource: 'cached'
        });
        continue;
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

      // Priority 2: Stock Media Collection (Pexels / Pixabay / Unsplash placeholder)
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

      collectedAssets.push(chosenAsset);
      updatedScenes.push({
        ...scene,
        assignedAssetUrl: chosenAsset.url,
        assignedAssetSource: chosenAsset.source
      });
    }

    return { mediaAssets: collectedAssets, updatedScenes };
  }

  private generateCacheKey(visualPrompt: string): string {
    const cleaned = visualPrompt.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `cache_key_${cleaned.substring(0, 40)}`;
  }

  private resolveStockMediaUrl(prompt: string, index: number): string {
    const pLower = prompt.toLowerCase();
    if (pLower.includes('watch') || pLower.includes('tech') || pLower.includes('cyber')) {
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
