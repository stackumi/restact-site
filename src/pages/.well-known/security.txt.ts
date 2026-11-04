import type { APIRoute } from 'astro';
import { GITHUB } from '../../site.config';

// RFC 9116. Contacts are listed in order of preference. EXPIRES must stay under a year away:
// renew it before it passes, and `pnpm verify` fails once it has.
const EXPIRES = '2027-10-31T00:00:00.000Z';

export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      `Contact: ${GITHUB.restactd}/security/advisories/new`,
      'Contact: mailto:security@restact.org',
      `Expires: ${EXPIRES}`,
      'Preferred-Languages: en',
      `Canonical: ${new URL('/.well-known/security.txt', site)}`,
      `Policy: ${GITHUB.restactd}/blob/main/SECURITY.md`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
