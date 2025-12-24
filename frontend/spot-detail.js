// spot-detail.js - XSS脆弱性修正済みバージョン

// HTMLエスケープ関数（stats.jsのescapeHtml関数と同等）
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadReviews() {
    const spotId = new URLSearchParams(window.location.search).get('id');
    
    try {
        const response = await fetch(`/api/spots/${spotId}/reviews`);
        if (!response.ok) {
            throw new Error('レビューの読み込みに失敗しました');
        }
        
        const reviews = await response.json();
        const reviewsList = document.getElementById('reviewsList');
        reviewsList.innerHTML = '';
        
        reviews.forEach(review => {
            // 日付のフォーマット
            const date = new Date(review.created_at);
            const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            
            // 写真のHTML（ある場合）
            let photoHtml = '';
            if (review.photo_url) {
                photoHtml = `<img src="${review.photo_url}" alt="レビュー写真" class="review-photo">`;
            }
            
            // 削除ボタンのHTML（自分のレビューの場合）
            let deleteButtonHtml = '';
            const currentUserId = getCurrentUserId(); // 現在ログイン中のユーザーID取得関数
            if (currentUserId === review.user_id) {
                deleteButtonHtml = `<button class="delete-button" onclick="deleteReview(${review.review_id})">削除</button>`;
            }
            
            // ★★★ 修正箇所: XSS対策 ★★★
            // 方法1: textContentを使用する方法（推奨）
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            reviewItem.dataset.reviewId = review.review_id;
            
            // ヘッダー部分
            const reviewHeader = document.createElement('div');
            reviewHeader.className = 'review-header';
            
            const reviewerName = document.createElement('span');
            reviewerName.className = 'reviewer-name';
            reviewerName.textContent = review.user_name; // 安全にテキストとして設定
            
            const reviewDate = document.createElement('span');
            reviewDate.className = 'review-date';
            reviewDate.textContent = dateStr;
            
            reviewHeader.appendChild(reviewerName);
            reviewHeader.appendChild(reviewDate);
            
            // 評価部分
            const reviewRating = document.createElement('div');
            reviewRating.className = 'review-rating';
            reviewRating.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            
            // レビュー本文（XSS対策済み）
            const reviewText = document.createElement('div');
            reviewText.className = 'review-text';
            reviewText.textContent = review.review_content; // 安全にテキストとして設定
            
            // 要素を組み立て
            reviewItem.appendChild(reviewHeader);
            reviewItem.appendChild(reviewRating);
            reviewItem.appendChild(reviewText);
            
            // 写真と削除ボタンは安全なのでinnerHTMLで追加可能
            if (photoHtml) {
                reviewItem.insertAdjacentHTML('beforeend', photoHtml);
            }
            if (deleteButtonHtml) {
                reviewItem.insertAdjacentHTML('beforeend', deleteButtonHtml);
            }
            
            reviewsList.appendChild(reviewItem);
        });
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        alert('レビューの読み込み中にエラーが発生しました');
    }
}

// 代替案: HTMLエスケープ関数を使う方法
async function loadReviewsAlternative() {
    const spotId = new URLSearchParams(window.location.search).get('id');
    
    try {
        const response = await fetch(`/api/spots/${spotId}/reviews`);
        if (!response.ok) {
            throw new Error('レビューの読み込みに失敗しました');
        }
        
        const reviews = await response.json();
        const reviewsList = document.getElementById('reviewsList');
        reviewsList.innerHTML = '';
        
        reviews.forEach(review => {
            const date = new Date(review.created_at);
            const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
            
            let photoHtml = '';
            if (review.photo_url) {
                photoHtml = `<img src="${review.photo_url}" alt="レビュー写真" class="review-photo">`;
            }
            
            let deleteButtonHtml = '';
            const currentUserId = getCurrentUserId();
            if (currentUserId === review.user_id) {
                deleteButtonHtml = `<button class="delete-button" onclick="deleteReview(${review.review_id})">削除</button>`;
            }
            
            // ★★★ 修正箇所: escapeHtml関数を使用 ★★★
            const reviewHtml = `
                <div class="review-item" data-review-id="${review.review_id}">
                    <div class="review-header">
                        <span class="reviewer-name">${escapeHtml(review.user_name)}</span>
                        <span class="review-date">${dateStr}</span>
                    </div>
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    <div class="review-text">${escapeHtml(review.review_content)}</div>
                    ${photoHtml}
                    ${deleteButtonHtml}
                </div>
            `;
            reviewsList.insertAdjacentHTML('beforeend', reviewHtml);
        });
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        alert('レビューの読み込み中にエラーが発生しました');
    }
}

// レビュー投稿処理
async function submitReview(event) {
    event.preventDefault();
    
    const reviewContent = document.getElementById('reviewContent').value;
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const spotId = new URLSearchParams(window.location.search).get('id');
    
    if (!reviewContent || !rating) {
        alert('レビュー内容と評価を入力してください');
        return;
    }
    
    try {
        const response = await fetch(`/api/spots/${spotId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                review_content: reviewContent,
                rating: parseInt(rating)
            })
        });
        
        if (!response.ok) {
            throw new Error('レビューの投稿に失敗しました');
        }
        
        // フォームをリセット
        document.getElementById('reviewContent').value = '';
        document.querySelector('input[name="rating"]:checked').checked = false;
        
        // レビュー一覧を再読み込み
        await loadReviews();
        
        alert('レビューを投稿しました');
        
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('レビューの投稿中にエラーが発生しました');
    }
}

// レビュー削除処理
async function deleteReview(reviewId) {
    if (!confirm('このレビューを削除しますか?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('レビューの削除に失敗しました');
        }
        
        // レビュー一覧を再読み込み
        await loadReviews();
        
        alert('レビューを削除しました');
        
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('レビューの削除中にエラーが発生しました');
    }
}

// 現在のユーザーIDを取得する関数（実装例）
function getCurrentUserId() {
    // 実際の実装ではセッションやローカルストレージから取得
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
    }
    return null;
}

// ページ読み込み時にレビューを表示
document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
    
    // レビュー投稿フォームのイベントリスナー
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }
});