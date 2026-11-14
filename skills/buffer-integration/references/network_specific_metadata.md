# Buffer Network-Specific Metadata & Formatting Guide

This guide details the network-specific metadata, character constraints, and asset formatting required when publishing across social platforms using Buffer's GraphQL API.

---

## 1. Network Constraints Matrix

| Platform | `service` | Character Limit | Media Types | Key Metadata Options |
| :--- | :--- | :--- | :--- | :--- |
| **Instagram** | `instagram` | 2,200 | Images, Videos | `type: post \| reel \| story` |
| **Threads** | `threads` | 500 | Images, Videos | Standard attachments |
| **X (Twitter)** | `twitter` | 280 (Standard) | Images, Videos, GIF | Thread creation |
| **LinkedIn** | `linkedin` | 3,000 | Images, Videos, PDF | `document` attachments |
| **TikTok** | `tiktok` | 2,200 | Videos only | Vertical video (9:16) |
| **YouTube** | `youtube` | 5,000 | Videos only | YouTube Shorts |
| **Pinterest** | `pinterest` | 500 | Images | Target board, source URL, title |
| **Bluesky** | `bluesky` | 300 | Images | Alt text / descriptions |
| **Facebook** | `facebook` | 63,206 | Images, Videos | Page vs Group routing |
| **Mastodon** | `mastodon` | 500 (typical) | Images, Videos | Content warnings |

---

## 2. Instagram Configurations

Instagram supports three primary post formats specified via `metadata.instagram.type`:
- `reel`: Vertical short-form video (recommended for discovery).
- `story`: 24-hour ephemeral full-screen post.
- `post`: Standard grid post (single image, carousel, or video).

### Instagram Reel Example
```json
{
  "channelId": "ch_instagram_101",
  "text": "How we scaled our background task workers by 10x 🚀 #engineering #devops",
  "schedulingType": "automatic",
  "mode": "addToQueue",
  "assets": [
    {
      "url": "https://cdn.example.com/videos/engineering-scaling.mp4",
      "mimeType": "video/mp4"
    }
  ],
  "metadata": {
    "instagram": {
      "type": "reel"
    }
  }
}
```

### Video Specifications for Reels & Stories
- **Aspect Ratio**: 9:16 (vertical, `1080x1920` recommended).
- **Duration**: Reels up to 15 minutes; Stories up to 60 seconds.
- **Codecs**: H.264 or HEVC video with AAC audio.

---

## 3. LinkedIn Document Carousels (PDFs)

LinkedIn allows uploading PDF slide decks that users can swipe through natively as carousel posts.

### Document Attachment Example
```json
{
  "channelId": "ch_linkedin_102",
  "text": "Swipe through our 5-step playbook for building resilient GraphQL APIs 📄",
  "schedulingType": "automatic",
  "mode": "addToQueue",
  "assets": [
    {
      "url": "https://cdn.example.com/docs/graphql-api-playbook.pdf",
      "mimeType": "application/pdf"
    }
  ]
}
```

---

## 4. X (Twitter) Threads & Microblogging

When publishing to X:
- Check character length: standard posts are capped at 280 characters.
- URLs count as 23 characters towards the tweet limit (due to `t.co` shortening).
- When creating multi-tweet threads, Buffer accepts thread sequences to publish sequentially.

---

## 5. Pinterest Board Selection

Pinterest pins require associating the post with a specific Pinterest Board:

```json
{
  "channelId": "ch_pinterest_103",
  "text": "Modern architectural concepts for remote home offices.",
  "schedulingType": "automatic",
  "mode": "addToQueue",
  "assets": [
    {
      "url": "https://cdn.example.com/images/home-office.jpg",
      "mimeType": "image/jpeg"
    }
  ],
  "metadata": {
    "pinterest": {
      "boardId": "board_88291a",
      "sourceUrl": "https://example.com/designs/home-office",
      "title": "Minimalist Remote Home Office"
    }
  }
}
```

---

## 6. Alt Text & Accessibility Best Practices

When attaching image assets for Bluesky, Mastodon, or X, provide descriptive alternative text for screen readers:

```json
{
  "assets": [
    {
      "url": "https://cdn.example.com/charts/q3-growth.png",
      "mimeType": "image/png",
      "image": {
        "url": "https://cdn.example.com/charts/q3-growth.png",
        "altText": "Line chart displaying 45% user growth quarter-over-quarter from July to September."
      }
    }
  ]
}
```
