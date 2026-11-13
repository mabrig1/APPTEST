// APPTEST Worker: static storefront plus secured API routes.
import {onRequestGet as status} from '../functions/api/status.js';
import {onRequestPost as proposal} from '../functions/api/proposal.js';
import {onRequestPost as lead} from '../functions/api/lead.js';
import {onRequestPost as testConnections} from '../functions/api/test-connections.js';
import {json} from '../functions/_lib/common.js';

const routes = new Map([
  ['GET /api/status', status],
  ['POST /api/proposal', proposal],
  ['POST /api/lead', lead],
  ['POST /api/test-connections', testConnections]
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const handler = routes.get(request.method + ' ' + url.pathname);
      if (!handler) {
        return json(405, {ok:false,error:'Unknown API route or unsupported method.'});
      }
      try {
        return await handler({request,env,ctx});
      } catch (_) {
        return json(500, {ok:false,error:'Unexpected API error. Try again later.'});
      }
    }
    return env.ASSETS.fetch(request);
  }
};
