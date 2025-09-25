import type { FormData, LearningDrop } from '../types';

const N8N_WEBHOOK_URL = 'https://n8n.tools.getontop.com/webhook/0120dbbc-5224-4518-9473-a82ff246d7d0';

export const sendToN8n = async (formData: FormData, learningDrop: LearningDrop): Promise<void> => {
  const payload = {
    request: formData,
    response: learningDrop,
  };

  try {
    await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors', // Bypass CORS errors for fire-and-forget webhooks
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // In 'no-cors' mode, we can't inspect the response to confirm success.
    // We assume it was sent successfully if no network error was thrown.
    console.log('Successfully initiated data send to n8n workflow.');

  } catch (error) {
    // This will typically catch network-level errors, not HTTP status errors.
    console.error('Error sending data to n8n webhook:', error);
  }
};
