import { VercelRequest, VercelResponse } from '@vercel/node';

interface PostData {
  pageId: string;
  accessToken: string;
  message?: string;
  imageUrl?: string;
  hashtags?: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pageId, accessToken, message, imageUrl, hashtags }: PostData = req.body;

  if (!pageId || !accessToken) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['pageId', 'accessToken']
    });
  }

  if (!message && !imageUrl) {
    return res.status(400).json({ 
      error: 'Either message or imageUrl must be provided'
    });
  }

  try {
    const FB_API_VERSION = 'v21.0';
    const FB_BASE_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

    // Prepare caption with hashtags
    let fullCaption = message || '';
    if (hashtags && hashtags.length > 0) {
      const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');
      fullCaption = fullCaption ? `${fullCaption}\n\n${hashtagString}` : hashtagString;
    }

    let postResponse;

    // ========== Post with Image ==========
    if (imageUrl) {
      // Step 1: Upload photo to Facebook
      const uploadUrl = `${FB_BASE_URL}/${pageId}/photos`;
      const uploadParams = new URLSearchParams({
        url: imageUrl,
        caption: fullCaption,
        access_token: accessToken,
        published: 'true'
      });

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: uploadParams
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(`Facebook photo upload failed: ${JSON.stringify(errorData)}`);
      }

      postResponse = await uploadRes.json();
    } 
    // ========== Text-only Post ==========
    else {
      const postUrl = `${FB_BASE_URL}/${pageId}/feed`;
      const postParams = new URLSearchParams({
        message: fullCaption,
        access_token: accessToken
      });

      const postRes = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: postParams
      });

      if (!postRes.ok) {
        const errorData = await postRes.json();
        throw new Error(`Facebook post failed: ${JSON.stringify(errorData)}`);
      }

      postResponse = await postRes.json();
    }

    return res.status(200).json({
      success: true,
      postId: postResponse.id || postResponse.post_id,
      message: 'Successfully posted to Facebook',
      postUrl: `https://www.facebook.com/${postResponse.id || postResponse.post_id}`
    });

  } catch (error: any) {
    console.error('Facebook posting error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to post to Facebook',
      details: error.stack
    });
  }
}
