<template>
  <div>
    <canvas ref="canvasElement"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Canvas, FabricImage, StaticCanvas } from 'fabric';

const canvasElement = ref(null);
let fabricCanvas = null;

onMounted(() => {
  if (canvasElement.value) {
    fabricCanvas = new Canvas(canvasElement.value, {
      width: 1,
      height: 1,
      backgroundColor: 'transparent'
    });
    console.log('Fabric.jsのCanvasを初期化しました');
  } else {
    console.error('onMounted: canvasElement が見つかりません');
  }
});

const addOshiImage = (imageUrl) => {
  if (!fabricCanvas) return;
  console.log('addOshiImage が呼ばれました');
  
  const imgElement = new Image();
  imgElement.onload = () => {
    console.log('推し画像の読み込み成功 (Image.onload)');
    const fabricImg = new FabricImage(imgElement);
    
    // Canvasのサイズに対して、いい感じのサイズに調整
    // (例: Canvasの幅の 1/3 サイズにする)
    const scale = (fabricCanvas.width * 0.33) / imgElement.naturalWidth;
    
    fabricImg.set({
      left: 100,
      top: 100,
      scaleX: scale,
      scaleY: scale,
    });
    
    fabricCanvas.add(fabricImg);
    fabricCanvas.renderAll();
    console.log('「推し」画像を追加しました');
  };
  imgElement.onerror = (err) => { /* ... (省略) ... */ };
  imgElement.src = imageUrl;
};

const resizeAndSetBackground = (dataUrl, imgElement, containerWidth) => {
  if (!fabricCanvas) {
    console.error('resizeAndSetBackground: fabricCanvas が初期化されていません');
    return;
  }
  console.log('resizeAndSetBackground が呼ばれました');

  // 1. 新しいCanvasのサイズを計算
  const imgRatio = imgElement.naturalHeight / imgElement.naturalWidth;
  
  // 親コンテナの幅(containerWidth)をそのままCanvasの幅として使用します
  const newWidth = containerWidth;
  const newHeight = newWidth * imgRatio;

  // 2. Fabric.jsのCanvasにサイズをセット
  fabricCanvas.setDimensions({
    width: newWidth,
    height: newHeight
  });
  
  // 3. <img> から FabricImage を作成
  const fabricImg = new FabricImage(imgElement);

  // 4. 背景としてセット
  fabricCanvas.backgroundColor = 'transparent'; // 以前の背景色をクリア
  fabricCanvas.backgroundImage = fabricImg;
  
  // 5. 画像をCanvasの幅にフィットさせる
  fabricImg.scaleToWidth(newWidth);

  // 6. 変更をCanvasに反映
  fabricCanvas.renderAll();

  console.log(`Canvasをリサイズしました: ${newWidth} x ${newHeight}`);
};

const deleteActiveObject = () => {
  if (!fabricCanvas) return;
  const activeObject = fabricCanvas.getActiveObject();
  if (activeObject) {
    fabricCanvas.remove(activeObject);
    fabricCanvas.renderAll();
  }
};

const exportOriginalSizeDataURL = (originalImageElement) => {
  try {
    if (!fabricCanvas || !originalImageElement) {
      console.error('exportOriginalSizeDataURL: 引数が不足しています');
      return null;
    }

    // 1. オリジナル解像度
    const originalWidth = originalImageElement.naturalWidth;
    const originalHeight = originalImageElement.naturalHeight;

    // 2. 現在の表示サイズ
    const currentWidth = fabricCanvas.width;

    // 3. スケーリング比率
    const ratio = originalWidth / currentWidth;
    
    if (ratio <= 0 || !isFinite(ratio)) {
      console.error('無効なスケーリング比率です', ratio);
      return null;
    }

    // 4. メモリ上に元サイズの StaticCanvas を作成
    const staticCanvas = new StaticCanvas(null, {
      width: originalWidth,
      height: originalHeight
    });

    // 5. 背景画像を手動で「再構築」
    const bgImage = fabricCanvas.backgroundImage;
    if (bgImage) {
      // getElement() で <img> 要素を取得
      const bgImgElement = bgImage.getElement();
      const newBgScale = bgImage.scaleX * ratio;
      
      // <img> 要素から新しい FabricImage を作成
      const newBg = new FabricImage(bgImgElement, {
        scaleX: newBgScale,
        scaleY: newBgScale
      });
      staticCanvas.backgroundImage = newBg;
    }

    // 6. オブジェクト（推し）を個別に「再構築」
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      objects.forEach(obj => {
        // 7. <img> 要素を取得 (FabricImage のみ)
        if (obj.type === 'image' && obj.getElement) {
          const oshiImgElement = obj.getElement();
          
          // 8. <img> とスケーリング済みのプロパティから新しい FabricImage を作成
          const newOshi = new FabricImage(oshiImgElement, {
            // スケーリングするプロパティ
            left: obj.left * ratio,
            top: obj.top * ratio,
            scaleX: obj.scaleX * ratio,
            scaleY: obj.scaleY * ratio,
            
            // そのままコピーするプロパティ
            angle: obj.angle,
            flipX: obj.flipX,
            flipY: obj.flipY,
            skewX: obj.skewX,
            skewY: obj.skewY,
            originX: obj.originX,
            originY: obj.originY,
            // ... (他にも必要なプロパティがあればここに追加)
          });
          
          // 9. StaticCanvas に追加
          staticCanvas.add(newOshi);
        }
      });
    }

    // 10. 最終描画
    staticCanvas.renderAll();

    // 11. 高解像度のData URLを生成
    const dataUrl = staticCanvas.toDataURL({
      format: 'png',
      quality: 1.0
    });

    // 12. メモリ解放
    staticCanvas.dispose();

    return dataUrl; // ★ 成功パス

  } catch (error) {
    console.error('exportOriginalSizeDataURL 内部でエラー:', error);
    return null; // ★ 失敗パス
  }
};

defineExpose({
  resizeAndSetBackground,
  addOshiImage,
  deleteActiveObject,
  exportOriginalSizeDataURL
});
</script>

<style scoped>
/*
  <canvas> タグを囲むラッパー（自動生成）に
  スタイルを適用するため :deep() を使います
*/
:deep(.canvas-container) {
  /*
    親要素 (App.vueの .canvas-wrapper) の
    サイズに追従するようにします
  */
  max-width: 100%;
  max-height: 100%;

  /* スマホ画面で縮小表示されたときもくっきりさせる */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
</style>
