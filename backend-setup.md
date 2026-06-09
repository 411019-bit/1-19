# Google Apps Script 後端整合教學

這份文件說明如何使用 Google Apps Script 接收前端傳送的單字資料，並將資料寫入 Google 試算表。

## 1. 建立 Google 試算表

1. 開啟 Google 試算表。
2. 新增一個工作表，例如命名為 `Words`。
3. 將第一列設為欄位標題：
   - `Timestamp`
   - `Word`
   - `Translation`
   - `PartOfSpeech`
   - `Example`
   - `RootAnalysis`

## 2. 建立 Google Apps Script 專案

1. 在試算表中，選擇 `擴充功能` > `Apps Script`。
2. 會開啟 Apps Script 編輯器。
3. 將預設的程式碼刪除，改成以下內容：

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName('Words');
    if (!sheet) {
      throw new Error('找不到名稱為 Words 的工作表。');
    }

    sheet.appendRow([
      new Date(),
      data.word || '',
      data.translation || '',
      data.partOfSpeech || '',
      data.example || '',
      data.rootAnalysis || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

## 3. 部署為 Web 應用程式

1. 在 Apps Script 編輯器上方，點選 `部署` > `新建部署`。
2. 選擇 `網頁應用程式`。
3. 設定：
   - `描述`：例如 `Word Manager API`。
   - `執行應用程式的身分`：選擇 `我`。
   - `可存取的使用者`：選擇 `任何人，甚至匿名使用者`。
4. 點選 `部署`。
5. 複製部署後的 `Web 應用程式網址`。

## 4. 更新前端程式

在前端 `script.js` 中，找到以下常數：

```javascript
const GAS_ENDPOINT = 'https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec';
```

將它替換成你剛才複製的 Web 應用程式網址，例如：

```javascript
const GAS_ENDPOINT = 'https://script.google.com/macros/s/你的部署代碼/exec';
```

## 5. 儲存單字後端流程

當管理者在表單中填好資料並按下「儲存單字」時，前端會：

1. 將資料儲存到瀏覽器 `localStorage`。
2. 透過 `fetch()` 將資料以 `POST` JSON 送到 Google Apps Script 後端。
3. 後端收到資料後，寫入 Google 試算表 `Words` 工作表。
4. 後端回傳成功狀態，前端顯示狀態訊息。

## 6. 測試流程

1. 開啟 `index.html`。
2. 點選「管理頁」並新增單字資料。
3. 確認 `GAS_ENDPOINT` 已設定為你的 Apps Script 部署網址。
4. 按下「儲存單字」。
5. 如果一切正常，前端會顯示成功訊息，試算表會新增一筆資料。

## 7. 注意事項

- **CORS**：Apps Script 範例已加入 `Access-Control-Allow-Origin: *` 標頭，讓前端可跨來源請求。
- **授權**：第一次部署時，Apps Script 可能會要求你授權讀寫試算表存取權限。
- **工作表名稱**：確保工作表名稱為 `Words`，或修改程式碼中的名稱一致。
- **更新部署**：若修改 Apps Script 程式碼，請重新部署並取得新的網址，或使用相同部署版本更新。
