"""
ファイルアップロード処理
"""
import os
import imghdr
from config import Config

class FileService:
    """ファイルアップロードに関するビジネスロジック"""

    def validate_image(self, file):
        """画像ファイルのバリデーション"""
        if not file or not file.filename:
            return None

        # ★★★ 修正箇所: ファイル拡張子偽装対策を追加 ★★★
        # ファイルの内容を読み取ってマジックナンバーをチェック
        file_data = file.read()
        file_type = imghdr.what(None, file_data)
        
        # 画像形式でない、または許可されていない形式の場合はエラー
        if file_type not in ['jpeg', 'png', 'gif']:
            file.seek(0)  # ファイルポインタを先頭に戻す
            return '画像ファイルではありません'
        
        # ファイルポインタを先頭に戻す（後で保存するため）
        file.seek(0)

        # ファイル形式チェック（拡張子も念のためチェック）
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in Config.ALLOWED_EXTENSIONS:
            return 'jpg, jpeg, png, gifのみ対応しています'

        # ファイルサイズチェック
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size > Config.MAX_CONTENT_LENGTH:
            return '画像ファイルは5MB以下にしてください'

        return None

    def save_review_photo(self, file, review_id):
        """レビュー写真を保存"""
        file_ext = os.path.splitext(file.filename)[1].lower()
        filename = f'review_{review_id}{file_ext}'

        # 保存先ディレクトリの確認（存在しなければ作成）
        upload_dir = Config.UPLOAD_FOLDER
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir, exist_ok=True)

        # ファイル保存
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)

        return filename

    def delete_review_photo(self, filename):
        """レビュー写真を削除"""
        if not filename:
            return True

        file_path = os.path.join(Config.UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                return True
            except Exception as e:
                print(f"ファイル削除エラー: {e}")
                return False

        return True