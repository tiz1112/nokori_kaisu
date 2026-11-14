// ===== 寿命の基準値(厚生労働省の公表値) =====
// 健康寿命:2022年(令和4年) / 平均寿命:2025年(令和7年)
const LIFE_TABLE = {
    health: { male: 72.57, female: 75.45 },   // 健康寿命
    life: { male: 81.35, female: 87.33 }      // 平均寿命
};

// ===== 画面の部品を見つけておく =====
const saveButton = document.querySelector('#saveSetting');
const addButton = document.querySelector('#add');
const clearButton = document.querySelector('#clear');
const list = document.querySelector('#list');
const remainText = document.querySelector('#remainText');

// ===== 設定を読む(無ければ null が返る) =====
function getSetting() {
    return JSON.parse(localStorage.getItem('setting'));
}

// ===== 今の年齢を計算する =====
function getAge(birthday) {
    const birth = new Date(birthday);          // 生年月日を日付に変換
    const today = new Date();                  // 今日の日付
    const diff = today - birth;                // 差(ミリ秒)
    return diff / (1000 * 60 * 60 * 24 * 365.25);   // 年に直す
}

// ===== 残り年数を計算する =====
function getRemainYears() {
    const setting = getSetting();
    if (!setting) {
        return 0;                              // 設定が無ければ 0
    }
    const age = getAge(setting.birthday);
    const limit = LIFE_TABLE[setting.standard][setting.gender];
    const remain = limit - age;
    if (remain < 0) {
        return 0;                              // マイナスにはしない
    }
    return remain;
}

// ===== 設定の表示を更新する =====
function renderSetting() {
    const setting = getSetting();
    if (!setting) {
        remainText.innerHTML = '';
        return;
    }

    // 入力欄に、保存済みの値を戻す
    document.querySelector('#birthday').value = setting.birthday;
    document.querySelector('#gender').value = setting.gender;
    document.querySelector('#standard').value = setting.standard;

    const years = Math.floor(getRemainYears());
    const label = setting.standard === 'health' ? '健康寿命' : '平均寿命';
    remainText.innerHTML = label + 'まで、あと <b>' + years + '</b> 年';
}

// ===== 一覧を表示する =====
function render() {
    const items = JSON.parse(localStorage.getItem('items')) || [];
    const remainYears = getRemainYears();

    list.innerHTML = '';

    // 1件も無いときの表示
    if (items.length === 0) {
        list.innerHTML = '<li class="empty">まだ何も数えていません。</li>';
        return;
    }

    // 1件ずつ取り出して表示する
    items.forEach(function (item, index) {
        // 残り回数 = 年に何回 × 残り年数 − 使った回数
        let count = Math.floor(item.perYear * remainYears) - item.used;
        if (count < 0) {
            count = 0;
        }

        const li = document.createElement('li');
        li.innerHTML =
            '<div class="item-what">' + item.what + '</div>' +
            '<div class="item-count">' + count + '<span>回</span></div>' +
            '<div class="item-sub">年' + item.perYear + '回のペースで、残り' + Math.floor(remainYears) + '年</div>' +
            '<div class="item-foot">' +
            '<span class="item-used">これまで ' + item.used + ' 回</span>' +
            '<button class="use-btn" data-index="' + index + '">1回使った</button>' +
            '</div>';
        list.appendChild(li);
    });

    // 「1回使った」ボタンに動きを付ける
    document.querySelectorAll('.use-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const i = Number(btn.dataset.index);        // 何番目のボタンか
            const items = JSON.parse(localStorage.getItem('items')) || [];
            items[i].used = items[i].used + 1;          // 使った回数を1増やす
            localStorage.setItem('items', JSON.stringify(items));
            render();
        });
    });
}

// ===== 「設定を保存する」ボタン =====
saveButton.addEventListener('click', function () {
    const birthday = document.querySelector('#birthday').value;
    const gender = document.querySelector('#gender').value;
    const standard = document.querySelector('#standard').value;

    if (birthday === '') {
        alert('生年月日を入力してください');
        return;
    }

    // 設定を localStorage に保存する(キーは setting)
    localStorage.setItem('setting', JSON.stringify({
        birthday: birthday,
        gender: gender,
        standard: standard
    }));

    renderSetting();
    render();
});

// ===== 「数える」ボタン =====
addButton.addEventListener('click', function () {
    const what = document.querySelector('#what').value;
    const perYear = document.querySelector('#perYear').value;

    if (what === '' || perYear === '') {
        alert('両方とも入力してください');
        return;
    }

    if (!getSetting()) {
        alert('先に、あなたの設定を保存してください');
        return;
    }

    // 【保存の3ステップ】読む → 1件足す → リストごと保存し直す
    const items = JSON.parse(localStorage.getItem('items')) || [];
    items.push({ what: what, perYear: Number(perYear), used: 0 });
    localStorage.setItem('items', JSON.stringify(items));

    render();

    // 入力欄を空に戻す
    document.querySelector('#what').value = '';
    document.querySelector('#perYear').value = '';
});

// ===== 「全部消す」ボタン =====
clearButton.addEventListener('click', function () {
    localStorage.removeItem('items');     // 項目だけ消す(設定は残す)
    render();
});

// ===== 「リセット」ボタン =====
const resetButton = document.querySelector('#resetSetting');

resetButton.addEventListener('click', function () {
    // 本当に消していいか確認する
    const ok = confirm('設定と、数えていること全部を消します。よろしいですか?');
    if (!ok) {
        return;                               // キャンセルされたら何もしない
    }

    localStorage.removeItem('setting');       // 設定を消す
    localStorage.removeItem('items');         // 項目も消す

    // 入力欄を空に戻す
    document.querySelector('#birthday').value = '';
    document.querySelector('#gender').value = 'male';
    document.querySelector('#standard').value = 'health';

    renderSetting();
    render();
});

// ===== ページを開いたときの処理 =====
renderSetting();
render();