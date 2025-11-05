import { ref } from 'vue';
import localforage from 'localforage';

// -----------------------------------------------------
// localForageのインスタンス（DB）を先に定義します
// 'backgroundStore' という名前のDB（テーブル）を使います
// -----------------------------------------------------
const imageStore = localforage.createInstance({
  name: 'oshiAppDB',      // データベース名
  storeName: 'backgroundStore' // このストアには背景画像を保存
});

// -----------------------------------------------------
// アプリ全体で共有する「状態」
// -----------------------------------------------------
// ギャラリーの画像リスト（最初は空）
const galleryList = ref<Array<{ id: string; data: unknown }>>([]);

// -----------------------------------------------------
// このコンポーザブル（機能）を呼び出すためのメイン関数
// -----------------------------------------------------
export function useBackgroundStore() {

  /**
   * DBからすべての画像を読み込み、galleryListを更新する
   */
  const loadImages = async () => {
    const keys = await imageStore.keys();
    const images: Array<{ id: string; data: unknown }> = [];
    for (const key of keys) {
      const imageData = await imageStore.getItem(key);
      // ここでは簡略化のためキーとデータのみ保存
      images.push({ id: key, data: imageData });
    }
    galleryList.value = images;
    console.log('ギャラリーを読み込みました:', galleryList.value);
  };

  /**
   * 新しい画像をDBに追加する
   * @param {Blob} imageBlob - 保存する画像データ
   */
  const addImage = async (imageBlob: Blob) => {
    // IDとして現在時刻のタイムスタンプを使う（簡易的）
    const imageId = `img_${Date.now()}`;
    
    try {
      await imageStore.setItem(imageId, imageBlob);
      console.log('画像を追加しました:', imageId);
      // 保存後、ギャラリーリストを再読み込み
      await loadImages();
    } catch (err) {
      console.error('画像の保存に失敗:', err);
      // ここで容量オーバーなどのエラー処理を将来的に追加
    }
  };

  /**
   * 画像をDBから削除する
   * @param {String} imageId - 削除する画像のID
   */
  const deleteImage = async (imageId: string) => {
    try {
      await imageStore.removeItem(imageId);
      console.log('画像を削除しました:', imageId);
      // 削除後、ギャラリーリストを再読み込み
      await loadImages();
    } catch (err) {
      console.error('画像の削除に失敗:', err);
    }
  };

  // 外部のコンポーネントが使えるように、関数と状態を返す
  return {
    galleryList,
    loadImages,
    addImage,
    deleteImage
  };
}