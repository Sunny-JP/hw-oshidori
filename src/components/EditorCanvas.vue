<template>
  <div>
    <canvas ref="canvasElement" width="600" height="400"></canvas>
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
      backgroundColor: '#eee'
    });
    console.log('Fabric.jsのCanvasを初期化しました');
    fabricCanvas.renderAll();
  } else {
    console.error('onMounted: canvasElement が見つかりません');
  }
});

/**
 * URLから「推し画像」をCanvasに追加する
 * @param {String} imageUrl - Data URL
 */
const addOshiImage = (imageUrl) => {
  if (!fabricCanvas) {
    console.error('addOshiImage: fabricCanvas が初期化されていません');
    return;
  }
  console.log('addOshiImage が呼ばれました');

  // --- ▼▼▼ ここから修正 ▼▼▼ ---
  
  // 1. Web標準の Image オブジェクトを作成
  const imgElement = new Image();
  
  // 2. 読み込み完了時の処理を先に定義
  imgElement.onload = () => {
    console.log('推し画像の読み込み成功 (Image.onload)'); // ★表示されるはずのログ

    // 3. 読み込んだHTML要素から FabricImage を作成
    const fabricImg = new FabricImage(imgElement, {
      scaleX: 200 / imgElement.width, // 幅200pxにスケール
      scaleY: 200 / imgElement.width,
      left: 100,
      top: 100,
    });
    
    // 4. Canvasに追加して再描画
    fabricCanvas.add(fabricImg);
    fabricCanvas.renderAll();
    console.log('「推し」画像を追加しました');
  };

  // 5. 読み込み失敗時の処理
  imgElement.onerror = (err) => {
    console.error('推し画像の読み込みに失敗 (Image.onerror)', err);
  };

  // 6. 最後に Data URL をセットして読み込みを開始
  imgElement.src = imageUrl;

  // --- ▲▲▲ 修正ここまで ▲▲▲ ---
};

/**
 * Canvasの背景画像を設定する
 * @param {String} imageUrl - Data URL
 */
const setBackgroundImage = (imageUrl) => {
  if (!fabricCanvas) {
    console.error('setBackgroundImage: fabricCanvas が初期化されていません');
    return;
  }
  console.log('setBackgroundImage が呼ばれました');

  // 1. Web標準の Image オブジェクトを作成
  const imgElement = new Image();

  // 2. 読み込み完了時の処理
  imgElement.onload = () => {
    console.log('背景画像の読み込み成功 (Image.onload)');

    // 3. 読み込んだHTML要素から FabricImage を作成
    const fabricImg = new FabricImage(imgElement);

    // --- ▼▼▼ ここから修正 ▼▼▼ ---

    // 4. 背景としてセット (プロパティに直接代入)
    fabricCanvas.backgroundImage = fabricImg;
    
    // 5. Canvasのサイズに画像をフィットさせる
    fabricImg.scaleToWidth(fabricCanvas.width);
    fabricImg.scaleToHeight(fabricCanvas.height);

    // 6. 変更をCanvasに反映（強制再描画）
    fabricCanvas.renderAll();

    console.log('背景画像を設定しました');
    
    // --- ▲▲▲ 修正ここまで ▲▲▲ ---
  };

  // 5. 読み込み失敗時の処理
  imgElement.onerror = (err) => {
    console.error('背景画像の読み込みに失敗 (Image.onerror)', err);
  };

  // 6. 最後に Data URL をセットして読み込みを開始
  imgElement.src = imageUrl;
};

defineExpose({
  setBackgroundImage,
  addOshiImage
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
  width: 100% !important;
  height: 100% !important;
  max-width: 600px; /* 元のcanvas幅 */
  max-height: 400px; /* 元のcanvas高さ */

  /* スマホ画面で縮小表示されたときもくっきりさせる */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* fabric.js が操作する <canvas> 自体
  (backgroundColor: '#eee' が適用される場所)
*/
:deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}
</style>
