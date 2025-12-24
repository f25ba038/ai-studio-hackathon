// events.js - XSS脆弱性修正箇所のみ

// ★★★ 追加: HTMLエスケープ関数 ★★★
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ★★★ 修正箇所: displayEvents関数の57-72行目付近 ★★★
function displayEvents(events) {
    const eventsGrid = document.getElementById('eventsGrid');

    if (!eventsGrid) {
        console.error('イベントグリッド(eventsGrid)が見つかりません');
        return;
    }

    // 既存の内容をクリア
    eventsGrid.innerHTML = '';

    if (events.length === 0) {
        eventsGrid.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">該当するイベントが見つかりませんでした</p>';
        return;
    }

    // イベントをHTML要素として追加
    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.dataset.area = event.area;

        // バグ: 日付をパースせずにそのまま表示している
        const month = event.event_date;
        const day = '';

        // エリア名を日本語に変換
        const areaNames = {
            'maebashi': '前橋・赤城',
            'takasaki': '高崎・富岡',
            'kusatsu': '草津・四万',
            'minakami': '水上・尾瀬',
            'ikaho': '伊香保・榛名',
            'kiryu': '桐生',
            'tomioka': '富岡',
            'tatebayashi': '館林'
        };
        const areaDisplay = areaNames[event.area] || event.area;

        // 修正前:
        // eventElement.innerHTML = `
        //     <div class="event-date-box">
        //         <div class="event-month">${month}月</div>
        //         <div class="event-day">${day}</div>
        //     </div>
        //     <div class="event-info">
        //         <h3>${event.event_name}</h3>
        //         <div class="event-meta">
        //             <span class="event-location">📍 ${event.location}</span>
        //             <span class="event-area">${areaDisplay}</span>
        //             <span class="event-category">${event.category}</span>
        //         </div>
        //         <p class="event-description">${event.description}</p>
        //     </div>
        // `;

        // 修正後:
        eventElement.innerHTML = `
            <div class="event-date-box">
                <div class="event-month">${month}月</div>
                <div class="event-day">${day}</div>
            </div>
            <div class="event-info">
                <h3>${escapeHtml(event.event_name)}</h3>
                <div class="event-meta">
                    <span class="event-location">📍 ${escapeHtml(event.location)}</span>
                    <span class="event-area">${areaDisplay}</span>
                    <span class="event-category">${escapeHtml(event.category)}</span>
                </div>
                <p class="event-description">${escapeHtml(event.description)}</p>
            </div>
        `;

        eventsGrid.appendChild(eventElement);
    });
}