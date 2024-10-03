// Provides CDK construct `AdmissibleDemoStack`.
// As structured by `cdk init`: cdk.json refers to bin/admissible-demo.ts, which
// creates the App and adds this construct.
// See this project's README or the comments below regarding
// the required 'configure-admissible.ts' file.

import {CloudFrontToS3} from '@aws-solutions-constructs/aws-cloudfront-s3';
import {AdmissibleEmailPasswordless,} from 'admissible-email-passwordless';
import * as cdk from 'aws-cdk-lib';
import { aws_cloudfront as cloudfront, Duration} from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import {
  HttpLambdaAuthorizer,
  HttpLambdaResponseType
} from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import {HttpLambdaIntegration} from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {HttpOrigin} from "aws-cdk-lib/aws-cloudfront-origins";
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import {Construct} from 'constructs';
import * as path from "path";


/*
The file 'configure-admissible.ts' is not included in this repository.
You can create it in this folder with the following content:

import { AdmissibleConfig } from 'admissible-email-passwordless';
export function getAdmissibleConfig(): AdmissibleConfig {
  const admissibleConfig = new AdmissibleConfig();
  admissibleConfig.otpFrom = ...your "From" email address here...
  ...your other configuration here...
  (See the doc-comments from the AdmissibleConfig class for details.)
  return admissibleConfig;
}
*/
import {getAdmissibleConfig} from './configure-admissible';



