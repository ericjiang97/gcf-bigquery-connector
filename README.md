# gcf-bigquery-connector
Test Library for MonPlan utilising Google Cloud Functions auto importing into BigQuery


Deploy this by
```
gcloud functions deploy gcf-bigquery --region asia-northeast1 --memory 256MB --entry-point gcfBigquery --trigger-http
```