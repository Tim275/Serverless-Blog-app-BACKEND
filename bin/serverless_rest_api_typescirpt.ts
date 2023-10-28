import * as cdk from "aws-cdk-lib";
import { RestApiStack } from "../lib/rest_api-stack";

const app = new cdk.App();
const region = "eu-central-1";
const account = "506820257931";
new RestApiStack(app, "RestApiStack", {
  env: { region: region, account: account },
});
