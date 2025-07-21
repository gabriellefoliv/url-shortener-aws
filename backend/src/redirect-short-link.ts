import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({})

const ddbDocClient = DynamoDBDocumentClient.from(client)

const commonHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
}

export const redirectShortLink = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: commonHeaders,
            body: ''
        }
    }

    const shortId = event.pathParameters?.shortId

    if (!shortId) {
        return {
            statusCode: 400,
            headers: commonHeaders,
            body: JSON.stringify({ error: "Short ID não fornecido." })
        }
    }

    try {
        const getParams = {
            TableName: process.env.TABLE_NAME || "url-shortener",
            Key: {
                shortId
            }
        }

        const { Item } = await ddbDocClient.send(new GetCommand(getParams))

        if (!Item || !Item.originalUrl) {
            return {
                statusCode: 404,
                headers: commonHeaders,
                body: JSON.stringify({ error: "URL não encontrada." })
            }
        }

        const originalUrl = Item.originalUrl

        const updateParams = {
            TableName: process.env.TABLE_NAME || "url-shortener",
            Key: {
                shortId
            },
            UpdateExpression: "SET clickCount = if_not_exists(clickCount, :start) + :inc",
            ExpressionAttributeValues: {
                ":inc": 1,
                ":start": 0
            },
            ReturnValues: ReturnValue.NONE
        }

        await ddbDocClient.send(new UpdateCommand(updateParams)).catch(err => {
            console.error("Erro ao atualizar contagem de cliques: ", err)
        })

        return {
            statusCode: 302,
            headers: {
                ...commonHeaders,
                Location: originalUrl
            },
            body: ''
        }
        
    } catch (error) {
        console.error("Erro ao redirecionar URL curta: ", error)
        return {
            statusCode: 500,
            headers: commonHeaders,
            body: JSON.stringify({ error: "Erro interno do servidor." })
        }
    }
}