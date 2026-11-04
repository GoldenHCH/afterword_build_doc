import { SecretParam, defineSecret } from 'firebase-functions/params';

import { contentSources } from './find/find.constants';

type ISecretReader = Pick<SecretParam, 'value'>;

const emptySecret: ISecretReader = { value: () => '' };
const optionalSecrets: SecretParam[] = [];

function defineOptionalSecret(name: string, isEnabled: boolean): ISecretReader {
  if (!isEnabled) {
    return emptySecret;
  }

  const secret = defineSecret(name);
  optionalSecrets.push(secret);

  return secret;
}

export const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
export const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
export const MCP_SHARED_KEY = defineSecret('MCP_SHARED_KEY');

export const PAPERCLIP_API_KEY = defineOptionalSecret('PAPERCLIP_API_KEY', contentSources.PAPER === 'paperclip');
export const X_BEARER_TOKEN = defineOptionalSecret('X_BEARER_TOKEN', contentSources.POST === 'x');

export const optionalSourceSecrets: readonly SecretParam[] = optionalSecrets;
