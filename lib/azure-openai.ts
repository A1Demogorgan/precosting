type AzureMessage = {
  role: "system" | "user";
  content: string;
};

export function getAzureOpenAIConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment =
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME ?? process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";

  if (!endpoint || !apiKey || !deployment) {
    return null;
  }

  return { endpoint, apiKey, deployment, apiVersion };
}

export async function createAzureCompletion(
  config: NonNullable<ReturnType<typeof getAzureOpenAIConfig>>,
  messages: AzureMessage[],
) {
  const response = await fetch(
    `${config.endpoint.replace(/\/$/, "")}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const completion = await response.json();
  return completion.choices?.[0]?.message?.content ?? null;
}
