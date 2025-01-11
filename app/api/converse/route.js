import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

export async function POST(req) {
    console.log("Received POST request");
    try {
        const { input } = await req.json();
        console.log("Input:", input);

        const client = new BedrockRuntimeClient({
            region: process.env.NEXT_PUBLIC_AWS_REGION,
            credentials: {
                accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
            },
        });

        const messages = [
            {
                role: 'user',
                content: [{ text: input }],
            },
        ];

        console.log("Messages:", JSON.stringify(messages, null, 2));

        const command = new ConverseCommand({
            modelId: 'amazon.nova-micro-v1:0',
            messages,
        });

        console.log("Sending command to Bedrock...");
        const response = await client.send(command);

        console.log("Response from Bedrock:", JSON.stringify(response, null, 2));

        return new Response(
            JSON.stringify({
                fullResponse: response,
                content: response?.output?.message?.content?.[0]?.text || 'No content',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error("Error invoking Bedrock:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