export class AdmissibleDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const bundlingOptions = {
      // ECMAScript module output format, otherwise  defaults to CJS. (OutputFormat.ESM requires Node.js >= 14)
      format: cdk.aws_lambda_nodejs.OutputFormat.ESM
    };


    //// Create the CDK construct for 'Admissible' Email Passwordless authentication

    const admissibleConfig = getAdmissibleConfig();
    const admissible = new AdmissibleEmailPasswordless(
      this,
      'AdmissibleEmailPasswordless',
      admissibleConfig
    );

    
    //// A "hello" lambda, which will require authentication to access

    const helloLambda = new nodejs.NodejsFunction(this, 'HelloLambda', {
      description: "Protected 'hello' function",
      entry: path.join(__dirname, "../api-lambdas/protected-hello.ts"),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      architecture: cdk.aws_lambda.Architecture.ARM_64,
      bundling: bundlingOptions,
      timeout: cdk.Duration.seconds(5),
    });


    //// API Gateway. Add Admissible's authorizer and Lambda functions.

    const apiGateway = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: "AdmissibleDemo",
      defaultAuthorizer: new HttpLambdaAuthorizer(
        'customAuthorizer',
        admissible.apiAuthorizerLambda,
        {
          responseTypes: [HttpLambdaResponseType.SIMPLE],
          // Disable caching. API Gateway does not currently support
          // cookies as an identity source.
          identitySource: [],
          resultsCacheTtl: Duration.seconds(0),
        },
      ),
    });

    apiGateway.addRoutes({
      path: '/api/auth/init',
      methods: [apigateway.HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        'AuthInitIntegration',
        admissible.authInitLambda
      ),
      // No authorizer for this route - it is needed for signing in
      authorizer: new apigateway.HttpNoneAuthorizer(),
    });
    apiGateway.addRoutes({
      path: '/api/auth/otp',
      methods: [apigateway.HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        'AuthOtpIntegration',
        admissible.authOtpLambda
      ),
      // No authorizer for this route - it is needed for signing in
      authorizer: new apigateway.HttpNoneAuthorizer(),
    });
    apiGateway.addRoutes({
      path: '/api/auth/refresh',
      methods: [apigateway.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        'AuthRefreshIntegration',
        admissible.authRefreshLambda
      ),
      // No authorizer for this route - access token may have already expired
      authorizer: new apigateway.HttpNoneAuthorizer(),
    });
    apiGateway.addRoutes({
      path: '/api/auth/signout',
      methods: [apigateway.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        'AuthSignoutIntegration',
        admissible.authSignoutLambda
      ),
      // No authorizer for this route
      authorizer: new apigateway.HttpNoneAuthorizer(),
    });
    apiGateway.addRoutes({
      // This route requires authorization. It returns JSON with the authorized user's email.
      path: '/api/auth/status',
      methods: [apigateway.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        'AuthStatusIntegration',
        admissible.authStatusLambda
      ),
    });
    apiGateway.addRoutes({
      // This route requires authorization. It just returns a 'hello' message.
      path: '/api/hello',
      methods: [apigateway.HttpMethod.GET],
      integration: new HttpLambdaIntegration('HelloIntegration', helloLambda),
    });


    //// Use CloudFrontToS3 for hosting the demo webapp

    // Custom response headers policy for CloudFront distribution:
    // The CloudFrontToS3 construct *can* provide a default policy, but it sets
    // the content-security-policy too strictly for the demo Vite/React webapp to run.
    const policyProps: cloudfront.ResponseHeadersPolicyProps = {
      responseHeadersPolicyName: 'AdmissibleDemoPolicy',
      comment: 'Admissible Demo Policy, content-security-policy allowing inline scripts and styling',
      securityHeadersBehavior: {
        // Vite build doesn't currently have anything like INLINE_RUNTIME_CHUNK, so I'm allowing unsafe-inline for style-src.
        contentSecurityPolicy: { contentSecurityPolicy: "default-src 'self'; style-src 'unsafe-inline';", override: true },
        contentTypeOptions: { override: true },  // this sets it to 'nosniff'
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: { referrerPolicy: cloudfront.HeadersReferrerPolicy.NO_REFERRER, override: true },
        strictTransportSecurity: { accessControlMaxAge: Duration.seconds(63072000), includeSubdomains: true, preload: true, override: true },
        // Per developer.mozilla.org, x-xss-protection is not recommended.
        xssProtection: { protection: false, override: false },
      },
      removeHeaders: ['Server'],
    };

    const cloudFrontS3 = new CloudFrontToS3(this, 'CloudFrontToS3', {
      insertHttpSecurityHeaders: false,
      responseHeadersPolicyProps: policyProps,
      logS3AccessLogs: false,
      logCloudFrontAccessLog: false,
      // Delete the webapp's bucket and log bucket when the stack is deleted.
      // (This override of default behavior results in AWS_SOLUTIONS_CONSTRUCTS_WARNING.)
      bucketProps: {
        versioned: false,
        autoDeleteObjects: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
      cloudFrontLoggingBucketProps: {
        versioned: false,
        autoDeleteObjects: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    });
    const distribution = cloudFrontS3.cloudFrontWebDistribution;

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset("../client/dist")],
      destinationBucket: cloudFrontS3.s3Bucket!,
      // Invalidate the CloudFront cache on each deployment, by specifying the distribution.
      distribution: distribution,
    });


    //// Put our API Gateway behind the same distribution as the S3 hosted webapp,
    //// so that the web app can use relative URLs to the gateway endpoints.

    const apiEndPointUrlWithoutProtocol = cdk.Fn.select(1, cdk.Fn.split("://", apiGateway.url!));
    const apiEndPointDomainName = cdk.Fn.select(0, cdk.Fn.split("/", apiEndPointUrlWithoutProtocol));
    const origin = new HttpOrigin(apiEndPointDomainName);
    distribution.addBehavior('/api/*', origin, {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });


    //// Outputs

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', { value: distribution.distributionId });
    new cdk.CfnOutput(this, 'HttpApiUrl', { value: apiGateway.url! });
    new cdk.CfnOutput(this, 'UserPoolAppClientId', { value: admissible.appClient.userPoolClientId });
    new cdk.CfnOutput(this, 'UserPoolId', { value: admissible.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolProviderUrl', { value: admissible.userPool.userPoolProviderUrl });
    new cdk.CfnOutput(this, 'websiteURL', {
      value: 'https://' + cloudFrontS3.cloudFrontWebDistribution.domainName
    });

  }
}
