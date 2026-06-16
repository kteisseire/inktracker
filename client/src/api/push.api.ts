import api from './client.js';

export async function subscribePush(sub: PushSubscriptionJSON): Promise<void> {
  await api.post('/push/subscribe', { endpoint: sub.endpoint, keys: sub.keys });
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await api.post('/push/unsubscribe', { endpoint });
}
