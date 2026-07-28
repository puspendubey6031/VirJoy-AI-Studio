export interface StockMediaItem {
  id: string;
  title: string;
  mediaType: 'video' | 'photo';
  previewUrl: string;
  downloadUrl: string;
  author: string;
  provider: 'Pexels' | 'Pixabay' | 'Unsplash' | 'CuratedCatalog';
}

export async function searchStockMediaWithFallback(
  query: string,
  type: 'video' | 'photo' = 'video'
): Promise<StockMediaItem[]> {
  const results: StockMediaItem[] = [];
  const cleanQuery = encodeURIComponent(query || 'technology product');

  // --- 1. PEXELS API ---
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const endpoint = type === 'video'
        ? `https://api.pexels.com/videos/search?query=${cleanQuery}&per_page=5`
        : `https://api.pexels.com/v1/search?query=${cleanQuery}&per_page=5`;

      const res = await fetch(endpoint, {
        headers: { 'Authorization': pexelsKey }
      });

      if (res.ok) {
        const data = await res.json();
        if (type === 'video' && Array.isArray(data.videos)) {
          data.videos.forEach((v: any) => {
            const videoFile = v.video_files?.find((f: any) => f.quality === 'hd') || v.video_files?.[0];
            results.push({
              id: `pexels-${v.id}`,
              title: `Pexels Video ${v.id}`,
              mediaType: 'video',
              previewUrl: v.image || videoFile?.link,
              downloadUrl: videoFile?.link || '',
              author: v.user?.name || 'Pexels Creator',
              provider: 'Pexels'
            });
          });
        } else if (type === 'photo' && Array.isArray(data.photos)) {
          data.photos.forEach((p: any) => {
            results.push({
              id: `pexels-photo-${p.id}`,
              title: p.alt || `Pexels Photo ${p.id}`,
              mediaType: 'photo',
              previewUrl: p.src?.medium || p.src?.landscape,
              downloadUrl: p.src?.original || p.src?.large,
              author: p.photographer || 'Pexels Photographer',
              provider: 'Pexels'
            });
          });
        }
      }
    } catch (err: any) {
      console.warn('[StockMediaProvider] Pexels call failed:', err?.message || err);
    }
  }

  // --- 2. PIXABAY API ---
  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (pixabayKey && results.length < 3) {
    try {
      const endpoint = type === 'video'
        ? `https://pixabay.com/api/videos/?key=${pixabayKey}&q=${cleanQuery}&per_page=5`
        : `https://pixabay.com/api/?key=${pixabayKey}&q=${cleanQuery}&image_type=photo&per_page=5`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.hits)) {
          data.hits.forEach((h: any) => {
            results.push({
              id: `pixabay-${h.id}`,
              title: h.tags || `Pixabay Media ${h.id}`,
              mediaType: type,
              previewUrl: type === 'video' ? h.videos?.tiny?.url || h.userImageURL : h.webformatURL,
              downloadUrl: type === 'video' ? h.videos?.medium?.url || h.videos?.large?.url : h.largeImageURL,
              author: h.user || 'Pixabay Creator',
              provider: 'Pixabay'
            });
          });
        }
      }
    } catch (err: any) {
      console.warn('[StockMediaProvider] Pixabay call failed:', err?.message || err);
    }
  }

  // --- 3. UNSPLASH API ---
  const unsplashKey = process.env.UNSPLASH_API_KEY;
  if (unsplashKey && results.length < 3) {
    try {
      const endpoint = `https://api.unsplash.com/search/photos?query=${cleanQuery}&per_page=5&client_id=${unsplashKey}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          data.results.forEach((u: any) => {
            results.push({
              id: `unsplash-${u.id}`,
              title: u.alt_description || `Unsplash Photo ${u.id}`,
              mediaType: 'photo',
              previewUrl: u.urls?.small,
              downloadUrl: u.urls?.full || u.urls?.regular,
              author: u.user?.name || 'Unsplash Photographer',
              provider: 'Unsplash'
            });
          });
        }
      }
    } catch (err: any) {
      console.warn('[StockMediaProvider] Unsplash call failed:', err?.message || err);
    }
  }

  // --- 4. FALLBACK: CURATED HIGH-QUALITY ROYALTY-FREE CATALOG ---
  if (results.length === 0) {
    const seed = encodeURIComponent(query || 'product');
    results.push(
      {
        id: `catalog-1`,
        title: `Curated Showcase - ${query}`,
        mediaType: type,
        previewUrl: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80`,
        downloadUrl: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&q=80`,
        author: 'VirJoy Stock Library',
        provider: 'CuratedCatalog'
      },
      {
        id: `catalog-2`,
        title: `Dynamic Studio Shot - ${query}`,
        mediaType: type,
        previewUrl: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80`,
        downloadUrl: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=80`,
        author: 'VirJoy Stock Library',
        provider: 'CuratedCatalog'
      }
    );
  }

  return results;
}
