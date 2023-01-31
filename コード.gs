// タスクの進捗状況を「指定のチャットルーム」に通知する
function main(){
  let data = getNotionData();        // ステップ1
  let message = buildMessage(data);  // ステップ2
  sendChat(message);                 // ステップ3
}

// ステップ1. NotionAPI接続設定とJSONデータ取得
// データ取得先のNotionデータベースIDとシークレットトークン
const DATABASE_ID = 'NotionデータベースIDを指定する';
const NOTION_TOKEN = 'Notion APIトークンを指定する';

// NotionAPIを用いてデータベースのデータ（タスク一覧）を取得する
// see https://developers.notion.com/reference/post-database-query
function getNotionData() {
  const url = "https://api.notion.com/v1/databases/" + DATABASE_ID + "/query";

  let headers = {
    "content-type" : "application/json; charset=UTF-8",
    "Authorization": "Bearer " + NOTION_TOKEN,
    "Notion-Version": "2022-06-28",
  }

  let options ={
    method : "post",
    headers : headers,
  }

  let data = UrlFetchApp.fetch(url, options);
  //getResponseCode() == 200 以外のエラーハンドリングが必要
  data = JSON.parse(data);
　return data;
}

// ステップ2.チャットルーム投稿用メッセージをJSONデータから生成
//  [info][title]タスク進捗報告[/title]
//  進捗率: xx％（完了：x件、進行中: x件、未着手: x件）
//  現在進行中のタスク(URL):
//  [/info] 
function buildMessage(data) {
  let allCount = data.results.length;
  let doneCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let currentTasks = [];

  for (i=0; i < allCount; i++){
    let record = data.results[i];
    let statusName = record.properties['進捗'].select.name;
    switch (statusName) {
      case '完了':
        doneCount++;
        break;
      case '実行中':
        inProgressCount++;
        let title = record.properties['名前'].title[0].plain_text;
        let url = record.url;
        currentTasks.push(`${title}（${url}）`)
        break;
      case '未着手':
        notStartedCount++;
        break;
    }
  }

  let progressRate = Math.floor((doneCount / allCount) * 100);

  let printTitle = `[title]タスク進捗報告[/title]`;
  let printProgress =`進捗率: ${progressRate}%（完了: ${doneCount}件, 実行中: ${inProgressCount}件, 未着手: ${notStartedCount}件）`;
  let printCurrentInfo = `現在進行中のタスク（URL）:\n ${currentTasks.join('\n')}`;
  return `[info]${printTitle}\n${printProgress}\n${printCurrentInfo}[/info]`;
}

// ステップ3. ChatWorkのAPI設定とメッセージ送信
// チャットルームID
const ROOM_ID = '';

// アカウントのAPIトークン（このアカウントがメッセージ送信者となる）
// see https://developer.chatwork.com/docs
const CHAT_API_TOKEN = '';

// チャットにメッセージを投稿するAPIエンドポイントと必須リクエストヘッダー（APIトークンをヘッダーに含める）
// see https://developer.chatwork.com/reference/post-rooms-room_id-messages
const END_POINT = `https://api.chatwork.com/v2/rooms/${ROOM_ID}/messages`;
const REQUEST_HEADERS = {
  'x-chatworktoken': CHAT_API_TOKEN
}

// メッセージを開発チームのチャットルームに投稿
function sendChat(message) {
  // 本来はここでrequest signatureの検証が必要

  let options = {
    'method' : 'post',
    'payload' : { 'body' : message },
    'headers' : REQUEST_HEADERS
  };

  UrlFetchApp.fetch(END_POINT, options);
  //getResponseCode() == 200 以外のエラーハンドリングが必要
}