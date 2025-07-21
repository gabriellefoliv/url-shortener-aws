import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { generateUniqueShortId } from "./utils/id-algorithm";

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

export const createShortLink = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            body: ''
        }
    }

    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Insira uma URL válida." })
        }
    }

    let requestBody

    try {
        requestBody = JSON.parse(event.body)
    } catch (error) {
        console.error("Erro no corpo da requisição: ", error)
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Corpo da requisição inválido." })
        }
    }

    const { url: originalUrl } = requestBody

    if (!originalUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "URL original não fornecida." })
        }
    }

    try {
        let shortId: string;
        let isUnique = false;
        let attempts = 0;
        const MAX_ATTEMPTS = 5;

        shortId = await generateUniqueShortId();

        const params = {
            TableName: process.env.TABLE_NAME || "url-shortener",
            Item: {
                shortId: shortId,
                originalUrl: originalUrl,
                createdAt: new Date().toISOString(),
                clickCount: 0
            },
            ConditionExpression: "attribute_not_exists(shortId)"
        }

        try {
            await ddbDocClient.send(new PutCommand(params))
        } catch (dynamoError: any) {
            if (dynamoError.name === "ConditionalCheckFailedException") {
                console.warn(`Colisão de short Id detectada: ${shortId}`)
                return {
                    statusCode: 409,
                    body: JSON.stringify({ error: "Colisão de id detectada. Tente novamente." })
                }
            } else {
                throw dynamoError;
            }
        }

        const baseUrl = process.env.BASE_URL 
        const fullShortUrl = `${baseUrl}/${shortId}`

        return {
            statusCode: 201,
            body: JSON.stringify({
                shortId: fullShortUrl,
                originalUrl: originalUrl,
                shortUrl: fullShortUrl
            })
        }
    } catch (error) {
        console.error("Erro ao criar o link curto: ", error)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Erro ao criar o link curto.", error: (error as Error).message })
        }
    }
}