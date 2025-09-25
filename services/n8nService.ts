import type { FormData, LearningDrop } from '../types';

const N8N_WEBHOOK_URL = 'https://n8n.tools.getontop.com/webhook/0120dbbc-5224-4518-9473-a82ff246d7d0';

export const sendToN8n = async (formData: FormData, learningDrop: LearningDrop): Promise<void> => {
  const payload = {
    request: formData,
    response: learningDrop,
  };

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`n8n webhook call failed with status: ${response.status}`);
      const responseBody = await response.text();
      console.error('n8n response:', responseBody);
    } else {
      console.log('Successfully sent data to n8n workflow.');
    }
  } catch (error) {
    console.error('Error sending data to n8n webhook:', error);
  }
};
