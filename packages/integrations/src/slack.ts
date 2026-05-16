const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function sendSlackNotification(
  message: string,
): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.log(`[slack] (dry) ${message}`);
    return;
  }
  // Stub — POST to Slack webhook
  console.log(`[slack] sent: ${message}`);
}
