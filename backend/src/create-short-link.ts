import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getNextUniqueId } from "./utils/id-algorithm";

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const commonHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
}

export const createShortLink = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: commonHeaders,
            body: ''
        }
    }

    if (!event.body) {
        return {
            statusCode: 400,
            headers: commonHeaders,
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
            headers: commonHeaders,
            body: JSON.stringify({ error: "Corpo da requisição inválido." })
        }
    }

    const { url: originalUrl } = requestBody

    if (!originalUrl) {
        return {
            statusCode: 400,
            headers: commonHeaders,
            body: JSON.stringify({ error: "URL original não fornecida." })
        }
    }

    try {
        let shortId: string | undefined = undefined;
        let isUnique = false;
        let attempts = 0;
        const MAX_ATTEMPTS = 5;

        while (!isUnique && attempts < MAX_ATTEMPTS) {
            shortId = await getNextUniqueId();
            isUnique = true;
            attempts++;
        }

        if (!isUnique || !shortId) {
            return {
                statusCode: 500,
                headers: commonHeaders,
                body: JSON.stringify({ error: "Não foi possível gerar um ID único após várias tentativas." })
            }
        }

        const params = {
            TableName: process.env.TABLE_NAME || "url-shortener",
            Item: {
                shortId: shortId,
                originalUrl: originalUrl,
                createdAt: new Date().toISOString(),
                clickCount: 0
            }
        }

        await ddbDocClient.send(new PutCommand(params))

        const baseUrl = process.env.BASE_URL 
        const fullShortUrl = `${baseUrl}/${shortId}`

        return {
            statusCode: 201,
            headers: commonHeaders,
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
            headers: commonHeaders,
            body: JSON.stringify({ message: "Erro ao criar o link curto.", error: (error as Error).message })
        }
    }
}