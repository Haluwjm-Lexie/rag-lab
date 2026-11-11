import {createApp} from '../server.mjs';

// Vercel invokes this module as a Node.js Serverless Function. The local app
// still uses server.mjs directly, while the online demo keeps its temporary
// session state in /tmp (Vercel's writable scratch directory).
const app = createApp('/tmp/lexie-rag-lab', {preview: true});

export default function handler(req, res) {
  return app.emit('request', req, res);
}
