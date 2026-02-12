#!/bin/bash

APP_ID="d22zhvaaydu232"
BRANCH_NAME="main"
REGION="us-east-1"

echo "Waiting for Amplify to trigger the build..."
sleep 10

# Get the latest Job ID
JOB_ID=$(aws amplify list-jobs --app-id $APP_ID --branch-name $BRANCH_NAME --region $REGION --query 'jobSummaries[0].jobId' --output text)

echo "Monitoring Job ID: $JOB_ID"

while true; do
    STATUS=$(aws amplify get-job --app-id $APP_ID --branch-name $BRANCH_NAME --job-id $JOB_ID --region $REGION --query 'job.summary.status' --output text)

    echo "Current Status: $STATUS"

    if [ "$STATUS" == "SUCCEED" ]; then
        echo "✅ Success!"
        exit 0
    elif [ "$STATUS" == "FAILED" ]; then
        echo "❌ Failed!"
        exit 1
    else
        sleep 20
    fi
done
