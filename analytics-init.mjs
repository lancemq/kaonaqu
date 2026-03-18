import { inject } from '/vendor/vercel-analytics.mjs';

const isLocalPreview = ['127.0.0.1', 'localhost'].includes(window.location.hostname);

if (!isLocalPreview) {
  inject();
}
