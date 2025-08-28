resource "aws_sns_topic" "main" {
  name = "meqenet-main-topic"
}

resource "aws_sqs_queue" "main" {
  name = "meqenet-main-queue"
}

resource "aws_sns_topic_subscription" "main_queue_subscription" {
  topic_arn = aws_sns_topic.main.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.main.arn
}
