import { term } from './term';

/** The reading-list UI document shown beside its rendered screen (home page and Presentation verbs). */
export const viewJson = term(`
⟨GET /v1/lists/7¦detailView⟩
{
  «"type"»: "page",
  «"title"»: "Reading list",
  «"blocks"»: [
    { "type": "grid", "items": [
      { "type": "stat", "value": 12,
        "label": "saved" },
      { "type": "stat", "value": 3,
        "label": "unread" } ] },
    { "type": "card",
      "title": "The REST:ACT draft",
      "subtitle": "spec · 18 min",
      "badges": [{ "label": "unread",
                   "tone": "warn" }] }
  ]
}
`);
