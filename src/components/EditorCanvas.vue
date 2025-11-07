<template>
  <div>
    <canvas ref="canvasElement"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Canvas, Image as FabricImage } from 'fabric';

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

defineExpose({
  resizeAndSetBackground,
  addOshiImage,
  deleteActiveObject
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
