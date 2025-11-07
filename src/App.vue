<template>
  <header>
    <h1>推しと一緒！アプリ</h1>
  </header>

  <main class="main-content">
    
    <div class="main-column-left">
      <div 
        class="canvas-wrapper" 
        ref="canvasWrapperRef" 
        :class="{ 'has-image': canvasHasImage }"
      >
        <div v_if="!canvasHasImage" class="canvas-placeholder">
          背景画像を読み込んでください
        </div>
        <EditorCanvas ref="editor" />
      </div>

      <div class="canvas-controls">
        <button @click="deleteSelectedOshi" class="delete-selected-btn">
          選択した推しを削除
        </button>
      </div>
    </div>
    <div class="main-column-right">
      <div class="gallery oshi-gallery">
        <div class="gallery-header">
          <div class="gallery-header-info">
            <h3>推し画像ギャラリー</h3>
            <p>（クリックでCanvasに追加 / 保存数: {{ oshiGallery.oshiList.value.length }}）</p>
          </div>
          <div class="gallery-header-input">
            <label for="oshi-upload" class="file-label">画像を追加</label>
            <input 
              id="oshi-upload"
              class="file-input"
              type="file" 
              accept="image/png, image/gif" 
              @change="onOshiFileChange"
            />
          </div>
        </div>
        <div class="gallery-container">
          <ul>
            <li v-for="image in oshiGallery.oshiList.value" :key="image.id">
              <img 
                :src="createBlobUrl(image.data)" 
                class="thumbnail"
                @click="addOshiToCanvas(image.data)"
              />
              <button class="delete-btn" @click="oshiGallery.deleteOshiImage(image.id)">×</button>
            </li>
          </ul>
        </div>
      </div>

      <div class="gallery">
        <div class="gallery-header">
          <div class="gallery-header-info">
            <h3>背景画像ギャラリー</h3>
            <p>（クリックで背景セット / 保存数: {{ backgroundGallery.galleryList.value.length }}）</p>
          </div>
          <div class="gallery-header-input">
            <label for="bg-upload" class="file-label">画像を追加</label>
            <input 
              id="bg-upload"
              class="file-input"
              type="file" 
              accept="image/*" 
              @change="onBackgroundFileChange"
            />
          </div>
        </div>
        <div class="gallery-container">
          <ul>
            <li v-for="image in backgroundGallery.galleryList.value" :key="image.id"> 
              <img 
                :src="createBlobUrl(image.data)" 
                class="thumbnail"
                @click="setBackground(image.data)" 
              />
              <button class="delete-btn" @click="backgroundGallery.deleteImage(image.id)">×</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
    </main>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import EditorCanvas from './components/EditorCanvas.vue';
import { useBackgroundStore } from './composables/useBackgroundStore.ts';
import { useOshiGallery } from './composables/useOshiStore.ts';

const backgroundGallery = useBackgroundStore();
const oshiGallery = useOshiGallery();
const currentBgDataUrl = ref(null);
const currentBgHtmlImage = ref(null);
const editor = ref(null);
const canvasWrapperRef = ref(null);
const canvasHasImage = ref(false);

const handleResize = () => {
  // 必要な要素が揃っていない（背景がまだない等）場合は何もしない
  if (!editor.value || !canvasWrapperRef.value || !currentBgDataUrl.value || !currentBgHtmlImage.value) {
    return;
  }

  console.log('リサイズを検知');
  
  // 1. 新しいコンテナ幅を取得
  const containerWidth = canvasWrapperRef.value.clientWidth;
  
  // 2. EditorCanvasのリサイズ関数を、保持している画像データで呼び出す
  editor.value.resizeAndSetBackground(
    currentBgDataUrl.value, 
    currentBgHtmlImage.value, 
    containerWidth
  );
};

onMounted(() => {
  backgroundGallery.loadImages();
  oshiGallery.loadOshiImages();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const createBlobUrl = (blob) => {
  if (!blob) return '';
  return URL.createObjectURL(blob);
};

const convertBlobToDataURL = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

const loadHtmlImage = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
};

const setBackground = async (imageBlob) => {
  if (!editor.value || !canvasWrapperRef.value) {
    console.error('setBackground: editor または wrapper が見つかりません');
    return;
  }
  
  try {
    const dataUrl = await convertBlobToDataURL(imageBlob);
    const imgElement = await loadHtmlImage(dataUrl);
    const containerWidth = canvasWrapperRef.value.clientWidth;
    currentBgDataUrl.value = dataUrl;
    currentBgHtmlImage.value = imgElement;
    editor.value.resizeAndSetBackground(dataUrl, imgElement, containerWidth);
    canvasHasImage.value = true;
  } catch (error) {
    console.error('背景画像のセットに失敗:', error);
  }
};

const addOshiToCanvas = async (imageBlob) => {
  if (!editor.value) return;
  try {
    const dataUrl = await convertBlobToDataURL(imageBlob);
    editor.value.addOshiImage(dataUrl); 
  } catch (error) {
    console.error('推し画像の変換に失敗:', error);
  }
};

const deleteSelectedOshi = () => {
  if (!editor.value) return;
  editor.value.deleteActiveObject();
};


const onBackgroundFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  backgroundGallery.addImage(file);
  event.target.value = null;
};

const onOshiFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  oshiGallery.addOshiImage(file);
  event.target.value = null;
};
</script>

<style>
/* --- グローバル・リセット --- */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #f4f4f9;
  color: #333;
}

/* --- PWA用レイアウト --- */
#app {
  display: flex;
  flex-direction: column;
  /* スマホの画面全体を使う設定。
    アドレスバーが隠れても高さが追従する
  */
  height: 100vh;
  height: -webkit-fill-available; /* iOS Safari用 */
}

header {
  flex-shrink: 0; /* 縮まない */
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #ddd;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

header h1 {
  font-size: 1.1rem;
  font-weight: 600;
}

/* メインコンテンツエリア */
.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 0;
  padding-bottom: 16px;
  padding: 16px;
}

@media (min-width: 1024px) {
  .main-content {
    flex-direction: row; /* PCでは横並び */
    gap: 24px;
    overflow-y: hidden; /* PCでは親をスクロールさせない */
  }

  .main-column-left {
    flex-grow: 1; /* 左カラム（Canvas）が幅を占める */
    min-width: 0; /* 縮小できるように */
    display: flex;
    flex-direction: column;
  }

  .main-column-right {
    flex-shrink: 0; /* 右カラム（操作部）は縮まない */
    width: 380px; /* 右カラムの幅を固定 */
    height: 100%; /* 親の高さに合わせる */
    overflow-y: auto; /* ★ 右カラムだけをスクロールさせる */
    
    /* スクロールバーのスタイル（任意） */
    scrollbar-width: thin;
    scrollbar-color: #ccc #f4f4f9;
  }
  
  /* PC時はギャラリー間のマージンを調整 */
  .main-column-right .gallery {
    margin-bottom: 24px;
  }
}

/* --- Canvasエリア --- */
/* --- 左カラム (Canvas周り) --- */
.canvas-wrapper {
  flex-grow: 1; /* PC時に高さを広げる */
  flex-shrink: 0;
  width: 100%;
  
  background-color: #eee;
  border-radius: 8px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
  min-height: 250px;
  
  /* プレースホルダーテキスト用 */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 背景画像がセットされたら、プレースホルダーを隠す */
.canvas-wrapper.has-image {
  background-color: transparent;
  min-height: 0;
  align-items: flex-start; /* 左上に配置 */
  justify-content: flex-start;
}
.canvas-placeholder {
  color: #888;
  font-size: 0.9rem;
}
.canvas-wrapper.has-image .canvas-placeholder {
  display: none;
}

.canvas-controls {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end; /* ボタンを右寄せ */
  /* Canvasの真下に配置 */
  margin-top: 12px;
  margin-bottom: 16px;
}

.delete-selected-btn {
  border: none;
  background-color: #e53935; /* 赤系の削除ボタン */
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.delete-selected-btn:active {
  background-color: #c62828;
}

/* --- ギャラリー --- */
.gallery-header {
  display: flex;
  justify-content: space-between; /* 両端揃え */
  align-items: center; /* 中央揃え */
  margin-bottom: 12px;
  gap: 16px;
}
.gallery-header-info {
  flex-grow: 1; /* タイトル領域が伸びる */
}
.gallery-header-input {
  flex-shrink: 0; /* ボタンは縮まない */
}

.gallery h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0; /* マージンリセット */
}

.gallery p {
  font-size: 0.8rem;
  color: #666;
  margin: 0; /* マージンリセット */
}

.gallery {
  flex-shrink: 0;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.gallery-container {
  /* ギャラリーがはみ出たら横スクロール */
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.gallery ul {
  list-style: none;
  display: flex; /* 横並び */
  gap: 12px;
  padding-bottom: 8px; /* スクロールバーのための余白 */
}

.gallery li {
  flex-shrink: 0; /* 縮まない */
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.thumbnail {
  width: 100px;
  height: 100px;
  object-fit: cover;
  cursor: pointer;
  display: block;
  background-color: #eee;
}

.thumbnail:active {
  filter: brightness(0.8);
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(0,0,0,0.6);
  color: white;
  border: none;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* --- ▼▼▼ 修正 (ファイル入力) ▼▼▼ --- */
/* デフォルトのinputを隠す */
.file-input {
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  position: absolute;
  z-index: -1;
}

/* ラベルをボタン風にスタイリング */
.file-label {
  border: none;
  background-color: #007aff;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
  display: inline-block;
}
.file-label:active {
  background-color: #0056b3;
}
</style>