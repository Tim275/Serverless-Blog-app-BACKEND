import { APIGatewayEvent } from "aws-lambda";
import {
  APIGatewayClient,
  GetExportCommand,
} from "@aws-sdk/client-api-gateway";
import { v4 as uuid } from "uuid";
import { BlogPost } from "./BlogPost";
import { BlogPostService } from "./BlogPostService";

const TABLE_NAME = process.env.TABLE_NAME!;
const blogPostService = new BlogPostService(TABLE_NAME);
export const createBlogPostHandler = async (event: APIGatewayEvent) => {
  const partialBlogPost = JSON.parse(event.body!) as {
    title: string;
    author: string;
    content: string;
  };
  const id = uuid();
  const createdAt = new Date().toISOString();

  const blogPost: BlogPost = {
    id: id,
    title: partialBlogPost.title,
    author: partialBlogPost.author,
    content: partialBlogPost.content,
    createdAt: createdAt,
  };
  await blogPostService.saveBlogPost(blogPost);
  return {
    statusCode: 201,
    body: JSON.stringify(blogPost),
  };
};

export const getBlogPostsHandler = async (event: APIGatewayEvent) => {
  const order = event?.queryStringParameters?.order;
  let blogPosts = await blogPostService.getAllBlogPosts();
  if (order === "asc") {
    // ORDER ASCENDING
    blogPosts = blogPosts.sort((blogPostA, blogPostB) =>
      blogPostA.createdAt.localeCompare(blogPostB.createdAt)
    );
  } else {
    // ORDER DESCENDING
    blogPosts = blogPosts.sort((blogPostA, blogPostB) =>
      blogPostB.createdAt.localeCompare(blogPostA.createdAt)
    );
  }
  return {
    statusCode: 200,
    body: JSON.stringify(blogPosts),
  };
};

export const getBlogPostHandler = async (event: APIGatewayEvent) => {
  const id = event.pathParameters!.id!;
  const blogPost = await blogPostService.getBlogPostById(id);
  return {
    statusCode: 200,
    body: JSON.stringify(blogPost),
  };
};

export const deleteBlogPostHandler = async (event: APIGatewayEvent) => {
  const id = event.pathParameters!.id!;
  await blogPostService.deleteBlogPostById(id);
  return {
    statusCode: 204,
  };
};

export const apiDocsHandler = async (event: APIGatewayEvent) => {
  const ui = event?.queryStringParameters?.ui;
  const apigateway = new APIGatewayClient({});
  const restApiId = process.env.API_ID!;
  const getExportCommand = new GetExportCommand({
    restApiId: restApiId,
    exportType: "swagger",
    accepts: "application/json",
    stageName: "prod",
  });

  const api = await apigateway.send(getExportCommand);
  const response = Buffer.from(api.body!).toString("utf-8");

  if (!ui) {
    return {
      statusCode: 200,
      body: response,
    };
  }

  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="SwaggerUI"
    />
    <title>SwaggerUI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
  </head>
  <body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: 'api-docs',
        dom_id: '#swagger-ui',
      });
    };
  </script>
  </body>
  </html>`;

  return {
    statusCode: 200,
    body: html,
    headers: {
      "Content-Type": "text/html",
    },
  };
};
