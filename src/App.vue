<template>
  <header>
    <h1>推しと一緒！アプリ</h1>
  </header>

  <main class="main-content">
    
    <div class="canvas-wrapper">
      <EditorCanvas ref="editor" />
    </div>
    
    <div class="controls">
      <h3>操作パネル</h3>
      
      <div>
        <label for="bg-upload">1. 背景画像をDBに追加:</label> <input 
          id="bg-upload"
          type="file" 
          accept="image/*" 
          @change="onBackgroundFileChange"
        />
      </div>

      <div>
        <label for="oshi-upload">2. 推し画像をDBに追加:</label> <input 
          id="oshi-upload"
          type="file" 
          accept="image/png, image/gif" 
          @change="onOshiFileChange" />
        <p>（透過PNG推奨）</p>
      </div>
    </div>

    <div class="gallery oshi-gallery"> <h3>推し画像ギャラリー</h3>
      <p>（画像クリックでCanvasに追加 / 保存数: {{ oshiGallery.oshiList.value.length }}）</p> <div class="gallery-container">
        <ul>
          <li v-for="image in oshiGallery.oshiList.value" :key="image.id">
            <img 
              :src="createBlobUrl(image.data)" 
              class="thumbnail"
              @click="addOshiToCanvas(image.data)" />
            <button class="delete-btn" @click="oshiGallery.deleteOshiImage(image.id)">×</button> </li>
        </ul>
      </div>
    </div>
    <div class="gallery">
      <h3>背景画像ギャラリー</h3> <p>（画像クリックで背景セット / 保存数: {{ backgroundGallery.galleryList.value.length }}）</p> <div class="gallery-container">
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
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import EditorCanvas from './components/EditorCanvas.vue';
// ▼▼▼ 2つのストアをインポート ▼▼▼
import { useBackgroundStore } from './composables/useBackgroundStore.ts';
import { useOshiGallery } from './composables/useOshiStore.ts';

// --------------------------------
// ギャラリー機能 (IndexedDB)
// --------------------------------
// ▼▼▼ 2つのストアを呼び出す ▼▼▼
const backgroundGallery = useBackgroundStore();
const oshiGallery = useOshiGallery();

onMounted(() => {
  backgroundGallery.loadImages();
  oshiGallery.loadOshiImages(); // ★推し画像も読み込む
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

// --------------------------------
// Canvasコンポーネント
// --------------------------------
const editor = ref(null);

/**
 * ギャラリーの画像をクリックしたときに背景をセットする
 */
const setBackground = async (imageBlob) => {
  if (!editor.value) {
    console.error('setBackground: editor (ref) が見つかりません');
    return;
  }
  console.log('setBackground が呼ばれました。');

  try {
    const dataUrl = await convertBlobToDataURL(imageBlob);
    editor.value.setBackgroundImage(dataUrl);
  } catch (error) {
    console.error('背景画像の変換に失敗:', error);
  }
};

// --- ▼▼▼ 新設 ▼▼▼ ---
/**
 * 推しギャラリーの画像をクリックしたときにCanvasに追加する
 */
const addOshiToCanvas = async (imageBlob) => {
  if (!editor.value) {
    console.error('addOshiToCanvas: editor (ref) が見つかりません');
    return;
  }
  console.log('addOshiToCanvas が呼ばれました。');
  
  try {
    const dataUrl = await convertBlobToDataURL(imageBlob);
    // EditorCanvas.vue にある addOshiImage 関数を呼び出す
    editor.value.addOshiImage(dataUrl); 
  } catch (error) {
    console.error('推し画像の変換に失敗:', error);
  }
};
// --- ▲▲▲ 新設ここまで ▲▲▲ ---


// --------------------------------
// ファイル入力の処理
// --------------------------------

/**
 * 背景画像ファイルが選択されたときの処理
 */
const onBackgroundFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  // ★背景ストアに追加
  backgroundGallery.addImage(file); 
  event.target.value = null;
};

/**
 * 推し画像ファイルが選択されたときの処理
 */
const onOshiFileChange = async (event) => { // ★ async は不要になった
  const file = event.target.files[0];
  if (!file) return;

  // --- ▼▼▼ 修正 ▼▼▼ ---
  // Canvasに直接追加するのではなく、Oshiストアに追加する
  oshiGallery.addOshiImage(file);
  // --- ▲▲▲ 修正ここまで ---

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
  flex-grow: 1; /* 残りの高さをすべて使う */
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 0; /* gapは使わず、marginで制御 */
  padding-bottom: 16px; /* 下端の余白 */
  padding: 16px;
}

/* --- Canvasエリア --- */
.canvas-wrapper {
  flex-shrink: 0;
  width: 100%;
  height: 400px; /* Canvasの高さに合わせる */
  max-height: 50vh; /* 画面の半分まで */

  /* Canvas(600px)がはみ出たら横スクロールさせる
    これがスマホ対応のキモです
  */
  overflow-x: auto;
  
  background-color: #ddd; /* スクロール領域の背景 */
  border-radius: 8px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
  
  /* スクロールをスムーズに */
  -webkit-overflow-scrolling: touch;
}

/* --- 操作パネル --- */
.controls {
  flex-shrink: 0;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls h3 {
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.controls div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* --- ギャラリー --- */
.gallery {
  flex-shrink: 0; /* 縮まない */
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.gallery h3 {
  font-size: 1rem;
  font-weight: 600;
}
.gallery p {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 12px;
}

.gallery.oshi-gallery {
  /* 推しギャラリーだけ少し背景色を変える（任意） */
  background-color: #fdfdff;
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

/* --- フォーム部品 --- */
label {
  font-size: 0.9rem;
  font-weight: 500;
}

input[type="file"] {
  font-size: 0.9rem;
}

/* ファイル選択ボタンのスタイルを整える (任意) */
input[type="file"]::file-selector-button {
  border: none;
  background-color: #007aff;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

input[type="file"]::file-selector-button:active {
  background-color: #0056b3;
}
</style>